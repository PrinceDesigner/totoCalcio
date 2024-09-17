// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { admin, firestore } = require('../firebaseAdmin');
const jwt = require('jsonwebtoken'); // Importa jsonwebtoken


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

        // Genera un token JWT
        const payload = {
            userId: userRecord.uid,
            email: userRecord.email,
            displayName: displayName,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' }); // Genera il token JWT con scadenza 3 ora

        // Se tutto è andato bene, restituisci un messaggio di successo
        return res.status(201).json({
            message: 'User created and saved in Firestore',
            user: {
                userId: userRecord.uid,
                fullName: displayName,
                email
            },
            token
        });

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
    console.log(email);
    try {
        // Verifica l'email dell'utente in Firebase Authentication
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Verifica che la password sia corretta (devi gestire la logica di controllo della password, ad esempio utilizzando Firebase Authentication)
        const user = await admin.auth().verifyPassword(email, password); // Gestisci correttamente il controllo della password qui

        // Genera il token JWT
        const payload = {
            userId: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' }); // Genera il token JWT con scadenza di 3 ore

        // Restituisci il token e i dati dell'utente
        return res.status(200).json({
            message: 'Login successful',
            user: {
                userId: userRecord.uid,
                fullName: userRecord.displayName,
                email: userRecord.email,
            },
            token
        });
    } catch (error) {
        console.error('Error logging in:', error);
        if (error.code === 'auth/user-not-found') {
            return res.status(400).json({ message: 'User not found' });
        }
        if (error.code === 'auth/wrong-password') {
            return res.status(400).json({ message: 'Incorrect password' });
        }
        return res.status(500).json({ message: 'Internal server error', error });
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
