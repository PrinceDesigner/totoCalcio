const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/authMiddleware');
const moment = require('moment-timezone'); // Importa moment per gestire le date e i fusi orari


// Inizializza Firestore
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const router = express.Router();

// Route per inserire o aggiornare una predizione
router.post('/add', authMiddleware, async (req, res) => {
    const { userId, leagueId, schedina, daysId } = req.body;

    if (!userId || !leagueId || !schedina || !daysId) {
        return res.status(400).json({ message: 'userId, leagueId, schedina e daysId sono obbligatori.' });
    }

    const dayDoc = await firestore.collection('days').doc(daysId).get();

    if (!dayDoc.exists) {
        return res.status(404).json({ message: 'Giornata non trovata.' });
    }

    const startDate = dayDoc.data().startDate;

    // Converti startDate e confronta con la data e ora attuali
    const currentDate = moment().utc(true).tz('Europe/Rome'); // Ottieni la data attuale nel fuso orario specificato
    const matchStartDate = moment.tz(startDate, 'Europe/Rome');

    if (currentDate.isAfter(matchStartDate)) {
        return res.status(405).json({ message: 'La giornata è già iniziata.', data: matchStartDate });
    }

    try {
        // Verifica se `leagueId` contiene più ID separati da virgole
        const leagueIds = leagueId.includes(',') ? leagueId.split(',') : [leagueId];
        let schedineresponse = [];
        // Cicla su ogni `leagueId` da processare
        for (const singleLeagueId of leagueIds) {
            // Controlla se esiste già una predizione con questi parametri
            const existingPredictionQuery = await firestore.collection('predictions')
                .where('userId', '==', userId)
                .where('leagueId', '==', singleLeagueId)
                .where('daysId', '==', daysId)
                .get();

            let predictionId;
            let operation;

            if (!existingPredictionQuery.empty) {
                // Se esiste già una predizione, aggiornala
                const existingPredictionDoc = existingPredictionQuery.docs[0]; // Ottieni il primo risultato
                predictionId = existingPredictionDoc.id; // Usa l'ID del documento esistente
                operation = 'update';
            } else {
                // Se non esiste, crea una nuova predizione
                predictionId = uuidv4(); // Genera un nuovo UUID
                operation = 'create';
            }

            // Struttura del documento da salvare o aggiornare
            const predictionData = {
                predictionId,
                userId,
                leagueId: singleLeagueId, // Utilizza il leagueId corrente
                daysId,
                schedina,
                punti: 0
            };

            // Salva o aggiorna il documento su Firestore nella collection "predictions"
            const predictionRef = firestore.collection('predictions').doc(predictionId);
            await predictionRef.set(predictionData, { merge: true }); // Usa { merge: true } per aggiornare solo i campi specificati

            // Recupera il documento appena salvato o aggiornato
            const savedPrediction = await predictionRef.get();

            if (!savedPrediction.exists) {
                console.error(`Errore durante il salvataggio della predizione per leagueId: ${singleLeagueId}`);
                return res.status(500).json({ message: 'Errore durante il salvataggio della predizione.' });
            }
            schedineresponse.push(predictionData)
        }

        // Se arriva qui, tutte le predizioni sono state salvate con successo
        return res.status(201).json(schedineresponse);
    } catch (error) {
        console.error('Errore durante il salvataggio della predizione:', error);
        return res.status(500).json({ message: 'Errore durante il salvataggio della predizione.' });
    }

    // try {
    //     // Controlla se esiste già una predizione con questi parametri
    //     const existingPredictionQuery = await firestore.collection('predictions')
    //         .where('userId', '==', userId)
    //         .where('leagueId', '==', leagueId)
    //         .where('daysId', '==', daysId)
    //         .get();

    //     let predictionId;
    //     let operation;

    //     if (!existingPredictionQuery.empty) {
    //         // Se esiste già una predizione, aggiornala
    //         const existingPredictionDoc = existingPredictionQuery.docs[0]; // Ottieni il primo risultato
    //         predictionId = existingPredictionDoc.id; // Usa l'ID del documento esistente
    //         operation = 'update';
    //     } else {
    //         // Se non esiste, crea una nuova predizione
    //         predictionId = uuidv4(); // Genera un nuovo UUID
    //         operation = 'create';
    //     }

    //     // Struttura del documento da salvare o aggiornare
    //     const predictionData = {
    //         predictionId,
    //         userId,
    //         leagueId,
    //         daysId,
    //         schedina,
    //         punti: 0
    //     };

    //     // Salva o aggiorna il documento su Firestore nella collection "predictions"
    //     const predictionRef = firestore.collection('predictions').doc(predictionId);
    //     await predictionRef.set(predictionData, { merge: true }); // Usa { merge: true } per aggiornare solo i campi specificati

    //     // Recupera il documento appena salvato o aggiornato
    //     const savedPrediction = await predictionRef.get();

    //     if (!savedPrediction.exists) {
    //         return res.status(500).json({ message: 'Errore durante il salvataggio della predizione.' });
    //     }

    //     // Restituisce il documento salvato come risposta
    //     return res.status(201).json(savedPrediction.data());
    // } catch (error) {
    //     console.error('Errore durante il salvataggio della predizione:', error);
    //     return res.status(500).json({ message: 'Errore durante il salvataggio della predizione.' });
    // }
});

// Route per controllare se esiste già una predizione
router.get('/check', async (req, res) => {
    const { dayId, leagueId, userId } = req.query;

    try {
        // Query per trovare una predizione con dayId, leagueId e userId
        const predictionsSnapshot = await firestore.collection('predictions')
            .where('daysId', '==', dayId)
            .where('leagueId', '==', leagueId)
            .where('userId', '==', userId)
            .get();

        if (predictionsSnapshot.empty) {
            // Nessuna predizione trovata
            return res.status(200).json({});
        }

        // Se c'è almeno una predizione, restituiscila (assumo che ce ne sia solo una)
        const predictionData = predictionsSnapshot.docs[0].data();
        res.status(200).json(predictionData);
    } catch (error) {
        console.error('Errore durante il controllo della predizione:', error);
        res.status(500).json({ message: 'Errore durante il controllo della predizione' });
    }
});


// Route per ottenere le predictions in base a leagueId e daysId
router.get('/predictionsForDayId', async (req, res) => {
    try {
        // Otteniamo i parametri dalla query string
        const { leagueId, daysId } = req.query;

        if (!leagueId || !daysId) {
            return res.status(400).json({ error: 'leagueId e daysId sono richiesti.' });
        }

        // Accediamo alla collezione predictions
        const predictionsRef = firestore.collection('predictions');
        const snapshot = await predictionsRef
            .where('leagueId', '==', leagueId)
            .where('daysId', '==', daysId)
            .get();

        let predictions = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            if (!predictions[userId]) {
                predictions[userId] = [];
            }
            predictions[userId] = { id: doc.id, ...data };
        });

        // Rispondiamo con le predictions trovate o un array vuoto
        res.status(200).json(predictions);
    } catch (error) {
        console.error('Errore durante il recupero delle predictions:', error);
        res.status(500).json({ error: 'Errore del server durante il recupero delle predictions.' });
    }
});



module.exports = router;
