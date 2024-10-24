// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require('./firebase-service-account.json'); // Modifica il percorso se necessario
const { google } = require('googleapis');
const { log } = require("firebase-functions/logger");
const moment = require('moment')
const axios = require('axios')
const { auth } = require('google-auth-library');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://totocalcioreact-default-rtdb.europe-west1.firebasedatabase.app"
});

const firestore = admin.firestore();
const rtdb = admin.database();

// Funzione per calcolare i punti della giornata
exports.calcolaPuntiGiornata = functions.https.onCall(async (data, context) => {
    const { leagueId, dayId } = data;

    if (!leagueId || !dayId) {
        throw new functions.https.HttpsError('invalid-argument', 'League ID e Day ID sono richiesti.');
    }

    // Crea l'ID del documento basato su leagueId e dayId
    const documentId = `${leagueId}_${dayId}`;
    console.log(documentId);
    // Riferimento al documento specifico nella collection "giornateCalcolate"
    const calcolateRef = firestore.collection('giornateCalcolate').doc(documentId);
    const lockRef = rtdb.ref(`locks/${leagueId}/${dayId}`);

    try {
        // Controlla se esiste già un lock per questa lega e giornata
        const lockSnapshot = await lockRef.once('value');
        if (lockSnapshot.exists()) {
            return { success: false, message: "Il calcolo è già in corso per questa giornata e lega." };
        }

        // Verifica se la giornata è già stata calcolata
        const calcolateDoc = await calcolateRef.get();
        if (calcolateDoc.exists && calcolateDoc.data().calcolate) {
            return { success: false, message: "Questa giornata è già stata calcolata." };
        } else if (!calcolateDoc.exists) {
            return { success: false, message: "Questa giornata non esiste nella collection giornateCalcolate." };
        }

        // Imposta un lock
        await lockRef.set({ inProgress: true, timestamp: admin.database.ServerValue.TIMESTAMP });

        // Esegui il recupero dei dati in parallelo utilizzando Promise.all()
        const [matchesSnapshot, predictionsSnapshot, leagueDoc] = await Promise.all([
            firestore.collection('matches').where('dayId', '==', dayId).get(),
            firestore.collection('predictions').where('leagueId', '==', leagueId).where('daysId', '==', dayId).get(),
            firestore.collection('leagues').doc(leagueId).get()
        ]);

        if (matchesSnapshot.empty) {
            return { success: false, message: "Nessuna partita trovata per questa giornata." };
        }

        if (predictionsSnapshot.empty) {
            return { success: false, message: "Nessuna schedina trovata per questa giornata." };
        }

        if (!leagueDoc.exists) {
            return { success: false, message: "Lega non trovata." };
        }

        // Definisci leagueRef qui dopo aver ottenuto leagueDoc
        const leagueRef = firestore.collection('leagues').doc(leagueId);

        // Utilizza una mappa per una ricerca più efficiente dei match
        const matchesMap = new Map();
        matchesSnapshot.forEach(doc => {
            const data = doc.data();
            matchesMap.set(data.matchId, data.result);
        });

        let batchCount = 0;
        const MAX_BATCH_SIZE = 500;
        let currentBatch = firestore.batch();

        const userPointsMap = {}; // Mappa per mantenere i punti accumulati da ogni utente

        // Calcola i punti per ogni prediction
        predictionsSnapshot.forEach(async (predictionDoc) => {
            const predictionData = predictionDoc.data();
            let punti = 0;

            // Calcola i punti basati sugli esiti usando la mappa
            predictionData.schedina.forEach(prediction => {
                const matchResult = matchesMap.get(prediction.matchId);
                if (matchResult === prediction.esitoGiocato) {
                    punti += 1;
                }

                // Aggiorna il campo `result` nella schedina
                prediction.result = matchResult || null;
            });

            // Aggiungi i punti dell'utente alla mappa
            const userId = predictionData.userId;
            userPointsMap[userId] = (userPointsMap[userId] || 0) + punti;

            // Aggiorna i punti nella prediction
            currentBatch.update(predictionDoc.ref, { punti, schedina: predictionData.schedina });
            batchCount++;

            // Se raggiungi il limite, committa il batch e inizia un nuovo batch
            if (batchCount >= MAX_BATCH_SIZE) {
                await currentBatch.commit();  // Fai il commit del batch
                currentBatch = firestore.batch();    // Crea un nuovo batch
                batchCount = 0;               // Resetta il conteggio
            }
        });

        // Commit dell'ultimo batch, nel caso ci siano ancora operazioni non committate
        if (batchCount > 0) {
            await currentBatch.commit();
        }

        // Inizia un nuovo batch per aggiornare la lega e la giornata calcolata
        const finalBatch = firestore.batch();

        // Aggiorna i punti dei membri della lega
        const leagueData = leagueDoc.data();
        const updatedMembersInfo = leagueData.membersInfo.map(member => {
            if (userPointsMap[member.id]) {
                return {
                    ...member,
                    punti: (member.punti || 0) + userPointsMap[member.id] // Incrementa i punti
                };
            }
            return member;
        });

        // Aggiorna la tabella leagues con i nuovi punti
        finalBatch.update(leagueRef, { membersInfo: updatedMembersInfo });

        // Aggiorna la giornata calcolata nella collection "giornateCalcolate"
        finalBatch.update(calcolateRef, { calcolate: true });

        // Committa l'ultimo batch per l'aggiornamento dei membri e la giornata calcolata
        await finalBatch.commit();

        // Rimuovi il lock alla fine dell'operazione
        await lockRef.remove();

        return { success: true, message: "Calcolo punti completato con successo e punti aggiornati nella lega." };

    } catch (error) {
        console.error('Errore durante il calcolo dei punti:', error);

        // Assicurati di rimuovere il lock anche in caso di errore
        await lockRef.remove();

        throw new functions.https.HttpsError('internal', 'Errore durante il calcolo dei punti');
    }
});



