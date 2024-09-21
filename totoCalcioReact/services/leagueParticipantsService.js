import axiosInstance from './axiosInterceptor';

export const fetchLeagueParticipants = async (userIds, leagueId) => {
  try {
    // Effettua la chiamata POST all'API con userIds e leagueId
    const response = await axiosInstance.post('/users-info', {
      userIds,
      leagueId,
    });

    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei partecipanti:', error);
    throw error;
  }
};
