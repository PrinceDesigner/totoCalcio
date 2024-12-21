const express = require('express');
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const { FieldValue, FieldPath } = require('firebase-admin').firestore; // Importa FieldValue
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
const axios = require('axios');
// const moment = require('moment');
const moment = require('moment-timezone');
const supabase = require('../superBaseConnect');
const { getAuth } = require('firebase-admin/auth');

// Funzione per sanitizzare i matchId
function sanitizeMatchId(matchId) {
  // Sostituisci caratteri non validi con un trattino (-)
  return matchId.replace(/[\/.#$[\]]/g, '-');
}

// Funzione per caricare le giornate su Firebase
async function fetchSerieAFixtures() {
  try {
    const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
      params: {
        league: 135, // Serie A
        season: 2024 // Stagione 2024
      },
      headers: {
        'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });
    return response.data.response;
  } catch (error) {
    console.error('Errore durante il recupero dei fixture:', error);
  }
}

async function fetchCurrentRound() {
  try {
    const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures/rounds', {
      params: {
        league: 135, // Serie A
        season: 2024,
        current: 'true' // Ottiene la giornata attuale
      },
      headers: {
        'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });

    return response.data.response[0]; // Es. "Regular Season - 31"
  } catch (error) {
    console.error('Errore durante il recupero della giornata attuale:', error);
  }
}


async function fetchMatchLineup(fixtureId) {
  try {
    // Effettua una richiesta GET per ottenere le formazioni della partita specificata
    const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures/lineups', {
      params: {
        fixture: fixtureId
      },
      headers: {
        'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });

    return response.data.response; // Restituisce le formazioni delle squadre
  } catch (error) {
    console.error('Errore durante il recupero della formazione:', error);
    throw error; // Propaga l'errore per essere gestito dal chiamante
  }
}

router.get('/match-lineup/:fixtureId', async (req, res) => {
  const { fixtureId } = req.params;

  try {
    const lineupData = await fetchMatchLineup(fixtureId);
    res.json(lineupData); // Invia la risposta JSON al client con i dati delle formazioni
  } catch (error) {
    res.status(500).json({ error: 'Errore durante il recupero della formazione' });
  }
});

// Route per ottenere l'unico documento dalla raccolta 'nomeGiornataAttuale'
router.get('/giornata-attuale', async (req, res) => {

  try {
    const snapshot = await firestore.collection('giornataAttuale').limit(1).get(); // Ottieni solo il primo documento

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Nessun documento trovato.' });
    }

    // Estrai il primo documento dal risultato
    const doc = snapshot.docs[0];
    const data = doc.data();

    res.status(200).json({ giornataAttuale: data.giornataAttuale });
  } catch (error) {
    console.error('Errore durante il recupero della giornata attuale:', error);
    res.status(500).json({ success: false, message: 'Errore durante il recupero della giornata attuale.' });
  }
});

// Funzione per determinare il risultato finale (1, X, 2)
function determineResult(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) {
    return "1"; // Vittoria squadra di casa
  } else if (homeGoals < awayGoals) {
    return "2"; // Vittoria squadra ospite
  } else {
    return "X"; // Pareggio
  }
}


async function createLeague(p_name, p_ownerid) {
  let { data, error } = await supabase
    .rpc('insert_league', {
      p_name,
      p_ownerid
    })

  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}


// Creazione di una nuova lega
router.post('/leagues', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.uid; // Ottieni l'ID utente dal token verificato

  try {

    const response = await createLeague(name, userId)
    const resp = {
      id: response[0].id_league_ret,
      name: response[0].name_ret,
      numeroPartecipanti: response[0].n_partecipanti_ret,
      ownerId: response[0].ownerid_ret
    }

    // Restituisci la risposta con i dati della lega appena creata
    res.status(201).json({ message: 'Lega creata con successo', leagueData: { ...resp, id: response[0].id_league_ret } });
  } catch (error) {
    console.error('Errore durante la creazione della lega:', error);
    res.status(500).json({ message: 'Errore durante la creazione della lega' });
  }
});


async function updateNameLeague(p_league_id,
  p_new_name) {
  let { data, error } = await supabase
    .rpc('update_league_name', {
      p_league_id,
      p_new_name
    })

  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}

// Route per aggiornare il nome della lega
router.put('/leagues/:leagueId', authMiddleware, async (req, res) => {
  const { leagueId } = req.params; // Ottieni l'ID della lega dai parametri dell'URL
  const { leagueName } = req.body; // Ottieni il nuovo nome della lega dal corpo della richiesta

  if (!leagueName || leagueName.trim() === '') {
    return res.status(400).json({ message: 'Il nome della lega non può essere vuoto.' });
  }

  try {

    await updateNameLeague(leagueId, leagueName)

    // Restituisci l'ID della lega e il nuovo nome come risposta
    res.status(200).json({ leagueId, nomeNuovo: leagueName.trim() });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della lega:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento della lega.' });
  }
});


async function joinInLeague(p_league_id, p_userid) {
  let { data, error } = await supabase
    .rpc('join_league', {
      p_league_id,
      p_userid
    });

  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error.message); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('Tutto ok', data);
    return data;
  }
}


