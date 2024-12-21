const functions      = require("firebase-functions/v1");
const supabase     = require('./supaClient');
const { info,error, log } = require("firebase-functions/logger");

exports.sendWeeklyNotificationSupa = functions.https.onRequest(async (req, res) => {
    info('Start sendWeeklyNotificationSupa');

    let body = '';
    let title = '';
    try {
        // Recupera il record della notifica da Supabase
        const { data: notificheQ, error: notificheErr } = await supabase
            .from('notifiche')
            .select('body, title')
            .limit(1);

        if (notificheErr || notificheQ.length === 0) {
            error('Errore o nessuna notifica trovata in Supabase:', notificheErr);
            return res.status(404).json({
                message: 'Nessuna notifica trovata in tabella',
            });
        }

        const row = notificheQ[0];
        body = row.body;
        title = row.title;
        info('Body:', body, 'Title:', title);

        // Recupera tutti i token dalla collezione 'users' (selezionando solo il campo 'tokenNotification')
        const tokensSnapshot = await supabase
            .from('users')
            .select('tokenNotification');

        const tokens = tokensSnapshot.data.map(row => row.tokenNotification).filter(token => token);

        if (tokens.length === 0) {
            info('Nessun token trovato per inviare notifiche.');
            return res.status(200).send('Nessun token trovato.');
        }

        // Messaggio delle notifiche
        const message = {
            title: title,
            body: body,
        };

        // Invia le notifiche utilizzando Expo
        const Expo = require('expo-server-sdk').default;
        const expo = new Expo();

        // Crea messaggi per ogni token
        const messages = tokens.map(token => {
            if (!Expo.isExpoPushToken(token)) {
                warn(`Token non valido: ${token}`);
                return null; // Ignora token non validi
            }
            return {
                to: token,
                sound: 'default',
                title: message.title,
                body: message.body,
            };
        }).filter(msg => msg !== null); // Filtra i messaggi nulli

        // Invia le notifiche in batch (max 100 notifiche per batch)
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk); // Invio batch
                tickets.push(...ticketChunk); // Aggiungi i ticket al risultato totale
                functions.logger.info('Batch inviato con successo:', ticketChunk);
            } catch (error) {
                functions.logger.error('Errore durante l\'invio del batch:', error);
            }
        }

        // Log dei ticket
        info('Tutti i ticket:', tickets);

        // Rispondi al client con successo
        return res.status(200).send(`Notifiche inviate con successo a ${tokens.length} utenti!`);
    } catch (error) {
        // Gestione degli errori
        error(`Errore nell'invio delle notifiche: ${error.message}`);
        return res.status(500).send(`Errore nell'invio delle notifiche: ${error.message}`);
    }
});

