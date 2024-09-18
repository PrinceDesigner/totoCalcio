import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Card, Badge, useTheme, Button } from 'react-native-paper';
import { COLORJS } from '../theme/themeColor';

const formatTime = (time) => (time < 10 ? `0${time}` : time);

export default function LeagueDetails({ navigation }) {
    const { colors } = useTheme();
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const matchdayNumber = 12;
    const deadline = new Date().getTime() + 3600000; // Simuliamo una scadenza a 1 ora da adesso

    const provisionalRanking = [
        { id: '1', name: 'Mario Rossi', points: 150 },
        { id: '2', name: 'Luigi Bianchi', points: 140 },
        { id: '3', name: 'Giovanni Verdi', points: 130 },
        { id: '4', name: 'Francesco Neri', points: 120 },
        { id: '5', name: 'Carlo Blu', points: 110 },
        { id: '6', name: 'Alessandro Gialli', points: 100 },
    ];


    const matches = [
        { id: '1', home: 'Juventus', away: 'Inter', time: '18:00' },
        { id: '2', home: 'Milan', away: 'Napoli', time: '20:45' },
        { id: '3', home: 'Roma', away: 'Lazio', time: '21:00' },
        { id: '4', home: 'Atalanta', away: 'Fiorentina', time: '18:00' },
        { id: '5', home: 'Bologna', away: 'Torino', time: '20:45' },
        { id: '6', home: 'Sassuolo', away: 'Cagliari', time: '21:00' },
        { id: '7', home: 'Udinese', away: 'Monza', time: '18:00' },
        { id: '8', home: 'Lecce', away: 'Verona', time: '20:45' },
        { id: '9', home: 'Genoa', away: 'Frosinone', time: '21:00' },
        { id: '10', home: 'Empoli', away: 'Salernitana', time: '21:00' },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = deadline - now;
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % 60000) / 1000);
            setCountdown({ hours, minutes, seconds });
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
            {/* Countdown Section */}
            <View style={{ ...styles.sectionCountDown, backgroundColor: colors.surface }}>
                <View style={styles.countdownHeader}>
                    {/* Badge compatto */}
                    <View style={styles.leagueBadgeCountDown}>
                        <Badge style={{ backgroundColor: colors.primary }}>Serie A</Badge>
                    </View>

                    {/* Numero di giornata */}
                    <View style={styles.leagueBadgeCountDown}>
                        <Badge style={{ backgroundColor: colors.primary }}> Giornata {matchdayNumber}</Badge>
                    </View>
                </View>

                {/* Countdown visual nello stile "10:10:10" */}
                <View style={styles.compactCountdownContainer}>
                    <Text style={styles.countdownNumber}>
                        {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
                    </Text>
                </View>

                {/* Bottone "Inserisci Esiti" */}
                <Button
                    mode="contained"
                    onPress={() => navigation.navigate('InsertResults')}
                    style={styles.insertButton}
                >
                    Inserisci Esiti
                </Button>
            </View>

            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }}>
                {/* Classifica Provvisoria */}
                <Card style={{ ...styles.section, marginBottom: 0 }}>
                    <Text style={{ ...styles.sectionTitle, color: 'white' }}>Classifica Provvisoria</Text>
                    {provisionalRanking.map((player, index) => (
                        <View key={player.id} style={styles.rankItem}>
                            <View style={{ display: 'flex', flexDirection: 'row' }}>
                                <Text style={styles.rankPosition}>{index + 1}</Text>
                                <Text style={styles.rankName}>{player.name}</Text>
                            </View>
                            <Text style={{ ...styles.rankPoints, color: 'white' }}>{player.points} punti</Text>
                        </View>
                    ))}

                    {/* Bottone per vedere la classifica completa */}
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('FullParticipantsRankingScreen')}
                        style={styles.fullRankingButton}
                    >
                        Classifica Completa
                    </Button>
                </Card>

                {/* Schema delle Partite */}
                <Card style={{ ...styles.section, backgroundColor: 'transparent', padding: 5, marginTop: 10 }}>
                    <Text style={{ color: 'white', fontSize: 25 }}>Partite Giornata 12</Text>
                    {matches.map((match) => (
                        <View key={match.id} style={styles.matchItem}>
                            {/* Dettaglio del match */}
                            <View style={styles.matchDetails}>
                                <View style={styles.leagueBadgeContainer}>
                                    <Badge style={{ backgroundColor: colors.primary }}>Serie A</Badge>
                                </View>
                                <Text style={styles.matchText}>{match.home} vs {match.away}</Text>
                                <Text style={styles.matchTime}>{match.time}</Text>
                            </View>
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionCountDown: {
        padding: 20,
        borderRadius: 0,
    },
    countdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leagueBadgeCountDown: {
        marginBottom: 5,
        padding: 5,
        borderRadius: 12,
        backgroundColor: COLORJS.primary,
    },
    matchdayText: {
        fontSize: 14,
        color: 'white',
    },
    compactCountdownContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    countdownNumber: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
    },
    insertButton: {
        marginTop: 10,
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
        marginBottom: 15,
    },
    rankItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    rankPosition: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginRight: 10,
    },
    rankName: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
    rankPoints: {
        fontSize: 16,
    },
    fullRankingButton: {
        marginTop: 10,
    },
    matchItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    leagueBadgeContainer: {
        marginBottom: 10,
        padding: 5,
        borderRadius: 12,
        backgroundColor: COLORJS.primary,
    },
    matchDetails: {
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        flex: 1,
    },
    matchText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    matchTime: {
        fontSize: 14,
        color: '#aaa',
    },
});

