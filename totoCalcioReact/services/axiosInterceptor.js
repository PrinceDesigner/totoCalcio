import axios from 'axios';
import { getToken } from '../AsyncStorage/AsyncStorage';
import { logout } from '../redux/slice/authSlice';
import { removeToken } from '../AsyncStorage/AsyncStorage';



let storeDispatch = null; // Variabile per memorizzare il dispatch
let navigator = null; // Per memorizzare la navigazione

// Funzione per configurare il dispatch di Redux
export const configureAxios = (dispatch, navigationRef) => {
  storeDispatch = dispatch;
  navigator = navigationRef;
};

// Configura l'istanza di Axios
const axiosInstance = axios.create({
  baseURL: 'https://totocalcioreact.uc.r.appspot.com/api', // Imposta il tuo URL backend // testata e funzionante
  // baseURL: 'http://192.168.1.5:5001/api', // Imposta il tuo URL backend
});

// Aggiungi un interceptor per includere automaticamente il token JWT
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken(); // Recupera il token JWT da AsyncStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Aggiungi il token all'header Authorization
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Aggiungi un interceptor per gestire errori
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if ((status === 401 || status === 403) && storeDispatch && navigator) {
      // Dispatch del logout
      await removeToken();
      storeDispatch(logout());
      navigator.navigate('LoginScreen');
    }
    return Promise.reject(error);
  }
);



export default axiosInstance;





// await removeToken(); 

// // Dispatch del logout per aggiornare lo stato di Redux
// dispatch(logout());