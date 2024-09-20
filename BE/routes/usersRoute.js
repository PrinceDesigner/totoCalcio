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
  

module.exports = router;
