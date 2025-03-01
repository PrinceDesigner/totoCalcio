// functions/index.js
const functions      = require("firebase-functions/v1");
const admin          = require("firebase-admin");
const serviceAccount = require('./firebase-service-account.json');
const { google }     = require('googleapis');
const moment         = require('moment-timezone');
const axios          = require('axios');
//const { v4: uuidv4 } = require('uuid'); // Importa la funzione per generare UUID
const { log,error,info }        = require("firebase-functions/logger");

const { migrationUser } = require('./migration_User');
const { migrateDaysAndMatches } = require('./migration_Days_Matches');
const { migrateLeaguesAndMembers } = require('./migr_League_memersInfo');
const {migrationPredictionsAndSchedina } = require('./migr_Predictions_Schedina');
const { migrateGiornateCalcolate } = require('./migr_Giornate_Calcolate');
const {calcolaPuntiGiornataTest,calcolaPuntiGiornataTest2 } = require('./calcoloGiornata');
const {updateMatchesSupa,updateDateMatchSupa,scheduleDayUpdateTasks_Supa,updateSingleMatchIdSupa } = require('./updateMatch');
const {sendWeeklyNotificationSupa} = require('./notifche');
const {exportAllTables} = require('./backupTable');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://totocalcioreact-default-rtdb.europe-west1.firebasedatabase.app"
});

const firestore = admin.firestore();
const rtdb = admin.database();
//spostato in calcolaPuntiGiornataTest
exports.calcolaPuntiGiornata = functions.https.onCall(async (data, context) => {

    // Step di inizializzazione e verifica lock

    const { leagueId, dayId } = data;
    const documentId = `${leagueId}_${dayId}`;
    const lockRef = rtdb.ref(`locks/${leagueId}/${dayId}`);
    const lockSnapshot = await lockRef.once('value');
    const isLocked = lockSnapshot.exists() && lockSnapshot.val() === true;
    // Recupera il documento
    //controllo che per non sia già stata calcolata nel caso in cui abbiamo cancellato il lock
    let isCalculated = false;
    const collectionName = "giornateCalcolate";

    const calcoloGiornataQuery = firestore
        .collection(collectionName)
        .where('leagueId', '==', leagueId)
        .where('dayId', '==', dayId)
        .select('calcolate'); // Seleziona solo il campo `calcolate`

    const calcoloGiornataQuerySnapshot = await calcoloGiornataQuery.get(); // Esegui la query

    if (!calcoloGiornataQuerySnapshot.empty) {
        const giornataCalcolata = calcoloGiornataQuerySnapshot.docs[0].data(); // Ottieni i dati del primo documento
        isCalculated = giornataCalcolata.calcolate; // Ottieni il valore booleano `calcolate`
    }

    if (isLocked || isCalculated) {//aggiunta condizione in OR
        console.log("Il documento è già bloccato.");
        console.log("isCalculated " ,isCalculated);
        console.log("isLocked " , isLocked);
        return { success: false, message: "Giornata già calcolata" };
    }
    await lockRef.set(true); // Blocca il documento

    try {
        // Caricamento dei dati
        const [matchesSnapshot, predictionsSnapshot, leagueDoc] = await Promise.all([
            firestore.collection('matches').where('dayId', '==', dayId).select('matchId', 'result').get(),
            firestore.collection('predictions').where('leagueId', '==', leagueId).where('daysId', '==', dayId).select('userId', 'schedina').get(),
            firestore.collection('leagues').doc(leagueId).get()
        ]);

        // Creazione batch e calcolo punti
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
        batchIndex + 1//gli utilimi due update saranno posizionati nell'ultima posizione del batch
        batchArray[batchIndex].update(leagueDoc.ref, { membersInfo: updatedMembersInfo });
        batchArray[batchIndex].update(firestore.collection('giornateCalcolate').doc(documentId), { calcolate: true });

        // Commit di tutti i batch
        /*for (const batch of batchArray) {
            await batch.commit();
        }*/
        await Promise.all(batchArray.map(batch => batch.commit()));//fa più batch in parallelo - LIMITE 500 scritture per secondo

        return { success: true, message: "Calcolo punti completato con successo." };

    } catch (error) {
        console.error(`Errore calcolaPuntiGiornata catch `, error);
        await lockRef.remove(); // Blocca il documento
    }
});

