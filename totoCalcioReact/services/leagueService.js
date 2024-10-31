import axiosInstance from '../services/axiosInterceptor';

// Creazione di una nuova lega
export const createLeague = async (name) => {
  try {
    const response = await axiosInstance.post('/leagues', { name });
    return response.data;
  } catch (error) {
    console.error('Errore durante la creazione della lega:', error);
    throw error;
  }
};

// Partecipazione a una lega
export const joinLeague = async (leagueId) => {
  try {
    const response = await axiosInstance.post('/leagues/join', { leagueId });
    return response.data;
  } catch (error) {
    console.error('Errore durante la partecipazione alla lega:', error);
    throw error;
  }
};

// Recupera tutte le leghe a cui l'utente partecipa
export const getUserLeagues = async () => {
  try {
    const response = await axiosInstance.get('/leagues');
    return response.data.leagues;
  } catch (error) {
    console.error('Errore durante il recupero delle leghe:', error);
    throw error;
  }
}; 

// Recupera una lega byId
export const getUserLeagueById = async (leagueId) => {
  try {
    const response = await axiosInstance.get(`/leagues/${leagueId}`);
    console.log('Lega nuova', response.data.league);
    return response.data.league;
  } catch (error) {
    console.error('Errore durante il recupero delle leghe:', error);
    throw error;
  }
};

// Recupera la classifica di una lega
export const getLeagueStandings = async (leagueId) => {
  try {
    const response = await axiosInstance.get(`/leagues/${leagueId}/standings`);
    return response.data.standings;
  } catch (error) {
    console.error('Errore durante il recupero della classifica:', error);
    throw error;
  }
};

// Elimina una lega
export const deleteLeague = async (leagueId) => {
  try {
    const response = await axiosInstance.delete(`/leagues/${leagueId}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante l\'eliminazione della lega:', error);
    throw error;
  }
};


// Servizio per aggiornare il nome della lega
export const updateLeagueName = async (leagueId, leagueName) => {
  try {
    const response = await axiosInstance.put(`/leagues/${leagueId}`, {
      leagueName
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della lega:', error);
    throw error;
  }
};

// Servizio per rimuovere un utente da una lega
export const removeUserFromLeague = async (leagueId, userId) => {
  try {
    const response = await axiosInstance.post('/leagues/removeUserFromLeague', {
      leagueId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante la rimozione dell\'utente dalla lega:', error);
    throw error;
  }
};


// Servizio per recuperare le lineups di una partita specifica
export const getMatchLineup = async (fixtureId) => {
  try {
    const response = await axiosInstance.get(`/match-lineup/${fixtureId}`);
    return response.data; // Restituisce i dati di lineup per la partita specifica
  } catch (error) {
    console.error('Errore durante il recupero della formazione:', error);
    throw error;
  }
};
