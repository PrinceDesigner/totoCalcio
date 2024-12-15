// functions/index.js
const functions = require("firebase-functions/v1");
const serviceAccount = require('./firebase-service-account.json');

exports.calcolaPuntiGiornata = functions.https.onCall(async (data, context) => {

    // Step di inizializzazione e verifica lock
    console.time("Inizializzazione e verifica lock");
    const { leagueId, dayId } = data;
    const documentId = `${leagueId}_${dayId}`;
    const lockRef = rtdb.ref(`locks/${leagueId}/${dayId}`);
    const lockSnapshot = await lockRef.once('value');
    const isLocked = lockSnapshot.exists() && lockSnapshot.val() === true;
    // Recupera il documento
    //controllo che per non sia già stata calcolata nel caso in cui abbiamo cancellato il lock
    let isCalculated = false;
    const collectionName = "giornateCalcolate";

    const calcoloGiornataQuery = firestore
        .collection(collectionName)
        .where('leagueId', '==', leagueId)
        .where('dayId', '==', dayId)
        .select('calcolate'); // Seleziona solo il campo `calcolate`

    const calcoloGiornataQuerySnapshot = await calcoloGiornataQuery.get(); // Esegui la query

    if (!calcoloGiornataQuerySnapshot.empty) {
        const giornataCalcolata = calcoloGiornataQuerySnapshot.docs[0].data(); // Ottieni i dati del primo documento
        isCalculated = giornataCalcolata.calcolate; // Ottieni il valore booleano `calcolate`
    }

    if (isLocked || isCalculated) {//aggiunta condizione in OR
        console.log("Il documento è già bloccato.");
        console.log("isCalculated " ,isCalculated);
        console.log("isLocked " , isLocked);
        return { success: false, message: "Giornata già calcolata" };
    }
    await lockRef.set(true); // Blocca il documento

    console.timeEnd("Inizializzazione e verifica lock");
    try {
        // Caricamento dei dati
        console.time("Caricamento dati (matches, predictions, leagueDoc)");
        const [matchesSnapshot, predictionsSnapshot, leagueDoc] = await Promise.all([
            firestore.collection('matches').where('dayId', '==', dayId).select('matchId', 'result').get(),
            firestore.collection('predictions').where('leagueId', '==', leagueId).where('daysId', '==', dayId).select('userId', 'schedina').get(),
            firestore.collection('leagues').doc(leagueId).get()
        ]);
        console.timeEnd("Caricamento dati (matches, predictions, leagueDoc)");

        // Creazione batch e calcolo punti
        console.time("Calcolo punti e creazione batch");
        const batchArray = [firestore.batch()];
        let batchIndex = 0;
        let batchCount = 0;
        const MAX_BATCH_SIZE = 499;

        const userPointsMap = {}; // Mappa per accumulare i punti degli utenti
        const matchesMap = new Map();
        matchesSnapshot.forEach(doc => {
            const data = doc.data();
            matchesMap.set(data.matchId, data.result);
        });

        predictionsSnapshot.forEach((predictionDoc) => {
            const predictionData = predictionDoc.data();
            let punti = 0;

            // Calcola i punti e aggiorna la schedina
            predictionData.schedina.forEach(prediction => {
                const matchResult = matchesMap.get(prediction.matchId);
                if (matchResult === prediction.esitoGiocato) {
                    punti += 1;
                }
                prediction.result = matchResult || null;
            });

            // Aggiungi i punti dell'utente alla mappa
            const userId = predictionData.userId;
            userPointsMap[userId] = (userPointsMap[userId] || 0) + punti;

            batchArray[batchIndex].update(predictionDoc.ref, { punti, schedina: predictionData.schedina });
            batchCount++;

            if (batchCount == MAX_BATCH_SIZE) {
                batchArray.push(firestore.batch());
                batchIndex++;
                batchCount = 0;
            }
        });
        console.timeEnd("Calcolo punti e creazione batch");

        // Preparazione aggiornamenti per leagueDoc e calcolateRef nell'ultimo batch
        const leagueData = leagueDoc.data();
        const updatedMembersInfo = leagueData.membersInfo.map(member => {
            if (userPointsMap[member.id]) {
                return {
                    ...member,
                    punti: (member.punti || 0) + userPointsMap[member.id]
                };
            }
            return member;
        });

        // Aggiungi gli aggiornamenti alla fine dell'ultimo batch
        batchIndex + 1//gli utilimi due update saranno posizionati nell'ultima posizione del batch
        batchArray[batchIndex].update(leagueDoc.ref, { membersInfo: updatedMembersInfo });
        batchArray[batchIndex].update(firestore.collection('giornateCalcolate').doc(documentId), { calcolate: true });

        // Commit di tutti i batch
        console.time("Commit batch");
        /*for (const batch of batchArray) {
            await batch.commit();
        }*/
        await Promise.all(batchArray.map(batch => batch.commit()));//fa più batch in parallelo - LIMITE 500 scritture per secondo
        console.timeEnd("Commit batch");

        console.timeEnd("Tempo totale calcolaPuntiGiornata");
        return { success: true, message: "Calcolo punti completato con successo." };

    } catch (error) {
        console.error(`Errore calcolaPuntiGiornata catch `, error);
        await lockRef.remove(); // Blocca il documento
    }
});