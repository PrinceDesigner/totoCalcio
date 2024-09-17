// server.js
const express = require('express');
const cors = require('cors'); // Importa CORS
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express(); // Crea l'app Express

// Usa il middleware CORS
app.use(cors());

// Middleware per logging delle richieste
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.path}`);
    next();
});

// Middleware per parsing del JSON
app.use(express.json());

// Rotte di autenticazione
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
