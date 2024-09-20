// src/services/authService.js

import axios from 'axios'; // Usa axios per fare le richieste HTTP
import axiosInstance from './axiosInterceptor'; // Importa il tuo axiosInterceptor

const API_URL = 'http://192.168.1.26:5001/api/auth'; // Imposta il tuo URL API

export const signup = async (email, password, displayName) => {
  try {
    console.log(`${API_URL}/signup`);
    const response = await axios.post(`${API_URL}/signup`, {
      email,
      password,
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
    console.log(`${API_URL}/login`);
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
    console.log('API', response);
    return response.data; // Restituisci i dati della risposta
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'utente:', error);
    throw error; // Rilancia l'errore per gestirlo nel componente
  }
};


