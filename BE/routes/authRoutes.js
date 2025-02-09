const express = require('express');
const router = express.Router();
const supabase = require('../superBaseConnect');

async function insert_user(uuid, displayName, email) {
    const { data, error } = await supabase
        .rpc('insert_user', { p_uid: uuid, p_displayname: displayName, p_email: email });

    if (error) {
        console.error('Errore durante l\'inserimento dell\'utente:', error);
        throw new Error('Errore durante l\'inserimento dell\'utente nel database');
    }

    return data; // Restituisci i dati per eventuali usi futuri
}

router.post('/signup', async (req, res) => {
    const { email, id, displayName } = req.body;

    // Validazione dell'input
    if (!email || !id || !displayName) {
        return res.status(400).json({ errore: 'Tutti i campi (email, id, displayName) sono obbligatori' });
    }

    try {
        const result = await insert_user(id, displayName, email);
        return res.status(200).json({ messaggio: 'Utente inserito con successo', dati: result });
    } catch (error) {
        console.error('Errore durante la registrazione:', error.message);
        return res.status(500).json({ errore: 'Si è verificato un errore durante la registrazione dell\'utente. Riprova più tardi.' });
    }
});

module.exports = router;
