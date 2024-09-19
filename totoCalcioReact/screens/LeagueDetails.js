import moment from 'moment-timezone';
import { useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Card, Badge, useTheme, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDayDetails } from '../redux/slice/infogiornataAttualeSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { COLORJS } from '../theme/themeColor';


export default function LeagueDetails({ navigation }) {
    const { colors } = useTheme();

    const dispatch = useDispatch();

    const giornataAttuale = useSelector((state) => state.giornataAttuale.giornataAttuale); // Stato delle leghe
    const infogiornataAttuale = useSelector((state) => state.infogiornataAttuale); // Stato delle leghe

    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const matchdayNumber = infogiornataAttuale.dayId && infogiornataAttuale.dayId.replace('RegularSeason-', '') || 0;
    const deadline = infogiornataAttuale && infogiornataAttuale.startDate; // Simuliamo una scadenza a 1 ora da adesso

    useEffect(() => {
        const getDayDetails = async () => {
            try {
                dispatch(showLoading()); // Mostra lo stato di caricamento
                await dispatch(fetchDayDetails(giornataAttuale)).unwrap(); // Recupera i dettagli della giornata
            } catch (error) {
                console.error('Errore durante il recupero della giornata:', error);
            } finally {
                dispatch(hideLoading()); // Nascondi lo stato di caricamento
            }
        };

        getDayDetails();
    }, [dispatch]);


    const provisionalRanking = [
        { id: '1', name: 'Mario Rossi', points: 150 },
        { id: '2', name: 'Luigi Bianchi', points: 140 },
        { id: '3', name: 'Giovanni Verdi', points: 130 },
        { id: '4', name: 'Francesco Neri', points: 120 },
        { id: '5', name: 'Carlo Blu', points: 110 },
        { id: '6', name: 'Alessandro Gialli', points: 100 },
    ];

    // matches per quella giornata
    const matches = infogiornataAttuale.matches;

    const convertToItalianTime = (dateString) => {
        // Crea un nuovo oggetto Date dalla stringa ISO
        return moment.tz(dateString, "Europe/Rome").format('HH:mm');
      };

      useEffect(() => {
        const interval = setInterval(() => {
          const now = moment(); // Ottieni la data attuale
          const targetTime = moment(deadline).utcOffset('+02:00'); // Aggiungi 2 ore all'ora UTC (fuso orario italiano)
    
          const duration = moment.duration(targetTime.diff(now)); // Calcola la differenza tra deadline e ora attuale
    
          if (duration.asMilliseconds() <= 0) {
            clearInterval(interval); // Ferma il timer se il countdown è finito
            setCountdown({ days: '0', hours: '00', minutes: '00' });
          } else {
            const days = Math.floor(duration.asDays());
            const hours = Math.floor(duration.asHours() % 24); // Restanti ore
            const minutes = Math.floor(duration.asMinutes() % 60); // Restanti minuti
    
            setCountdown({
              days: days.toString(),
              hours: hours < 10 ? `0${hours}` : hours.toString(), // Formatta con 2 cifre
              minutes: minutes < 10 ? `0${minutes}` : minutes.toString(), // Formatta con 2 cifre
            });
          }
        }, 1000); // Aggiorna ogni secondo
    
        return () => clearInterval(interval); // Pulisci l'interval quando il componente viene smontato
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
                    {countdown.days}d {countdown.hours}h {countdown.minutes}m
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
                    <Text style={{ color: 'white', fontSize: 25 }}>Partite Giornata {matchdayNumber}</Text>
                    {matches.map((match) => (
                        <View key={match.matchId} style={styles.matchItem}>
                            {/* Dettaglio del match */}
                            <View style={styles.matchDetails}>
                                <View style={styles.leagueBadgeContainer}>
                                    <Badge style={{ backgroundColor: colors.primary }}>Serie A</Badge>
                                </View>
                                <Text style={styles.matchText}>{match.homeTeam} vs {match.awayTeam}</Text>
                                <Text style={styles.matchTime}>{convertToItalianTime(match.startTime)}</Text>
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

