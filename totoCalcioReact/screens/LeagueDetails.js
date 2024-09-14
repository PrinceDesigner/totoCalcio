import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Card, useTheme } from 'react-native-paper'; // Importa il hook useTheme

// Funzione per simulare il countdown
const calculateCountdown = (deadline) => {
    const now = new Date().getTime();
    const distance = deadline - now;
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000)) / 1000);
    return { hours, minutes, seconds };
};

export default function LeagueDetails({ route, navigation }) {
    const { colors } = useTheme(); // Ottieni i colori dal tema
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const deadline = new Date().getTime() + 3600000; // Simuliamo una scadenza a 1 ora da adesso
    const matchdayNumber = 12; // Simula il numero della giornata

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(calculateCountdown(deadline));
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    // Simuliamo la classifica provvisoria
    const provisionalRanking = [
        { id: '1', name: 'Giocatore 1', points: 50 },
        { id: '2', name: 'Giocatore 2', points: 45 },
        { id: '3', name: 'Giocatore 3', points: 40 },
        { id: '4', name: 'Giocatore 4', points: 35 },
        { id: '5', name: 'Giocatore 5', points: 30 },
        { id: '6', name: 'Giocatore 6', points: 25 },
    ];

    // Simuliamo lo schema delle partite
    const matches = [
        { id: '1', home: 'Squadra A', away: 'Squadra B' },
        { id: '2', home: 'Squadra C', away: 'Squadra D' },
        { id: '3', home: 'Squadra E', away: 'Squadra F' },
    ];

    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }}>
            {/* Countdown */}
            <TouchableOpacity onPress={() => navigation.navigate('InsertResults')}>
                <Card style={styles.section}>
                    <Text style={styles.countdownText}>
                        Giornata {matchdayNumber}
                    </Text>
                    <View style={styles.countdownContainer}>
                        <Text style={{...styles.countdownNumber, color: colors.primary}}>{countdown.hours}</Text>
                        <Text style={styles.countdownLabel}>ore</Text>
                        <Text style={{...styles.countdownNumber, color: colors.primary}}>{countdown.minutes}</Text>
                        <Text style={styles.countdownLabel}>min</Text>
                        <Text style={{...styles.countdownNumber, color: colors.primary}}>{countdown.seconds}</Text>
                        <Text style={styles.countdownLabel}>sec</Text>
                    </View>
                    <Text style={styles.insertEsitiText}>
                        Clicca per inserire gli esiti {matchdayNumber}
                    </Text>
                </Card>
            </TouchableOpacity>

            {/* Classifica Provvisoria */}
            <TouchableOpacity onPress={() => navigation.navigate('ProvisionalRanking')}>
                <Card style={styles.section}>
                    <Text style={{...styles.sectionTitle, color: colors.primary}}>Top 6</Text>
                    <FlatList
                        data={provisionalRanking.slice(0, 6)} // Mostra solo i primi 6
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.rankItem}>
                                <Text style={styles.rankName}>{item.name}</Text>
                                <Text style={{...styles.rankPoints}}>{item.points} punti</Text>
                            </View>
                        )}
                        scrollEnabled={false} // Impedisce lo scorrimento all'interno di FlatList
                    />
                </Card>
            </TouchableOpacity>

            {/* Schema delle Partite */}
            <TouchableOpacity onPress={() => navigation.navigate('MatchSchedule')}>
                <Card style={styles.section}>
                    <Text style={{...styles.sectionTitle, color: colors.primary}}>Schema delle Partite</Text>
                    <FlatList
                        data={matches}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.matchItem}>
                                <Text style={styles.team}>{item.home}</Text>
                                <Text style={styles.vs}>vs</Text>
                                <Text style={styles.team}>{item.away}</Text>
                            </View>
                        )}
                        scrollEnabled={false} // Impedisce lo scorrimento all'interno di FlatList
                    />
                </Card>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20
    },
    section: {
        marginBottom: 30,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    countdownContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    countdownText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: 'white'
    },
    insertEsitiText: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        color: 'white'
    },
    countdownNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        marginHorizontal: 5,
    },
    countdownLabel: {
        fontSize: 16,
        color: 'white',
        marginRight: 10,
    },
    rankItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
        color: 'white'
    },
    rankName: {
        fontSize: 16,
        color: 'white'

    },
    rankPoints: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    matchItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    team: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    vs: {
        fontSize: 16,
    },
});