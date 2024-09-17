// redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Stato iniziale per l'autenticazione
const initialState = {
  isAuthenticated: false,
  user: null, // Dati utente come email, username, ecc.
  error: null, // Per gestire eventuali errori di autenticazione o signup
};

// Crea lo slice per l'autenticazione
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Azione per login successo
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload; // Imposta i dati dell'utente
      state.error = null;
    },
    // Azione per login fallito
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload; // Imposta l'errore di login
    },
    // Azione per registrazione successo
    signupSuccess: (state, action) => {
      state.isAuthenticated = true; // Potresti voler mantenere l'utente autenticato dopo il signup
      state.user = action.payload; // Imposta i dati dell'utente (es: email, displayName, ecc.)
      state.token = action.payload.token; // Imposta i dati dell'utente (es: email, displayName, ecc.)
      state.error = null;
    },
    // Azione per registrazione fallita
    signupFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload; // Imposta l'errore di registrazione
    },
    // Azione per il logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
  },
});

// Esporta le azioni generate automaticamente
export const { loginSuccess, loginFailure, signupSuccess, signupFailure, logout } = authSlice.actions;

// Esporta il reducer per essere usato nel Redux store
export default authSlice.reducer;
