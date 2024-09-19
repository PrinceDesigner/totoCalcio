const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/authMiddleware');


// Inizializza Firestore
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const router = express.Router();

// Route per inserire una predizione
router.post('/add',authMiddleware, async (req, res) => {
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

module.exports = router;
