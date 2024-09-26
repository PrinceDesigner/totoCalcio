// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require('./firebase-service-account.json'); // Modifica il percorso se necessario

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://totocalcioreact.firebaseio.com"
});

const db = admin.firestore();

// Funzione per calcolare i punti della giornata
exports.calcolaPuntiGiornata = functions.https.onCall(async (data, context) => {
    const { leagueId, dayId } = data;

    if (!leagueId || !dayId) {
        throw new functions.https.HttpsError('invalid-argument', 'League ID e Day ID sono richiesti.');
    }

    try {
        // Recupera tutte le partite per il dayId
        const matchesSnapshot = await db.collection('matches')
            .where('dayId', '==', dayId)
            .get();

        if (matchesSnapshot.empty) {
            return { success: false, message: "Nessuna partita trovata per questa giornata." };
        }

        const matches = [];
        matchesSnapshot.forEach(doc => {
            matches.push({ id: doc.id, ...doc.data() });
        });

        // Recupera tutte le predictions per la leagueId e il dayId
        const predictionsSnapshot = await db.collection('predictions')
            .where('leagueId', '==', leagueId)
            .where('daysId', '==', dayId)
            .get();

        if (predictionsSnapshot.empty) {
            return { success: false, message: "Nessuna schedina trovata per questa giornata." };
        }

        const batch = db.batch();

        const userPointsMap = {}; // Mappa per mantenere i punti accumulati da ogni utente

        predictionsSnapshot.forEach((predictionDoc) => {
            const predictionData = predictionDoc.data();
            let punti = 0;

            // Calcola i punti basati sugli esiti
            predictionData.schedina.forEach(prediction => {
                const match = matches.find(m => m.matchId === prediction.matchId);
                if (match && match.result === prediction.esitoGiocato) {
                    punti += 1;
                }

                // Aggiorna anche il campo `result` nella schedina
                prediction.result = match ? match.result : null;
            });

            // Aggiungi i punti dell'utente alla mappa
            const userId = predictionData.userId;
            if (userPointsMap[userId]) {
                userPointsMap[userId] += punti;
            } else {
                userPointsMap[userId] = punti;
            }

            // Aggiorna i punti nella prediction
            batch.update(predictionDoc.ref, { punti, schedina: predictionData.schedina });
        });

        // Recupera la lega per aggiornare i membri
        const leagueRef = db.collection('leagues').doc(leagueId);
        const leagueDoc = await leagueRef.get();

        if (!leagueDoc.exists) {
            return { success: false, message: "Lega non trovata." };
        }

        const leagueData = leagueDoc.data();
        const updatedMembersInfo = leagueData.membersInfo.map(member => {
            if (userPointsMap[member.id]) {
                return {
                    ...member,
                    punti: (member.punti || 0) + userPointsMap[member.id] // Incrementa i punti
                };
            }
            return member;
        });

        // Aggiorna la tabella leagues con i nuovi punti
        batch.update(leagueRef, { membersInfo: updatedMembersInfo });

        // Committa la transazione
        await batch.commit();

        return { success: true, message: "Calcolo punti completato con successo e punti aggiornati nella lega." };
    } catch (error) {
        console.error('Errore durante il calcolo dei punti:', error);
        throw new functions.https.HttpsError('internal', 'Errore durante il calcolo dei punti');
    }
});

