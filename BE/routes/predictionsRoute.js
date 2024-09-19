const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/authMiddleware');


// Inizializza Firestore
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const router = express.Router();

// Route per inserire una predizione
router.post('/add', authMiddleware, async (req, res) => {
    const { userId, leagueId, schedina, daysId } = req.body;

    if (!userId || !leagueId || !schedina || !daysId) {
        return res.status(400).json({ message: 'userId, leagueId e schedina sono obbligatori.' });
    }

    // Genera un predictionId
    const predictionId = uuidv4();

    // Struttura del documento da salvare
    const predictionData = {
        predictionId,
        userId,
        leagueId,
        daysId,
        schedina
    };

    try {
        // Salva il documento su Firestore nella collection "predictions"
        const predictionRef = firestore.collection('predictions').doc(predictionId);
        await predictionRef.set(predictionData);

        // Recupera il documento appena salvato
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
            return res.status(404).json({ message: 'Nessuna predizione trovata' });
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