// Partecipazione a una lega esistente
router.post('/leagues/join', authMiddleware, async (req, res) => {
  let { leagueId } = req.body; // Prendi leagueId dal body della richiesta
  const userId = req.user.uid;

  leagueId = leagueId?.trim();

  try {
    const response = await joinInLeague(leagueId, userId)
    const resp = {
      id: response[0].id_league_ret,
      name: response[0].name_ret,
      numeroPartecipanti: response[0].n_partecipanti_ret,
      ownerId: response[0].ownerid_ret
    }
    res.status(200).json({
      message: 'Partecipazione avvenuta con successo',
      leagueData: { ...resp, id: response[0].id_league_ret }, // Restituisci i dettagli della lega
    });
  } catch (error) {

    if (error.message) {
      return res.status(500).json({ message: error.message });
    }

    console.error('Errore durante la partecipazione alla lega:', error);
    res.status(500).json({ message: 'Errore durante la partecipazione alla lega' });
  }
});


async function getLeagueForUserId(userId) {
  let { data, error } = await supabase
    .rpc('get_leagueuser', {
      p_userid: userId
    });


  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}


// Visualizza tutte le leghe a cui l'utente partecipa
router.get('/leagues', authMiddleware, async (req, res) => {
  const userId = req.user.uid;
  /*get_leagues_by_user caire cosa serve in output e aggiornare la funzione sul DB*/
  try {

    const response = await getLeagueForUserId(userId)

    let leagues = []
    if (response.length >= 1) {
      leagues = response.map(doc => ({
        id: doc.id_league_ret,
        ownerId: doc.ownerid_ret,
        name: doc.name_ret,
        numeroPartecipanti: doc.membri_count_ret,
      }));
    }

    res.status(200).json({ message: 'Elenco delle leghe recuperato con successo', leagues });
  } catch (error) {
    console.error('Errore durante il recupero delle leghe:', error);
    res.status(500).json({ message: 'Errore durante il recupero delle leghe' });
  }
});

async function getMembersInfoForLeague(leagueId) {
  const { data, error } = await supabase
    .rpc('get_members_by_league', {
      p_league_id: leagueId      // Il JSON che contiene i dati da aggiornare
    });

  if (error) {
    console.error('Error fetching data:', error);
    throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
  } else {
    console.log('tutto ok', data)
    return data
  }
}

// PRENDO LE INFO DEI MEMBRI
router.get('/leagues/:leagueId/members-info', authMiddleware, async (req, res) => {
  const { leagueId } = req.params; // Ottieni l'ID della lega dai parametri dell'URL
  /*get_leagues_by_user caire cosa serve in output e aggiornare la funzione sul DB*/
  try {
    const auth = getAuth();

    const r = await getMembersInfoForLeague(leagueId)
    // Mappa gli utenti con le informazioni aggiuntive da Firebase Authentication
    const response = await Promise.all(

      r.map(async (el) => {
        try {
          // Recupera le informazioni utente da Firebase Authentication
          const userRecord = await auth.getUser(el.id_user_ret);
          // Aggiungi photoUrl all'oggetto
          return {
            ...el,
            photoUrl: userRecord.photoURL || null, // photoURL potrebbe essere null
          };
        } catch (error) {
          console.error(`Errore per utente ${el.id_user_ret}:`, error);
          // Se fallisce, restituisci comunque l'elemento senza photoUrl
          return {
            ...el,
            photoUrl: null,
          };
        }
      })
    );

    res.status(200).json({ message: 'Elenco dei members info recuperato con successo', response });
  } catch (error) {
    console.error('Errore durante il recupero dei members info:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei members info' });
  }
});



