// functions/index.js
const functions = require("firebase-functions/v1");
const supabase     = require('./supaClient');
const { info,error, log } = require("firebase-functions/logger");

exports.calcolaPuntiGiornataTest = functions.https.onCall(async (data, context) => {
    info('inizio calcolo giornata ');
    // Step di inizializzazione e verifica lock
    const { leagueId, dayId } = data;
    const idGiornataCalcolata = `${leagueId}_${dayId}`;

    // Lock della riga calcolgiornata per evitare concorrenza
    info('inizio calcolo giornata ', idGiornataCalcolata);
    try {
        const lockStatus = await supabase.rpc('lock_record', { id: idGiornataCalcolata});
        if (lockStatus.data.status === 'in_progress') {
            info('Il calcolo è in corso');
            //context.send('calcolo in corso');
            return { success: false, message: 'Il calcolo è in corso' };
        } else if (lockStatus.data.status === 'completed') {
            info('Giornata già calcolata');
            //context.send('Giornata già calcolata');
            return { success: false, message: 'Giornata già calcolata' };
        }
    } catch (errorExc) {
        error('ERRORE ***** imprevisto per la lega ', idGiornataCalcolata);
        //context.send('Giornata già calcolata',errorExc);
        return { success: false, message: 'Errore imprevisto' };
    }

    try {
        // Recupera tutti i membri della lega
        const membersSnapshot = await supabase
            .from('members_info')
            .select('userid, punti, id_members,id_league')
            .eq('id_league', leagueId);
        // Recupero match
        info('Start - recupero Match ');
        const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select('matchid, result')
            .eq('dayid', dayId);

        if (matchesError) {
            const messageErr = `Errore imprevisto durante il calcolo - LeagueId: ${leagueId}`;
            error(messageErr);
            return { success: false, message: messageErr };
        }

        const matchesMap = new Map();
        matchesData.forEach(match => {
            matchesMap.set(match.matchid, match.result);
        });
        info('Fine - recupero Match');

        // Creazione della mappa dei risultati delle partite
        info('Start - costruzione struttura prediction, mappa predictionid, schedina');
        const predSchedina = await getPredictionsForLeagueAndMatch(leagueId, dayId);
        const schedina = predSchedina.schedina;
        const predictions = predSchedina.predictions;
        const predictionIds = predictions.map(prediction => prediction.predictionid);
        info('Fine  - costruzione struttura prediction, mappa predictionid, schedina ');

        // Ciclo su schedinaMap
        const userPointsMap = new Map(); // Mappa per accumulare i punti degli utenti
        const schedinaUpdate = []; // Array JSON che contiene i dati aggiornati della schedina
        const predictionUpdate = [];

        schedina.forEach(row => {
            let punti = 0;
            let predictionId;
            row.forEach(entry => {
                const { matchid, esitogiocato, prediction_id} = entry;
                const matchResult = matchesMap.get(matchid);
                if (matchResult === esitogiocato) {
                    punti += 1;
                }
                // Aggiorna il risultato nella schedina
                entry.result = matchResult || null;
                // Aggiungi la riga aggiornata all'array schedinaUpdate
                schedinaUpdate.push({
                    schedina_id:  entry.schedina_id,
                    matchid: entry.matchid,
                    result: matchResult,
                    esitogiocato: entry.esitogiocato
                });
                predictionId = prediction_id;

            });
            const userId = predictions.find(pred => pred.predictionid === predictionId)?.userid;
            if (!userPointsMap.has(userId)) {
                userPointsMap.set(userId,punti);
            }
            //con questa struttura farò update delle predicton
            predictionUpdate.push({
                punti:punti,
                predictionid:predictionId
            })
        });
        // Update schedina
        const { data: scedinaUpdData, error: schedinaUpdErr } =  await supabase
            .from('schedina')
            .upsert(schedinaUpdate,{conflict_target: 'schedina_id'})
            .in('prediction_id', predictionIds); // Aggiornato per specificare la lega

        if (schedinaUpdErr) {
            error('schedinaUpdErr in errore');
            //context.send(schedinaUpdErr);
            return { success: false, message: schedinaUpdErr.message };
        }
        //Update schedina

        //update prediction
        const { data: predictionUpdData, error: predictionUpdErr } = await supabase
            .from('predictions')
            .upsert(predictionUpdate,{conflict_target: 'predictionid'})
            .eq('id_league', leagueId);
        if (predictionUpdErr) {
            error('predictionUpdErr in errore');
            //context.send(predictionUpdErr);
            return { success: false, message: predictionUpdErr.message };
        }
        //update prediction

        // Funzione per aggiornare i punti dei membri
        const updateUserPoints = async (members, userPointsMap, leagueId) => {
            const updatesMemeberInfo = [];

            for (const { userid, punti, id_members,id_league } of members) {
                const currentPoints = userPointsMap.get(userid) || 0;
                log('userid ','userid');
                log('currentPoints',currentPoints);
                const updatedPoints = currentPoints + punti;

                updatesMemeberInfo.push({
                    punti: updatedPoints,
                    userid: userid,
                    id_league,
                    id_members
                });
            }

            const { data: membersInfoData, error: membersInfoError } = await supabase
                .from('members_info')
                .upsert(updatesMemeberInfo,{conflict_target: 'userid'})
                .eq('id_league', leagueId); // Aggiornato per specificare la lega

            if (membersInfoError) {
                error('membersInfoError in errore');
                return { success: false, message: membersInfoError.message };
            }
            return { success: true, message: "Punti aggiornati correttamente." };
        };

        if (membersSnapshot.data) {
            await updateUserPoints(membersSnapshot.data, userPointsMap, leagueId);
        }

        await supabase.rpc('update_calcolata_flag', { id: idGiornataCalcolata });

        //context.send('aggiornamento fatto');
        return { success: true, message: "Calcolo punti completato con successo." };

    } catch (error) {
        console.error(`Errore calcolaPuntiGiornata catch `, error);
        return { success: false, message: 'Errore imprevisto' };
    }
});

