import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { createLeague, joinLeague, getUserLeagues, deleteLeague, updateLeagueName, getUserLeagueById, getMembersInfoForLeague } from '../../services/leagueService';

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

// Recupera tutte le leghe a cui l'utente partecipa
export const getUserLeaguesByIdThunk = createAsyncThunk('leagues/getUserLeagueById', async (leagueId, { rejectWithValue }) => {
    try {
        const league = await getUserLeagueById(leagueId);
        return league;
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

// Thunk asincrono per aggiornare il nome della lega
export const updateLeagueNameThunk = createAsyncThunk('leagues/updateName', async ({ leagueId, leagueName }, { rejectWithValue }) => {
    try {
        const response = await updateLeagueName(leagueId, leagueName);
        return response; // Torna i dettagli della lega aggiornata
    } catch (error) {
        return rejectWithValue(error.response.data); // Gestisci l'errore
    }
});
// Thunk asincrono per rcuperare members-info
export const membersInfoForLeagueNameThunk = createAsyncThunk('leagues/membersInfo', async ({ leagueId }, { rejectWithValue }) => {
    try {
        const response = await getMembersInfoForLeague(leagueId);
        return response; // Torna i dettagli della lega aggiornata
    } catch (error) {
        return rejectWithValue(error.response.data); // Gestisci l'errore
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
        },
        removeUserFromLeagueReducer: (state, action) => {
            const { leagueId, userId } = action.payload;

            // Trova la lega con l'ID specificato
            const existingLeagueIndex = state.leagues.findIndex(
                (league) => league.id === leagueId
            );

            if (existingLeagueIndex !== -1) {
                // Rimuove l'utente dalla lista dei membri
                state.leagues[existingLeagueIndex].members = state.leagues[existingLeagueIndex].members.filter(
                    (member) => member !== userId
                );

                // Rimuove l'utente dalla lista membersInfo
                state.leagues[existingLeagueIndex].membersInfo = state.leagues[existingLeagueIndex].membersInfo.filter(
                    (memberInfo) => memberInfo.id !== userId
                );
            }
        },
        makeUserAdminReducer: (state, action) => {
            const { leagueId, userId } = action.payload;

            // Trova la lega con l'ID specificato
            const existingLeagueIndex = state.leagues.findIndex(
                (league) => league.id === leagueId
            );

            if (existingLeagueIndex !== -1) {
                // Aggiungi l'utente all'array ownerId se non è già presente
                const ownerIdArray = state.leagues[existingLeagueIndex].ownerId;
                if (!ownerIdArray.includes(userId)) {
                    ownerIdArray.push(userId);
                }
            }
        },
        removeUserAdminReducer: (state, action) => {
            const { leagueId, userId } = action.payload;

            // Trova la lega con l'ID specificato
            const existingLeagueIndex = state.leagues.findIndex(
                (league) => league.id === leagueId
            );

            if (existingLeagueIndex !== -1) {
                // Rimuovi l'utente dall'array ownerId se è presente
                const ownerIdArray = state.leagues[existingLeagueIndex].ownerId;
                const userIndex = ownerIdArray.indexOf(userId);
                if (userIndex !== -1) {
                    ownerIdArray.splice(userIndex, 1);
                }
            }
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
            // leaga byid
            .addCase(getUserLeaguesByIdThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(getUserLeaguesByIdThunk.fulfilled, (state, action) => {
                state.loading = false;
                const fetchedLeague = action.payload;
                const existingLeagueIndex = state.leagues.findIndex(league => league.id === fetchedLeague.id);
                if (existingLeagueIndex !== -1) {
                    state.leagues[existingLeagueIndex] = fetchedLeague;
                } else {
                    state.leagues.push(fetchedLeague);
                }
            })
            .addCase(getUserLeaguesByIdThunk.rejected, (state, action) => {
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
            })
            // Modifica del nome della lega
            .addCase(updateLeagueNameThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateLeagueNameThunk.fulfilled, (state, action) => {
                state.loading = false;

                const updatedLeague = action.payload; // La lega aggiornata

                // Trova la lega nel tuo stato attuale e aggiorna il nome
                const existingLeagueIndex = state.leagues.findIndex(
                    (league) => league.id === updatedLeague.leagueId
                );

                if (existingLeagueIndex !== -1) {
                    state.leagues[existingLeagueIndex] = {
                        ...state.leagues[existingLeagueIndex],
                        name: updatedLeague.nomeNuovo // Aggiorna solo il nome
                    };
                }
            })
            .addCase(updateLeagueNameThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(membersInfoForLeagueNameThunk.pending, (state, action) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(membersInfoForLeagueNameThunk.fulfilled, (state, action) => {
                state.loading = false;

                // Recupera l'id della lega dal meta
                const { leagueId } = action.meta.arg;

                // Trova l'elemento della lega con l'id corrispondente
                const leagueIndex = state.leagues.findIndex(league => league.id === leagueId);

                if (leagueIndex !== -1) {
                    // Prepara membersInfo e members
                    const membersInfo = action.payload.response.map(member => ({
                        userId: member.id_user_ret,
                        punti: member.punti_ret,
                        displayName: member.displayname_ret,
                        photoURL: member.photoUrl
                    }));

                    const members = action.payload.response.map(member => member.id_user_ret);

                    // Aggiorna lo stato della lega con i nuovi campi
                    state.leagues[leagueIndex].membersInfo = membersInfo;
                    state.leagues[leagueIndex].members = members;
                }

            })
            .addCase(membersInfoForLeagueNameThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    }
});

// Selettore di base che restituisce tutte le leghe dallo stato
const selectLeagues = (state) => state.leagues.leagues;

// Selettore che accetta idPassato come argomento e filtra le leghe
export const selectLeagueById = (leagueId) => createSelector(
    [selectLeagues],
    (leagues) => leagues.find(league => league.id === leagueId)
);

export const { clearError, removeUserFromLeagueReducer, makeUserAdminReducer, removeUserAdminReducer } = leaguesSlice.actions;
export default leaguesSlice.reducer;
