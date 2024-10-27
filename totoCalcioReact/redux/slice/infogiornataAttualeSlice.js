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
  loading: false,
  error: null,
  dayId: null,
  dayNumber: null,
  startDate: null,
  endDate: null,
  isCurrentDay: false,
  matches: [],
};


const infogiornataAttualeSlice = createSlice({
  name: 'infogiornataAttuale',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDayDetails.pending, (state) => {
        return {
          ...state,
          loading: true,
          error: null,
        };
      })
      .addCase(fetchDayDetails.fulfilled, (state, action) => {
        return {
          ...state,
          loading: false,
          dayId: action.payload.dayId,
          dayNumber: action.payload.dayNumber,
          startDate: action.payload.startDate,
          endDate: action.payload.endDate,
          isCurrentDay: action.payload.isCurrentDay,
          matches: action.payload.matches,
        };
      })
      .addCase(fetchDayDetails.rejected, (state, action) => {
        return {
          ...state,
          loading: false,
          error: action.payload || 'Errore nel recupero della giornata',
        };
      });
  },
});

export default infogiornataAttualeSlice.reducer;