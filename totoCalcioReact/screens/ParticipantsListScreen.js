import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Card, useTheme, Avatar, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Importa l'icona del cestino
import { useSelector } from 'react-redux';
import { selectLeagueById } from '../redux/slice/leaguesSlice';

export default function ParticipantsListScreen() {
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
    const confirmDeleteParticipant = () => {
        console.log(`Partecipante ${selectedParticipant.name} eliminato`);
        setModalVisible(false);
        // Aggiungi la logica per rimuovere il partecipante dalla lista
    };

    // Funzione per chiudere la modale
    const closeModal = () => {
        setModalVisible(false);
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
                {participants.map((participant, index) => (
                    <Card key={index + 1} style={{ ...styles.card, backgroundColor: colors.surface }}>
                        <View style={styles.participantRow}>
                            <Text style={{ color: 'white' }}>{index + 1}</Text>
                            <Avatar.Image
                                source={{ uri: participant.photoURL }}
                                size={40}
                                style={styles.avatar}
                            />
                            <Text style={{ ...styles.participantName, color: 'white' }}>{participant.displayName}</Text>

                            {/* Icona del cestino */}
                            {selectedLeague.ownerId === userId ? <TouchableOpacity onPress={() => handleDeleteParticipant(participant)}>
                                <MaterialIcons name="delete" size={24} color={colors.primary} />
                            </TouchableOpacity> : null}
                        </View>
                    </Card>
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
