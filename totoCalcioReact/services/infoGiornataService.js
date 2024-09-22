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


// Funzione per ottenere la giornata attuale
export const getGiornataAttuale = async () => {
  try {
    // Effettua una richiesta GET alla route del backend
    const response = await axiosInstance.get('/giornata-attuale');
    return response.data.giornataAttuale; // Restituisci il campo 'giornataAttuale' dalla risposta
  } catch (error) {
    console.error('Errore durante il recupero della giornata attuale:', error);
    throw error; // Gestisci l'errore nella parte chiamante
  }
};
