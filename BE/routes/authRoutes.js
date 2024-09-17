// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { admin, firestore } = require('../firebaseAdmin');

// const { OAuth2Client } = require('google-auth-library');
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Rotta per la registrazione
router.post('/signup', async (req, res) => {
    const { email, password, displayName } = req.body;

    try {
        // Crea l'utente in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });

        // Salva i dettagli dell'utente in Firestore
        await firestore.collection('users').doc(userRecord.uid).set({
            displayName: displayName,
            email: email,
            uid: userRecord.uid,
        });

        // Se tutto è andato bene, restituisci un messaggio di successo
        return res.status(201).json({ message: 'User created and saved in Firestore', user: { userId: userRecord.uid, fullName: displayName, email } });

    } catch (error) {
        // Gestisci diversi tipi di errori
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ message: 'Email already in use', error: error.message });
        }
        if (error.code === 'auth/invalid-password') {
            return res.status(400).json({ message: 'The password must be a string with at least 6 characters.', error: error.message });
        }

        console.error('Error creating user or saving to Firestore:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


// Rotta per il login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const token = await admin.auth().createCustomToken(userRecord.uid);
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in', error });
    }
});

// Login con Google
// router.post('/google', async (req, res) => {
//     const { token } = req.body;

//     try {
//         const ticket = await googleClient.verifyIdToken({
//             idToken: token,
//             audience: process.env.GOOGLE_CLIENT_ID,
//         });

//         const payload = ticket.getPayload();
//         const userId = payload['sub'];

//         const firebaseToken = await admin.auth().createCustomToken(userId);

//         res.status(200).json({ token: firebaseToken });
//     } catch (error) {
//         console.error('Error logging in with Google:', error);
//         res.status(500).json({ message: 'Error logging in with Google', error });
//     }
// });


module.exports = router;