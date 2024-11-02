// functions/index.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const serviceAccount = require('./firebase-service-account.json');
const { google } = require('googleapis');
const moment = require('moment')
const axios = require('axios')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://totocalcioreact-default-rtdb.europe-west1.firebasedatabase.app"
});

const firestore = admin.firestore();
const rtdb = admin.database();

exports.calcolaPuntiGiornata = functions.https.onCall(async (data, context) => {
    console.time("Tempo totale calcolaPuntiGiornata");

    // Step di inizializzazione e verifica lock
    console.time("Inizializzazione e verifica lock");
    const { leagueId, dayId } = data;
    const documentId = `${leagueId}_${dayId}`;
    const lockRef = rtdb.ref(`locks/${leagueId}/${dayId}`);
    const lockSnapshot = await lockRef.once('value');
    console.timeEnd("Inizializzazione e verifica lock");

    // Caricamento dei dati
    console.time("Caricamento dati (matches, predictions, leagueDoc)");
    const [matchesSnapshot, predictionsSnapshot, leagueDoc] = await Promise.all([
        firestore.collection('matches').where('dayId', '==', dayId).get(),
        firestore.collection('predictions').where('leagueId', '==', leagueId).where('daysId', '==', dayId).get(),
        firestore.collection('leagues').doc(leagueId).get()
    ]);
    console.timeEnd("Caricamento dati (matches, predictions, leagueDoc)");

    // Creazione batch e calcolo punti
    console.time("Calcolo punti e creazione batch");
    const batchArray = [firestore.batch()];
    let batchIndex = 0;
    let batchCount = 0;
    const MAX_BATCH_SIZE = 499;

    const userPointsMap = {}; // Mappa per accumulare i punti degli utenti
    const matchesMap = new Map();
    matchesSnapshot.forEach(doc => {
        const data = doc.data();
        matchesMap.set(data.matchId, data.result);
    });

    predictionsSnapshot.forEach((predictionDoc) => {
        const predictionData = predictionDoc.data();
        let punti = 0;

        // Calcola i punti e aggiorna la schedina
        predictionData.schedina.forEach(prediction => {
            const matchResult = matchesMap.get(prediction.matchId);
            if (matchResult === prediction.esitoGiocato) {
                punti += 1;
            }
            prediction.result = matchResult || null;
        });

        // Aggiungi i punti dell'utente alla mappa
        const userId = predictionData.userId;
        userPointsMap[userId] = (userPointsMap[userId] || 0) + punti;

        batchArray[batchIndex].update(predictionDoc.ref, { punti, schedina: predictionData.schedina });
        batchCount++;

        if (batchCount == MAX_BATCH_SIZE) {
            batchArray.push(firestore.batch());
            batchIndex++;
            batchCount = 0;
        }
    });
    console.timeEnd("Calcolo punti e creazione batch");

    // Preparazione aggiornamenti per leagueDoc e calcolateRef nell'ultimo batch
    const leagueData = leagueDoc.data();
    const updatedMembersInfo = leagueData.membersInfo.map(member => {
        if (userPointsMap[member.id]) {
            return {
                ...member,
                punti: (member.punti || 0) + userPointsMap[member.id]
            };
        }
        return member;
    });

    // Aggiungi gli aggiornamenti alla fine dell'ultimo batch
    batchIndex+1//gli utilimi due update saranno posizionati nell'ultima posizione del batch
    batchArray[batchIndex].update(leagueDoc.ref, { membersInfo: updatedMembersInfo });
    batchArray[batchIndex].update(firestore.collection('giornateCalcolate').doc(documentId), { calcolate: true });

    // Commit di tutti i batch
    console.time("Commit batch");
    for (const batch of batchArray) {
        await batch.commit();
    }
    console.timeEnd("Commit batch");

    console.timeEnd("Tempo totale calcolaPuntiGiornata");

    return { success: true, message: "Calcolo punti completato con successo." };
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

exports.updateMatches = functions.https.onRequest(async (req, res) => {
    const { dayId } = req.body;
    functions.logger.log('START--->>>', dayId);

    if (!dayId) {
        return res.status(400).send({ success: false, message: "dayId è richiesto" });
    }

    try {
        // Ottieni i dati dalla API di football
        const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures`, {
            params: {
                league: '135',
                season: '2024',
                round: dayId.replace('Regular', 'Regular ').replace('Season', 'Season ').replace('-', '- '),
            },
            headers: {
                'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
            },
        });

        const fixtures = response.data.response;
        functions.logger.log('FIXTURES->', fixtures);

        // Inizializza un array per i batch
        const batchArray = [firestore.batch()];
        let batchIndex = 0;
        let operationCount = 0; // Contatore delle operazioni nel batch
        const MAX_BATCH_SIZE = 499; // Dimensione massima del batch

        // Aggiorna la collection matches e prepara gli inserimenti in giornateCalcolate
        const predictions = []; // Array per le previsioni da inserire
        const leaguesSnapshot = await firestore.collection('leagues').get();
        const leagueIds = leaguesSnapshot.docs.map(doc => doc.id);
        const leagueMap = leagueIds.reduce((acc, leagueId) => {
            acc[leagueId] = { calcolata: false };
            return acc;
        }, {});

        // Aggiorna i risultati delle partite e raccogli le previsioni
        for (const match of fixtures) {
            const matchRef = firestore.collection('matches').doc(match.fixture.id.toString());
            batchArray[batchIndex].update(matchRef, { result: determineResult(match.goals.home, match.goals.away) });
            operationCount++;

            // Controlla se il batch ha raggiunto la dimensione massima
            if (operationCount == MAX_BATCH_SIZE) {
                batchArray.push(firestore.batch());
                batchIndex++;
                operationCount = 0; // Resetta il contatore
            }
        }

        const predictionsSnapshot = await firestore.collection('predictions').where('daysId', '==', dayId).get();
        // Aggiungi logica per le previsioni
        predictionsSnapshot.forEach(doc => {
            const predictionData = doc.data();
            if (predictionData.leagueId in leagueMap) {
                leagueMap[predictionData.leagueId].calcolata = true;
                const documentId = `${predictionData.leagueId}_${dayId}`;
                predictions.push({ documentId, leagueId: predictionData.leagueId });
            }
        });

        batchIndex++;
        predictions.forEach(prediction => {
            // Imposta il documento nel batch corrente
            batchArray[batchIndex].set(firestore.collection('giornateCalcolate').doc(prediction.documentId), {
                calcolate: false,
                dayId: dayId,
                leagueId: prediction.leagueId,
            });
            predictionBatchCount++;

            // Controlla se il batch ha raggiunto la dimensione massima
            if (predictionBatchCount >= MAX_BATCH_SIZE) {
                batchArray.push(firestore.batch());
                batchIndex++;
                predictionBatchCount = 0;
            }
        });

        // Esegui il commit di tutti i batch
        for (const batch of batchArray) {
            await batch.commit();
        }

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