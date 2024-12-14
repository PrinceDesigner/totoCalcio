const functions    = require('firebase-functions');
const admin        = require('firebase-admin');
const supabase     = require('./supaClient');
const {error,info} = require("firebase-functions/logger");

exports.migrationUser = functions.https.onRequest(async (req, res) => {
    try {
        info('Inizio migrazione dei user');

        // Estrarre tutti i dati da Firebase
        const usersSnapshot = await admin.firestore().collection('users').get();
        const usersData     = usersSnapshot.docs.map(doc => doc.data());

        // Mappare i dati sulla tabella Supabase
        const mappedData = usersData.map(user => ({
            userid:      user.uid,
            displayname: user.displayName,
            email:       user.email
        }));
        // Inserire o aggiornare i dati su Supabase
        const { data, errorSupaUser } = await supabase.from('users').upsert(mappedData);

        if (errorSupaUser) {
            res.status(500).send(`Supabase error: ${errorSupaUser.message}`);
            return;
        }
        info('Fine migrazione dei user');
        res.status(200).send('Migrazione completata con successo!');
    } catch (errorExc) {
        res.status(500).send(`Firebase error: ${errorExc.message}`);
    }
});

exports.onUserAdded = functions.firestore.document('users/{userId}').onCreate(async (snap, context) => {
    try {
    const newUser = snap.data();
    // Mappare i dati sulla tabella Supabase
    const mappedData = {
        userid:      newUser.uid,
        displayname: newUser.displayName,
        email:       newUser.email
    };
    info('Inizio migrazione dello user appena inserito ' , newUser.uid);

    // Inserire o aggiornare i dati su Supabase
    const { data, errorSupaUser } = await supabase.from('users').upsert([mappedData]);

    if (errorSupaUser) {
        error(`Supabase error: ${errorSupaUser.message}`);
        return;
    }

    info('Fine migrazione dello user appena inserito ' , newUser.uid);
    } catch (errorExc) {
        error(`Firebase error: ${errorExc.message}`);
    }
});

exports.onUserUpdated = functions.firestore.document('users/{userId}').onUpdate(async (change, context) => {
    try {
        const updatedUser = change.after.data();
        // Mappare i dati sulla tabella Supabase
        const mappedData = {
            userid:      updatedUser.uid,
            displayname: updatedUser.displayName,
            email:       updatedUser.email
        };
        info('Inzio Aggiormaneto dello user ',newUser.uid);


        // Aggiornare i dati su Supabase
        const { data, errorSupaUser } = await supabase.from('users').upsert([mappedData]);

        if (errorSupaUser) {
            error(`Supabase error: ${errorSupaUser.message}`);
            return;
        }

        info('Fine Aggiormaneto dello user ',newUser.uid);

    } catch (errorExc) {
        error(`Firebase error: ${errorExc.message}`);
    }
});

// Funzione di eliminazione
exports.onUserDeleted = functions.firestore.document('users/{userId}').onDelete(async (snap, context) => {
    try {
        const userId = snap.id;
        info('Inzio delete dello user ',userId);

        // Verificare se l'utente esiste in Supabase
        const { data: existingUser, error } = await supabase.from('users').select().eq('userid', userId);

        if (error) {
            error(`Supabase error: ${error.message}`);
            return;
        }

        if (existingUser.length > 0) {
            // Rimuovere l'utente da Supabase
            const { error: deleteError } = await supabase.from('users').delete().eq('userid', userId);

            if (deleteError) {
                error(`Errore eliminazione Supabase: ${deleteError.message}`);
                return;
            }

            info(`Fine delete dell' Utente rimosso da Supabase: ${userId}`);
        } else {
            info(`L'utente ${userId} non esiste in Supabase.`);
        }

    } catch (error) {
        error(`Errore durante la rimozione: ${error.message}`);
    }
});


