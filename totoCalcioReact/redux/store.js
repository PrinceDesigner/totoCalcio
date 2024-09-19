import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger'; // Importa redux-logger
import authReducer from '../redux/slice/authSlice';
import uiReducer from '../redux/slice/uiSlice';
import leaguesReducer from '../redux/slice/leaguesSlice';
import infogiornataAttualeReducer from '../redux/slice/infogiornataAttualeSlice';
import selectedLeagueReducer from '../redux/slice/selectedLeagueSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    leagues: leaguesReducer,
    infogiornataAttuale: infogiornataAttualeReducer,
    giornataAttuale: selectedLeagueReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger), // Aggiungi redux-logger
});

export default store;
