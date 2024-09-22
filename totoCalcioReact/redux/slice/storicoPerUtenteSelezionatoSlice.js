// redux/slice/storicoPerUtenteSelezionatoSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { fetchGiornateCalcolate, fetchGiornatePerUtenteSelzionato } from '../../services/storicoService';

// Thunk asincrono per recuperare i dati delle giornate calcolate
export const fetchStoricoPerUtenteSelezionato = createAsyncThunk(
  'storicoPerUtenteSelezionato/fetch',
  async ({ leagueId, userId }, { rejectWithValue }) => {
    try {
      // Chiamata al servizio per ottenere i dati
      const data = await fetchGiornatePerUtenteSelzionato(leagueId, userId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Errore durante il recupero dello storico');
    }
  }
);

const storicoPerUtenteSelezionatoSlice = createSlice({
  name: 'storicoPerUtenteSelezionato',
  initialState: {
    storico: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Puoi aggiungere altri reducers qui, se necessario
    clearStorico: (state) => {
      state.storico = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoricoPerUtenteSelezionato.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoricoPerUtenteSelezionato.fulfilled, (state, action) => {
        state.loading = false;
        state.storico = action.payload;
      })
      .addCase(fetchStoricoPerUtenteSelezionato.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore durante il recupero dello storico';
      });
  },
});

// Importa i metodi necessari da Redux Toolkit

// Selettore di base che restituisce lo storico dallo stato
const selectStorico = (state) => state.storicoPerUtenteSelezionato.storico;

// Selettore che accetta un dayId come argomento e filtra lo storico
export const selectStoricoByDayId = (dayId) => createSelector(
  [selectStorico],
  (storico) => storico.find(item => item.dayId === dayId)
);

// Esporta le azioni generate automaticamente e il reducer
export const { clearStorico } = storicoPerUtenteSelezionatoSlice.actions;
export default storicoPerUtenteSelezionatoSlice.reducer;
