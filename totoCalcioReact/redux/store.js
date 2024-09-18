import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slice/authSlice'; // Importa il reducer per l'autenticazione
import uiReducer from '../redux/slice/uiSlice'; // Importa il reducer per l'interfaccia utente
import leaguesReducer from '../redux/slice/leaguesSlice'; // Importa il reducer per le leghe


// Configura lo store
const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    leagues: leaguesReducer // Aggiungi il reducer per le leghe
  },
});

export default store;
