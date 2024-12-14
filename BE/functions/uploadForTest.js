// functions/index.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require('uuid'); // Importa la funzione per generare UUID
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
    console.log("Dati ricevuti:", predictionsData);

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
            console.log("docRef ", docRef)
            batch.set(docRef, { ...prediction, predictionId: uniqueId }); // Aggiungi l'operazione di scrittura al batch
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
    console.error("QUI CI SONO LE PREDICTION", predictionIds);
    const batch = admin.firestore().batch(); // Inizializza un batch

    // Aggiungi le operazioni di eliminazione al batch
    try {
        predictionIds.forEach(id => {
            console.error("QUI CI SONO LE PREDICTION nel for", id);
            // Crea un riferimento al documento
            const predictionRef = admin.firestore().collection('predictions').doc(id);
            // Aggiungi l'operazione di eliminazione al batch
            batch.delete(predictionRef);
            console.log("predictionRef ", predictionRef)
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
exports.createLeagues = functions.https.onRequest(async (req, res) => {
    const { members, membersInfo, leagueId } = req.body;
    console.log("League id input", leagueId)
    // Verifica se l'input è valido
    if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).send('Invalid input: members must be a non-empty array.');
    }

    if (!Array.isArray(membersInfo) || membersInfo.some(member => !member.id || member.punti === undefined)) {
        return res.status(400).send('Invalid input: membersInfo must be an array of JSON objects with "id" and "punti" fields.');
    }

    const leagueRef = admin.firestore().collection('leagues').doc(leagueId);

    try {
        // Imposta i dati della lega insieme a `members` e `membersInfo`
        await leagueRef.set({
            id: leagueId,
            members: admin.firestore.FieldValue.arrayUnion(...members),
            membersInfo: admin.firestore.FieldValue.arrayUnion(...membersInfo) // Aggiorna `membersInfo` direttamente come array
        }, { merge: true });

        console.log(`League ${leagueId} created/updated with members and membersInfo:`, members, membersInfo);
        return res.status(201).json({ leagueId: leagueId, members: members, membersInfo });
    } catch (error) {
        console.error('Error creating/updating league:', error);
        return res.status(500).send('Error creating/updating league.', error);
    }
});

exports.deleteLeagues = functions.https.onRequest(async (req, res) => {
    const { leagueIds } = req.body;
    console.log('Input received:', { leagueIds });

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
});
//league