// prendi una legaById
// Recupera una lega specifica utilizzando il suo ID
router.get('/leagues/:leagueId', async (req, res) => {
  const leagueId = req.params.leagueId;
  /*get_leagues_by_leagueid capire cosa serve in output anche i memebrs ?
  Se si utilizzare get_members_by_league */
  try {
    const leagueDoc = await firestore.collection('leagues').doc(leagueId).get();

    if (!leagueDoc.exists) {
      return res.status(404).json({ message: 'Lega non trovata' });
    }

    const leagueData = leagueDoc.data();

    res.status(200).json({ message: 'Lega recuperata con successo', league: { id: leagueDoc.id, ...leagueData } });
  } catch (error) {
    console.error('Errore durante il recupero della lega:', error);
    res.status(500).json({ message: 'Errore durante il recupero della lega' });
  }
});

// Visualizza la classifica di una lega
router.get('/leagues/:leagueId/standings', authMiddleware, async (req, res) => {
  const { leagueId } = req.params;

  try {
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const league = await leagueRef.get();

    if (!league.exists) {
      return res.status(404).json({ message: 'Lega non trovata' });
    }

    const standings = league.data().standings || [];

    res.status(200).json({ message: 'Classifica recuperata con successo', standings });
  } catch (error) {
    console.error('Errore durante il recupero della classifica:', error);
    res.status(500).json({ message: 'Errore durante il recupero della classifica' });
  }
});

// Elimina una lega
router.delete('/leagues/:leagueId', authMiddleware, async (req, res) => {
  const { leagueId } = req.params;
  const userId = req.user.uid;

  try {
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const league = await leagueRef.get();

    if (!league.exists) {
      return res.status(404).json({ message: 'Lega non trovata' });
    }

    if (!league.data().ownerId.includes(userId)) {
      return res.status(403).json({ message: 'Non sei autorizzato a eliminare questa lega' });
    }

    await leagueRef.delete();

    res.status(200).json({ message: 'Lega eliminata con successo', leagueId });
  } catch (error) {
    console.error('Errore durante l\'eliminazione della lega:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione della lega' });
  }
});



