// redux/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false, // Stato per il caricamento globale
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showLoading: (state) => {
      state.loading = true;
    },
    hideLoading: (state) => {
      state.loading = false;
    },
  },
});

// Esporta le azioni per mostrare/nascondere il caricamento
export const { showLoading, hideLoading } = uiSlice.actions;

export default uiSlice.reducer;
