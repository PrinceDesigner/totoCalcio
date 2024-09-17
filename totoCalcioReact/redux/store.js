import { configureStore } from '@reduxjs/toolkit';
import { composeWithDevTools } from 'redux-devtools-extension';
import authReducer from '../redux/slice/authSlice'; // Importa il reducer per l'autenticazione
import uiReducer from '../redux/slice/uiSlice'; // Importa il reducer per l'interfaccia utente

// Configura lo store
const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  devTools: composeWithDevTools(), // Abilita Redux DevTools
});

export default store;
