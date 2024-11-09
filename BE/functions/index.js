// functions/index.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const serviceAccount = require('./firebase-service-account.json');
const { google } = require('googleapis');
const moment = require('moment');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // Importa la funzione per generare UUID


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
    const isLocked = lockSnapshot.exists() && lockSnapshot.val() === true;

    if (isLocked) {
        console.log("Il documento è già bloccato.");
        return { success: false, message: "Gornata già calcolata" };
    }
    await lockRef.set(true); // Blocca il documento

    console.timeEnd("Inizializzazione e verifica lock");
    try{
        // Caricamento dei dati
        console.time("Caricamento dati (matches, predictions, leagueDoc)");
        const [matchesSnapshot, predictionsSnapshot, leagueDoc] = await Promise.all([
            firestore.collection('matches').where('dayId', '==', dayId).select('matchId', 'result').get(),
            firestore.collection('predictions').where('leagueId', '==', leagueId).where('daysId', '==', dayId).select('userId', 'schedina').get(),
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
        /*for (const batch of batchArray) {
            await batch.commit();
        }*/
        await Promise.all(batchArray.map(batch => batch.commit()));//fa più batch in parallelo - LIMITE 500 scritture per secondo
        console.timeEnd("Commit batch");

        console.timeEnd("Tempo totale calcolaPuntiGiornata");
        return { success: true, message: "Calcolo punti completato con successo." };

    }catch (error) {
        console.error(`Errore calcolaPuntiGiornata catch `, error);
        await lockRef.remove(); // Blocca il documento
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

exports.updateMatches = functions.https.onRequest(async (req, res) => {
    console.time('Data Retrieval Time');
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
         // Esegui le query per ottenere i dati da Firestore in parallelo
        const [leaguesSnapshot, predictionsSnapshot] = await Promise.all([
            firestore.collection('leagues').get(),
            firestore.collection('predictions').where('daysId', '==', dayId).select('leagueId').get() // Recupera solo leagueId
        ]);

        // Aggiorna la collection matches e prepara gli inserimenti in giornateCalcolate
        const predictions = []; // Array per le previsioni da inserire
        //const leaguesSnapshot = await firestore.collection('leagues').get();
        const leagueIds = leaguesSnapshot.docs.map(doc => doc.id);
        const leagueMap = leagueIds.reduce((acc, leagueId) => {
            acc[leagueId] = { calcolata: false };
            return acc;
        }, {});

       // const predictionsSnapshot = await firestore.collection('predictions').where('daysId', '==', dayId).get();
        // Aggiungi logica per le previsioni
        predictionsSnapshot.forEach(doc => {
            const predictionData = doc.data();
            if (predictionData.leagueId in leagueMap) {
                leagueMap[predictionData.leagueId].calcolata = true;
                const documentId = `${predictionData.leagueId}_${dayId}`;
                predictions.push({ documentId, leagueId: predictionData.leagueId });
            }
        });

        console.timeEnd('Data Retrieval Time');

        console.time('Popolamento Batch');
        // Inizializza un array per i batch
        const batchArray = [firestore.batch()];
        let batchIndex = 0;
        let operationCount = 0; // Contatore delle operazioni nel batch
        const MAX_BATCH_SIZE = 499; // Dimensione massima del batch

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

        batchIndex++;
        batchArray.push(firestore.batch());
        // Aggiungi le previsioni a 'giornateCalcolate'
        let predictionBatchCount = 0;
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
                predictionBatchCount = 0; // Resetta il contatore
            }
        });
        console.timeEnd('Popolamento Batch');

        console.time('Batch commit sequenziale');
        // Esegui il commit di tutti i batch
        for (const batch of batchArray) {
            await batch.commit();
        }
        console.timeEnd('Batch commit sequenziale');

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
    if(homeGoals == awayGoals)  return "X"; // Pareggio
    return "";//-> nel caso di partita rinviata
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

//User
exports.createUserByJson = functions.https.onRequest(async (req, res) => {
    // Assicurati che il metodo della richiesta sia POST
    if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
    }

    const users = req.body; // Supponendo che il JSON sia inviato nel corpo della richiesta

    const batch = admin.firestore().batch(); // Inizializza un batch
    try {
    users.forEach(user => {
        const { displayName, email, uid } = user;

        // Controlla se i dati richiesti sono presenti
        if (!displayName || !email || !uid) {
        throw new Error('User data is missing required fields: displayName, email, uid');
        }

        // Crea un riferimento al documento
        const userRef = admin.firestore().collection('users').doc(uid);
        // Aggiungi l'operazione di scrittura al batch
        batch.set(userRef, {
        displayName,
        email,
        uid,
        });
    });

    // Esegui il batch
    await batch.commit();
    return res.status(200).send('Users added successfully');
    } catch (error) {
    console.error('Error adding users:', error);
    return res.status(500).send('Error adding users: ' + error.message);
    }
});

exports.deleteUsersByIds = functions.https.onRequest(async (req, res) => {
    // Assicurati che il metodo della richiesta sia POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Analizza direttamente il corpo della richiesta come JSON
    const userIds = req.body;

    const batch = admin.firestore().batch(); // Inizializza un batch
    try {
        userIds.forEach(uid => {
        // Crea un riferimento al documento
        const userRef = admin.firestore().collection('users').doc(uid);
        // Aggiungi l'operazione di eliminazione al batch
        batch.delete(userRef);
        });

        // Esegui il batch
        await batch.commit();
        return res.status(200).send('Users deleted successfully');
    } catch (error) {
        console.error('Error deleting users:', error);
        return res.status(500).send('Error deleting users: ' + error.message);
    }
});
//User

//predictions

exports.writePredictions = functions.https.onRequest(async (req, res) => {
    // Controlla se la richiesta è un POST
    if (req.method !== 'POST') {
        return res.status(405).send('Metodo non consentito. Usa POST.');
    }

    // Estrai i dati dal corpo della richiesta
    const predictionsData = req.body;

    // Verifica che i dati siano validi
    if (!Array.isArray(predictionsData) || predictionsData.length === 0) {
        return res.status(400).send('Nessuna previsione fornita o dati non validi.');
    }

    const db = admin.firestore();
    const batch = db.batch();
    const insertedIds = []; // Array per tenere traccia degli ID inseriti

    try {
        // Itera sulle previsioni e aggiungile al batch
        predictionsData.forEach(prediction => {
            const uniqueId = uuidv4(); // Genera un UUID unico per la previsione
            const docRef = db.collection('predictions').doc(uniqueId); // Usa l'UUID come ID del documento
            batch.set(docRef, { ...prediction, id: uniqueId }); // Aggiungi l'operazione di scrittura al batch
            insertedIds.push(uniqueId); // Aggiungi l'ID generato all'array degli ID inseriti
        });
        console.log("LISTA PREDICTION PRE COMMIT ", insertedIds)
        await batch.commit(); // Esegui tutte le operazioni di batch

        return res.status(200).json({
            message: 'Previsioni scritte con successo.',
            insertedIds: insertedIds // Restituisci l'array degli ID inseriti
        });
    } catch (error) {
        console.error('Errore durante la scrittura delle previsioni:', error);
        return res.status(500).send('Errore interno del server.');
    }
});


exports.deletePredictions = functions.https.onRequest(async (req, res) => {
    // Verifica che il metodo sia POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Prendi l'array di ID direttamente dal corpo della richiesta
    const predictionIds = req.body; // Modificato per usare predictionIds

    // Verifica che l'input sia un array di stringhe non vuote
    /* if (!Array.isArray(predictionIds) || predictionIds.length === 0 || !predictionIds.every(id => typeof id === 'string')) {
        return res.status(400).send('Invalid input: must be a non-empty array of strings.');
    }*/
    console.error("QUI CI SONO LE PREDICTION",predictionIds);
    const batch = admin.firestore().batch(); // Inizializza un batch

    // Aggiungi le operazioni di eliminazione al batch
    try {
        predictionIds.forEach(id => {
            console.error("QUI CI SONO LE PREDICTION nel for",id);
            // Crea un riferimento al documento
            const predictionRef = admin.firestore().collection('predictions').doc(id);
            // Aggiungi l'operazione di eliminazione al batch
            batch.delete(predictionRef);
            console.log("predictionRef ",predictionRef)
        });
        // Esegui il batch
        await batch.commit();
        return res.status(200).send({ message: 'Predictions deleted successfully', deletedIds: predictionIds });
    } catch (error) {
        console.error('Error deleting predictions:', error);
        return res.status(500).send('Error deleting predictions');
    }
});
//prediction

//league
exports.createLeagues = async (req, res) => {
    const { members, membersInfo } = req.body;

    // Verifica se l'input è valido
    if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).send('Invalid input: members must be a non-empty array.');
    }

    const leagueRefs = [];

    const batch = admin.firestore().batch(); // Inizializza un batch
    try {
        // Creazione delle leghe
        members.forEach(memberId => {
            const leagueRef = admin.firestore().collection('leagues').doc(memberId); // Crea un riferimento alla lega
            batch.set(leagueRef, { id: memberId, punti: 0 }); // Imposta i dati per la lega
            leagueRefs.push(memberId); // Salva l'ID della lega
        });

        await batch.commit(); // Esegui il batch
        return res.status(201).json({ leagueIds: leagueRefs }); // Restituisce gli ID delle leghe create
    } catch (error) {
        console.error('Error creating leagues:', error);
        return res.status(500).send('Error creating leagues.');
    }
};

exports.deleteLeagues = async (req, res) => {
    const { leagueIds } = req.body;

    // Verifica se l'input è valido
    if (!Array.isArray(leagueIds) || leagueIds.length === 0) {
        return res.status(400).send('Invalid input: leagueIds must be a non-empty array.');
    }

    const batch = admin.firestore().batch(); // Inizializza un batch
    try {
        leagueIds.forEach(id => {
            const leagueRef = admin.firestore().collection('leagues').doc(id); // Crea un riferimento alla lega
            batch.delete(leagueRef); // Aggiungi l'operazione di eliminazione al batch
        });

        await batch.commit(); // Esegui il batch
        return res.status(200).send('Leagues deleted successfully.');
    } catch (error) {
        console.error('Error deleting leagues:', error);
        return res.status(500).send('Error deleting leagues.');
    }
};
//league