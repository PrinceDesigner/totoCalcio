// src/services/authService.js

import axios from 'axios'; // Usa axios per fare le richieste HTTP
import axiosInstance from './axiosInterceptor'; // Importa il tuo axiosInterceptor

// const API_URL = 'http://169.254.201.170:5001/api/auth'; // Imposta il tuo URL API
// const API_URL = 'https://totocalcioreact.uc.r.appspot.com/api/auth';
const API_URL = 'https://test-dot-totocalcioreact.uc.r.appspot.com/api/auth';
export const signup = async (email, id, displayName) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, {
      email,
      id,
      displayName,
    });

    return response.data;
  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    throw error;
  }
};


// Funzione per il login
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return response.data; // Restituisce il token e i dati dell'utente
  } catch (error) {
    console.error('Errore durante il login:', error);
    throw error;
  }
};

// Funzione per aggiornare l'email e il displayName dell'utente
export const updateUser = async (email, displayName, userId) => {
  try {
    // Effettua la chiamata API per aggiornare l'email e il displayName
    const response = await axiosInstance.put('/update-user', {
      email,
      displayName,
      userId,
    });
    return response.data; // Restituisci i dati della risposta
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'utente:', error);
    throw error; // Rilancia l'errore per gestirlo nel componente
  }
};


// Funzione per salvare il token di notifica push dell'utente
export const savePushToken = async (userId, expoPushToken) => {
  try {
    // Effettua la chiamata API per salvare il token push dell'utente
    const response = await axiosInstance.post('/save-push-token', {
      userId,
      expoPushToken,
    });
    return response.data; // Restituisci i dati della risposta
  } catch (error) {
    console.error('Errore durante il salvataggio del token push:', error);
    throw error; // Rilancia l'errore per gestirlo nel componente
  }
};


// Funzione per verificare se il token push è già salvato sul server
export const verifyPushToken = async (userId, expoPushToken) => {
  try {
    // Effettua la chiamata API per verificare il token push dell'utente
    const response = await axiosInstance.post('/verify-push-token', {
      userId,
      expoPushToken,
    });
    return response.data.isTokenValid; // Presupponendo che il server restituisca questa proprietà
  } catch (error) {
    console.error('Errore durante la verifica del token push:', error);
    throw error; // Rilancia l'errore per gestirlo nel componente
  }
};
