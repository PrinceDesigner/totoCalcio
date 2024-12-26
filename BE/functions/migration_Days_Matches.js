const functions    = require('firebase-functions');
const admin        = require('firebase-admin');
const supabase     = require('./supaClient');
const {error,info} = require("firebase-functions/logger");

exports.migrateDaysAndMatches = functions.https.onRequest(async (req, res) => {
    try {
        info('Inizio migrazione dei giorni e dei match.');

        // 1. Estrarre tutti i documenti dalla collezione `days`
        const daysSnapshot = await admin.firestore().collection('days').get();
        if (daysSnapshot.empty) {
            res.status(404).send('Nessun giorno trovato nella collezione days.');
            return;
        }

        // 2. Iterare sui giorni per inserirli e raccogliere gli ID dei match
        const matchesMap = new Map(); // Mappa dayId -> array di matchId
        const daysToInsert = [];

        daysSnapshot.forEach(doc => {
            const dayData = doc.data();
            const dayId = doc.id;

            // Creazione record `days` per Supabase
            daysToInsert.push({
                dayid: dayId,
                daynumber: dayData.dayNumber,
                iscurrentday: dayData.isCurrentDay,
            });

            // Mappare gli ID dei match associati al giorno
            if (Array.isArray(dayData.matches) && dayData.matches.length > 0) {
                matchesMap.set(dayId, dayData.matches);
            }
        });

        // Inserire tutti i giorni nella tabella `days` su Supabase
        const { error: daysError } = await supabase.from('days').upsert(daysToInsert);
        if (daysError) {
            error(`Errore durante l'inserimento dei giorni su Supabase: ${daysError.message}`);
            res.status(500).send(`Errore durante l'inserimento dei giorni su Supabase: ${daysError.message}`);
            return;
        }

        info(`Inseriti ${daysToInsert.length} giorni su Supabase.`);

        // 3. Estrarre e inserire i match per ciascun giorno
        for (const [dayId, matchIds] of matchesMap.entries()) {
            info(`Inizio elaborazione match per il giorno ${dayId}: ${matchIds}`);

            // Query batch per recuperare i dettagli dei match
            const matchesQuerySnapshot = await admin.firestore()
                .collection('matches')
                .where('dayId', '==', dayId)
                .get();

            if (matchesQuerySnapshot.empty) {
                info(`Nessun dettaglio match trovato per il giorno ${dayId}`);
                continue;
            }

            const matchesToInsert = matchesQuerySnapshot.docs.map(doc => {
                const matchData = doc.data();
                return {
                    matchid: doc.id,
                    awaylogo: matchData.awayLogo,
                    awayteam: matchData.awayTeam,
                    dayid: dayId, // Collegamento con la tabella `days`
                    homelogo: matchData.homeLogo,
                    hometeam: matchData.homeTeam,
                    result: matchData.result,
                    stadio: matchData.stadio,
                    starttime: matchData.startTime,
                };
            });

            // Inserire i match nella tabella `matches` su Supabase
            const { error: matchesError } = await supabase.from('matches').upsert(matchesToInsert);
            if (matchesError) {
                error(`Errore durante l'inserimento dei match per il giorno ${dayId}: ${matchesError.message}`);
                continue;
            }

            info(`Inseriti ${matchesToInsert.length} match per il giorno ${dayId} su Supabase.`);
        }

        res.status(200).send('Migrazione completata con successo.');
    } catch (errorExc) {
        error('Errore durante la migrazione completa:', errorExc.message);
        res.status(500).send(`Errore durante la migrazione: ${errorExc.message}`);
    }
});
/*
exports.onDayUpdated = functions.firestore.document('days/{dayId}').onUpdate(async (change, context) => {
    try {
        const updatedDay = change.after.data();
        const dayid = updatedDay.dayId;

        // Aggiorna la tabella `days`
        const dayToUpdate = {
            dayid,
            daynumber: updatedDay.dayNumber,
            iscurrentday: updatedDay.isCurrentDay
        };

        const { error: dayUpdateError } = await supabase.from('days').upsert([dayToUpdate]);

        if (dayUpdateError) {
            error(`Errore aggiornamento tabella days: ${dayUpdateError.message}`);
            return;
        }

        info('Tabella days aggiornata con successo.');

    } catch (errorExc) {
        error(`Errore durante l'aggiornamento: ${errorExc.message}`);
    }
});

exports.onMatchUpdated = functions.firestore.document('matches/{matchId}').onUpdate(async (change, context) => {
    try {
        const updatedMatch = change.after.data();
        info(updatedMatch);

        // Mappare i dati sulla tabella Supabase
        const mappedData = {
            matchid: context.params.matchId,
            awaylogo: updatedMatch.awayLogo,
            awayteam: updatedMatch.awayTeam,
            dayid: updatedMatch.dayId,
            homelogo: updatedMatch.homeLogo,
            hometeam: updatedMatch.homeTeam,
            result: updatedMatch.result,
            stadio: updatedMatch.stadio,
            starttime: updatedMatch.startTime,
        };

        // Aggiornare i dati su Supabase
        const { data, error } = await supabase.from('matches').upsert([mappedData]);

        if (errorSupa) {
            error(`Supabase error: ${errorSupa.message}`);
            return;
        }

        info('Match successfully updated in Supabase:', data);

    } catch (errorExc) {
        error(`Firebase error: ${errorExc.message}`);
    }
});*/