// Function per pianificare il task di aggiornamento per ogni giornata
exports.scheduleDayUpdateTasks = functions.https.onCall(async (data, context) => {
    console.log('START --> scheduleDayUpdateTasks');
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

            info('JOB->', job)
            info('Auth ->', authClient)

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

//capire se serve
exports.scheduleDayUpdateTasksV2 = functions
    .runWith({ timeoutSeconds: 540, memory: '2GB' })
    .https.onRequest(async (req, res) => {
        console.log('START --> scheduleDayUpdateTasks');
        const promises = [];

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

                const promise = scheduler.projects.locations.jobs.create({
                    parent: `projects/${projectId}/locations/us-central1`,
                    requestBody: job,
                    auth: authClient,
                });
                info('JOB->', job)
                info('Auth ->', authClient)
                promises.push(promise);
            });
            await Promise.all(promises); // Aspetta che tutte le promesse siano risolte

            return res.status(200).send({ success: true, message: "Tasks pianificati correttamente" });
        } catch (error) {
            console.error('Errore durante la pianificazione dei task:', error);
            return res.status(500).send({ success: false, message: 'Errore durante la pianificazione dei task' });
        }
    });

//post migrazione sarà sostiuita con updateMatchesSupa
exports.updateMatches = functions.https.onRequest(async (req, res) => {
    console.time('Data Retrieval Time');

    const { dayId, noStep = false } = req.body;
    log('START--->>>', dayId);

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
        log('FIXTURES->', fixtures);
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
            acc[leagueId] = { calcolata: leagueId.calcolata || false };
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
            console.info("match.fixture.status.short", match.fixture.status.short)
            const matchRef = firestore.collection('matches').doc(match.fixture.id.toString());
            batchArray[batchIndex].update(matchRef, { result: determineResult(match.goals.home, match.goals.away,match.fixture.status.short), status: match.fixture.status.short });
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
        await updateCurrentGiornata(noStep);

        res.status(200).send({ success: true, message: "Partite aggiornate con successo" });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento delle partite:', error);
        res.status(500).send({ success: false, message: "Errore durante l'aggiornamento delle partite" });
    }
});

