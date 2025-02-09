const express = require('express');
const { getAuth } = require('firebase-admin/auth'); // Firebase Admin SDK per aggiornare l'utente
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware di autenticazione
const supabase = require('../superBaseConnect');

const router = express.Router();

async function update_user(uuid, displaName, email) {
  const { data, error } = await supabase
    .rpc('update_user', { p_uid: uuid, p_displayname: displaName, p_email: email })


  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}

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

    const response = await update_user(userId, displayName, email);

    res.status(200).json({ message: 'Email e displayName aggiornati con successo!', user: response });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'utente:', error);
    return res.status(500).json({ message: 'Errore durante l\'aggiornamento dell\'utente.' });
  }

});


async function saveUserToken(p_uid, p_tokennotify) {
  let { data, error } = await supabase
    .rpc('user_notify', {
      p_tokennotify,
      p_uid
    })

  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}


// Endpoint per salvare il token di notifica push dell'utente
router.post('/save-push-token', async (req, res) => {
  const { userId, expoPushToken } = req.body;

  // Controlla che userId ed expoPushToken siano presenti
  if (!userId || !expoPushToken) {
    return res.status(400).json({ error: 'userId e expoPushToken sono richiesti' });
  }

  try {

    await saveUserToken(userId,expoPushToken);

    return res.status(200).json({ message: 'Token salvato correttamente nel database.' });
  } catch (error) {
    console.error('Errore durante il salvataggio del token nel database:', error);
    return res.status(500).json({ message: 'Errore durante il salvataggio del token nel database.' });
  }
});


async function getUserToken(p_uid) {
  let { data, error } = await supabase
    .rpc('get_user_token', {
      p_uid
    })

  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}

// Endpoint per verificare se il token di notifica push dell'utente è già salvato
router.post('/verify-push-token', async (req, res) => {
  const { userId, expoPushToken } = req.body;

  // Controlla che userId ed expoPushToken siano presenti
  if (!userId || !expoPushToken) {
    return res.status(400).json({ error: 'userId e expoPushToken sono richiesti' });
  }

  try {

    const result = await getUserToken(userId)
    // Controlla se il token coincide
    const savedToken = result?.tokenNotification;

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
