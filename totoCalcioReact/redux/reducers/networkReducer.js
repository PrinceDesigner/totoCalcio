// redux/reducers/networkReducer.js
const initialState = {
    isConnected: true, // Stato iniziale
  };
  
  const networkReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_CONNECTION_STATUS':
        return { ...state, isConnected: action.payload };
      default:
        return state;
    }
  };
  
  export default networkReducer;
  