//Aggiornamento delle date dei match
//post migrazione sarà sostiuita con updateDateMatchSupa
exports.updateDateMatch = functions
    .region('europe-west1')
    .runWith({ timeoutSeconds: 540, memory: '2GB' })
    .https.onRequest(async (req, res) => {
        console.time('Data Retrieval Time');
        info('START --> Updating Match Start Times');

        try {
            // Ottieni tutti i dati delle partite dalla API di football
            const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures`, {
                params: {
                    league: '135',
                    season: '2024',
                },
                headers: {
                    'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
                    'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
                },
            });

            const fixtures = response.data.response;
            info('FIXTURES ->', fixtures);

            console.timeEnd('Data Retrieval Time');

            console.time('Batch Processing');
            // Preparazione dei batch per aggiornare solo l'orario di inizio (startTime) dei match
            const batchArray = [firestore.batch()];
            let batchIndex = 0;
            let operationCount = 0;
            const MAX_BATCH_SIZE = 499;

            for (const match of fixtures) {
                const matchRef = firestore.collection('matches').doc(match.fixture.id.toString());
                let italianTime = moment.utc(match.fixture.date).tz("Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00');


                // Aggiorna solo il campo `startTime` con il tempo di inizio del match
                batchArray[batchIndex].update(matchRef, { startTime: italianTime });
                operationCount++;

                // Controlla se il batch ha raggiunto la dimensione massima
                if (operationCount === MAX_BATCH_SIZE) {
                    batchArray.push(firestore.batch());
                    batchIndex++;
                    operationCount = 0;
                }
            }

            console.timeEnd('Batch Processing');

            console.time('Batch Commit');
            // Commit sequenziale dei batch
            for (const batch of batchArray) {
                await batch.commit();
            }
            console.timeEnd('Batch Commit');
            res.status(200).send({ success: true, message: "Orari di inizio dei match aggiornati con successo" });
        } catch (error) {
            console.error('Errore durante l\'aggiornamento degli orari di inizio dei match:', error);
            res.status(500).send({ success: false, message: "Errore durante l'aggiornamento degli orari di inizio dei match" });
        }
    });

// Funzione per determinare il risultato
function determineResult(homeGoals, awayGoals,status) {

    if (homeGoals === null || awayGoals === null || status=="ABD" ) {
        return null; // Se uno dei due valori è null, restituisci una stringa vuota
    }
    if (homeGoals > awayGoals) return "1"; // Vittoria squadra di casa
    if (homeGoals < awayGoals) return "2"; // Vittoria squadra ospite
    if (homeGoals == awayGoals) return "X"; // Pareggio
    return null;//-> nel caso di partita rinviata
}

// Funzione per aggiornare la giornata attuale

async function updateCurrentGiornata(noStep) {

    if (noStep) {//Quando update match parte da una partita posticipata non andare avanti con la giornata
        return ""
    }
    const promises = [];
    const projectId = 'totocalcioreact'; // Usa l'ID del progetto Firebase
    // Usa il GoogleAuth per ottenere l'authClient con i corretti scopes
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-scheduler', 'https://www.googleapis.com/auth/cloud-platform'],
    });

    const authClient = await auth.getClient();
    // const authClient = await auth.getClient();
    const scheduler = google.cloudscheduler('v1', { auth: authClient });


    const currentGiornataRef = firestore.collection('giornataAttuale').limit(1);
    const currentGiornataSnapshot = await currentGiornataRef.get();

    if (!currentGiornataSnapshot.empty) {
        const doc = currentGiornataSnapshot.docs[0];
        const currentGiornataData = doc.data().giornataAttuale;

        // Estrai e incrementa il numero corrente
        const currentGiornataNumber = parseInt(currentGiornataData.split('-')[1], 10);
        const updatedGiornataNumber = currentGiornataNumber + 1;
        const updatedGiornataAttuale = `RegularSeason-${updatedGiornataNumber}`;
        //updatato prima giornata attuale a prescindere dai batch creati
        await doc.ref.update({ giornataAttuale: updatedGiornataAttuale });
        log(`Giornata attuale aggiornata a: ${updatedGiornataAttuale}`);

        //query per recupero match della prossiam giornata attuale+1 in updatedGiornataAttuale
        const [matches] = await Promise.all([
            firestore.collection('matches').where('dayId', '==', updatedGiornataAttuale).select('startTime','matchId').get()
        ]);
        //Al passaggio da una giornata (10 -> 11) si aggiungono dei batch per ogni singolo match di quella giornata
        //come input matchId così entriamo sul db direttamente ed aggiorniamo il singolo match -> Funz updateSingleMatchId
        matches.forEach(singleMatch => {
            const matchIdData = singleMatch.data();
            const matchId = matchIdData.matchId;
            // Ottieni la data di fine con moment
            const endDate = moment(matchIdData.startTime);
            // Aggiungi 2 ore alla data di fine
            const scheduleTime = endDate.add(2, 'hours');

            // Estrai i componenti della data e dell'ora per la programmazione del task
            const scheduleMinute = scheduleTime.minutes();
            const scheduleHour = scheduleTime.hours();
            const scheduleDay = scheduleTime.date();
            const scheduleMonth = scheduleTime.month() + 1; // I mesi in Moment sono indicizzati da 0

            console.log('schedule->', `0 ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`);
            console.log('endDate->', endDate.format());
            console.log('scheduleTime->', scheduleTime.format());
            console.log('matchId ->', matchId);

            const job = {
                name: `projects/${projectId}/locations/us-central1/jobs/update-Match-After-Finish-${matchId}`,
                schedule: `${scheduleMinute} ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`, // Configura l'orario con Moment
                timeZone: 'Europe/Rome',
                httpTarget: {
                    uri: `https://us-central1-${projectId}.cloudfunctions.net/updateSingleMatchId?matchId=${matchId}`,
                    httpMethod: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                },
            };

            const promise = scheduler.projects.locations.jobs.create({
                parent: `projects/${projectId}/locations/us-central1`,
                requestBody: job,
                auth: authClient,
            });
            /*info('JOB->', job)
            info('Auth ->', authClient)*/
            promises.push(promise);
    });
        await Promise.all(promises); // Aspetta che tutte le promesse siano risolte
    }
}

