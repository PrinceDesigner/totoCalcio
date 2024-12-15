const functions    = require('firebase-functions');
const admin        = require('firebase-admin');
const supabase     = require('./supaClient');
const {error,info} = require("firebase-functions/logger");

exports.migrateLeaguesAndMembers = functions.https.onRequest(async (req, res) => {
    try {
        info(`inzio Migrazione completa League & Memebrs `);

        // Estrai tutti i dati da Firebase per la tabella 'leagues'
        const leaguesSnapshot = await admin.firestore().collection('leagues').get();
        const leaguesData = leaguesSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id  // Ottieni documentId
        }));

        for (const league of leaguesData) {
            const leagueId = league.id;
            const leagueToUpdate = {
                id_league: leagueId,
                name: league.name,
                ownerid: league.ownerId
            };

            // Aggiorna o inserisce la lega su Supabase
            const { error: leagueUpdateError } = await supabase.from('leagues').upsert([leagueToUpdate]);

            if (leagueUpdateError) {
                error(`Errore aggiornamento tabella leagues: ${leagueUpdateError.message}`);
                continue;
            }

            info(`Tabella leagues aggiornata/inserita per id_league: ${leagueId}`);

            // Gestisci i membri di ogni lega
            const membersInfo = league.membersInfo || [];
            const currentMembersSnapshot = await supabase.from('members_info')
                .select()
                .eq('id_league', leagueId);

            const currentMembers = currentMembersSnapshot.data || [];

            const membersData = membersInfo.filter(member => {
                return !currentMembers.some(m => m.userid === member.id);
            }).map(member => ({
                id_league: leagueId,
                userid: member.id,
                punti: member.punti
            }));

            // Aggiorna o inserisce i membri nella tabella members_info su Supabase
            if (membersData.length > 0) {
                const { error: membersUpdateError } = await supabase.from('members_info').upsert(membersData);

                if (membersUpdateError) {
                    error(`Errore aggiornamento tabella members_info: ${membersUpdateError.message}`);
                    continue;
                }

                info(`Tabella members_info aggiornata/inserita per id_league: ${leagueId}`);
            } else {
                info('Nessun membro da aggiungere.');
            }
        }
        info(`Fine Migrazione completa League & Memebrs `);
        res.status(200).send('Migration completed successfully.');
    } catch (errorExc) {
        res.status(500).send(`Errore durante la migrazione: ${errorExc.message}`);
    }
});

exports.migrateLeaguesAndMembersByCreate = functions.firestore.document('leagues/{leagueId}').onCreate(async (snap, context) => {
    try {
        const league = snap.data();
        const leagueId = snap.id;

        info(`inzio Migrazione della leaga appena inserita ${leagueId}`);

        const leagueToUpdate = {
            id_league: leagueId,
            name: league.name,
            ownerid: league.ownerId
        };

        // Aggiorna o inserisce la lega su Supabase
        const { error: leagueUpdateError } = await supabase.from('leagues').upsert([leagueToUpdate]);

        if (leagueUpdateError) {
            error(`Errore aggiornamento tabella leagues: ${leagueUpdateError.message}`);
            return;
        }

        info(`Tabella leagues aggiornata/inserita per id_league: ${leagueId}`);

        // Gestisci i membri di ogni lega
        const membersInfo = league.membersInfo || [];
        const membersData = membersInfo.map(member => ({
            id_league: leagueId,
            userid: member.id,
            punti: member.punti
        }));

        // Aggiorna o inserisce i membri nella tabella members_info su Supabase
        const { error: membersUpdateError } = await supabase.from('members_info').upsert(membersData);

        if (membersUpdateError) {
            error(`Errore aggiornamento tabella members_info: ${membersUpdateError.message}`);
            return;
        }

        info(`FINE Migrazione - Tabella members_info aggiornata/inserita per id_league: ${leagueId}`);
    } catch (errorExc) {
        error(`Errore durante la migrazione: ${errorExc.message}`);
    }
});

