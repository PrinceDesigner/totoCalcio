import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { fetchLeagueParticipants } from '../../services/leagueParticipantsService';

// Thunk per ottenere i partecipanti della lega corrente
export const fetchParticipantsThunk = createAsyncThunk(
  'partecipanti/fetchParticipants',
  async ({ userIds, leagueId, dayId }, { rejectWithValue }) => {
    try {
      // Chiama il servizio per ottenere i dati dei partecipanti
      const response = await fetchLeagueParticipants(userIds, leagueId, dayId);
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
    removeParticipant: (state, action) => {
      const userIdToRemove = action.payload;
      state.participants = state.participants.filter(participant => participant.userId !== userIdToRemove);
    },
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

// Selettore per accedere ai partecipanti
const selectParticipants = (state) => state.partecipantiLegaCorrente.participants;

// Selettore memorizzato per filtrare i partecipanti e i match per matchId
export const selectParticipantAndMatchByMatchId = createSelector(
  [selectParticipants, (_, matchId) => matchId],
  (participants, matchId) => {
    return participants
      .map((participant) => {
        if (participant.schedina) {
          const match = participant.schedina.find((schedina) => schedina.matchId === matchId);
          if (match) {
            return {
              userId: participant.userId,
              displayName: participant.displayName,
              photoURL: participant.photoURL,
              match: match, // Dettagli del match
            };
          }
        }
        return null;
      })
      .filter((result) => result !== null); // Rimuove eventuali null
  }
);


export const { removeParticipant } = participantsSlice.actions;
export default participantsSlice.reducer;
