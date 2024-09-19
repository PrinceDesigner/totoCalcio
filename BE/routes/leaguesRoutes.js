const express = require('express');
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const { FieldValue } = require('firebase-admin').firestore; // Importa FieldValue
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Creazione di una nuova lega
router.post('/leagues', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.uid; // Ottieni l'ID utente dal token verificato

  try {
    // Crea una nuova lega in Firestore
    const leagueRef = await firestore.collection('leagues').add({
      name,
      ownerId: userId,
      createdAt: new Date(),
      members: [userId], // L'utente che crea la lega è anche il primo membro
    });

    const league = await leagueRef.get();

    res.status(201).json({ message: 'Lega creata con successo', leagueData: { ...league.data(), id: league.id } });
  } catch (error) {
    console.error('Errore durante la creazione della lega:', error);
    res.status(500).json({ message: 'Errore durante la creazione della lega' });
  }
});

// Partecipazione a una lega esistente
router.post('/leagues/join', authMiddleware, async (req, res) => {
  const { leagueId } = req.body; // Prendi leagueId dal body della richiesta
  const userId = req.user.uid;

  if (!leagueId) {
    return res.status(400).json({ message: 'ID della lega mancante.' });
  }

  try {
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const league = await leagueRef.get();

    if (!league.exists) {
      return res.status(404).json({ message: 'Lega non trovata' });
    }

    const leagueData = league.data();

    // Controlla se l'utente è già membro della lega
    if (leagueData.members && leagueData.members.includes(userId)) {
      return res.status(400).json({ message: 'L\'utente è già membro di questa lega.' });
    }

    // Aggiungi l'utente ai membri della lega
    await leagueRef.update({
      members: FieldValue.arrayUnion(userId),
    });

    // Ritorna la lega aggiornata insieme al messaggio di successo
    const updatedLeague = await leagueRef.get();

    res.status(200).json({
      message: 'Partecipazione avvenuta con successo',
      leagueData: {...updatedLeague.data(), id: updatedLeague.id}, // Restituisci i dettagli della lega
    });
  } catch (error) {
    console.error('Errore durante la partecipazione alla lega:', error);
    res.status(500).json({ message: 'Errore durante la partecipazione alla lega' });
  }
});

// Visualizza tutte le leghe a cui l'utente partecipa
router.get('/leagues', authMiddleware, async (req, res) => {
  const userId = req.user.uid;

  try {
    const leaguesSnapshot = await firestore
      .collection('leagues')
      .where('members', 'array-contains', userId)
      .get();

    const leagues = leaguesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ message: 'Elenco delle leghe recuperato con successo', leagues });
  } catch (error) {
    console.error('Errore durante il recupero delle leghe:', error);
    res.status(500).json({ message: 'Errore durante il recupero delle leghe' });
  }
});

// Visualizza la classifica di una lega
router.get('/leagues/:leagueId/standings', authMiddleware, async (req, res) => {
  const { leagueId } = req.params;

  try {
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const league = await leagueRef.get();

    if (!league.exists) {
      return res.status(404).json({ message: 'Lega non trovata' });
    }

    const standings = league.data().standings || [];

    res.status(200).json({ message: 'Classifica recuperata con successo', standings });
  } catch (error) {
    console.error('Errore durante il recupero della classifica:', error);
    res.status(500).json({ message: 'Errore durante il recupero della classifica' });
  }
});

// Elimina una lega
router.delete('/leagues/:leagueId', authMiddleware, async (req, res) => {
  const { leagueId } = req.params;
  const userId = req.user.uid;

  try {
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const league = await leagueRef.get();

    if (!league.exists) {
      return res.status(404).json({ message: 'Lega non trovata' });
    }

    if (league.data().ownerId !== userId) {
      return res.status(403).json({ message: 'Non sei autorizzato a eliminare questa lega' });
    }

    await leagueRef.delete();

    res.status(200).json({ message: 'Lega eliminata con successo', leagueId });
  } catch (error) {
    console.error('Errore durante l\'eliminazione della lega:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione della lega' });
  }
});

module.exports = router;
