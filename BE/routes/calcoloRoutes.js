// Importa le dipendenze necessarie
const express = require('express');
const supabase = require('../superBaseConnect');

const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato correttamente Firebase Admin SDK
const authMiddleware = require('../middlewares/authMiddleware'); // Importa il middleware di autenticazione

const router = express.Router();

async function getGiornateDaCalcolare(p_leagueid) {
  let { data, error } = await supabase
  .rpc('get_giornate_calcolate_byleagueid', {
    p_leagueid
  })

  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}

router.get('/giornate-calcolate/:leagueId', authMiddleware, async (req, res) => {
  const { leagueId } = req.params; // Prendi il parametro leagueId dalla richiesta

  try {
   const result = await getGiornateDaCalcolare(leagueId);
    // Invia i documenti uniti come risposta JSON
    res.status(200).json({ documents: result });
  } catch (error) {
    console.error('Errore durante il recupero dei documenti:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei documenti dalla raccolta giornateCalcolate.' });
  }
});


async function getHistoryUser(p_league_id, 
  p_user_id) {
  let { data, error } = await supabase
  .rpc('get_history_schedine_byleagueid', {
    p_league_id, 
    p_user_id
  })


  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}

// Route per ottenere tutti i documenti con una specifica leagueId e userId nella raccolta "giornateCalcolate"
router.get('/giornate-calcolate/:leagueId/:userId', authMiddleware, async (req, res) => {
  const { leagueId, userId } = req.params;

  try {

    const result = await getHistoryUser(leagueId, userId)

    res.status(200).json({ documentsWithPredictions: result });
  } catch (error) {
    console.error('Errore durante il recupero dei documenti:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei documenti dalla raccolta giornateCalcolate.' });
  }
});


module.exports = router;
