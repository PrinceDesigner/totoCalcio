import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLeagueParticipants } from '../../services/leagueParticipantsService';

// Thunk per ottenere i partecipanti della lega corrente
export const fetchParticipantsThunk = createAsyncThunk(
  'partecipanti/fetchParticipants',
  async ({ userIds, leagueId }, { rejectWithValue }) => {
    try {
      // Chiama il servizio per ottenere i dati dei partecipanti
      const response = await fetchLeagueParticipants(userIds, leagueId);
      return response; // Restituisce la risposta da memorizzare nello stato Redux
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Errore durante il recupero dei partecipanti');
    }
  }
);

// Slice per gestire i partecipanti della lega corrente
const participantsSlice = createSlice({
  name: 'partecipantiLegaCorrente',
  initialState: {
    leagueId: null,
    participants: [], // Array dei partecipanti
    loading: false,
    error: null,
  },
  reducers: {
    // Puoi aggiungere altri reducers qui se necessario
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParticipantsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipantsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.leagueId = action.payload.leagueId; // Memorizza l'ID della lega
        state.participants = action.payload.users; // Memorizza i dati dei partecipanti
      })
      .addCase(fetchParticipantsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default participantsSlice.reducer;
