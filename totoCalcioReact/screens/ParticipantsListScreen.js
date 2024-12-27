import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Card, useTheme, Avatar, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Importa l'icona del cestino
import { useDispatch, useSelector } from 'react-redux';
import { removeUserFromLeagueReducer, selectLeagueById } from '../redux/slice/leaguesSlice';
import { removeParticipant } from '../redux/slice/partecipantsSlice';
import { triggerRefresh } from '../redux/slice/refreshSlice';
import { fetchStoricoPerUtenteSelezionato, setUser } from '../redux/slice/storicoPerUtenteSelezionatoSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { getMembersInfoForLeague, removeUserFromLeague } from '../services/leagueService';
import fontStyle from '../theme/fontStyle';
import { COLORJS } from '../theme/themeColor';
import { showToast } from '../ToastContainer';
import Wrapper from './componentScreen/Container';

export default function ParticipantsListScreen({ navigation }) {
    const dispatch = useDispatch(); // Usa dispatch per inviare l'azione Redux

    const { colors } = useTheme();
    const [modalVisible, setModalVisible] = useState(false); // Stato per la visibilità della modale
    const [selectedParticipant, setSelectedParticipant] = useState(null); // Partecipante selezionato per l'eliminazione

    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const userId = useSelector((state) => state.auth.user.user.userId);
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));

    const [members, setMembers] = useState([]);  // Stato che indica se la giornata è passata

    const participants = members;

    // Funzione per mostrare la modale
    const handleDeleteParticipant = (participant) => {
        setSelectedParticipant(participant);
        setModalVisible(true);
    };

    // Funzione per confermare l'eliminazione del partecipante
    const confirmDeleteParticipant = async () => {
        if (!selectedParticipant) {
            console.error('Nessun partecipante selezionato');
            return;
        }

        const { userId } = selectedParticipant;

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

    const fetchLeagueById = async (leagueId) => {
        try {
            dispatch(showLoading()); // Mostra lo stato di caricamento
            const membersResult = await getMembersInfoForLeague(leagueId);
            setMembers(membersResult)
        } catch (error) {
            console.error('Errore durante il recupero della lega:', error);
        } finally {
            dispatch(hideLoading()); // Nascondi lo stato di caricamento
        }
    };

    useEffect(() => {
        fetchLeagueById(leagueId)
    }, []);

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

            dispatch(setUser({ ...participant }));

            // Nascondi lo stato di caricamento
            dispatch(hideLoading());

            // Naviga alla schermata successiva, ad esempio "UserHistoryScreen"
            navigation.navigate('UserHistoryScreen',
                {
                    user: participant.displayName, // Passa i dettagli del partecipante se necessario
                });

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
            console.log(leagueId, userId);
            const response = await removeUserFromLeague(leagueId, userId);
            showToast('success', 'Utente rimosso con successo');
            dispatch(triggerRefresh())

            navigation.navigate('LeagueDetails', { screen: 'Home Lega' }); // Sostituisci la schermata per evitare duplicazioni
        } catch (error) {
            console.error('Errore durante la rimozione dell\'utente dalla lega:', error);
            // Mostra un errore all'utente se necessario
        }
    };


    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
                <Wrapper>
                    {participants.map((participant, index) => (
                        <TouchableOpacity
                            key={index + 1}
                            onPress={() => handleParticipantPress(participant)} // Aggiungi la funzione da eseguire al tocco
                            style={{ ...styles.cardTouchable }} // Modifica per includere lo stile
                        >
                            <View style={styles.card}>
                                <View style={styles.participantRow}>
                                    <Avatar.Image
                                        source={participant.photoURL ? { uri: participant.photoURL } : require('../../totoCalcioReact/User-avatar.svg.png')}
                                        size={40}
                                        style={styles.avatar}
                                    />
                                    <Text style={{ ...styles.participantName, color: 'white' }}>{participant.displayName}</Text>

                                    {/* Icona del cestino */}
                                    {(!selectedLeague.ownerId.includes(participant.userId)) && selectedLeague.ownerId.includes(userId) ? (
                                        <TouchableOpacity onPress={() => handleDeleteParticipant(participant)}>
                                            <MaterialIcons name="delete" size={24} color={colors.primary} />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </Wrapper>
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
                        <Text style={styles.modalTitle}>Vuoi eliminare {selectedParticipant?.displayName} dalla lega?</Text>

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
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        backgroundColor: COLORJS.secondaryBackGroud
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
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
        ...fontStyle.textBold
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
        ...fontStyle.textMedium,
        textAlign: 'center'
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