exports.onLeagueUpdated = functions.firestore.document('leagues/{leagueId}').onUpdate(async (change, context) => {
    try {

        const updatedLeague = change.after.data();
        const leagueId = change.after.id;
        info(`inzio aggiornamento della leaga ${leagueId}`);

        const leagueToUpdate = {
            id_league: leagueId,
            name: updatedLeague.name,
            ownerid: updatedLeague.ownerId
        };

        // Aggiorna la lega su Supabase
        const { error: leagueUpdateError } = await supabase.from('leagues').upsert([leagueToUpdate]);

        if (leagueUpdateError) {
            error(`Errore aggiornamento tabella leagues: ${leagueUpdateError.message}`);
            return;
        }

        info(`Tabella leagues aggiornata per id_league: ${leagueId}`);

        // Aggiorna o inserisce membri
        const newMembersInfo = updatedLeague.membersInfo || [];
        const currentMembersSnapshot = await supabase.from('members_info')
            .select()
            .eq('id_league', leagueId);

        const currentMembers = currentMembersSnapshot.data || [];

        const updatedMembers = [];
        const removedMembers = [];

        for (const member of newMembersInfo) {
            const existingMember = currentMembers.find(m => m.userid === member.id);

            if (existingMember) {
                // Aggiorna solo se i dati sono cambiati
                if (existingMember.punti !== member.punti) {
                    updatedMembers.push({
                        id_league: leagueId,
                        userid: member.id,
                        punti: member.punti
                    });
                }
            } else {
                // Inserisce membri nuovi
                updatedMembers.push({
                    id_league: leagueId,
                    userid: member.id,
                    punti: member.punti
                });
            }
        }

        // Gestire membri rimossi
        for (const member of currentMembers) {
            if (!newMembersInfo.some(m => m.id === member.userid)) {
                removedMembers.push(member.userid);
            }
        }

        // Aggiorna o inserisce i membri nella tabella members_info su Supabase
        if (updatedMembers.length > 0) {
            const { error: membersUpdateError } = await supabase.from('members_info').upsert(updatedMembers);

            if (membersUpdateError) {
                error(`Errore aggiornamento tabella members_info: ${membersUpdateError.message}`);
                return;
            }

            info(`Tabella members_info aggiornata per id_league: ${leagueId}`);
        }

        // Rimuovi i membri eliminati
        if (removedMembers.length > 0) {
            const { error: membersDeleteError } = await supabase.from('members_info')
                .delete()
                .in('userid', removedMembers);

            if (membersDeleteError) {
                error(`Errore eliminazione membri nella tabella members_info: ${membersDeleteError.message}`);
                return;
            }

            info(`Membri rimossi per id_league: ${leagueId}`);
        } else {
            info('Nessun membro da rimuovere.');
        }

    } catch (errorExc) {
        error(`Errore durante l'aggiornamento: ${errorExc.message}`);
    }
});

exports.onLeagueDeleted = functions.firestore.document('leagues/{leagueId}').onDelete(async (snapshot, context) => {
    try {
        const leagueId = snapshot.id;

        // Elimina la lega da Supabase
        const { error: leagueDeleteError } = await supabase.from('leagues').delete().eq('id_league', leagueId);

        if (leagueDeleteError) {
            error(`Errore eliminazione tabella leagues: ${leagueDeleteError.message}`);
            return;
        }

        info(`Tabella leagues eliminata per id_league: ${leagueId}`);

        // Elimina membri associati
        const { error: membersDeleteError } = await supabase.from('members_info').delete().eq('id_league', leagueId);

        if (membersDeleteError) {
            error(`Errore eliminazione tabella members_info: ${membersDeleteError.message}`);
            return;
        }

        info(`Tabella members_info eliminata per id_league: ${leagueId}`);

    } catch (errorExc) {
        error(`Errore durante l'eliminazione: ${errorExc.message}`);
    }
});