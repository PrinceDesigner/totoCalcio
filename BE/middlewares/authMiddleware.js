const admin = require('firebase-admin'); // Assicurati che Firebase Admin SDK sia configurato correttamente

// Middleware di autenticazione per verificare il token JWT di Firebase
const authMiddleware = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  // Controlla se l'header Authorization è presente
  if (!authorizationHeader) {
    return res.status(401).json({ message: 'Token mancante.', status: 401 });
  }

  const token = authorizationHeader.split(' ')[1]; // Estrai il token dal formato 'Bearer <token>'

  // Se il token non è presente nell'header
  if (!token) {
    return res.status(401).json({ message: 'Token mancante.', status: 401 });
  }

  try {
    // Verifica il token utilizzando Firebase Admin SDK
    console.log('token', token);
    const decodedToken = await admin.auth().verifyIdToken(token);
    // Aggiungi i dettagli dell'utente verificato alla richiesta
    req.user = decodedToken;

    // Passa al middleware successivo o alla rotta successiva
    next();
  } catch (error) {
    console.error('Errore durante la verifica del token:', error);
    return res.status(403).json({ message: 'Token non valido.', status: 403 });
  }
};

module.exports = authMiddleware;
