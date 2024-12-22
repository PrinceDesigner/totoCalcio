import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger'; // Importa redux-logger
import authReducer from '../redux/slice/authSlice';
import uiReducer from '../redux/slice/uiSlice';
import leaguesReducer from '../redux/slice/leaguesSlice';
import infogiornataAttualeReducer from '../redux/slice/infogiornataAttualeSlice';
import selectedLeagueReducer from '../redux/slice/selectedLeagueSlice';
import insertPredictionsReducer from '../redux/slice/predictionsSlice';
import storicoPerUtenteSelezionatoReducer from '../redux/slice/storicoPerUtenteSelezionatoSlice'; // Importa il reducer dei partecipanti
import giornateDaCalcolareReducer from '../redux/slice/giornateDaCalcolareSlice'; // Importa il reducer dei partecipanti
import refreshReducer from '../redux/slice/refreshSlice';
import networkReducer from '../redux/reducers/networkReducer'; // Importa il reducer della connessione
import liveStatusReducer from '../redux/slice/isLiveSlice'; // Importa il reducer della connessione


const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    leagues: leaguesReducer,
    infogiornataAttuale: infogiornataAttualeReducer,
    giornataAttuale: selectedLeagueReducer,
    insertPredictions: insertPredictionsReducer,
    storicoPerUtenteSelezionato: storicoPerUtenteSelezionatoReducer,
    refresh: refreshReducer,
    giornateDaCalcolareReducer: giornateDaCalcolareReducer,
    ui: uiReducer,
    liveStatus: liveStatusReducer,
    network: networkReducer, // Aggiungi il reducer


  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger), // Aggiungi redux-logger
});

export default store;
