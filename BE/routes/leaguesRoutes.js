const express = require('express');
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const { FieldValue, FieldPath } = require('firebase-admin').firestore; // Importa FieldValue
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
const axios = require('axios');
const moment = require('moment');
const momentTime = require('moment-timezone');



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

    res.status(200).json({giornataAttuale: data.giornataAttuale });
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


// Creazione di una nuova lega
// Creazione di una nuova lega
router.post('/leagues', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.uid; // Ottieni l'ID utente dal token verificato

  try {
    // Recupera la giornata attuale
    const currentRound = await fetchCurrentRound();
    // const currentRoundFormatted = currentRound.toString().trim().replace(/\s+/g, '');
    const currentRoundFormatted = currentRound.toString().trim().replace(/\s+/g, '');

    // Crea una nuova lega in Firestore con la giornata attuale
    const leagueRef = await firestore.collection('leagues').add({
      name,
      ownerId: userId,
      createdAt: moment().utc().format('YYYY-MM-DDTHH:mm:ss+00:00'),
      members: [userId], // L'utente che crea la lega è anche il primo membro
      membersInfo: [{ id: userId, punti: 0 }],
    });

    const league = await leagueRef.get();
    const leagueId = league.id;

  
    // Restituisci la risposta con i dati della lega appena creata
    res.status(201).json({ message: 'Lega creata con successo', leagueData: { ...league.data(), id: leagueId } });
  } catch (error) {
    console.error('Errore durante la creazione della lega:', error);
    res.status(500).json({ message: 'Errore durante la creazione della lega' });
  }
});


// Route per aggiornare il nome della lega
router.put('/leagues/:leagueId', authMiddleware, async (req, res) => {
  const { leagueId } = req.params; // Ottieni l'ID della lega dai parametri dell'URL
  const { leagueName } = req.body; // Ottieni il nuovo nome della lega dal corpo della richiesta

  if (!leagueName || leagueName.trim() === '') {
    return res.status(400).json({ message: 'Il nome della lega non può essere vuoto.' });
  }

  try {
    // Ottieni il riferimento al documento della lega
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const leagueDoc = await leagueRef.get();

    // Verifica se la lega esiste
    if (!leagueDoc.exists) {
      return res.status(404).json({ message: 'Lega non trovata.' });
    }

    // Aggiorna il nome della lega
    await leagueRef.update({ name: leagueName.trim() });

    // Restituisci l'ID della lega e il nuovo nome come risposta
    res.status(200).json({ leagueId, nomeNuovo: leagueName.trim() });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della lega:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento della lega.' });
  }
});

// Partecipazione a una lega esistente
router.post('/leagues/join', authMiddleware, async (req, res) => {
  const { leagueId } = req.body; // Prendi leagueId dal body della richiesta
  const userId = req.user.uid;

  if (!leagueId) {
    return res.status(400).json({ message: 'ID della lega mancante.' });
  }

  try {
    const leagueRef = firestore.collection('leagues').doc(leagueId);
    const league = await leagueRef.get();

    if (!league.exists) {
      return res.status(404).json({ message: 'Lega non trovata' });
    }

    const leagueData = league.data();

    // Controlla se l'utente è già membro della lega
    if (leagueData.members && leagueData.members.includes(userId)) {
      return res.status(400).json({ message: 'L\'utente è già membro di questa lega.' });
    }

    const obj = {
      id: userId,
      punti: 0
    }

    // Aggiungi l'utente ai membri della lega
    await leagueRef.update({
      members: FieldValue.arrayUnion(userId),
      membersInfo: FieldValue.arrayUnion(obj)
    });

    // Ritorna la lega aggiornata insieme al messaggio di successo
    const updatedLeague = await leagueRef.get();

    res.status(200).json({
      message: 'Partecipazione avvenuta con successo',
      leagueData: { ...updatedLeague.data(), id: updatedLeague.id }, // Restituisci i dettagli della lega
    });
  } catch (error) {
    console.error('Errore durante la partecipazione alla lega:', error);
    res.status(500).json({ message: 'Errore durante la partecipazione alla lega' });
  }
});

// Visualizza tutte le leghe a cui l'utente partecipa
router.get('/leagues', authMiddleware, async (req, res) => {
  const userId = req.user.uid;

  try {
    const leaguesSnapshot = await firestore
      .collection('leagues')
      .where('members', 'array-contains', userId)
      .get();

    const leagues = leaguesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ message: 'Elenco delle leghe recuperato con successo', leagues });
  } catch (error) {
    console.error('Errore durante il recupero delle leghe:', error);
    res.status(500).json({ message: 'Errore durante il recupero delle leghe' });
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

    if (league.data().ownerId !== userId) {
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
        startDate: moment.tz(day.startDate,"Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00'),   // Prima partita della giornata
        endDate: moment.tz(day.endDate,"Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00'),       // Ultima partita della giornata
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
        startTime: moment.tz(fixture.fixture.date,"Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00')  // Data e ora di inizio della partita
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





module.exports = router;
