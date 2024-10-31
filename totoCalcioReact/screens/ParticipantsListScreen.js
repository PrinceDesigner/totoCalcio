import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Card, useTheme, Avatar, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Importa l'icona del cestino
import { useDispatch, useSelector } from 'react-redux';
import { removeUserFromLeagueReducer, selectLeagueById } from '../redux/slice/leaguesSlice';
import { removeParticipant } from '../redux/slice/partecipantsSlice';
import { fetchStoricoPerUtenteSelezionato } from '../redux/slice/storicoPerUtenteSelezionatoSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { removeUserFromLeague } from '../services/leagueService';
import { showToast } from '../ToastContainer';

export default function ParticipantsListScreen({ navigation }) {
    const dispatch = useDispatch(); // Usa dispatch per inviare l'azione Redux

    const { colors } = useTheme();
    const [modalVisible, setModalVisible] = useState(false); // Stato per la visibilità della modale
    const [selectedParticipant, setSelectedParticipant] = useState(null); // Partecipante selezionato per l'eliminazione

    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const userId = useSelector((state) => state.auth.user.user.userId);
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));
    const participants = useSelector((state) => state.partecipantiLegaCorrente.participants);


    // Funzione per mostrare la modale
    const handleDeleteParticipant = (participant) => {
        setSelectedParticipant(participant);
        setModalVisible(true);
    };

    // Funzione per confermare l'eliminazione del partecipante
    // Funzione per confermare l'eliminazione del partecipante
    const confirmDeleteParticipant = async () => {
        if (!selectedParticipant) {
            console.error('Nessun partecipante selezionato');
            return;
        }

        const { leagueId, userId } = selectedParticipant;

        // Chiudi la modale prima di procedere con l'operazione di rimozione
        setModalVisible(false);

        try {
            // Mostra il caricamento
            dispatch(showLoading());

            // Chiama handleRemoveUser per eseguire la rimozione
            await handleRemoveUser(leagueId, userId);

            // Mostra un messaggio di successo o altre azioni necessarie post-rimozione
            showToast('success', 'Partecipante rimosso con successo');
        } catch (error) {
            // Gestisci eventuali errori
            console.error('Errore durante la rimozione del partecipante:', error);
            showToast('error', 'Errore durante la rimozione del partecipante');
        } finally {
            // Nascondi il caricamento
            dispatch(hideLoading());
        }

    };

    // Funzione per chiudere la modale
    const closeModal = () => {
        setModalVisible(false);
    };

    const handleParticipantPress = async (participant) => {
        try {
            // Mostra lo stato di caricamento
            dispatch(showLoading());

            // Effettua la chiamata all'API
            await dispatch(fetchStoricoPerUtenteSelezionato({ leagueId, userId: participant.userId })).unwrap();

            // Nascondi lo stato di caricamento
            dispatch(hideLoading());

            // Naviga alla schermata successiva, ad esempio "UserHistoryScreen"
            navigation.navigate('UserHistoryScreen');

            // Mostra un messaggio di successo se necessario
        } catch (error) {
            console.error('Errore durante il caricamento dei dati:', error);

            // Nascondi lo stato di caricamento
            dispatch(hideLoading());

            // Mostra un messaggio di errore
        }
    };


    const handleRemoveUser = async (leagueId, userId) => {
        try {
            const response = await removeUserFromLeague(leagueId, userId);
            showToast('success', 'Utente rimosso con successo');
            dispatch(removeParticipant(userId));
            dispatch(removeUserFromLeagueReducer({ leagueId, userId }));

            navigation.navigate('LeagueDetails', { screen: 'Home Lega' }); // Sostituisci la schermata per evitare duplicazioni
        } catch (error) {
            console.error('Errore durante la rimozione dell\'utente dalla lega:', error);
            // Mostra un errore all'utente se necessario
        }
    };


    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
                {participants.map((participant, index) => (
                    <TouchableOpacity
                        key={index + 1}
                        onPress={() => handleParticipantPress(participant)} // Aggiungi la funzione da eseguire al tocco
                        style={{ ...styles.cardTouchable }} // Modifica per includere lo stile
                    >
                        <Card style={styles.card}>
                            <View style={styles.participantRow}>
                                <Text style={{ color: 'white' }}>{index + 1}</Text>
                                <Avatar.Image
                                    source={{ uri: participant.photoURL }}
                                    size={40}
                                    style={styles.avatar}
                                />
                                <Text style={{ ...styles.participantName, color: 'white' }}>{participant.displayName}</Text>

                                {/* Icona del cestino */}
                                {selectedLeague.ownerId === userId ? (
                                    <TouchableOpacity onPress={() => handleDeleteParticipant(participant)}>
                                        <MaterialIcons name="delete" size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Modale per confermare l'eliminazione */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Vuoi eliminare {selectedParticipant?.name}?</Text>

                        {/* Bottoni per confermare o annullare */}
                        <View style={styles.modalActions}>
                            <Button
                                mode="contained"
                                onPress={confirmDeleteParticipant}
                                style={styles.modalButton}
                            >
                                Elimina
                            </Button>
                            <Button
                                mode="text"
                                onPress={closeModal}
                                style={styles.modalButton}
                            >
                                Annulla
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    participantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
    // Modale
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Sfondo semitrasparente
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        marginHorizontal: 10,
        marginTop: 10,
    },
});
