import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchGiornateCalcolate } from '../../services/storicoService';

// Thunk per gestire la chiamata al servizio
export const fetchGiornateCalcolateThunk = createAsyncThunk(
  'giornate/fetchGiornateCalcolare',
  async (leagueId, { rejectWithValue }) => {
    try {
      const documents = await fetchGiornateCalcolate(leagueId); // Usa il servizio esistente
      return documents; // Restituisci i documenti
    } catch (error) {
      console.error('Errore durante il recupero delle giornate calcolate:', error);
      return rejectWithValue(error.message || 'Errore sconosciuto');
    }
  }
);

// Slice
const giornateSlice = createSlice({
  name: 'giornate',
  initialState: {
    giornate: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Gestione degli stati del thunk
      .addCase(fetchGiornateCalcolateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGiornateCalcolateThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.giornate = action.payload;
      })
      .addCase(fetchGiornateCalcolateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore durante il recupero delle giornate calcolate';
      });
  },
});

export default giornateSlice.reducer;
