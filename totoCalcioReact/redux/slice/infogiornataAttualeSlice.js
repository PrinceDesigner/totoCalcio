import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDayDetails } from '../../services/infoGiornataService';

// Thunk per ottenere i dettagli della giornata e le partite
export const fetchDayDetails = createAsyncThunk(
  'infogiornataAttuale/fetchDayDetails',
  async (dayId, { rejectWithValue }) => {
    try {
      const response = await getDayDetails(dayId)
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  dayId: null,
  dayNumber: '',
  startDate: '',
  endDate: '',
  isCurrentDay: false,
  matches: [],
  loading: false,
  error: null,
};

const infogiornataAttualeSlice = createSlice({
  name: 'infogiornataAttuale',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDayDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDayDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.dayId = action.payload.dayId;
        state.dayNumber = action.payload.dayNumber;
        state.startDate = action.payload.startDate;
        state.endDate = action.payload.endDate;
        state.isCurrentDay = action.payload.isCurrentDay;
        state.matches = action.payload.matches;
      })
      .addCase(fetchDayDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Errore nel recupero della giornata';
      });
  },
});

export default infogiornataAttualeSlice.reducer;
