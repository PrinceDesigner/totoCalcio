// functions/index.js
const functions = require("firebase-functions/v1");
const supabase     = require('./supaClient');
const { info,error, log } = require("firebase-functions/logger");
const { google }     = require('googleapis');
const axios          = require('axios');
const moment         = require('moment-timezone');

exports.updateMatchesSupa = functions.https.onRequest(async (req, res) => {

    const { dayId, noStep = false } = req.body;
    info('START--->>>', dayId);

    if (!dayId) {
        return res.status(400).send({ success: false, message: "dayId è richiesto" });
    }

    try {
        // Ottieni i dati dalla API di football
        const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures`, {
            params: {
                league: '135',
                season: '2024',
                round: dayId.replace('Regular', 'Regular ').replace('Season', 'Season ').replace('-', '- '),
            },
            headers: {
                'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
            },
        });

        const fixtures = response.data.response;
        functions.logger.log('FIXTURES->', fixtures);

        // Ottieni dati da Supabase
        const { data: leagues, error: leaguesError } = await supabase.from('leagues').select('id_league');
        if (leaguesError){
                console.error('Errore durante estrazione leagues ', leaguesError);
                res.status(500).send({ success: false, message: "Errore durante estrazione leagues " +leaguesError });
        }


        const { data: predictions, error: predictionsError } = await supabase
            .from('predictions')
            .select('id_league')
            .eq('dayid', dayId);
            if (predictionsError){
                console.error('Errore durante estrazione predictions ', predictionsError);
                res.status(500).send({ success: false, message: "Errore durante estrazione predictions " +leaguesError });
            }

        const leagueMap = leagues.reduce((acc, league) => {
            acc[league.id_league] = { calcolata: false };
            return acc;
        }, {});

        predictions.forEach(prediction => {
            if (prediction.id_league in leagueMap) {
                leagueMap[prediction.id_league].calcolata = true;
            }
        });

        // Aggiorna la tabella "matches" in Supabase
        for (const match of fixtures) {
            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    result: determineResult(match.goals.home, match.goals.away, match.fixture.status.short),
                    status: match.fixture.status.short,
                })
                .eq('matchid', match.fixture.id);

            if (updateError) {
                error('Errore aggiornando match:', updateError);
            }
        }

        // Inserisci le previsioni nella tabella "giornateCalcolate"
        const giornateCalcolate = predictions.map(prediction => ({
            idgiornatecalcolate: `${prediction.id_league}_${dayId}`,
            calcolate: false,
            dayid:dayId,
            id_league: prediction.id_league,
        }));

        const { error: insertError } = await supabase
            .from('giornatecalcolate')
            .insert(giornateCalcolate, {
                onConflict: 'idgiornatecalcolate', // Specifica la colonna per gestire i conflitti
                ignoreDuplicates: true,           // Non aggiorna i record esistenti
        });
        if (insertError){
            console.log('giornateCalcolate',giornateCalcolate);
            console.error('Errore durante insert  giornateCalcolate ', insertError);
            res.status(500).send({ success: false, message: "Errore  durante insert giornateCalcolate " +insertError });
        }

        // Aggiorna il campo giornataAttuale
        await updateCurrentGiornata(noStep);

        res.status(200).send({ success: true, message: "Partite aggiornate con successo" });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento delle partite:', error);
        res.status(500).send({ success: false, message: "Errore durante l'aggiornamento delle partite" + error });
    }
});

exports.updateDateMatchSupa = functions
    .region('europe-west1')
    .runWith({ timeoutSeconds: 540, memory: '2GB' })
    .https.onRequest(async (req, res) => {
        functions.logger.info('START --> Updating Match Start Times');

        try {
            // Ottieni tutti i dati delle partite dalla API di football
            const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures`, {
                params: {
                    league: '135',
                    season: '2024',
                },
                headers: {
                    'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
                    'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
                },
            });

            const fixtures = response.data.response;
           // functions.logger.info('FIXTURES ->', fixtures);

            // Preparazione di una lista di aggiornamenti in bulk
            const updates = fixtures.map(match => ({
                matchid: match.fixture.id.toString(),
                starttime: moment.utc(match.fixture.date).tz("Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00')
            }));

            // Aggiornamento in bulk con upsert e conflict_target
            const { error } = await supabase.from('matches')
                .upsert(updates, { conflict_target: 'matchid' });

            if (error) {
                functions.logger.error('Errore durante l\'aggiornamento in bulk con upsert:', error);
                res.status(500).send({ success: false, message: "Errore durante l'aggiornamento in bulk con upsert" });
                return;
            }

            res.status(200).send({ success: true, message: "Orari di inizio dei match aggiornati con successo in bulk con upsert" });

        } catch (error) {
            functions.logger.error('Errore durante l\'aggiornamento degli orari di inizio dei match:', error);
            res.status(500).send({ success: false, message: "Errore durante l'aggiornamento degli orari di inizio dei match" });
        }
    });


