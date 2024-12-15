// Importa le dipendenze necessarie
const express = require('express');
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato correttamente Firebase Admin SDK
const authMiddleware = require('../middlewares/authMiddleware'); // Importa il middleware di autenticazione

const router = express.Router();

router.get('/giornate-calcolate/:leagueId', authMiddleware, async (req, res) => {
  const { leagueId } = req.params; // Prendi il parametro leagueId dalla richiesta

  try {
    // Esegui la query sulla raccolta "giornateCalcolate" per trovare i documenti con il campo leagueId uguale a quello specificato
    const snapshot = await firestore.collection('giornateCalcolate')
      .where('leagueId', '==', leagueId)
      .get();
    //get_giornate_calcolate_byleagueid -> già pronta da rivedere i tag di uscita
    // Controlla se sono stati trovati documenti
    if (snapshot.empty) {
      return res.status(200).json({ message: 'Nessun documento trovato per questa leagueId.', documents: []});
    }

    // Inizializza un array per contenere i documenti uniti
    const mergedData = [];

    // Itera sui documenti trovati e aggiungi i dati al mergedData
    snapshot.forEach(doc => {
      // Aggiungi direttamente doc.data() al mergedData
      mergedData.push(doc.data());
    });

    // Invia i documenti uniti come risposta JSON
    res.status(200).json({ documents: mergedData });
  } catch (error) {
    console.error('Errore durante il recupero dei documenti:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei documenti dalla raccolta giornateCalcolate.' });
  }
});


// Route per ottenere tutti i documenti con una specifica leagueId e userId nella raccolta "giornateCalcolate"
router.get('/giornate-calcolate/:leagueId/:userId', authMiddleware, async (req, res) => {
  const { leagueId, userId } = req.params;
  /*post migrazione usare get_predictions_with_schedine con in input leagueid e userid
    output jsonArray [
    {
    schedina_id: 'cf539621-525e-4222-9f24-29eac5549722',
    esitogiocato: '1',
    result: '1',
    matchid: '1223735',
    prediction_id: '130397dd-eb8c-4af9-88b8-c3ca474a974c',
    dayid: 'RegularSeason-15'
  },
  ........
  */
  try {

    const predictionsPromises = [];
    const predictionsSnapshot = await firestore.collection('predictions')
      .where('leagueId', '==', leagueId)
      .where('userId', '==', userId)
      .get();

    // Aggiungi le predizioni a predictionsPromises
    predictionsSnapshot.docs.forEach(predictionDoc => {
      const predictionData = predictionDoc.data();
      predictionsPromises.push({
        daysId: predictionData.daysId,
        id: predictionDoc.id,
        ...predictionData
      });
    });

    const predictionsMap = {};
    predictionsPromises.forEach(prediction => {
      predictionsMap[prediction.daysId] = prediction;
    });

    console.log('predictionsPromises', predictionsPromises);

    // Crea l'array finale con le predizioni complete
    const documentsWithPredictions = predictionsPromises.map(document => ({
      ...predictionsMap[document.daysId] || null // Aggiungi la predizione completa o null se non esiste
    }));


    res.status(200).json({ documentsWithPredictions });
  } catch (error) {
    console.error('Errore durante il recupero dei documenti:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei documenti dalla raccolta giornateCalcolate.' });
  }
});


module.exports = router;
