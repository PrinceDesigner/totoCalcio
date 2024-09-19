import axiosInstance from '../services/axiosInterceptor';  // Usa il tuo interceptor o axiosInstance personalizzato

// Funzione per inviare la predizione
export const createPrediction = async (predictionData) => {
  try {
    const response = await axiosInstance.post('/predictions/add', predictionData);
    return response.data; // Restituisce il documento caricato dal server
  } catch (error) {
    console.error('Errore durante la creazione della predizione:', error);
    throw error; // Solleva l'errore per gestirlo nell'interfaccia utente
  }
};