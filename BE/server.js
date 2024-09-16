// server.js
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

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