//Invocato dal batch creato dal passaggio della giornata (10 -> 11)
//Updata ogni singolo match 30 min dopo la loro fine
//1 batch ->  1 partita
exports.updateSingleMatchId = functions.https.onRequest(async (req, res) => {
    info('Start updateSingleMatchId ');
    // Prendi il matchId dai query string parameters
    const { matchId } = req.query;
    const strMatchId = matchId.toString();
    info('updateSingleMatchId - matchId ',strMatchId);
     // Ottieni i dati dalla API di football
    try {
        // Chiamata all'API per ottenere i dati della partita
        const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${strMatchId}`, {
            headers: {
                'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
            },
        });

        // Verifica che la risposta contenga dati
        if (response.data && response.data.response && response.data.response.length > 0) {
            const fulltimeScore = {
                home: response.data.response[0].goals.home,
                away: response.data.response[0].goals.away,
                status: response.data.response[0].fixture.status.short,
            };

            info('updateSingleMatchId - fulltimeScore', fulltimeScore);

            // Aggiorna il documento in Firestore
            const matchRef = firestore.collection('matches').doc(strMatchId);

            await matchRef.update({
                result: determineResult(fulltimeScore.home, fulltimeScore.away,fulltimeScore.status),
                status: fulltimeScore.status,
            });

            info('Finish updateSingleMatchId');
            return res.status(200).send('Finish updateSingleMatchId successfully');
        } else {
            throw new Error('No match data found in the response.');
        }
    } catch (error) {
        error('Error fetching match data or updating Firestore document', error);
        return res.status(500).send('Error fetching match data or updating Firestore document');
    }
});

//NOTIFICHE
exports.sendWeeklyNotification = functions.https.onRequest(async (req, res) => {
    info('Start sendWeeklyNotification');

    var  body  = '';
    var  title = '';
    try {
        // Recupera tutti i token dalla collezione 'users' (selezionando solo il campo 'tokenNotification')
        const tokensSnapshot = await firestore.collection('users').select('tokenNotification').get();
        const tokens = tokensSnapshot.docs
            .map(doc => doc.data().tokenNotification)  // Estrae direttamente i token
            .filter(token => token);  // Filtra i valori falsy (ad esempio, token nulli o vuoti)

        if (tokens.length === 0) {
            info('Nessun token trovato per inviare notifiche.');
            return res.status(200).send('Nessun token trovato.');
        }

        // Invia le notifiche utilizzando Expo
        const Expo = require('expo-server-sdk').default;
        const expo = new Expo();
        // Recupera la notifica
        const notificheQ = await firestore.collection('notifiche').select('body', 'title').limit(1).get();

        if (!notificheQ.empty) {
            const doc = notificheQ.docs[0];
            ({ body, title } = doc.data());
            console.log('Body:', body, 'Title:', title);
        } else {
            console.log('Nessun record trovato.');
            return res.status(404).json({
                message: 'Nessuna notifica trovata in tabella',
            });
        }
        // Messaggio delle notifiche
        const message = {
            title: title,
            body: body,
        };
        // Crea messaggi per ogni token
        const messages = tokens.map(token => {
            if (!Expo.isExpoPushToken(token)) {
                warn(`Token non valido: ${token}`);
                return null; // Ignora token non validi
            }
            return {
                to: token,
                sound: 'default',
                title: message.title,
                body: message.body,
            };
        }).filter(msg => msg !== null); // Filtra i messaggi nulli

        // Invia le notifiche in batch (max 100 notifiche per batch)
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = []; // Array per raccogliere tutti i ticket

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk); // Invio batch
                tickets.push(...ticketChunk); // Aggiungi i ticket al risultato totale
                info('Batch inviato con successo:', ticketChunk);
            } catch (error) {
                error('Errore durante l\'invio del batch:', error);
            }
        }

        // Log dei ticket
        info('Tutti i ticket:', tickets);

        // Rispondi al client con successo
        return res.status(200).send(`Notifiche inviate con successo a ${tokens.length} utenti!`);
    } catch (error) {
        // Gestione degli errori
        error(`Errore nell'invio delle notifiche: ${error.message}`);
        return res.status(500).send(`Errore nell'invio delle notifiche: ${error.message}`);
    }
});

