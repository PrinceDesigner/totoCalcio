import axios from 'axios';
import { getToken } from '../AsyncStorage/AsyncStorage';

// Configura l'istanza di Axios
const axiosInstance = axios.create({
  baseURL: 'http://192.168.1.26:5001/api', // Imposta il tuo URL backend
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

export default axiosInstance;
