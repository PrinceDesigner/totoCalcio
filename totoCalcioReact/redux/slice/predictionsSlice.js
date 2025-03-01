import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { checkPrediction, createPrediction } from '../../services/predictionsService';

// Thunk per salvare la predizione
export const savePrediction = createAsyncThunk(
  'predictions/savePrediction',
  async ({ predictionData, leagueId }, { rejectWithValue }) => {
    try {
      const response = await createPrediction(predictionData);
      return { schedina: response.schedina };
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  }
);

// Thunk per controllare se una predizione esiste
export const fetchPrediction = createAsyncThunk(
  'predictions/fetchPrediction',
  async ({ giornataAttuale, leagueId, userId }, { rejectWithValue }) => {
    try {
      const prediction = await checkPrediction(giornataAttuale, leagueId, userId);
      return { schedina: prediction.schedina };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Errore durante il controllo della predizione');
    }
  }
);

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState: {
    schedinaInserita: {}, // Lo stato in cui memorizziamo la schedina inserita
    loading: false, // Stato di caricamento globale
    error: null // Stato di errore globale
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Gestione dello stato di caricamento e popolamento per savePrediction
      .addCase(savePrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePrediction.fulfilled, (state, action) => {
        state.loading = false;
        state.schedinaInserita = action.payload; // Popola la schedina inserita dopo il salvataggio
      })
      .addCase(savePrediction.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Errore nel salvataggio della predizione';
      })

      // Gestione dello stato di caricamento e popolamento per fetchPrediction
      .addCase(fetchPrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrediction.fulfilled, (state, action) => {
        state.loading = false;
        state.schedinaInserita = action.payload; // Popola la schedina inserita se esiste già
      })
      .addCase(fetchPrediction.rejected, (state, action) => {
        state.loading = false;
        state.schedinaInserita = {}; // Popola la schedina inserita se esiste già
        state.error = action.payload || 'Errore durante il controllo della predizione';
      });
  }
});

export default predictionsSlice.reducer;