//gestione rinviati
// Trigger per ascoltare gli aggiornamenti sul documento `matche`
exports.scheduleJobOnUpdate = functions.firestore
    .document('matches/{matchId}')
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data(); // Stato precedente del documento
        const afterData = change.after.data(); // Stato successivo del documento
        const dayId = afterData.dayId;
        log('ALL data match ',beforeData)
        log('afterData.startTime',afterData.startTime)
        log('beforeData.startTime',beforeData.startTime)
        log('beforeData.status',afterData.status)

        // Verifica se startTime è stato aggiornato e che lo stato precedente fosse 'PST'
        if (afterData.startTime !== beforeData.startTime && beforeData.status === 'PST') {
            try {
                const projectId = 'totocalcioreact'; // Usa l'ID del progetto Firebase
                // Usa il GoogleAuth per ottenere l'authClient con i corretti scopes
                const auth = new google.auth.GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/cloud-scheduler', 'https://www.googleapis.com/auth/cloud-platform'],
                });

                const authClient = await auth.getClient();
                const scheduler = google.cloudscheduler('v1', { auth: authClient });
                // Converte startTime in un oggetto Moment.js
                const endDate = moment(afterData.startTime);

                // Verifica che endDate sia valido
                if (!endDate.isValid()) {
                    error('startTime non valido:', afterData.startTime);
                    return null;
                }

                // Aggiungi 2 ore alla data di endTime
                const scheduleTime = endDate.add(2, 'hours');

                // Estrai i componenti per la programmazione
                const scheduleMinute = scheduleTime.minutes();
                const scheduleHour = scheduleTime.hours();
                const scheduleDay = scheduleTime.date();
                const scheduleMonth = scheduleTime.month() + 1; // I mesi in Moment sono indicizzati da 0

                // Log per verificare la data e l'orario di schedulazione
                info('scheduleTime->', scheduleTime.format());
                info('endDate->', endDate.format());

                // Crea un job di Cloud Scheduler
                const job = {
                    name: `projects/${projectId}/locations/us-central1/jobs/update-matchesPosticipato-${context.params.matchId}`,
                    schedule: `${scheduleMinute} ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`, // Formato cron
                    timeZone: 'Europe/Rome',
                    httpTarget: {
                        uri: `https://us-central1-${projectId}.cloudfunctions.net/updateMatches`,
                        httpMethod: 'POST',
                        body: Buffer.from(JSON.stringify({ dayId: dayId, noStep: true })).toString('base64'),//Aggiorno tutta la giornata di quel match
                        headers: { 'Content-Type': 'application/json' },
                    },
                };

                // Creazione del job nel Cloud Scheduler
                const promise = scheduler.projects.locations.jobs.create({
                    parent: `projects/${projectId}/locations/us-central1`,
                    requestBody: job,
                    auth: authClient,
                });

                info('Job creato:', job);
                await promise;
                return promise;
            } catch (error) {
                error('Errore nella creazione del job:', error);
                throw new Error('Impossibile creare il job nel Cloud Scheduler');
            }
        } else {
            // Nessuna azione se le condizioni non sono soddisfatte
            return null;
        }
    });
