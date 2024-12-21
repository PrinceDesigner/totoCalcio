// functions/index.js
const functions = require("firebase-functions/v1");
const supabase     = require('./supaClient');
const { info,error, log } = require("firebase-functions/logger");
const { google }     = require('googleapis');

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
        if (leaguesError) throw leaguesError;

        const { data: predictions, error: predictionsError } = await supabase
            .from('predictions')
            .select('id_league')
            .eq('daysId', dayId);
        if (predictionsError) throw predictionsError;

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
                .eq('id', match.fixture.id);

            if (updateError) {
                error('Errore aggiornando match:', updateError);
            }
        }

        // Inserisci le previsioni nella tabella "giornateCalcolate"
        const giornateCalcolate = predictions.map(prediction => ({
            documentId: `${prediction.id_league}_${dayId}`,
            calcolate: false,
            dayId,
            id_league: prediction.id_league,
        }));

        const { error: insertError } = await supabase.from('giornateCalcolate').upsert(giornateCalcolate);
        if (insertError) throw insertError;

        // Aggiorna il campo giornataAttuale
        await updateCurrentGiornata(noStep);

        res.status(200).send({ success: true, message: "Partite aggiornate con successo" });
    } catch (error) {
        console.error('Errore durante l\'aggiornamento delle partite:', error);
        res.status(500).send({ success: false, message: "Errore durante l'aggiornamento delle partite" });
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
            functions.logger.info('FIXTURES ->', fixtures);

            // Preparazione di una lista di aggiornamenti in bulk
            const updates = fixtures.map(match => ({
                id: match.fixture.id.toString(),
                startTime: moment.utc(match.fixture.date).tz("Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00')
            }));

            // Aggiornamento in bulk con upsert e conflict_target
            const { error } = await supabaseClient.from('matches')
                .upsert(updates, { conflict_target: 'id' });

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
        .from('giornataAttuale')
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
        .from('giornataAttuale')
        .update({ giornataAttuale: updatedGiornataAttuale });

    if (updateError) {
        console.error('Errore durante l\'aggiornamento della giornata attuale:', updateError);
        return;
    }

    console.log(`Giornata attuale aggiornata a: ${updatedGiornataAttuale}`);

    const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('startTime, id')
        .eq('dayId', updatedGiornataAttuale);

    if (matchesError) {
        console.error('Errore nel recupero delle partite per la nuova giornata:', matchesError);
        return;
    }

    const promises = matches.map(singleMatch => {
        const scheduleTime = moment(singleMatch.startTime).add(30, 'minutes');

        const job = {
            name: `projects/totocalcioreact/locations/us-central1/jobs/update-Match-After-Finish-${singleMatch.id}`,
            schedule: `${scheduleTime.minutes()} ${scheduleTime.hours()} ${scheduleTime.date()} ${scheduleTime.month() + 1} *`,
            timeZone: 'Europe/Rome',
            httpTarget: {
                uri: `https://us-central1-totocalcioreact.cloudfunctions.net/updateSingleMatchId?matchId=${singleMatch.id}`,
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