// Function per pianificare il task di aggiornamento per ogni giornata
exports.scheduleDayUpdateTasks = functions.https.onCall(async (data, context) => {
    try {
        const daysSnapshot = await firestore.collection('days').get();

        if (daysSnapshot.empty) {
            return { success: false, message: "Nessuna giornata trovata" };
        }

        const projectId = 'totocalcioreact'; // Usa l'ID del progetto Firebase
        // Usa il GoogleAuth per ottenere l'authClient con i corretti scopes
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-scheduler', 'https://www.googleapis.com/auth/cloud-platform'],
        });

        const authClient = await auth.getClient();
        // const authClient = await auth.getClient();
        const scheduler = google.cloudscheduler('v1', { auth: authClient });

        // Itera su ogni giornata per pianificare un task
        daysSnapshot.forEach(async (doc) => {
            const dayData = doc.data();
            const dayId = doc.id;
            const dayNumber = dayData.dayNumber
            // Ottieni la data di fine con moment
            const endDate = moment(dayData.endDate);

            // Aggiungi 2 ore alla data di fine
            const scheduleTime = endDate.add(3, 'hours');

            // Ottieni l'ora formattata come stringa ISO
            const formattedTime = scheduleTime.toISOString();

            // Estrai i componenti della data e dell'ora per la programmazione del task
            const scheduleMinute = scheduleTime.minutes();
            const scheduleHour = scheduleTime.hours();
            const scheduleDay = scheduleTime.date();
            const scheduleMonth = scheduleTime.month() + 1; // I mesi in Moment sono indicizzati da 0

            console.log('schedule->', `0 ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`);
            console.log('endDate->', endDate.format());
            console.log('scheduleTime->', scheduleTime.format());
            console.log('dayNumber ->', dayNumber);

            const job = {
                name: `projects/${projectId}/locations/us-central1/jobs/update-matches-${dayId}`,
                schedule: `${scheduleMinute} ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`, // Configura l'orario con Moment
                timeZone: 'Europe/Rome',
                httpTarget: {
                    uri: `https://us-central1-${projectId}.cloudfunctions.net/updateMatches`,
                    httpMethod: 'POST',
                    body: Buffer.from(JSON.stringify({ dayId })).toString('base64'),
                    headers: { 'Content-Type': 'application/json' },
                },
            };

            functions.logger.info('JOB->', job)
            functions.logger.info('Auth ->', authClient)


            try {
                await scheduler.projects.locations.jobs.create({
                    parent: `projects/${projectId}/locations/us-central1`,
                    requestBody: job,
                    auth: authClient
                });
                console.log(`Task creato per dayId: ${dayId}`);
            } catch (error) {
                console.error(`Errore durante la creazione del task per ${dayId}:`, error);
            }
        });

        return { success: true, message: "Tasks pianificati correttamente" };
    } catch (error) {
        console.error('Errore durante la pianificazione dei task:', error);
        throw new functions.https.HttpsError('internal', 'Errore durante la pianificazione dei task');
    }
});


