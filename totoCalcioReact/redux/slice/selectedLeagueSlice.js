// redux/slices/selectedLeagueSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  giornataAttuale: null, // Stato iniziale con nessuna lega selezionata
  legaSelezionata: null, 
};

const selectedLeagueSlice = createSlice({
  name: 'selectedLeague',
  initialState,
  reducers: {
    setSelectedLeagueGiornata: (state, action) => {
      state.giornataAttuale = action.payload.giornataAttuale; // Imposta la lega selezionata
      state.legaSelezionata = action.payload.legaSelezionata; // Imposta la lega selezionata
    },
    clearSelectedLeague: (state) => {
      state.giornataAttuale = null; // Pulisce la selezione della lega
    },
  },
});

// Esporta le azioni per selezionare o resettare la lega
export const { setSelectedLeagueGiornata, clearSelectedLeague } = selectedLeagueSlice.actions;

export default selectedLeagueSlice.reducer;
