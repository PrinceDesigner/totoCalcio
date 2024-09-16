// firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json'); // Modifica il percorso se necessario

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://totocalcioreact.firebaseio.com"
});

const firestore = admin.firestore(); // Inizializza Firestore

module.exports = { admin, firestore }; // Esporta anche Firestore
