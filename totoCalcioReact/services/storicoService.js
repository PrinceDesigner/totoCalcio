import axiosInstance from './axiosInterceptor';

// Servizio per ottenere le giornate calcolate con le predizioni per uno specifico utente e lega
export const fetchGiornatePerUtenteSelzionato = async (leagueId, userId) => {
  try {
    // Effettua la chiamata API
    const response = await axiosInstance.get(`/giornate-calcolate/${leagueId}/${userId}`);

    return response.data.documentsWithPredictions; // Restituisce l'array dei documenti
  } catch (error) {
    console.error('Errore durante il recupero delle giornate calcolate:', error);
    throw error; // Rilancia l'errore per gestirlo nei thunk o nei componenti
  }
};

export const fetchGiornateCalcolate = async (leagueId) => {
  try {
    const response = await axiosInstance.get(`/giornate-calcolate/${leagueId}`);
    return response.data.documents;
  } catch (error) {
    console.error('Errore durante il recupero delle giornate calcolate:', error);
    throw error;
  }
};
