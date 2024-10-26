import moment from 'moment-timezone';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { Card, Badge, useTheme, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDayDetails } from '../redux/slice/infogiornataAttualeSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { COLORJS } from '../theme/themeColor';
import { fetchPrediction } from '../redux/slice/predictionsSlice';
import { fetchParticipantsThunk } from '../redux/slice/partecipantsSlice';
import { Image } from 'react-native'; // Importa il componente Image
import { getUserLeaguesThunk, selectLeagueById } from '../redux/slice/leaguesSlice';
import * as Clipboard from 'expo-clipboard'; // Importa Clipboard
import { Share } from 'react-native';
import { getGiornataAttuale } from '../services/infoGiornataService';



export default function LeagueDetails() {
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    const navigation = useNavigation();

    const dispatch = useDispatch();
    let [giornataAttuale, setGiornataAttuale] = useState();
    giornataAttuale = useSelector((state) => state.giornataAttuale.giornataAttuale); // Stato delle leghe
    const infogiornataAttuale = useSelector((state) => state.infogiornataAttuale);
    const schedinaGiocata = useSelector((state) => state.insertPredictions.schedinaInserita.schedina);
    // Selettori per ottenere le informazioni necessarie
    const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);

    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));

    // id Partecipanti
    const userIds = selectedLeague.members;

    const route = useRoute(); // Ottieni l'oggetto route

    //partecipanti
    const provisionalRanking = useSelector((state) => state.partecipantiLegaCorrente.participants);

    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const matchdayNumber = infogiornataAttuale.dayId && infogiornataAttuale.dayId.replace('RegularSeason-', '') || 0;
    const deadline = infogiornataAttuale && infogiornataAttuale.startDate;


    // Funzione per copiare l'ID della lega
    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(leagueId);
        alert('ID della lega copiato negli appunti');
    };

    // Funzione per condividere l'ID della lega
    const shareLeagueId = async () => {
        try {
            const result = await Share.share({
                message: `${leagueId}`,
            });
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Condivisione riuscita con un'attività specifica
                } else {
                    // Condivisione riuscita
                }
            } else if (result.action === Share.dismissedAction) {
                // Condivisione annullata
            }
        } catch (error) {
            alert('Errore durante la condivisione: ' + error.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            // Verifica che tutti i valori siano disponibili prima di effettuare le chiamate
            if (giornataAttuale && dayId && leagueId && userId && userIds.length) {
                // Se sono disponibili, esegui fetchDataInParallel
                fetchDataInParallel();
            }
    
            // Questa funzione serve per "pulire" l'effetto quando la schermata perde il focus
            // Qui possiamo aggiungere del codice di cleanup se necessario
            return () => {
                // Se hai bisogno di pulire qualche stato o listener, fallo qui
            };
        }, [giornataAttuale, dayId, leagueId, userId, userIds, fetchDataInParallel])
    );


    const isDatePast = (inputDate) => {
        if (deadline) {
            // Configura la data di input usando moment e imposta il fuso orario a "Europe/Rome"
            const date = moment.tz(inputDate, "Europe/Rome");

            // Ottieni l'orario attuale e imposta il fuso orario a "Europe/Rome"
            const currentDate = moment.tz("Europe/Rome").format('YYYY-MM-DDTHH:mm:ss+00:00');

            // Confronta le date e restituisci true se la data di input è minore dell'orario attuale
            return date.isBefore(currentDate);
        } else {
            return '..'
        }
    };

    const fetchLeagues = async () => {
        try {
            dispatch(showLoading()); // Mostra lo stato di caricamento
            await dispatch(getUserLeaguesThunk()).unwrap(); // Attendi che il thunk termini
        } catch (error) {
            console.error('Errore durante il recupero delle leghe:', error);
        } finally {
            dispatch(hideLoading()); // Nascondi lo stato di caricamento
        }
    };

    // Esempio di utilizzo all'interno di un useEffect in un componente
    const fetchGiornataAttuale = async () => {
        try {
            const giornata = await getGiornataAttuale();
            setGiornataAttuale(giornata)
        } catch (error) {
            console.error('Errore durante il recupero della giornata attuale:', error);
        }
    };


    const fetchDataInParallel = async () => {
        try {
            dispatch(showLoading()); // Mostra lo stato di caricamento

            // Esegui entrambe le chiamate in parallelo con Promise.all
            await Promise.all([
                dispatch(fetchDayDetails(giornataAttuale)).unwrap(), // Recupera i dettagli della giornata
                dispatch(fetchPrediction({ dayId, leagueId, userId })).unwrap(),// Controlla la predizione
                dispatch(fetchParticipantsThunk({ userIds, leagueId })).unwrap(),
            ]);


        } catch (error) {
            console.error('Errore durante il recupero dei dati:', error);
        } finally {
            setRefreshing(false); // Imposta il caricamento su false
            dispatch(hideLoading());
        }
    };


    // Funzione per gestire il refresh
    const onRefresh = () => {
        fetchLeagues().then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
        fetchGiornataAttuale().then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
    };

    const matches = infogiornataAttuale.matches;

    const convertToItalianTime = (dateString) => {
        // Crea un nuovo oggetto Date dalla stringa ISO
        return moment(dateString).utc().format('HH:mm');
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const now = moment().utc("Europe/Rome"); // Ottieni la data attuale
            const targetTime = moment(deadline);
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
                    <View >
                        <Text style={{ color: 'white' }}>{selectedLeague.name}</Text>
                    </View>

                    {/* Numero di giornata */}
                    <View style={styles.leagueBadgeCountDown}>
                        <Badge style={{ backgroundColor: colors.primary }}> Giornata {matchdayNumber}</Badge>
                    </View>
                </View>

                {/* Countdown visual nello stile "10:10:10" */}
                {!isDatePast(deadline) ? <View style={styles.compactCountdownContainer}>
                    <Text style={styles.countdownNumber}>
                        {countdown.days}d {countdown.hours}h {countdown.minutes}m
                    </Text>
                </View> : null}

                {/* Bottone "Inserisci Esiti" */}
                {!isDatePast(deadline) ? <Button
                    mode="contained"
                    onPress={() => navigation.navigate('InsertResults')}
                    style={styles.insertButton}
                >
                    {schedinaGiocata ? 'Modifica Esiti' : 'Inserisci Esiti'}
                </Button> :
                    <>
                        <Text style={{ textAlign: 'center', color: 'red', fontSize: 30 }}>LIVE</Text>
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('EsitiInseriti')}
                            style={styles.insertButton}
                        >
                            Clicca per guardare i tuoi Esiti
                        </Button>
                    </>

                }
            </View>

            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Classifica Provvisoria */}
                <Card style={{ ...styles.section, marginBottom: 0 }}>
                    <Text style={{ ...styles.sectionTitle, color: 'white' }}>Classifica Provvisoria</Text>
                    {[...provisionalRanking]
                        .sort((a, b) => b.punti - a.punti)
                        .map((player, index) => (
                            <View key={index + 1} style={styles.rankItem}>
                                <View style={{ display: 'flex', flexDirection: 'row' }}>
                                    <Text style={styles.rankPosition}>{index + 1}</Text>
                                    <Text style={styles.rankName}>{player.displayName}</Text>
                                </View>
                                <Text style={{ ...styles.rankPoints, color: 'white' }}>{player.punti} punti</Text>
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

                {/* Sezione per copiare e condividere l'ID della lega */}
                <Card style={{ ...styles.section, marginTop: 20 }}>
                    <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>Condividi la tua Lega</Text>
                    <Text style={{ color: 'white', fontSize: 16 }}>ID Lega: {leagueId}</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <Button
                            mode="contained"
                            onPress={copyToClipboard}
                            style={styles.copyButton}
                        >
                            Copia ID
                        </Button>

                        <Button
                            mode="contained"
                            onPress={shareLeagueId}
                            style={styles.shareButton}
                        >
                            Condividi
                        </Button>
                    </View>
                </Card>

                {/* Schema delle Partite */}
                <Card style={{ ...styles.section, backgroundColor: 'transparent', padding: 5, marginBottom: 10 }}>
                    <View>
                        <Text style={{ color: 'white', fontSize: 25 }}>Giornata {matchdayNumber}</Text>
                    </View>
                    {matches.map((match) => (
                        <View key={match.matchId} style={{ ...styles.matchItem, backgroundColor: colors.surface }}>
                            {/* Dettaglio del match */}
                            <View style={styles.matchDetails}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                    <View style={styles.leagueBadgeContainer}>
                                        <Badge style={{ backgroundColor: colors.primary }}>Serie A</Badge>
                                    </View>
                                    <View style={styles.leagueBadgeContainer}>
                                        <Badge style={{ backgroundColor: colors.primary }}>{match.stadio}</Badge>
                                    </View>
                                </View>

                                {/* Sezione con i loghi delle squadre e i nomi */}
                                <View style={styles.teamContainer}>
                                    <View style={styles.team}>
                                        <Image
                                            source={{ uri: match.homeLogo }}
                                            style={styles.teamLogo}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.teamName}>{match.homeTeam}</Text>
                                    </View>

                                    <Text style={styles.vsText}>vs</Text>

                                    <View style={styles.team}>
                                        <Image
                                            source={{ uri: match.awayLogo }}
                                            style={styles.teamLogo}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.teamName}>{match.awayTeam}</Text>
                                    </View>
                                </View>

                                <Text style={styles.matchTime}>{convertToItalianTime(match.startTime)}</Text>
                            </View>
                        </View>
                    ))}
                </Card>

                <Button
                    mode="contained"
                    onPress={() => navigation.navigate('EditLeagueScreen', { leagueId })}
                    style={{ ...styles.insertButton }}
                >
                    Modifica Lega
                </Button>
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
        marginBottom: 10,
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
    leagueBadgeContainer: {
        marginBottom: 10,
        padding: 5,
        borderRadius: 12,
        backgroundColor: COLORJS.primary,
    },

    matchItem: {
        marginVertical: 5,
        borderRadius: 5,
        fontSize: 14,
        color: '#aaa',
        padding: 10

    },
    matchDetails: {
        // paddingHorizontal: 10,
    },
    leagueBadgeContainer: {
        marginBottom: 5,
    },
    matchText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    matchTime: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
    },
    teamContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
    },
    team: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    teamLogo: {
        width: 30,
        height: 30,
        marginRight: 5,
    },
    teamName: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    vsText: {
        color: 'white',
        fontSize: 14,
        marginHorizontal: 5,
    },
});