// Function per aggiornare i risultati delle partite
exports.updateMatches = functions.https.onRequest(async (req, res) => {
    const { dayId } = req.body;
    functions.logger.log('START--->>>', dayId ) ;

    if (!dayId) {
        return res.status(400).send({ success: false, message: "dayId è richiesto" });
    }

    try {
        // Ottieni i dati dalla API di football
        const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures`, {
            params: {
                league: '135', // ID della lega
                season: '2024', // Anno della stagione
                round: dayId.replace('Regular', 'Regular ').replace('Season', 'Season ').replace('-', '- '),
            },
            headers: {
                'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
            },
        });

        const fixtures = response.data.response;
        functions.logger.log('FIXTURES->', fixtures);

        // Aggiorna la collection matches
        const batch = firestore.batch();
        fixtures.forEach(match => {
            const matchRef = firestore.collection('matches').doc(match.fixture.id.toString());
            batch.update(matchRef, { result: determineResult(match.goals.home, match.goals.away) });
        });

        await batch.commit();

        // Recupera tutte le leghe
        const leaguesSnapshot = await firestore.collection('leagues').get();
        const leagueIds = leaguesSnapshot.docs.map(doc => doc.id);
        functions.logger.log('leagueIds', leagueIds)
        functions.logger.log('dayId', dayId)

        // Recupera le previsioni corrispondenti a questi ID di lega
        const predictionsSnapshot = await firestore.collection('predictions')
            /*.where('leagueId', 'in', leagueIds) non serve, faremo questo check:
                                                    Se almeno una schedina è legata ad una lega estratta
                                                    Allora il record può essere inserito
                                                    Così evitiamo di avere il vincolo di estrarre max 30 record con le condizioni*/
            .where('daysId', '==', dayId)
            .get();

        // Crea una mappa per le leghe
        const leagueMap = leagueIds.reduce((acc, leagueId) => {
            acc[leagueId] = { calcolata: false };
            return acc;
        }, {});

        // Crea un nuovo batch per gli inserimenti nella collezione giornateCalcolate
        const giornateCalcolateBatch = firestore.batch();

        const predictionsPromises = predictionsSnapshot.docs.map(async (doc) => {
            const predictionData = doc.data();
            functions.logger.log('predictionData', predictionData);

            if (predictionData.leagueId in leagueMap) {
                leagueMap[predictionData.leagueId].calcolata = true;

                // Crea l'ID del documento per la collezione giornateCalcolate
                const documentId = `${predictionData.leagueId}_${dayId}`;

                // Aggiungi l'operazione al batch
                giornateCalcolateBatch.set(firestore.collection('giornateCalcolate').doc(documentId), {
                    calcolate: false, // Imposta su true
                    dayId: dayId,
                    leagueId: predictionData.leagueId,
                });

                functions.logger.log(`Documento aggiunto al batch per giornateCalcolate con ID: ${documentId}`);
            } else {
                functions.logger.log(`League ID non trovato in leagueMap: ${predictionData.leagueId}`);
            }
        });

        // await Promise.all(predictionsPromises); // Aspetta che tutte le promesse siano risolte

        // Esegui il batch commit per le giornateCalcolate
        await giornateCalcolateBatch.commit();

        // Aggiorna il campo giornataAttuale
        await updateCurrentGiornata();

        res.status(200).send({ success: true, message: "Partite aggiornate con successo" });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento delle partite:', error);
        res.status(500).send({ success: false, message: "Errore durante l'aggiornamento delle partite" });
    }
});


// Funzione per determinare il risultato
function determineResult(homeGoals, awayGoals) {
    if (homeGoals > awayGoals) return "1"; // Vittoria squadra di casa
    if (homeGoals < awayGoals) return "2"; // Vittoria squadra ospite
    return "X"; // Pareggio
}

// Funzione per aggiornare la giornata attuale
async function updateCurrentGiornata() {
    const currentGiornataRef = firestore.collection('giornataAttuale').limit(1);
    const currentGiornataSnapshot = await currentGiornataRef.get();

    if (!currentGiornataSnapshot.empty) {
        const doc = currentGiornataSnapshot.docs[0];
        const currentGiornataData = doc.data().giornataAttuale;

        // Estrai e incrementa il numero corrente
        const currentGiornataNumber = parseInt(currentGiornataData.split('-')[1], 10);
        const updatedGiornataNumber = currentGiornataNumber + 1;
        const updatedGiornataAttuale = `RegularSeason-${updatedGiornataNumber}`;

        // Aggiorna il documento
        await doc.ref.update({ giornataAttuale: updatedGiornataAttuale });
        functions.logger.log(`Giornata attuale aggiornata a: ${updatedGiornataAttuale}`);
    }
}



