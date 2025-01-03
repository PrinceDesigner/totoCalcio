const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const supabase = require('../superBaseConnect');



// Inizializza Firestore
const { firestore } = require('../firebaseAdmin'); // Assicurati di aver configurato Firebase Admin SDK
const router = express.Router();

async function addSchedina(
    p_dayid,
    p_id_league,
    p_schedina,
    p_userid,
    p_selectleague
) {
    let { data, error } = await supabase
        .rpc('insert_prediction_schedina', {
            p_dayid,
            p_id_league,
            p_schedina,
            p_userid,
            p_selectleague
        })
    if (error) console.error(error)
    else console.log(data)

    if (error) {
        console.error('Error fetching data:', error);
        throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
    } else {
        console.log('tutto ok', data)
        return data
    }
}

// Route per inserire o aggiornare una predizione
router.post('/add', authMiddleware, async (req, res) => {
    const { userId, leagueId, schedina, daysId, legaSelezionata } = req.body;

    if (!userId || !leagueId || !schedina || !daysId) {
        return res.status(400).json({ message: 'userId, leagueId, schedina e daysId sono obbligatori.' });
    }


    try {
        // Verifica se `leagueId` contiene più ID separati da virgole
        const leagueIds = leagueId.includes(',') ? leagueId.split(',') : [leagueId];
        let schedineresponse = [];
        // Cicla su ogni `leagueId` da processare
        const response = await addSchedina(daysId, leagueIds, schedina, userId, legaSelezionata)
        if (response.message === 'Giornata gia iniziata') {
            return res.status(500).json({ message: 'Giornata già iniziata' });
        }
        return res.status(201).json(response);
    } catch (error) {
        console.error('Errore durante il salvataggio della predizione:', error);
        return res.status(500).json({ message: 'Errore durante il salvataggio della predizione.' });
    }


});

// Route per controllare se esiste già una predizione

async function getPredictionsForDay(
    p_day_id,
    p_league_id,
    p_userid) {
    let { data, error } = await supabase
        .rpc('get_schedina_by_user_and_league', {
            p_day_id,
            p_league_id,
            p_userid
        })
    if (error) {
        console.error('Error fetching data:', error);
        throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
    } else {
        console.log('tutto ok', data)
        return data
    }
}

router.get('/check', async (req, res) => {
    const { dayId, leagueId, userId } = req.query;
    try {
        const result = await getPredictionsForDay(dayId, leagueId, userId)
        res.status(200).json(result);
    } catch (error) {
        console.error('Errore durante il controllo della predizione:', error);
        res.status(500).json({ message: 'Errore durante il controllo della predizione' });
    }
});

async function getResultOfUserForMatch(p_league_id,
    p_match_id) {
    let { data, error } = await supabase
        .rpc('get_league_match_results', {
            p_league_id,
            p_match_id
        })

    if (error) {
        console.error('Error fetching data:', error);
        throw new Error(error); // Lancia un'eccezione con il messaggio dell'errore
    } else {
        console.log('tutto ok', data)
        return data
    }
}

router.get('/getResultOfUserForMatch', async (req, res) => {
    const { leagueId, matchId } = req.query;
    try {
        const result = await getResultOfUserForMatch(leagueId, matchId)
        res.status(200).json(result);
    } catch (error) {
        console.error('Errore durante il recupero dei risultati', error);
        res.status(500).json({ message: 'Errore durante il recupero dei risultati' });
    }
});


// Route per ottenere le predictions in base a leagueId e daysId
router.get('/predictionsForDayId', async (req, res) => {
    try {
        // Otteniamo i parametri dalla query string
        const { leagueId, daysId } = req.query;

        if (!leagueId || !daysId) {
            return res.status(400).json({ error: 'leagueId e daysId sono richiesti.' });
        }

        // Accediamo alla collezione predictions
        const predictionsRef = firestore.collection('predictions');
        const snapshot = await predictionsRef
            .where('leagueId', '==', leagueId)
            .where('daysId', '==', daysId)
            .get();

        let predictions = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            if (!predictions[userId]) {
                predictions[userId] = [];
            }
            predictions[userId] = { id: doc.id, ...data };
        });

        // Rispondiamo con le predictions trovate o un array vuoto
        res.status(200).json(predictions);
    } catch (error) {
        console.error('Errore durante il recupero delle predictions:', error);
        res.status(500).json({ error: 'Errore del server durante il recupero delle predictions.' });
    }
});



module.exports = router;
