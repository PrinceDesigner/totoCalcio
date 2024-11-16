import moment from 'moment-timezone';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { Card, Badge, useTheme, Button, ActivityIndicator, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDayDetails } from '../redux/slice/infogiornataAttualeSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { COLORJS } from '../theme/themeColor';
import { fetchPrediction } from '../redux/slice/predictionsSlice';
import { fetchParticipantsThunk } from '../redux/slice/partecipantsSlice';
import { getUserLeaguesByIdThunk, getUserLeaguesThunk, selectLeagueById } from '../redux/slice/leaguesSlice';
import * as Clipboard from 'expo-clipboard'; // Importa Clipboard
import { Share } from 'react-native';
import { getGiornataAttuale } from '../services/infoGiornataService';
import MatchItem from './componentScreen/MatchItem';
import { clearRefresh } from '../redux/slice/refreshSlice';
import RankingList from './componentScreen/RankingList';
import fontStyle from '../theme/fontStyle';
import { BannerAdComponent } from '../components/Adv/AdvBanner';
import DailyQuestion from './componentScreen/quiz/DailyQuestions';


export default function LeagueDetails({ navigation }) {
    const { colors } = useTheme();

    const dispatch = useDispatch();

    let [giornataAttuale, setGiornataAttuale] = useState();
    const [refreshing, setRefreshing] = useState(false);
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [loading, setLoading] = useState(true); // Stato di loading per il cambiamento di isPast
    const [isPast, setIsPast] = useState(false);  // Stato che indica se la giornata è passata

    giornataAttuale = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const infogiornataAttuale = useSelector((state) => state.infogiornataAttuale);
    const schedinaGiocata = useSelector((state) => state.insertPredictions.schedinaInserita.schedina);

    // Selettori per ottenere le informazioni necessarie
    const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));
    const provisionalRanking = useSelector((state) => state.partecipantiLegaCorrente.participants);
    const provisionalRankingLoading = useSelector((state) => state.partecipantiLegaCorrente.loading);
    // selettore di refreshdata
    const refreshRequired = useSelector((state) => state.refresh.refreshRequired);

    // id Partecipanti
    const userIds = selectedLeague?.members;
    const matches = infogiornataAttuale.matches;

    const matchdayNumber = infogiornataAttuale.dayId && infogiornataAttuale.dayId.replace('RegularSeason-', '') || 0;
    const startDate = infogiornataAttuale && infogiornataAttuale.startDate;

    const sortedMatches = [...matches].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));



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

    useEffect(() => {
        const checkUserMembership = () => {
            const userIds = selectedLeague?.members;
            if (!userIds.includes(userId)) {
                navigation.navigate('Home1', { refresh: true });
            }
        };

        if (selectedLeague) {
            checkUserMembership();
        }
    }, [selectedLeague]);

    useEffect(() => {
        if (refreshRequired) {
            // Effettua la chiamata per aggiornare i dati
            if (giornataAttuale && dayId && leagueId && userId && userIds.length) {
                // Se sono disponibili, esegui fetchDataInParallel
                fetchLeagueById(leagueId)
                fetchGiornataAttuale()
                fetchDataInParallel()
            }
            // Una volta ricaricati i dati, ripristina il flag di refresh
            dispatch(clearRefresh());
        }
    }, [refreshRequired, dispatch]);

    useEffect(() => {
        // Simuliamo un delay per aggiornare isPast, ad esempio quando startDate cambia
        const checkIsPast = async () => {
            try {
                setLoading(true);  // Imposta loading su true mentre si calcola

                // Calcola se la data è passata
                const result = isDatePast(startDate);

                // Aggiorna lo stato isPast con il risultato calcolato
                setIsPast(result);
            } catch (error) {
                console.error('Errore durante il controllo della data:', error);
            } finally {
                setLoading(false); // Imposta loading su false una volta terminato
            }
        };

        checkIsPast();
    }, [startDate]); // Ogni volta che cambia startDate, ricontrolla isPast

    useEffect(() => {
        // Verifica che tutti i valori siano disponibili prima di effettuare le chiamate
        if (giornataAttuale && dayId && leagueId && userId && userIds.length) {
            // Se sono disponibili, esegui fetchDataInParallel
            fetchDataInParallel();
        }
    }, [giornataAttuale, dayId]);

    useEffect(() => {
        if (!startDate) return; // Assicurati che startDate sia definito prima di avviare il countdown.

        // Definisci una funzione per calcolare il countdown rimanente
        const calculateCountdown = () => {
            const now = moment().utc(true).tz("Europe/Rome");
            const targetTime = moment(startDate);
            const duration = moment.duration(targetTime.diff(now));

            if (duration.asMilliseconds() <= 0) {
                // Se il targetTime è passato, ferma il countdown
                setCountdown({ days: '0', hours: '00', minutes: '00' });
                return;
            }

            // Aggiorna i valori del countdown
            const days = Math.floor(duration.asDays());
            const hours = Math.floor(duration.hours()); // Usa direttamente `.hours()` per maggiore chiarezza
            const minutes = Math.floor(duration.minutes());

            setCountdown({
                days: days.toString(),
                hours: hours < 10 ? `0${hours}` : hours.toString(),
                minutes: minutes < 10 ? `0${minutes}` : minutes.toString(),
            });
        };

        // Calcola immediatamente il countdown all'inizio
        calculateCountdown();

        // Imposta un intervallo per aggiornare il countdown ogni minuto, tranne nei minuti finali
        const interval = setInterval(() => {
            calculateCountdown();
        }, 1000); // Ogni secondo (puoi fare ogni minuto con `60000` se preferisci ridurre le risorse)

        return () => clearInterval(interval); // Pulisci l'interval quando il componente viene smontato
    }, [startDate]);


    const isDatePast = (inputDate) => {
        if (!inputDate) {
            // Se la data di input non è valida, restituisci null
            return null;
        }

        // Configura la data di input usando moment e imposta il fuso orario a "Europe/Rome"
        const date = moment.tz(inputDate, "Europe/Rome");

        // Ottieni l'orario attuale e imposta il fuso orario a "Europe/Rome"
        const currentDate = moment().utc(true).tz("Europe/Rome");

        // Confronta le date e restituisci true se la data di input è minore dell'orario attuale
        return date.isBefore(currentDate);
    };


    // Fetch specific league by ID
    const fetchLeagueById = async (leagueId) => {
        try {
            dispatch(showLoading()); // Mostra lo stato di caricamento
            await dispatch(getUserLeaguesByIdThunk(leagueId)).unwrap(); // Attendi che il thunk termini
        } catch (error) {
            console.error('Errore durante il recupero della lega:', error);
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
        fetchLeagueById(leagueId).then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
        fetchGiornataAttuale().then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
        fetchDataInParallel();
    };

    const renderConuntDown = () => {
        if (loading) {
            // Mostra un indicatore di caricamento mentre si sta calcolando `isPast`
            return <ActivityIndicator size="large" color={colors.primary} />;
        }

        if (isPast === null) {
            // Se `isPast` è null (cioè non c'è una data valida), puoi mostrare qualcosa come un placeholder o un messaggio
            return <ActivityIndicator size="large" color={colors.primary} />;
        }

        return isPast ? (liveSection) : countdownAndButton;
    };


    // Sezione Countdown e Bottone
    const countdownAndButton = (
        <>
            <View style={styles.compactCountdownContainer}>
                <Text style={styles.countdownNumber}>
                    {countdown.days}d {countdown.hours}h {countdown.minutes}m
                </Text>
            </View>
            <Button
                mode="outlined"
                onPress={() => navigation.navigate('InsertResults')}
                style={styles.insertButton}
                labelStyle={{
                    ...fontStyle.textBold
                }}
            >
                {schedinaGiocata ? 'Modifica Esiti' : 'Inserisci Esiti'}
            </Button>
            <View style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <BannerAdComponent />
            </View>
        </>
    );

    // Sezione Live
    const liveSection = (
        <>
            <Text style={{ textAlign: 'center', color: 'red', fontSize: 30, ...fontStyle.textMedium }}>LIVE</Text>
            <Button
                mode="outlined"
                onPress={() => navigation.navigate('EsitiInseriti')}
                style={styles.insertButton}
                labelStyle={{
                    ...fontStyle.textBold
                }}
            >
                Clicca per guardare i tuoi Esiti
            </Button>
            <View style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <BannerAdComponent />
            </View>
        </>
    );


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Countdown Section */}
            <View style={{ ...styles.sectionCountDown, backgroundColor: colors.background }}>
                <View style={styles.countdownHeader}>
                    {/* Badge compatto */}
                    <View style={styles.leagueBadgeCountDown}>
                        <Badge style={{ backgroundColor: colors.primary, ...fontStyle.textBold }}>Serie A</Badge>
                    </View>
                    <View >
                        <Text style={{ color: 'white', ...fontStyle.textBold }}>{selectedLeague?.name}</Text>
                    </View>

                    {/* Numero di giornata */}
                    <View style={styles.leagueBadgeCountDown}>
                        <Badge style={{ backgroundColor: colors.primary, ...fontStyle.textBold }}> Giornata {matchdayNumber}</Badge>
                    </View>
                </View>

                {/* Contenuto della sezione Countdown e Live */}
                {renderConuntDown()}
            </View>

            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Classifica Provvisoria */}
                <View style={{ ...styles.section, marginBottom: 0 }}>
                    <Text style={{ ...styles.sectionTitle, color: 'white' }}>Classifica Provvisoria</Text>

                    {provisionalRankingLoading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            <RankingList ranking={provisionalRanking.slice(0, 6)} size={20} />

                            {/* Bottone per vedere la classifica completa */}
                            <Button
                                mode="contained"
                                onPress={() => navigation.navigate('FullParticipantsRankingScreen')}
                                style={styles.fullRankingButton}
                                labelStyle={{
                                    ...fontStyle.textBold
                                }}
                            >
                                Classifica Completa
                            </Button>
                        </>
                    )}
                </View>
                <View style={styles.shareAction}>
                    <View style={{borderRightWidth: 1, borderRightColor: colors.primary, paddingRight: 10}}>
                        <Text style={{ color: 'white', fontSize: 15, ...fontStyle.textBold }}>ID Lega: {leagueId}</Text>
                        <Text style={{ color: 'white', fontSize: 12, ...fontStyle.textLight }}>Condividi con i tuoi amici</Text>
                    </View>

                    <View style={{ ...styles.flexRow, marginTop: 10 }}>
                        <TouchableOpacity style={{ marginRight: 10 }} onPress={copyToClipboard}>
                            <Avatar.Icon size={35} icon="content-copy" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={shareLeagueId}>
                            <Avatar.Icon size={35} icon="share-variant" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Daily question */}
                {/* <DailyQuestion /> */}

                {/* Schema delle Partite */}
                <View style={{ ...styles.section, backgroundColor: 'transparent', padding: 5, marginBottom: 10 }}>

                    {sortedMatches.map((match, i) => {
                        if (i === 5) {
                            return (
                                <React.Fragment key={`match-${match.matchId}`}>
                                    <View style={{ marginTop: 10, marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <BannerAdComponent />
                                    </View>
                                    <MatchItem match={match} />
                                </React.Fragment>
                            );
                        } else {
                            return <MatchItem key={`match-${match.matchId}`} match={match} />;
                        }

                    }
                    )}

                </View>

                {selectedLeague.ownerId.includes(userId) ? <Button
                    mode="contained"
                    onPress={() => navigation.navigate('EditLeagueScreen')}
                    style={{ ...styles.insertButton }}
                    labelStyle={{
                        ...fontStyle.textBold
                    }}

                >
                    Modifica Lega
                </Button> : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    sectionCountDown: {
        padding: 20,
        borderRadius: 0,
        paddingBottom: 10
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
        backgroundColor: COLORJS.surface
    },
    sectionTitle: {
        fontSize: 20,
        marginBottom: 10,
        ...fontStyle.textMedium
    },
    fullRankingButton: {
        marginTop: 10,
    },
    flexRow: {
        display: 'flex',
        flexDirection: 'row'
    },
    shareAction: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 15,
        borderColor: COLORJS.surface,
        borderWidth: 1,
        marginTop: 10,
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    }
});

