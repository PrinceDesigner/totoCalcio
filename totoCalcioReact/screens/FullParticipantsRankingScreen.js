import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

// Dati dei partecipanti alla lega
const participants = [
    { id: '1', name: 'Mario Rossi', points: 150 },
    { id: '4', name: 'Francesco Neri', points: 120 },
    { id: '2', name: 'Luigi Bianchi', points: 140 },
    { id: '3', name: 'Giovanni Verdi', points: 130 },
    { id: '5', name: 'Carlo Blu', points: 110 },
    { id: '6', name: 'Alessandro Gialli', points: 100 },
    { id: '7', name: 'Andrea Viola', points: 90 },
    { id: '8', name: 'Giorgio Rosa', points: 85 },
    { id: '9', name: 'Pietro Marroni', points: 80 },
    { id: '10', name: 'Fabio Arancioni', points: 75 },
    // Aggiungi altri partecipanti se necessario
];

export default function FullParticipantsRankingScreen() {
    const { colors } = useTheme();

    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }}>

            {participants.map((participant, index) => (
                <Card key={participant.id} style={{ ...styles.card, backgroundColor: colors.surface }}>
                    <View style={styles.rankRow}>
                        <Text style={{color: 'white'}}>{index + 1}</Text>
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
    position: {
        fontSize: 18,
        fontWeight: 'bold',
        width: '10%',
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
