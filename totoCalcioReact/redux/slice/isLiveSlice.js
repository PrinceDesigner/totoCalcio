// features/liveStatusSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLive: false,
};

const liveStatusSlice = createSlice({
    name: 'liveStatus',
    initialState,
    reducers: {
        setLiveStatus: (state, action) => {
            state.isLive = action.payload;
        },
        resetLiveStatus: (state) => {
            state.isLive = false;
        },
    },
});

export const { setLiveStatus, resetLiveStatus } = liveStatusSlice.actions;

export default liveStatusSlice.reducer;
