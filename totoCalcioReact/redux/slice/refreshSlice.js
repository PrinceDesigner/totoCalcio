// redux/slices/refreshSlice.js
import { createSlice } from '@reduxjs/toolkit';

const refreshSlice = createSlice({
  name: 'refresh',
  initialState: {
    refreshRequired: false,
  },
  reducers: {
    triggerRefresh: (state) => {
      state.refreshRequired = true;
    },
    clearRefresh: (state) => {
      state.refreshRequired = false;
    },
  },
});

// Esporta le azioni per attivare e disattivare il refresh
export const { triggerRefresh, clearRefresh } = refreshSlice.actions;

export default refreshSlice.reducer;
