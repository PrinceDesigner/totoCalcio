import React, { useEffect } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, Card, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchPrediction } from '../redux/slice/predictionsSlice';
import { showLoading, hideLoading } from '../redux/slice/uiSlice';
import { showToast } from '../ToastContainer';

export default function GiornataDetailsScreen({ route }) {
    const { colors } = useTheme();
    const dispatch = useDispatch();

    const userId = useSelector((state) => state.auth.user.user.userId);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const matchdayNumber = dayId.replace('RegularSeason-', '') || 0;
    const matches = useSelector((state) => state.infogiornataAttuale.matches);

    // Dati dal Redux store
    const prediction = useSelector((state) => state.insertPredictions.schedinaInserita);
    const loading = useSelector((state) => state.ui.loading);

    // Mock dei partecipanti
    const participants = [
        { id: '1', name: 'Mario Rossi', image: 'https://placekitten.com/40/40' },
        { id: '2', name: 'Luca Bianchi', image: 'https://placekitten.com/40/41' },
        { id: '3', name: 'Giovanni Verdi', image: 'https://placekitten.com/40/42' },
    ];

    const getMatchById = (matchId) => {
        return matches.find(match => match.matchId === matchId);
    };

    const renderPrediction = () => (
        <View style={styles.sectionContainer}>
            <Text style={{ ...styles.sectionTitle, color: colors.primary }}>I tuoi esiti per la giornata {matchdayNumber} </Text>
            {prediction.schedina && prediction.schedina.length > 0 ? (
                <View>
                    {prediction.schedina.map((item) => (
                        <Card key={item.matchId} style={{ ...styles.matchCard, backgroundColor: colors.surface }}>
                            <View style={styles.matchInfo}>
                                <Text style={[styles.matchText, { color: 'white' }]}>
                                    {getMatchById(item.matchId).homeTeam} 
                                    <Text> - </Text> 
                                    {getMatchById(item.matchId).awayTeam}
                                </Text>
                                <Text style={[styles.predictionText, { color: colors.accent }]}>
                                    {item.esitoGiocato}
                                </Text>
                            </View>
                        </Card>
                    ))}
                </View>
            ) : (
                <Text style={{ ...styles.noDataText, color: colors.text }}>Nessuna predizione per questa giornata.</Text>
            )}
        </View>
    );

    const renderParticipants = () => (
        <View style={styles.sectionContainer}>
            <Text style={{ ...styles.sectionTitle, color: colors.primary }}>Partecipanti</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
                {participants.map((participant, index) => (
                    <Card key={participant.id} style={{ ...styles.card, backgroundColor: colors.surface }}>
                        <View style={styles.participantRow}>
                            <Text style={{ color: 'white' }}>{index + 1}</Text>
                            <Avatar.Image
                                source={{ uri: participant.image }}
                                size={40}
                                style={styles.avatar}
                            />
                            <Text style={{ ...styles.participantName, color: 'white' }}>
                                {participant.name}
                            </Text>

                        </View>
                    </Card>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
            {loading ? (
                <Text style={{ ...styles.loadingText, color: colors.primary }}>Caricamento...</Text>
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
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    matchCard: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    matchInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    matchText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    predictionText: {
        fontSize: 18,
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        color: 'gray',
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
        fontWeight: 'bold',
        flex: 1,
    },
    avatar: {
        marginHorizontal: 10,
    },
});
