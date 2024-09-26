// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require('./firebase-service-account.json'); // Modifica il percorso se necessario

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://totocalcioreact-default-rtdb.europe-west1.firebasedatabase.app"
});

const db = admin.firestore();
const rtdb = admin.database();

// Funzione per calcolare i punti della giornata
exports.calcolaPuntiGiornata = functions.https.onCall(async (data, context) => {
    const { leagueId, dayId } = data;

    if (!leagueId || !dayId) {
        throw new functions.https.HttpsError('invalid-argument', 'League ID e Day ID sono richiesti.');
    }

    // Crea l'ID del documento basato su leagueId e dayId
    const documentId = `${leagueId}_${dayId}`;
    
    // Riferimento al documento specifico nella collection "giornateCalcolate"
    const calcolateRef = db.collection('giornateCalcolate').doc(documentId);
    const lockRef = rtdb.ref(`locks/${leagueId}/${dayId}`);

    try {
        // Controlla se esiste già un lock per questa lega e giornata
        const lockSnapshot = await lockRef.once('value');
        if (lockSnapshot.exists()) {
            return { success: false, message: "Il calcolo è già in corso per questa giornata e lega." };
        }

        // Verifica se la giornata è già stata calcolata
        const calcolateDoc = await calcolateRef.get();
        if (calcolateDoc.exists && calcolateDoc.data().calcolate) {
            return { success: false, message: "Questa giornata è già stata calcolata." };
        } else if (!calcolateDoc.exists) {
            return { success: false, message: "Questa giornata non esiste nella collection giornateCalcolate." };
        }

        // Imposta un lock
        await lockRef.set({ inProgress: true, timestamp: admin.database.ServerValue.TIMESTAMP });

        // Esegui il recupero dei dati in parallelo utilizzando Promise.all()
        const [matchesSnapshot, predictionsSnapshot, leagueDoc] = await Promise.all([
            db.collection('matches').where('dayId', '==', dayId).get(),
            db.collection('predictions').where('leagueId', '==', leagueId).where('daysId', '==', dayId).get(),
            db.collection('leagues').doc(leagueId).get()
        ]);

        if (matchesSnapshot.empty) {
            return { success: false, message: "Nessuna partita trovata per questa giornata." };
        }
        
        if (predictionsSnapshot.empty) {
            return { success: false, message: "Nessuna schedina trovata per questa giornata." };
        }

        if (!leagueDoc.exists) {
            return { success: false, message: "Lega non trovata." };
        }

        // Definisci leagueRef qui dopo aver ottenuto leagueDoc
        const leagueRef = db.collection('leagues').doc(leagueId);

        // Utilizza una mappa per una ricerca più efficiente dei match
        const matchesMap = new Map();
        matchesSnapshot.forEach(doc => {
            const data = doc.data();
            matchesMap.set(data.matchId, data.result);
        });

        let batchCount = 0;
        const MAX_BATCH_SIZE = 500;
        let currentBatch = db.batch();

        const userPointsMap = {}; // Mappa per mantenere i punti accumulati da ogni utente

        // Calcola i punti per ogni prediction
        predictionsSnapshot.forEach(async (predictionDoc) => {
            const predictionData = predictionDoc.data();
            let punti = 0;

            // Calcola i punti basati sugli esiti usando la mappa
            predictionData.schedina.forEach(prediction => {
                const matchResult = matchesMap.get(prediction.matchId);
                if (matchResult === prediction.esitoGiocato) {
                    punti += 1;
                }

                // Aggiorna il campo `result` nella schedina
                prediction.result = matchResult || null;
            });

            // Aggiungi i punti dell'utente alla mappa
            const userId = predictionData.userId;
            userPointsMap[userId] = (userPointsMap[userId] || 0) + punti;

            // Aggiorna i punti nella prediction
            currentBatch.update(predictionDoc.ref, { punti, schedina: predictionData.schedina });
            batchCount++;

            // Se raggiungi il limite, committa il batch e inizia un nuovo batch
            if (batchCount >= MAX_BATCH_SIZE) {
                await currentBatch.commit();  // Fai il commit del batch
                currentBatch = db.batch();    // Crea un nuovo batch
                batchCount = 0;               // Resetta il conteggio
            }
        });

        // Commit dell'ultimo batch, nel caso ci siano ancora operazioni non committate
        if (batchCount > 0) {
            await currentBatch.commit();
        }

        // Inizia un nuovo batch per aggiornare la lega e la giornata calcolata
        const finalBatch = db.batch();

        // Aggiorna i punti dei membri della lega
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
        finalBatch.update(leagueRef, { membersInfo: updatedMembersInfo });
        
        // Aggiorna la giornata calcolata nella collection "giornateCalcolate"
        finalBatch.update(calcolateRef, { calcolate: true });

        // Committa l'ultimo batch per l'aggiornamento dei membri e la giornata calcolata
        await finalBatch.commit();

        // Rimuovi il lock alla fine dell'operazione
        await lockRef.remove();

        return { success: true, message: "Calcolo punti completato con successo e punti aggiornati nella lega." };

    } catch (error) {
        console.error('Errore durante il calcolo dei punti:', error);

        // Assicurati di rimuovere il lock anche in caso di errore
        await lockRef.remove();

        throw new functions.https.HttpsError('internal', 'Errore durante il calcolo dei punti');
    }
});