exports.calcolaPuntiGiornataTest2 = functions.https.onRequest(async (data, context) => {
    info('inizio calcolo giornata ');
    // Step di inizializzazione e verifica lock
    const { leagueId, dayId } = data.body;
    const idGiornataCalcolata = `${leagueId}_${dayId}`;

    // Lock della riga calcolgiornata per evitare concorrenza
    info('inizio calcolo giornata ', idGiornataCalcolata);
    try {
        const lockStatus = await supabase.rpc('lock_record', { id: idGiornataCalcolata});
        if (lockStatus.data.status === 'in_progress') {
            info('Il calcolo è in corso');
            context.send('calcolo in corso');
            return { success: false, message: lockStatus.message };
        } else if (lockStatus.data.status === 'completed') {
            info('Giornata già calcolata');
            context.send('Giornata già calcolata');
            return { success: false, message: lockStatus.message };
        }
    } catch (errorExc) {
        error('ERRORE ***** imprevisto per la lega ', idGiornataCalcolata);
        context.send('Giornata già calcolata',errorExc);
        return { success: false, message: 'Errore imprevisto' };
    }

    try {
        // Recupera tutti i membri della lega
        const membersSnapshot = await supabase
            .from('members_info')
            .select('userid, punti, id_members,id_league')
            .eq('id_league', leagueId);
        // Recupero match
        info('Start - recupero Match ');
        const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select('matchid, result')
            .eq('dayid', dayId);

        if (matchesError) {
            const messageErr = `Errore imprevisto durante il calcolo - LeagueId: ${leagueId}`;
            error(messageErr);
            return { success: false, message: messageErr };
        }

        const matchesMap = new Map();
        matchesData.forEach(match => {
            matchesMap.set(match.matchid, match.result);
        });
        info('Fine - recupero Match');

        // Creazione della mappa dei risultati delle partite
        info('Start - costruzione struttura prediction, mappa predictionid, schedina');
        const predSchedina = await getPredictionsForLeagueAndMatch(leagueId, dayId);
        const schedina = predSchedina.schedina;
        const predictions = predSchedina.predictions;
        const predictionIds = predictions.map(prediction => prediction.predictionid);
        info('Fine  - costruzione struttura prediction, mappa predictionid, schedina ');

        // Ciclo su schedinaMap
        const userPointsMap = new Map(); // Mappa per accumulare i punti degli utenti
        const schedinaUpdate = []; // Array JSON che contiene i dati aggiornati della schedina
        const predictionUpdate = [];

        schedina.forEach(row => {
            let punti = 0;
            let predictionId;
            row.forEach(entry => {
                const { matchid, esitogiocato, prediction_id} = entry;
                const matchResult = matchesMap.get(matchid);
                if (matchResult === esitogiocato) {
                    punti += 1;
                }
                // Aggiorna il risultato nella schedina
                entry.result = matchResult || null;
                // Aggiungi la riga aggiornata all'array schedinaUpdate
                schedinaUpdate.push({
                    schedina_id:  entry.schedina_id,
                    matchid: entry.matchid,
                    result: matchResult,
                    esitogiocato: entry.esitogiocato
                });
                predictionId = prediction_id;

            });
            const userId = predictions.find(pred => pred.predictionid === predictionId)?.userid;
            if (!userPointsMap.has(userId)) {
                userPointsMap.set(userId,punti);
            }
            //con questa struttura farò update delle predicton
            predictionUpdate.push({
                punti:punti,
                predictionid:predictionId
            })
        });
        log('predictionUpdate',predictionUpdate)
        log('schedinaUpdate',schedinaUpdate)

        // Update schedina
        const { data: scedinaUpdData, error: schedinaUpdErr } =  await supabase
            .from('schedina')
            .upsert(schedinaUpdate,{conflict_target: 'schedina_id'})
            .in('prediction_id', predictionIds); // Aggiornato per specificare la lega

        if (schedinaUpdErr) {
            error('schedinaUpdErr in errore');
            //context.send(schedinaUpdErr);
            return { success: false, message: schedinaUpdErr.message };
        }
        //Update schedina

        //update prediction
        const { data: predictionUpdData, error: predictionUpdErr } = await supabase
            .from('predictions')
            .upsert(predictionUpdate,{conflict_target: 'predictionid'})
            .eq('id_league', leagueId);
        if (predictionUpdErr) {
            error('predictionUpdErr in errore');
            context.send(predictionUpdErr);
            return { success: false, message: predictionUpdErr.message };
        }
        //update prediction

        // Funzione per aggiornare i punti dei membri
        const updateUserPoints = async (members, userPointsMap, leagueId) => {
            const updatesMemeberInfo = [];

            for (const { userid, punti, id_members,id_league } of members) {
                const currentPoints = userPointsMap.get(userid) || 0;
                log('userid ','userid');
                log('currentPoints',currentPoints);
                const updatedPoints = currentPoints + punti;

                updatesMemeberInfo.push({
                    punti: updatedPoints,
                    userid: userid,
                    id_league,id_league,
                    id_members,id_members
                });
            }

            const { data: membersInfoData, error: membersInfoError } = await supabase
                .from('members_info')
                .upsert(updatesMemeberInfo,{conflict_target: 'userid'})
                .eq('id_league', leagueId); // Aggiornato per specificare la lega

            if (membersInfoError) {
                error('membersInfoError in errore');
                return { success: false, message: membersInfoError.message };
            }
            return { success: true, message: "Punti aggiornati correttamente." };
        };

        if (membersSnapshot.data) {
            await updateUserPoints(membersSnapshot.data, userPointsMap, leagueId);
        }

        await supabase.rpc('update_calcolata_flag', { id: idGiornataCalcolata });

        context.send('aggiornamento fatto');
        return { success: true, message: "Calcolo punti completato con successo." };

    } catch (error) {
        console.error(`Errore calcolaPuntiGiornata catch `, error);
        return { success: false, message: 'Errore imprevisto' };
    }
});
// Funzione per ottenere tutte le previsioni per una lega specifica e un matchId
const getPredictionsForLeagueAndMatch = async (leagueId, dayId) => {
    if (!leagueId || !dayId) {
        log(leagueId,dayId);
        throw new Error('Invalid leagueId or dayId getPredictionsForLeagueAndMatch' );
    }
    try {
        // Recupera tutte le previsioni per la lega e il match specificato
        info(`Start - getPredictionsForLeagueAndMatch estrazione per ${leagueId}  e ${dayId}`);
        const { data: predictionsData, error: predError } = await supabase
            .from('predictions')
            .select('predictionid, id_league, dayid,userid')
            .eq('id_league', leagueId)
            .eq('dayid', dayId);

        if (predError) {
            error("Errore duranteg - getPredictionsForLeagueAndMatch ", predError);
            throw predError;
        }

        // Estrazione dei predictionIds
        const predictionIds = predictionsData.map(pred => pred.predictionid);

        // Recupera le righe dalla tabella 'schedina' basate sui predictionIds
        const schedinaMap = await getSchedinaForPredictions(predictionIds);
        info(`Fine - getPredictionsForLeagueAndMatch estrazione per ${leagueId}  e ${dayId}`);
        return { predictions: predictionsData, schedina: schedinaMap };
    } catch (error) {
        error("Errore durante il recupero delle previsioni e schedina:", error);
    }
};

// Funzione per ottenere tutte le righe di 'schedina' basate sui predictionIds
const getSchedinaForPredictions = async (predictionIds) => {
    if (!predictionIds || predictionIds.length === 0) {
        throw new Error('Invalid predictionIds - getSchedinaForPredictions');
    }
    try {
        info(`Start - getSchedinaForPredictions estrazione per ${predictionIds}`);
        const { data: schedinaData, error: schedError } = await supabase
            .from('schedina')
            .select('schedina_id,prediction_id,matchid,esitogiocato,result')
            .in('prediction_id', predictionIds);
        if (schedError){
            error("Errore duranteg - getSchedinaForPredictions ", schedError);
            throw schedError;
        }

        const schedinaMap = new Map();
        schedinaData.forEach(row => {
            const predictionId = row.prediction_id;
            if (!schedinaMap.has(predictionId)) {
                schedinaMap.set(predictionId, []);
            }
            schedinaMap.get(predictionId).push(row);
        });
        info(`Fine - getSchedinaForPredictions estrazione per ${predictionIds}`);
        return schedinaMap;
    } catch (errorExc) {
        error("Errore durante il recupero della schedina:", errorExc);
    }
};


