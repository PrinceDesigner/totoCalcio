const functions    = require('firebase-functions');
const admin        = require('firebase-admin');
const supabase     = require('./supaClient');
const {error,info} = require("firebase-functions/logger");

exports.migrationPredictionsAndSchedina = functions.https.onRequest(async (req, res) => {
    try {
        info("Inzio Migrazione completa Predictions & Schedina");

        // Estrarre tutti i dati da Firebase
        const predictionsSnapshot = await admin.firestore().collection('predictions').get();

        const predictionsData = predictionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Recuperare i dati esistenti su Supabase
        const currentPredictionsSnapshot = await supabase.from('predictions').select();
        const currentSchedinaSnapshot    = await supabase.from('schedina').select();
        const currentLeaguesSnapshot     = await supabase.from('leagues').select('id_league');

        const currentPredictions = currentPredictionsSnapshot.data || [];
        const currentSchedina    = currentSchedinaSnapshot.data    || [];
        const currentLeagues     = currentLeaguesSnapshot.data     || [];

        const updatedPredictions       = [];
        const updatedSchedina          = [];
        const predictionsWithoutLeague = [];

        // Mappare i dati sulla tabella Supabase
        for (const prediction of predictionsData) {
            const leagueExists = currentLeagues.some(league => league.id_league === prediction.leagueId);

            if (!leagueExists) {
                predictionsWithoutLeague.push(prediction.id);
                continue;
            }

            const existingPrediction = currentPredictions.find(p => p.predictionId === prediction.id);

            if (existingPrediction) {
                // Aggiornare solo se i dati sono cambiati
                if (existingPrediction.id_league !== prediction.leagueId ||
                    existingPrediction.dayid !== prediction.daysId ||
                    existingPrediction.userid !== prediction.userId) {
                    updatedPredictions.push({
                        id_league: prediction.leagueId,
                        dayid: prediction.daysId,
                        predictionid: prediction.id,
                        userid: prediction.userId,
                        punti: prediction.punti
                    });
                }
            } else {
                // Inserire nuove predizioni
                updatedPredictions.push({
                    id_league: prediction.leagueId,
                    dayid: prediction.daysId,
                    predictionid: prediction.id,
                    userid: prediction.userId,
                    punti: prediction.punti
                });
            }

            // Mappare le schedina correlate alla predizione
            const schedinaArray = prediction.schedina || [];
            for (const schedina of schedinaArray) {
                const existingSchedina = currentSchedina.find(s => s.prediction_id === prediction.id && s.matchid === schedina.matchId);

                if (!existingSchedina) {
                    updatedSchedina.push({
                        prediction_id: prediction.id,
                        matchid: schedina.matchId,
                        esitogiocato: schedina.esitoGiocato,
                        result: schedina.result

                    });
                }
            }
        }

        // Aggiornare o inserire le predizioni su Supabase
        if (updatedPredictions.length > 0) {
            const { errorSupaPrediction } = await supabase.from('predictions').upsert(updatedPredictions);

            if (errorSupaPrediction) {
                res.status(500).send(`Supabase error: ${errorSupaPrediction.message}`);
                return;
            }
        }

        // Aggiornare o inserire le schedina su Supabase
        if (updatedSchedina.length > 0) {
            const { errorSupaSchedina } = await supabase.from('schedina').upsert(updatedSchedina);

            if (errorSupaSchedina) {
                res.status(500).send(`Supabase error: ${errorSupaSchedina.message}`);
                return;
            }
        }

        info("Fine Migrazione completa Predictions & Schedina");

        res.status(200).send({ predictionsWithoutLeague, updatedPredictions });
    } catch (errorExc) {
        res.status(500).send(`Errore: ${errorExc.message}`);
    }
});
/*
exports.migratePredictionsAndSchedina = functions.firestore.document('predictions/{predictionId}').onCreate(async (snap, context) => {
    try {
        const prediction    = snap.data();
        const leagueId      = prediction.leagueId;
        const predictionId  = snap.id;
        const userId        = prediction.userId;
        const schedinaArray = prediction.schedina || [];

        info(`Inzio Predictions & Schedina appena inserita ${predictionId}`);

        // Verifica della validità del dato
        if (!leagueId || !userId) {
            error('Dati incompleti per la predizione.');
            return;
        }

        // Mappare i dati sulla tabella `predictions` di Supabase
        const predictionToInsert = {
            id_league: leagueId,
            dayid: prediction.leagueId,
            predictionid: predictionId,
            userid: userId
        };

        // Inserire o aggiornare la predizione su Supabase
        const { error: predictionError } = await supabase.from('predictions').upsert([predictionToInsert]);

        if (predictionError) {
            error(`Errore aggiornamento/inserimento tabella predictions: ${predictionError.message}`);
            return;
        }

        info(`Predizione aggiornata/inserita per id_league: ${leagueId}, predictionId: ${predictionId}`);

        // Gestire la migrazione di schedina
        const schedinaData = schedinaArray.map(schedina => ({
            predictionid: predictionId,
            matchid: schedina.matchId,
            userid: userId,
            esitogiocato: schedina.esitoGiocato,
            result: schedina.result,
            punti_schedina: prediction.punti
        }));

        // Inserire o aggiornare le schedina su Supabase
        const { error: schedinaError } = await supabase.from('schedina').upsert(schedinaData);

        if (schedinaError) {
            error(`Errore aggiornamento/inserimento tabella schedina: ${schedinaError.message}`);
            return;
        }

        info(`Fine Inserimento - Schedina aggiornata/inserita per predictionId: ${predictionId}`);

    } catch (errorExc) {
        error(`Errore durante la migrazione: ${errorExc.message}`);
    }
});

exports.updateExistingPredictionsAndSchedina = functions.firestore.document('predictions/{predictionId}').onUpdate(async (change, context) => {
    try {
        const updatedPrediction = change.after.data();
        const leagueId          = updatedPrediction.leagueId;
        const predictionId      = change.after.id;
        const userId            = updatedPrediction.userId;
        const schedinaArray     = updatedPrediction.schedina || [];

        info(`Inzio aggiornamento Predizione ${predictionId}`);

        // Aggiornare i dati nella tabella `predictions` di Supabase
        const predictionToUpdate = {
            id_league: leagueId,
            dayid: updatedPrediction.leagueId,
            predictionid: predictionId,
            userid: userId
        };

        const { error: predictionUpdateError } = await supabase.from('predictions').upsert([predictionToUpdate]);

        if (predictionUpdateError) {
            error(`Errore aggiornamento tabella predictions: ${predictionUpdateError.message}`);
            return;
        }

        info(`Predizione aggiornata per id_league: ${leagueId}, predictionId: ${predictionId}`);

        // Aggiornare o inserire schedina
        const currentSchedinaSnapshot = await supabase.from('schedina')
            .select()
            .eq('predictionid', predictionId);

        const currentSchedina = currentSchedinaSnapshot.data || [];

        const updatedSchedina = [];

        for (const schedina of schedinaArray) {
            const existingSchedina = currentSchedina.find(s => s.matchid === schedina.matchId);

            if (existingSchedina) {
                // Aggiorna solo se i dati sono cambiati
                if (existingSchedina.esitogiocato !== schedina.esitoGiocato || existingSchedina.result !== schedina.result) {
                    updatedSchedina.push({
                        prediction_id: predictionId,
                        matchid: schedina.matchId,
                        userid: userId,
                        esitogiocato: schedina.esitoGiocato,
                        result: schedina.result,
                        punti_schedina: updatedPrediction.punti
                    });
                }
            }
        }

        // Aggiornare le schedina su Supabase solo se sono state modificate
        if (updatedSchedina.length > 0) {
            const { error: schedinaUpdateError } = await supabase.from('schedina').upsert(updatedSchedina);

            if (schedinaUpdateError) {
                error(`Errore aggiornamento tabella schedina: ${schedinaUpdateError.message}`);
                return;
            }

            info(`Fine  - Schedina aggiornata per predictionId: ${predictionId}`);
        } else {
            info('Fine - Nessuna schedina da aggiornare.');
        }

    } catch (errorExc) {
        error(`Errore durante l'aggiornamento: ${errorExc.message}`);
    }
});*/
