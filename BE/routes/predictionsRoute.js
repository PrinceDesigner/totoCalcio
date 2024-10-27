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

    // Step 1: Controllo sulla startDate della giornata
    const dayDoc = await firestore.collection('days').doc(daysId).get();

    if (!dayDoc.exists) {
        return res.status(404).json({ message: 'Giornata non trovata.' });
    }

    const startDate = dayDoc.data().startDate;

    // Converti startDate e confronta con la data e ora attuali
    const currentDate = moment().tz('Europe/Rome'); // Ottieni la data attuale nel fuso orario specificato
    const matchStartDate = moment.tz(startDate, 'Europe/Rome');

    if (currentDate.isAfter(matchStartDate)) {
        return res.status(403).json({ message: 'La giornata è già iniziata.', data: matchStartDate });
    }

    try {
        // Controlla se esiste già una predizione con questi parametri
        const existingPredictionQuery = await firestore.collection('predictions')
            .where('userId', '==', userId)
            .where('leagueId', '==', leagueId)
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
            leagueId,
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
            return res.status(500).json({ message: 'Errore durante il salvataggio della predizione.' });
        }

        // Restituisce il documento salvato come risposta
        return res.status(201).json(savedPrediction.data());
    } catch (error) {
        console.error('Errore durante il salvataggio della predizione:', error);
        return res.status(500).json({ message: 'Errore durante il salvataggio della predizione.' });
    }
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



module.exports = router;