// Route per caricare le giornate
// Route per caricare le giornate
router.post('/leagues/upload-days', async (req, res) => {
  try {
    const fixtures = await fetchSerieAFixtures();
    const currentRound = await fetchCurrentRound();

    // Raggruppiamo i fixture per "round" (giornata)
    const groupedByDay = fixtures.reduce((acc, fixture) => {
      const dayNumber = fixture.league.round;  // Es. "Regular Season - 31"
      const matchId = fixture.fixture.id;

      // Se non esiste ancora un gruppo per questa giornata, crealo
      if (!acc[dayNumber]) {
        acc[dayNumber] = {
          dayNumber,
          matches: [],
          startDate: fixture.fixture.date,  // Imposta inizialmente la data di inizio come quella della prima partita
          endDate: fixture.fixture.date     // Anche la data di fine è inizialmente la data della prima partita
        };
      }

      acc[dayNumber].matches.push(matchId);

      const matchDate = new Date(fixture.fixture.date);  // Data della partita
      const currentStartDate = new Date(acc[dayNumber].startDate);
      const currentEndDate = new Date(acc[dayNumber].endDate);

      // Aggiorna la data di inizio se la partita corrente è prima della data di inizio attuale
      if (matchDate < currentStartDate) {
        acc[dayNumber].startDate = fixture.fixture.date;
      }

      // Aggiorna la data di fine se la partita corrente è dopo la data di fine attuale
      if (matchDate > currentEndDate) {
        acc[dayNumber].endDate = fixture.fixture.date;
      }

      return acc;
    }, {});

    // Ordina le giornate in base al numero
    const daysArray = Object.values(groupedByDay).sort((a, b) => parseInt(a.dayNumber.match(/\d+/)) - parseInt(b.dayNumber.match(/\d+/)));

    // Carichiamo ogni giornata su Firebase
    for (const day of daysArray) {
      const dayId = day.dayNumber.toString().trim().replace(/\s+/g, ''); // Genera un UUID per la giornata

      // Verifica se questa giornata è quella attuale confrontando `dayNumber` con `currentRound`
      const isCurrentDay = day.dayNumber === currentRound;

      // Struttura della giornata da caricare su Firebase
      const dayData = {
        dayId,
        dayNumber: day.dayNumber,
        matches: day.matches,
        startDate: moment.tz(day.startDate, "Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00'),   // Prima partita della giornata
        endDate: moment.tz(day.endDate, "Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00'),       // Ultima partita della giornata
        isCurrentDay               // Booleano per indicare se è la giornata attuale
      };

      try {
        // Carica la giornata su Firestore
        await firestore.collection('days').doc(dayId).set(dayData);
        console.log(`Giornata ${day.dayNumber} caricata con successo!`);
      } catch (error) {
        console.error(`Errore durante il caricamento della giornata ${day.dayNumber}:`, error);
      }
    }

    res.status(200).send('Le giornate sono state caricate con successo.');
  } catch (error) {
    console.error('Errore durante il caricamento delle giornate:', error);
    res.status(500).send('Errore durante il caricamento delle giornate.');
  }
});





// Route per caricare le partite su Firestore usando gli stessi matchId presenti in 'days'
router.post('/leagues/upload-matches', async (req, res) => {
  try {
    const fixtures = await fetchSerieAFixtures();  // Ottieni i fixture dalla RapidAPI

    for (const fixture of fixtures) {
      let matchId = fixture.fixture.id.toString(); // Converti in stringa se necessario
      // Verifica che matchId sia valido (non vuoto o undefined)
      if (!matchId || typeof matchId !== 'string') {
        // console.error('Match ID non valido:', matchId);
        continue; // Salta questa partita se il matchId non è valido
      }

      // Controlla se la partita è terminata, se sì, determina il risultato
      const result = fixture.fixture.status.short === "FT"
        ? determineResult(fixture.goals.home, fixture.goals.away)
        : null;  // Se la partita non è terminata, il risultato sarà `null`

      const matchData = {
        matchId,  // Usa il matchId esistente
        homeTeam: fixture.teams.home.name,  // Squadra di casa
        awayTeam: fixture.teams.away.name,  // Squadra ospite
        homeLogo: fixture.teams.home.logo,
        awayLogo: fixture.teams.away.logo,
        stadio: fixture.fixture.venue.name,
        result,  // Risultato, `null` se la partita non è ancora finita
        dayId: fixture.league.round.toString().trim().replace(/\s+/g, ''),  // Giornata a cui appartiene la partita (stesso valore usato per la giornata)
        startTime: moment.tz(fixture.fixture.date, "Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00')  // Data e ora di inizio della partita
      };

      // Carica il match su Firestore usando lo stesso matchId già presente nella collezione 'days'
      await firestore.collection('matches').doc(matchId).set(matchData);
      console.log(`Partita ${matchData.homeTeam} vs ${matchData.awayTeam} caricata con successo!`);
    }

    res.status(200).send('Le partite sono state caricate con successo.');
  } catch (error) {
    console.error('Errore durante il caricamento delle partite:', error);
    res.status(500).send('Errore durante il caricamento delle partite.');
  }
});

// Route per ottenere i dettagli delle giornate con le partite in bulk
router.get('/leagues/days/:dayId', async (req, res) => {
  const { dayId } = req.params;

  try {
    // Ottieni il documento della giornata dalla collezione 'days'
    const dayDoc = await firestore.collection('days').doc(dayId).get();

    if (!dayDoc.exists) {
      return res.status(404).json({ message: 'Giornata non trovata' });
    }

    const dayData = dayDoc.data();

    // Recupera tutti i matchId della giornata in un array
    const matchIds = dayData.matches.map(matchId => matchId.toString()); // Converti i matchId in stringa

    // Recupera i documenti delle partite in bulk con una sola chiamata
    const matchesSnapshot = await firestore.collection('matches').where(FieldPath.documentId(), 'in', matchIds).get();

    // Estrai i dettagli delle partite dai documenti ottenuti
    const matchesDetails = matchesSnapshot.docs.map(doc => doc.data());

    // Risposta contenente i dati della giornata e i dettagli delle partite
    res.status(200).json({
      dayId: dayData.dayId,
      dayNumber: dayData.dayNumber,
      startDate: dayData.startDate,
      endDate: dayData.endDate,
      isCurrentDay: dayData.isCurrentDay,
      matches: matchesDetails // Includi i dettagli delle partite
    });

  } catch (error) {
    console.error('Errore durante il recupero della giornata:', error);
    res.status(500).json({ message: 'Errore durante il recupero della giornata' });
  }
});

// Route per eliminare un utente da una lega
router.post('/leagues/removeUserFromLeague', async (req, res) => {
  const { leagueId, userId } = req.body;
  console.log('bodyyyy', req.body);

  if (!leagueId || !userId) {
    return res.status(400).json({ message: 'leagueId e userId sono obbligatori.' });
  }

  try {
    // Ottieni la lega dalla collezione "leagues"
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const leagueDoc = await leagueRef.get();

    if (!leagueDoc.exists) {
      return res.status(404).json({ message: 'Lega non trovata.' });
    }

    const leagueData = leagueDoc.data();

    // Rimuovi l'utente dall'array "members"
    const updatedMembers = leagueData.members.filter((member) => member !== userId);
    const updatedMembersInfo = leagueData.membersInfo.filter((memberInfo) => memberInfo.id !== userId);

    // Aggiorna la lega con i membri aggiornati
    await leagueRef.update({
      members: updatedMembers,
      membersInfo: updatedMembersInfo,
    });

    // Elimina tutte le predizioni dell'utente dalla collezione "predictions"
    const predictionsSnapshot = await firestore.collection('predictions')
      .where('leagueId', '==', leagueId)
      .where('userId', '==', userId)
      .get();

    const batch = firestore.batch();

    predictionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Esegui l'operazione di batch per eliminare le predizioni
    await batch.commit();

    return res.status(200).json({ message: 'Utente rimosso dalla lega e predizioni eliminate con successo.', data: userId });
  } catch (error) {
    console.error('Errore durante la rimozione dell\'utente dalla lega:', error);
    return res.status(500).json({ message: 'Errore durante la rimozione dell\'utente dalla lega.' });
  }
});

// Rendi un utente amministratore di una lega
router.post('/leagues/make-admin', authMiddleware, async (req, res) => {
  const { leagueId, userId } = req.body; // Ottieni l'ID della lega e dell'utente dal body della richiesta

  // Verifica se leagueId e userId sono stati forniti
  if (!leagueId || !userId) {
    return res.status(400).json({ message: 'ID della lega e ID dell\'utente sono obbligatori.' });
  }

  try {
    // Ottieni il riferimento al documento della lega
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const leagueDoc = await leagueRef.get();

    // Verifica se la lega esiste
    if (!leagueDoc.exists) {
      return res.status(404).json({ message: 'Lega non trovata.' });
    }

    const leagueData = leagueDoc.data();

    // Verifica se l'utente è un membro della lega
    if (!leagueData.members.includes(userId)) {
      return res.status(400).json({ message: 'L\'utente non è un membro della lega.' });
    }

    // Aggiorna l'ownerId della lega aggiungendo l'ID dell'utente specificato
    await leagueRef.update({
      ownerId: FieldValue.arrayUnion(userId)
    });

    res.status(200).json({ message: 'Utente reso amministratore con successo.', leagueId, userId });
  } catch (error) {
    console.error('Errore durante l\'assegnazione del ruolo di amministratore:', error);
    res.status(500).json({ message: 'Errore durante l\'assegnazione del ruolo di amministratore.' });
  }
});

// Rimuovi un utente come amministratore di una lega
router.post('/leagues/remove-admin', authMiddleware, async (req, res) => {
  const { leagueId, userId } = req.body; // Ottieni l'ID della lega e dell'utente dal body della richiesta

  // Verifica se leagueId e userId sono stati forniti
  if (!leagueId || !userId) {
    return res.status(400).json({ message: 'ID della lega e ID dell\'utente sono obbligatori.' });
  }

  try {
    // Ottieni il riferimento al documento della lega
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const leagueDoc = await leagueRef.get();

    // Verifica se la lega esiste
    if (!leagueDoc.exists) {
      return res.status(404).json({ message: 'Lega non trovata.' });
    }

    const leagueData = leagueDoc.data();

    // Verifica se l'utente è attualmente amministratore della lega
    if (!leagueData.ownerId || !leagueData.ownerId.includes(userId)) {
      return res.status(400).json({ message: 'L\'utente non è un amministratore della lega.' });
    }

    // Rimuovi l'ID dell'utente dal campo ownerId della lega
    await leagueRef.update({
      ownerId: FieldValue.arrayRemove(userId)
    });

    res.status(200).json({ message: 'Utente rimosso come amministratore con successo.', leagueId, userId });
  } catch (error) {
    console.error('Errore durante la rimozione del ruolo di amministratore:', error);
    res.status(500).json({ message: 'Errore durante la rimozione del ruolo di amministratore.' });
  }
});



module.exports = router;
