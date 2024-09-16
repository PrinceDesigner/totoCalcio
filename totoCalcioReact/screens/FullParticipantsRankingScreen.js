import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, useTheme, Avatar } from 'react-native-paper';

// Dati dei partecipanti alla lega (aggiungi immagini)
const participants = [
    { id: '1', name: 'Mario Rossi', points: 150, image: 'https://via.placeholder.com/50' },
    { id: '2', name: 'Luigi Bianchi', points: 140, image: 'https://via.placeholder.com/50' },
    { id: '3', name: 'Giovanni Verdi', points: 130, image: 'https://via.placeholder.com/50' },
    { id: '4', name: 'Francesco Neri', points: 120, image: 'https://via.placeholder.com/50' },
    { id: '5', name: 'Carlo Blu', points: 110, image: 'https://via.placeholder.com/50' },
    { id: '6', name: 'Alessandro Gialli', points: 100, image: 'https://via.placeholder.com/50' },
    { id: '7', name: 'Andrea Viola', points: 90, image: 'https://via.placeholder.com/50' },
    { id: '8', name: 'Giorgio Rosa', points: 85, image: 'https://via.placeholder.com/50' },
    { id: '9', name: 'Pietro Marroni', points: 80, image: 'https://via.placeholder.com/50' },
    { id: '10', name: 'Fabio Arancioni', points: 75, image: 'https://via.placeholder.com/50' },
    // Aggiungi altri partecipanti se necessario
];

export default function FullParticipantsRankingScreen() {
    const { colors } = useTheme();

    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 100 }}>
            {participants.map((participant, index) => (
                <Card key={participant.id} style={{ ...styles.card, backgroundColor: colors.surface }}>
                    <View style={styles.rankRow}>
                        <Text style={{ color: 'white', fontSize: 20 }}>{index + 1}</Text>
                        <Avatar.Image
                            source={{ uri: participant.image }}
                            size={40}
                            style={styles.avatar}
                        />
                        <Text style={{ ...styles.participantName, color: 'white' }}>{participant.name}</Text>
                        <Text style={{ ...styles.points, color: colors.primary }}>{participant.points}pt</Text>
                    </View>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    rankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
        marginRight: 0
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
    points: {
        fontSize: 16,
        fontWeight: 'bold',
        width: '25%',
        textAlign: 'right',
    },
});
