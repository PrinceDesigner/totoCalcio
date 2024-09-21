const express = require('express');
const { getAuth } = require('firebase-admin/auth'); // Firebase Admin SDK per aggiornare l'utente
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware di autenticazione

const router = express.Router();

// Route per aggiornare email e displayName
router.put('/update-user', authMiddleware, async (req, res) => {
    const { email, displayName, userId } = req.body; // Prendi email e displayName dal body della richiesta
  
    if (!email || !displayName) {
      return res.status(400).json({ message: 'Email e displayName sono obbligatori.' });
    }
  
    try {
      // 1. Aggiorna Firebase Authentication
      const auth = getAuth(); // Ottieni l'istanza di Firebase Auth
      await auth.updateUser(userId, { email, displayName });
      
      // 2. Aggiorna la raccolta `users` su Firestore
      const userRef = firestore.collection('users').doc(userId); // Referenza al documento utente su Firestore
      await userRef.update({ email, displayName });
  
      // 3. Recupera il documento aggiornato
      const updatedUserDoc = await userRef.get();
  
      if (!updatedUserDoc.exists) {
        return res.status(404).json({ message: 'Utente non trovato.' });
      }
  
      // Restituisci il documento aggiornato
      const updatedUserData = updatedUserDoc.data();
      res.status(200).json({ message: 'Email e displayName aggiornati con successo!', user: updatedUserData });
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'utente:', error);
      return res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'utente.' });
    }
  });
  

// Route per ottenere i displayName, userId, photoURL, punti e leagueId per un array di userId
router.post('/users-info', async (req, res) => {
  const { userIds, leagueId } = req.body; // Aggiunto leagueId alla richiesta

  // Controlla che userIds e leagueId siano forniti
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !leagueId) {
    return res.status(400).json({ message: 'Devi fornire un array di userId e un leagueId.' });
  }

  try {
    // Ottieni il documento della lega per ottenere i punti
    const leagueDoc = await firestore.collection('leagues').doc(leagueId).get();

    if (!leagueDoc.exists) {
      return res.status(404).json({ message: 'Lega non trovata.' });
    }

    const leagueData = leagueDoc.data();
    const memberInfo = leagueData.membersInfo || [];

    // Ottieni i documenti degli utenti in batch dalla collezione Firestore
    const userRefs = userIds.map(userId => firestore.collection('users').doc(userId));
    const userSnapshots = await firestore.getAll(...userRefs);

    // Ottieni i dettagli degli utenti da Firebase Authentication in parallelo
    const auth = getAuth();
    const userRecords = await Promise.all(userIds.map(userId => auth.getUser(userId).catch(() => null)));

    // Crea un array per le informazioni degli utenti
    const usersInfo = [];

    // Itera su userSnapshots e userRecords simultaneamente
    for (let i = 0; i < userSnapshots.length; i++) {
      const snapshot = userSnapshots[i];
      const authUser = userRecords[i];

      if (snapshot.exists) {
        const data = snapshot.data();

        // Trova i punti dell'utente all'interno dell'array members
        const member = memberInfo.find(member => member.id === snapshot.id);
        const punti = member ? member.punti : 0; // Se non trovi il membro, assegna 0 punti

        usersInfo.push({
          userId: snapshot.id,
          displayName: data.displayName || 'Nome non disponibile',
          photoURL: authUser ? authUser.photoURL : null, // Ottieni il photoURL dall'utente autenticato
          punti, // Includi i punti dell'utente
          leagueId // Includi leagueId in ogni oggetto utente
        });
      }
    }

    res.status(200).json({ leagueId, users: usersInfo }); // Risposta include leagueId e users
  } catch (error) {
    console.error('Errore durante il recupero delle informazioni degli utenti:', error);
    return res.status(500).json({ message: 'Errore durante il recupero delle informazioni degli utenti.' });
  }
});

  



module.exports = router;
