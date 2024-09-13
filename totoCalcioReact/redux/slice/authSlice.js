// redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Stato iniziale per l'autenticazione
const initialState = {
  isAuthenticated: false,
  user: null, // Puoi aggiungere dati utente come email, username, ecc.
  error: null, // Per gestire eventuali errori di autenticazione
};

// Crea lo slice per l'autenticazione
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload; // Imposta i dati dell'utente
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload; // Imposta l'errore
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
  },
});

// Esporta le azioni generate automaticamente
export const { loginSuccess, loginFailure, logout } = authSlice.actions;

// Esporta il reducer per essere usato nel Redux store
export default authSlice.reducer;
