// src/services/authService.js

import axios from 'axios'; // Usa axios per fare le richieste HTTP

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
