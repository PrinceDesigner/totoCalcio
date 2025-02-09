const functions    = require('firebase-functions');
const admin        = require('firebase-admin');
const supabase     = require('./supaClient');
const {error,info} = require("firebase-functions/logger");

exports.migrateGiornateCalcolate = functions.https.onRequest(async (req, res) => {
    try {
        info("Inzio Migrazione completa giornate calcolate");
        // Recupera i dati dalla collezione Firebase `giornateCalcolate`
        const snapshot = await admin.firestore().collection("giornateCalcolate").get();
        if (snapshot.empty) {
            res.status(404).send("Nessuna giornata calcolata trovata in Firebase.");
            return;
        }

        // Prepara i dati per la migrazione a Supabase
        const giornateCalcolateData = [];
        const invalidLeagues        = [];
        const validLeaguesSet       = new Set();

        // Recupera l'elenco di tutte le `id_league` dalla tabella `leagues` di Supabase
        const { data: leagues, error: leaguesError } = await supabase.from("leagues").select("id_league");

        if (leaguesError) {
            error(`Errore durante il recupero delle leghe da Supabase: ${leaguesError.message}`);
            res.status(500).send(`Errore durante il recupero delle leghe: ${leaguesError.message}`);
            return;
        }

        // Crea un Set per rapida verifica delle leghe valide
        leagues.forEach(league => validLeaguesSet.add(league.id_league));

        snapshot.forEach(doc => {
            const data      = doc.data();
            const leagueId  = data.leagueId;
            const dayId     = data.dayId;
            const calcolate = data.calcolate || false; // Default a `false` se non definito

            if (!validLeaguesSet.has(leagueId)) {
                invalidLeagues.push(leagueId);
                return; // Salta questa giornata calcolata
            }

            // Crea la riga da inserire in Supabase
            const row = {
                id_league: leagueId,
                dayid: dayId,
                calcolate: calcolate,
                idgiornatecalcolate: `${leagueId}_${dayId}` // Concatenazione di leagueId e dayId
            };
            giornateCalcolateData.push(row);
        });

        if (giornateCalcolateData.length === 0) {
            res.status(400).send("Nessuna giornata valida trovata per la migrazione.");
            return;
        }

        // Inserisci o aggiorna i dati validi nella tabella `giornatecalcolate` di Supabase
        const { errorSupa } = await supabase.from("giornatecalcolate").upsert(giornateCalcolateData);

        if (errorSupa) {
            error(`Errore durante la migrazione a Supabase: ${errorSupa.message}`);
            res.status(500).send(`Errore durante la migrazione: ${errorSupa.message}`);
            return;
        }

        info("FINE giornate Calcolate - Dati migrati con successo:", giornateCalcolateData);

        // Invia la risposta con i dettagli della migrazione e delle leghe non valide
        res.status(200).send({
            message: "Migrazione completata con successo!",
            migratedRecords: giornateCalcolateData.length,
            invalidLeagues: [...new Set(invalidLeagues)] // Rimuove eventuali duplicati
        });
    } catch (errorExc) {
        error("Errore durante la migrazione:", errorExc.message);
        res.status(500).send(`Errore durante la migrazione: ${errorExc.message}`);
    }
});

/* non servono
exports.syncGiornateCalcolateOnCreate = functions.firestore
    .document("giornateCalcolate/{giornataId}")
    .onCreate(async (snap, context) => {
        try {
            info(`Inizio Migrazione della giornataCalcolata appena inserita ${leagueId}_${dayId}`);
            const data = snap.data();
            const leagueId = data.leagueId;
            const dayId = data.dayId;
            const calcolate = data.calcolate || false; // Default a `false`

            const rowToInsert = {
                id_league: leagueId,
                dayid: dayId,
                calcolate: calcolate,
                idgiornatecalcolate: `${leagueId}_${dayId}` // Concatenazione di leagueId e dayId
            };

            const { error } = await supabase.from("giornatecalcolate").upsert([rowToInsert]);

            if (error) {
                error(`Errore durante l'inserimento in Supabase: ${error.message}`);
                return;
            }

            info(`Fine Migrazione della giornataCalcolata appena inserita ${leagueId}_${dayId}`);
        } catch (errorExc) {
            error(`Errore durante il trigger onCreate: ${errorExc.message}`);
        }
    });

exports.syncGiornateCalcolateOnUpdate = functions.firestore
    .document("giornateCalcolate/{giornataId}")
    .onUpdate(async (change, context) => {
        try {
            info(`inzio aggiornamenot della giornataCalcolata ${leagueId}_${dayId}`);

            const newData = change.after.data();
            const leagueId = newData.leagueId;
            const dayId = newData.dayId;
            const calcolate = newData.calcolate || false;

            const rowToUpdate = {
                id_league: leagueId,
                dayid: dayId,
                calcolate: calcolate,
                idgiornatecalcolate: `${leagueId}_${dayId}` // Concatenazione di leagueId e dayId
            };

            const { errorSupa } = await supabase.from("giornatecalcolate").upsert([rowToUpdate]);

            if (errorSupa) {
                error(`Errore durante l'aggiornamento in Supabase: ${errorSupa.message}`);
                return;
            }

            info(`Fine aggiornamenot della giornataCalcolata ${leagueId}_${dayId}`);
        } catch (errorExc) {
            error(`Errore durante il trigger onUpdate: ${errorExc.message}`);
        }
    });*/