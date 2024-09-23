// server.js
const express = require('express');
const cors = require('cors'); // Importa CORS
const authRoutes = require('./routes/authRoutes');
const leagueRoutes = require('./routes/leaguesRoutes'); // Importa le route delle leghe
const predictionsRoute = require('./routes/predictionsRoute'); // Importa le route delle leghe
const userRoute = require('./routes/usersRoute'); // Importa le route delle leghe
const giornateCalcolateRoutes = require('./routes/calcoloRoutes');

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
app.use('/api', leagueRoutes);
app.use('/api/predictions', predictionsRoute);
app.use('/api', userRoute);
app.use('/api', giornateCalcolateRoutes);

// Middleware per la gestione degli errori (deve essere l'ultimo middleware)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