async function scheduleJob(job) {
    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-scheduler', 'https://www.googleapis.com/auth/cloud-platform'],
        });

        const authClient = await auth.getClient();
        const scheduler = google.cloudscheduler('v1', { auth: authClient });

        await scheduler.projects.locations.jobs.create({
            parent: `projects/totocalcioreact/locations/us-central1`,
            requestBody: job,
            auth: authClient,
        });

        console.log(`Job creato con successo: ${job.name}`);
    } catch (error) {
        console.error('Errore durante la creazione del job:', error);
    }
}

async function updateCurrentGiornata(noStep) {
    if (noStep) {
        return;
    }

    const { data: giornataData, error: giornataError } = await supabase
        .from('giornataattuale')
        .select('giornataAttuale')
        .single();

    if (giornataError || !giornataData) {
        console.error('Errore nel recupero della giornata attuale:', giornataError);
        return;
    }

    const currentGiornataNumber = parseInt(giornataData.giornataAttuale.split('-')[1], 10);
    const updatedGiornataNumber = currentGiornataNumber + 1;
    const updatedGiornataAttuale = `RegularSeason-${updatedGiornataNumber}`;

    const { error: updateError } = await supabase
        .from('giornataattuale')
        .update({ giornataAttuale: updatedGiornataAttuale })
        .eq('giornataAttuale',giornataData.giornataAttuale);

    if (updateError) {
        console.error('Errore durante l\'aggiornamento della giornata attuale:', updateError);
        return;
    }

    console.log(`Giornata attuale aggiornata a: ${updatedGiornataAttuale}`);

    const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('starttime, matchid')
        .eq('dayid', updatedGiornataAttuale);

    if (matchesError) {
        console.error('Errore nel recupero delle partite per la nuova giornata:', matchesError);
        return;
    }

    const promises = matches.map(singleMatch => {
        const scheduleTime = moment(singleMatch.starttime).add(3, 'hours');

        const job = {
            name: `projects/totocalcioreact/locations/us-central1/jobs/Supa-update-Match-After-Finish-${singleMatch.matchid}`,
            schedule: `${scheduleTime.minutes()} ${scheduleTime.hours()} ${scheduleTime.date()} ${scheduleTime.month() + 1} *`,
            timeZone: 'Europe/Rome',
            httpTarget: {
                uri: `https://us-central1-totocalcioreact.cloudfunctions.net/updateSingleMatchIdSupa?matchId=${singleMatch.matchid}`,
                httpMethod: 'POST',
                headers: { 'Content-Type': 'application/json' },
            },
        };

        return scheduleJob(job);
    });

    await Promise.all(promises);
}

// Funzione per determinare il risultato
function determineResult(homeGoals, awayGoals,status) {

    if (homeGoals === null || awayGoals === null || status=="ABD" ) {
        return null; // Se uno dei due valori è null, restituisci una stringa vuota
    }
    if (homeGoals > awayGoals) return "1"; // Vittoria squadra di casa
    if (homeGoals < awayGoals) return "2"; // Vittoria squadra ospite
    if (homeGoals == awayGoals) return "X"; // Pareggio
    return null;//-> nel caso di partita rinviata
}

