import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createPrediction } from '../../services/predictionsService';

// Thunk per salvare la predizione
export const savePrediction = createAsyncThunk(
  'predictions/savePrediction',
  async (predictionData, { rejectWithValue }) => {
    try {
      const response = await createPrediction(predictionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState: {
    data: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(savePrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePrediction.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(savePrediction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nel salvataggio della predizione';
      });
  }
});

export default predictionsSlice.reducer;
