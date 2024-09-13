// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slice/authSlice'; // Importa il reducer per l'autenticazione
import uiReducer from '../redux/slice/uiSlice'

// Configura lo store
const store = configureStore({
  reducer: {
    auth: authReducer, // Definisce l'autenticazione come parte dello stato globale
    ui: uiReducer, // Aggiungi il reducer per la gestione del caricamento

    // Aggiungi altri slice qui man mano che li crei
  },
});

export default store;