exports.scheduleDayUpdateTasks_Supa = functions
.runWith({ timeoutSeconds: 540, memory: '2GB' })
.https.onRequest(async (req, res) => {
console.log('START --> scheduleDayUpdateTasks SUPA');
const promises = [];

try {
    // Recupera tutte le giornate dal database Supabase
    const { data: days, error } = await supabase
    .from('days')
    .select('*');

    if (error) {
    console.error('Errore nel recupero delle giornate:', error);
    return res.status(500).send({ success: false, message: 'Errore nel recupero delle giornate' });
    }

    if (!days || days.length === 0) {
    return res.status(404).send({ success: false, message: 'Nessuna giornata trovata' });
    }

    const projectId = 'totocalcioreact'; // Usa l'ID del progetto Firebase
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-scheduler', 'https://www.googleapis.com/auth/cloud-platform'],
    });

    const authClient = await auth.getClient();
    const scheduler = google.cloudscheduler('v1', { auth: authClient });

    for (const day of days) {
        const dayId = day.dayid; // `dayid` è il nome corretto nella tabella Supabase

        // Recupera la startDate più lontana per il dayId dalla tabella matches
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('starttime')
            .eq('dayid', dayId)
            .order('starttime', { ascending: false })
            .limit(1)
            .single();

        if (matchError) {
            console.error(`Errore nel recupero della startDate per dayId ${dayId}:`, matchError);
            continue;
        }

        if (!match || !match.starttime) {
            console.log(`Nessuna starttime trovata per dayId ${dayId}`);
            continue;
        }

        const startDate = moment(match.starttime);
        const scheduleTime = startDate.add(3, 'hours');

        const scheduleMinute = scheduleTime.minutes();
        const scheduleHour = scheduleTime.hours();
        const scheduleDay = scheduleTime.date();
        const scheduleMonth = scheduleTime.month() + 1; // I mesi in Moment sono indicizzati da 0

        console.log('schedule->', `0 ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`);
        console.log('startDate->', startDate.format());
        console.log('scheduleTime->', scheduleTime.format());
        console.log('dayId ->', dayId);

        const job = {
            name: `projects/${projectId}/locations/us-central1/jobs/supa-update-matches-${dayId}`,
            schedule: `${scheduleMinute} ${scheduleHour} ${scheduleDay} ${scheduleMonth} *`, // Configura l'orario
            timeZone: 'Europe/Rome',
            httpTarget: {
            uri: `https://us-central1-${projectId}.cloudfunctions.net/updateMatchesSupa`,
            httpMethod: 'POST',
            body: Buffer.from(JSON.stringify({ dayId })).toString('base64'),
            headers: { 'Content-Type': 'application/json' },
            },
        };

        const promise = scheduler.projects.locations.jobs.create({
            parent: `projects/${projectId}/locations/us-central1`,
            requestBody: job,
            auth: authClient,
        });

            promises.push(promise);
    }

    await Promise.all(promises); // Aspetta che tutte le promesse siano risolte

    return res.status(200).send({ success: true, message: 'Tasks pianificati correttamente' });
} catch (error) {
    console.error('Errore durante la pianificazione dei task:', error);
    return res.status(500).send({ success: false, message: 'Errore durante la pianificazione dei task' });
}
});

exports.updateSingleMatchIdSupa = functions.https.onRequest(async (req, res) => {
    console.info('Start updateSingleMatchIdSupa');
    // Prendi il matchId dai query string parameters
    const { matchId } = req.query;

    if (!matchId) {
        console.error('Match ID non fornito.');
        return res.status(400).send('Match ID non fornito.');
    }

    const strMatchId = matchId.toString();
    console.info('updateSingleMatchIdSupa - matchId', strMatchId);

    try {
        // Chiamata all'API di football
        const response = await axios.get(`https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${strMatchId}`, {
            headers: {
                'x-rapidapi-key': 'db73c3daeamshce50eba84993c27p1ebcadjsnb14d87bc676d',
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
            },
        });

        // Verifica che la risposta contenga dati
        if (response.data && response.data.response && response.data.response.length > 0) {
            const matchData = response.data.response[0];
            const fulltimeScore = {
                home: matchData.goals.home,
                away: matchData.goals.away,
                status: matchData.fixture.status.short,
            };

            console.info('updateSingleMatchIdSupa - fulltimeScore', fulltimeScore);

            // Determina il risultato
            const result = determineResult(fulltimeScore.home, fulltimeScore.away, fulltimeScore.status);

            // Aggiorna la tabella matches in Supabase
            const { data, error } = await supabase
                .from('matches')
                .update({
                    result,
                    status: fulltimeScore.status,
                })
                .eq('matchid', strMatchId);

            if (error) {
                console.error('Errore durante l\'aggiornamento della tabella matches in Supabase', error);
                return res.status(500).send({ success: false, message: error });
            }

            console.info('Finish updateSingleMatchIdSupa');
            return res.status(200).send('Finish updateSingleMatchIdSupa successfully');
        } else {
            return res.status(500).send({ success: false, message: 'response vuota' });
        }
    } catch (error) {
        console.error('Error fetching match data or updating Supabase table', error);
        return res.status(500).send('Error fetching match data or updating Supabase table');
    }
});