//gestione rinviati

exports.scheduleJobOnUpdateSupa = functions.https.onRequest(async (req, res) => {

    const { dayId,matchId,startTime } = req.body;
        info(' Request scheduleJobOnUpdateSupa ', req.body);
        info('matchId - scheduleJobOnUpdateSupa',matchId);

        // Verifica se startTime è stato aggiornato e che lo stato precedente fosse 'PST'
        try {
            const projectId = 'totocalcioreact'; // Usa l'ID del progetto Firebase
            // Usa il GoogleAuth per ottenere l'authClient con i corretti scopes
            const auth = new google.auth.GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/cloud-scheduler', 'https://www.googleapis.com/auth/cloud-platform'],
            });

            const authClient = await auth.getClient();
            const scheduler = google.cloudscheduler('v1', { auth: authClient });
            // Converte startTime in un oggetto Moment.js
            const endDate = moment(startTime);

            // Verifica che endDate sia valido
            if (!endDate.isValid()) {
                error('startTime non valido:', startTime);
                return null;
            }

            // Aggiungi 2 ore alla data di endTime
            const scheduleTime = endDate.add(2, 'hours');

            // Estrai i componenti per la programmazione
            const scheduleMinute = scheduleTime.minutes();
            const scheduleHour = scheduleTime.hours();
            const scheduleDay = scheduleTime.date();
            const scheduleMonth = scheduleTime.month() + 1; // I mesi in Moment sono indicizzati da 0

            // Log per verificare la data e l'orario di schedulazione
            info('scheduleTime->', scheduleTime.format());
            info('endDate->', endDate.format());
            info('scheduleMinute', scheduleMinute);
            info('scheduleHour', scheduleHour);
            info('scheduleDay', scheduleDay);
            info('scheduleMonth', scheduleMonth);

            // Crea un job di Cloud Scheduler
            const job = {
                name: `projects/${projectId}/locations/us-central1/jobs/update-matchesPosticipatoSupa-${matchId}`,
                schedule: `${scheduleMinute} ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`, // Formato cron
                timeZone: 'Europe/Rome',
                httpTarget: {
                    uri: `https://us-central1-${projectId}.cloudfunctions.net/updateMatchesSupa`,
                    httpMethod: 'POST',
                    body: Buffer.from(JSON.stringify({ dayId: dayId, noStep: true })).toString('base64'),//Aggiorno tutta la giornata di quel match
                    headers: { 'Content-Type': 'application/json' },
                },
            };

            // Creazione del job nel Cloud Scheduler
            const promise = scheduler.projects.locations.jobs.create({
                parent: `projects/${projectId}/locations/us-central1`,
                requestBody: job,
                auth: authClient,
            });
            return res.status(200).send(`job creato!`);
        } catch (error) {
            throw new Error('Impossibile creare il job nel Cloud Scheduler');
        }
});

exports.migrationUser                       = migrationUser;
exports.migrateDaysAndMatches               = migrateDaysAndMatches;
exports.migrateLeaguesAndMembers            = migrateLeaguesAndMembers;
exports.migrationPredictionsAndSchedina      = migrationPredictionsAndSchedina;
exports.migrateGiornateCalcolate             = migrateGiornateCalcolate;

//utili per dei test prima della migrazione a supa
exports.calcolaPuntiGiornataTest             = calcolaPuntiGiornataTest;
exports.calcolaPuntiGiornataTest2            = calcolaPuntiGiornataTest2; //*
//utili per dei test prima della migrazione a supa

exports.updateMatchesSupa                    = updateMatchesSupa;
exports.updateDateMatchSupa                  = updateDateMatchSupa;
exports.scheduleDayUpdateTasks_Supa          = scheduleDayUpdateTasks_Supa;
exports.updateSingleMatchIdSupa              = updateSingleMatchIdSupa;

exports.sendWeeklyNotificationSupa           = sendWeeklyNotificationSupa;
exports.exportAllTables                      = exportAllTables;

