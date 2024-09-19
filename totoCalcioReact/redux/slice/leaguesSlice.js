import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createLeague, joinLeague, getUserLeagues, getLeagueStandings, deleteLeague } from '../../services/leagueService';

// Creazione di una nuova lega
export const createLeagueThunk = createAsyncThunk('leagues/create', async (name, { rejectWithValue }) => {
    try {
        const response = await createLeague(name);
        return response; // Torna i dettagli della lega creata
    } catch (error) {
        return rejectWithValue(error.response.data); // Gestisci l'errore
    }
});

// Partecipazione a una lega
export const joinLeagueThunk = createAsyncThunk('leagues/join', async (leagueId, { rejectWithValue }) => {
    try {
        const response = await joinLeague(leagueId);
        return response; // Torna i dettagli della partecipazione
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Recupera tutte le leghe a cui l'utente partecipa
export const getUserLeaguesThunk = createAsyncThunk('leagues/getUserLeagues', async (_, { rejectWithValue }) => {
    try {
        const leagues = await getUserLeagues();
        return leagues;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Recupera la classifica di una lega
export const getLeagueStandingsThunk = createAsyncThunk('leagues/getStandings', async (leagueId, { rejectWithValue }) => {
    try {
        const standings = await getLeagueStandings(leagueId);
        return standings;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Elimina una lega
export const deleteLeagueThunk = createAsyncThunk('leagues/delete', async (leagueId, { rejectWithValue }) => {
    try {
        const response = await deleteLeague(leagueId);
        return response;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Slice per la gestione delle leghe
const leaguesSlice = createSlice({
    name: 'leagues',
    initialState: {
        leagues: [],
        standings: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null; // Pulisci l'errore
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createLeagueThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLeagueThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.leagues = [...state.leagues, action.payload.leagueData]; // Usa lo spread operator per aggiungere la nuova lega
            })
            .addCase(createLeagueThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Per joinLeague
            .addCase(joinLeagueThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(joinLeagueThunk.fulfilled, (state, action) => {
                state.loading = false;
            
                const updatedLeague = action.payload.leagueData;
            
                // Verifica se la lega è già presente nello stato
                const existingLeagueIndex = state.leagues.findIndex(
                    (league) => league.id === updatedLeague.id
                );
            
                if (existingLeagueIndex === -1) {
                    // Se la lega non esiste già, la aggiunge alla lista
                    state.leagues = [...state.leagues, updatedLeague];
                } else {
                    // Se la lega esiste già, la aggiorna con i nuovi dati
                    state.leagues[existingLeagueIndex] = updatedLeague;
                }
            })
            
            .addCase(joinLeagueThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Per getUserLeagues
            .addCase(getUserLeaguesThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(getUserLeaguesThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.leagues = action.payload; // Salva le leghe recuperate nello store
            })
            .addCase(getUserLeaguesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteLeagueThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteLeagueThunk.fulfilled, (state, action) => {
                state.loading = false;
                // Filtra l'ID della lega eliminata
                state.leagues = state.leagues.filter(league => league.id !== action.payload.leagueId);
            })
            .addCase(deleteLeagueThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

    }
});

export const { clearError } = leaguesSlice.actions;
export default leaguesSlice.reducer;
