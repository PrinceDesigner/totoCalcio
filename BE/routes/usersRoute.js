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


router.post('/users-info', async (req, res) => {
  const { userIds, leagueId, dayId } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !leagueId) {
    return res.status(400).json({ message: 'Devi fornire un array di userId e un leagueId.' });
  }

  try {
    // Recupera il documento della lega e controlla l'esistenza
    const leagueDoc = await firestore.collection('leagues').doc(leagueId).get();
    if (!leagueDoc.exists) {
      return res.status(404).json({ message: 'Lega non trovata.' });
    }

    const leagueData = leagueDoc.data();
    const memberInfo = leagueData.membersInfo || [];

    // Pre-processa memberInfo in una Map per accesso rapido
    const memberMap = new Map(memberInfo.map(member => [member.id, member]));

    // Prepara le promesse per ottenere i dati
    const auth = getAuth();

    const [userSnapshots, userRecords, schedineSnapshot] = await Promise.all([
      // Batch query per i documenti degli utenti
      Promise.all(
        userIds.map(userId =>
          firestore.collection('users').doc(userId).get().catch(() => null)
        )
      ),
      // Batch query per i dati di Firebase Authentication
      Promise.all(
        userIds.map(userId => auth.getUser(userId).catch(() => null))
      ),
      // Query unica per ottenere tutte le schedine
      firestore
        .collection('predictions')
        .where('daysId', '==', dayId)
        .where('leagueId', '==', leagueId)
        .get(),
    ]);

    // Crea una mappa userId -> schedina per accesso rapido
    const schedineMap = new Map();
    schedineSnapshot.forEach(doc => {
      const data = doc.data();
      schedineMap.set(data.userId, data);
    });

    // Genera l'array delle informazioni degli utenti
    const usersInfo = userIds.map((userId, index) => {
      const userSnapshot = userSnapshots[index];
      const authUser = userRecords[index];
      const schedina = schedineMap.get(userId);

      if (userSnapshot && userSnapshot.exists) {
        const data = userSnapshot.data();

        // Recupera il membro dalla Map invece di usare find
        const member = memberMap.get(userId);
        const punti = member ? member.punti : 0;

        return {
          userId,
          displayName: data.displayName || 'Nome non disponibile',
          photoURL: authUser?.photoURL || null,
          punti,
          leagueId,
          schedina: schedina?.schedina || null,
        };
      }

      return null; // Se snapshot è nullo, saltiamo l'utente
    }).filter(Boolean); // Filtra utenti nulli

    res.status(200).json({ leagueId, users: usersInfo });
  } catch (error) {
    console.error('Errore durante il recupero delle informazioni degli utenti:', error);
    res.status(500).json({ message: 'Errore durante il recupero delle informazioni degli utenti.' });
  }
});




// Endpoint per salvare il token di notifica push dell'utente
router.post('/save-push-token', async (req, res) => {
  const { userId, expoPushToken } = req.body;

  // Controlla che userId ed expoPushToken siano presenti
  if (!userId || !expoPushToken) {
    return res.status(400).json({ error: 'userId e expoPushToken sono richiesti' });
  }

  try {
    // Ottieni la referenza al documento utente su Firestore
    const userRef = firestore.collection('users').doc(userId);

    // Aggiorna il campo `tokenNotification` con il token push
    await userRef.update({
      tokenNotification: expoPushToken,
    });

    return res.status(200).json({ message: 'Token salvato correttamente nel database.' });
  } catch (error) {
    console.error('Errore durante il salvataggio del token nel database:', error);
    return res.status(500).json({ message: 'Errore durante il salvataggio del token nel database.' });
  }
});


// Endpoint per verificare se il token di notifica push dell'utente è già salvato
router.post('/verify-push-token', async (req, res) => {
  const { userId, expoPushToken } = req.body;

  // Controlla che userId ed expoPushToken siano presenti
  if (!userId || !expoPushToken) {
    return res.status(400).json({ error: 'userId e expoPushToken sono richiesti' });
  }

  try {
    // Ottieni la referenza al documento utente su Firestore
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    // Controlla se il token coincide
    const userData = userDoc.data();
    const savedToken = userData?.tokenNotification;

    if (savedToken === expoPushToken) {
      return res.status(200).json({ isTokenValid: true });
    } else {
      return res.status(200).json({ isTokenValid: false });
    }
  } catch (error) {
    console.error('Errore durante la verifica del token nel database:', error);
    return res.status(500).json({ message: 'Errore durante la verifica del token nel database.' });
  }
});





module.exports = router;
