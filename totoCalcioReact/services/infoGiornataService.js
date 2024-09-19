import axiosInstance from '../services/axiosInterceptor';

// Recupera i dettagli di una giornata specifica
export const getDayDetails = async (dayId) => {
  try {
    const response = await axiosInstance.get(`/leagues/days/${dayId}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei dettagli della giornata:', error);
    throw error;
  }
};
