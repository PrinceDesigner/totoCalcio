import React from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, Card, Avatar } from 'react-native-paper';
import { showLoading, hideLoading } from '../redux/slice/uiSlice';
import { showToast } from '../ToastContainer';
import { checkPrediction } from '../services/predictionsService';
import { useNavigation } from '@react-navigation/native';
import PredictionComponent from './componentScreen/SchedinaInserita';
import fontStyle from '../theme/fontStyle';

export default function GiornataDetailsScreen({ route }) {
    const { colors } = useTheme();
    const dispatch = useDispatch();

    const navigation = useNavigation(); // Inizializza la navigazione

    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const matches = useSelector((state) => state.infogiornataAttuale.matches);
    const participants = useSelector((state) => state.partecipantiLegaCorrente.participants);
    const prediction = useSelector((state) => state.insertPredictions.schedinaInserita);
    const loading = useSelector((state) => state.ui.loading);

    const matchdayNumber = dayId.replace('RegularSeason-', '') || 0;

    // Funzione per gestire il click su un partecipante
    const handleParticipantPress = async (participant) => {
        try {
            // Mostra lo stato di caricamento
            dispatch(showLoading());

            // Chiama il servizio checkPrediction
            const predictionData = await checkPrediction(dayId, leagueId, participant.userId);


            // Gestisci il risultato, ad esempio naviga a un'altra schermata o mostra un messaggio
            if (predictionData) {
                navigation.navigate('EsitiUtenteInseriti', {
                    prediction: predictionData, // Passa i dati della predizione
                    user: participant.displayName, // Passa i dettagli del partecipante se necessario
                });

            } else {
                showToast('info', 'Nessuna predizione trovata per questo utente.');
            }

        } catch (error) {
            console.error('Errore durante il controllo della predizione:', error);
            showToast('error', error.response.data.message);
        } finally {
            // Nascondi lo stato di caricamento
            dispatch(hideLoading());
        }
    };

    const renderPrediction = () => (
        <View style={styles.sectionContainer}>
            <Text style={{ ...styles.sectionTitle, color: colors.primary }}>I tuoi esiti per la giornata {matchdayNumber} </Text>
            <PredictionComponent prediction={prediction} />
        </View>
    );

    const renderParticipants = () => (
        <View style={styles.sectionContainer}>
            <Text style={{ ...styles.sectionTitle, color: colors.primary }}>Vedi gli esiti degli avversari</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                {participants.map((participant, index) => (
                    <TouchableOpacity
                        key={index + 1}
                        onPress={() => handleParticipantPress(participant)} // Funzione per gestire il click
                    >
                        <View style={{ ...styles.card, backgroundColor: colors.secondaryBackGroud }}>
                            <View style={styles.participantRow}>
                                <Text style={{ color: 'white' }}>{index + 1}</Text>
                                <Avatar.Image
                                    source={{ uri: participant.photoURL }}
                                    size={40}
                                    style={styles.avatar}
                                />
                                <Text style={{ ...styles.participantName, color: 'white' }}>
                                    {participant.displayName}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
            {loading ? (
               null
            ) : (
                <>
                    {renderPrediction()}
                    {renderParticipants()}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 10,
        ...fontStyle.textBold
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 18,
    },
    card: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    participantName: {
        fontSize: 16,
        ...fontStyle.textMedium,
        flex: 1,
    },
    avatar: {
        marginHorizontal: 10,
    },
});

