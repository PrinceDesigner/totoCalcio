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

// Recupera info membri
export const getMembersInfoForLeague = async (leagueId) => {
  try {
    const response = await axiosInstance.get(`/leagues/${leagueId}/members-info`);
    // {membersInfo,members}
    const membersInfo = response.data.response.map(member => ({
      userId: member.id_user_ret,
      punti: member.punti_ret,
      displayName: member.displayname_ret,
      photoURL: member.photoUrl
  }));

    console.log('MembersInfo', response.data);
    return membersInfo;
  } catch (error) {
    console.error('Errore durante dei membri MembersInfo', error);
    throw error;
  }
};

export const getMembersInfoForLeagueLive = async (leagueId, dayId) => {
  try {
    const response = await axiosInstance.get(`/leagues/${leagueId}/${dayId}/members-info-live`);
    // {membersInfo,members}
    const membersInfo = response.data.response.map(member => ({
      userId: member.id_user_ret,
      punti: member.punti_live_ret,
      displayName: member.displayname_ret,
      photoURL: member.photoUrl
  }));

    console.log('MembersInfo', response.data);
    return membersInfo;
  } catch (error) {
    console.error('Errore durante dei membri MembersInfo', error);
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

// Servizio per rendere un utente amministratore di una lega
export const makeUserAdmin = async (leagueId, userId) => {
  try {
    const response = await axiosInstance.post('/leagues/make-admin', {
      leagueId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error(`Errore durante l'assegnazione del ruolo di amministratore:`, error);
    throw error;
  }
};

// Levo admin
export const removeUserAdmin = async (leagueId, userId) => {
  try {
    const response = await axiosInstance.post('/leagues/remove-admin', {
      leagueId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error(`Errore durante la rimozione del ruolo di amministratore:`, error);
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


