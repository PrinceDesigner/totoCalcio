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


// Servizio per controllare se una predizione esiste
export const checkPrediction = async (dayId, leagueId, userId) => {
  try {
    const response = await axiosInstance.get(`/predictions/check`, {
      params: { dayId, leagueId, userId }
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante il controllo della predizione:', error);
    throw error;
  }
};

// Servizio per ottenere le predizioni per uno specifico giorno e lega
export const getPredictionsForDay = async (leagueId, daysId) => {
  try {
    const response = await axiosInstance.get(`/predictions/predictionsForDayId/`, {
      params: { leagueId, daysId }
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero delle predizioni:', error);
    throw error;
  }
};

// Servizio per ottenere le predizioni per uno specifico giorno e lega
export const getResultOfUserForMatch = async (leagueId, matchId) => {
  try {
    const response = await axiosInstance.get(`/predictions/getResultOfUserForMatch/`, {
      params: { leagueId, matchId }
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero delle predizioni:', error);
    throw error;
  }
};


