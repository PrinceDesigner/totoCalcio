// redux/slices/selectedLeagueSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    legaSelezionata: null, // Stato iniziale con nessuna lega selezionata
};

const selectedLeagueSlice = createSlice({
  name: 'selectedLeague',
  initialState,
  reducers: {
    setSelectedLeagueGiornata: (state, action) => {
      state.legaSelezionata = action.payload; // Imposta la lega selezionata
    },
    clearSelectedLeague: (state) => {
      state.legaSelezionata = null; // Pulisce la selezione della lega
    },
  },
});

// Esporta le azioni per selezionare o resettare la lega
export const { setSelectedLeagueGiornata, clearSelectedLeague } = selectedLeagueSlice.actions;

export default selectedLeagueSlice.reducer;
