import moment from 'moment-timezone';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, RefreshControl, ImageBackground } from 'react-native';
import { Card, Badge, useTheme, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDayDetails } from '../redux/slice/infogiornataAttualeSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { COLORJS } from '../theme/themeColor';
import { fetchPrediction } from '../redux/slice/predictionsSlice';
import { membersInfoForLeagueNameThunk, selectLeagueById } from '../redux/slice/leaguesSlice';
import * as Clipboard from 'expo-clipboard'; // Importa Clipboard
import { Share } from 'react-native';
import { getGiornataAttuale } from '../services/infoGiornataService';
import MatchItem from './componentScreen/MatchItem';
import { clearRefresh } from '../redux/slice/refreshSlice';
import RankingList from './componentScreen/RankingList';
import fontStyle from '../theme/fontStyle';
// import { BannerAdComponent } from '../components/Adv/AdvBanner';
import Wrapper from './componentScreen/Container';
import { fetchGiornateCalcolateThunk } from '../redux/slice/giornateDaCalcolareSlice';
import GiornateDaCalcolareItemList from './componentScreen/GiornateDaCalcolareItemList';
import { setSelectedGiornata, setSelectedLeagueGiornata } from '../redux/slice/selectedLeagueSlice';
import CustomDropdownSelectLeague from '../components/DropDownSelectLeague/DropDownSelectLeague';
import { getMembersInfoForLeague, getMembersInfoForLeagueLive } from '../services/leagueService';
import { setLiveStatus } from '../redux/slice/isLiveSlice';

export default function LeagueDetails({ navigation }) {
    const { colors } = useTheme();

    const dispatch = useDispatch();

    // let [giornataAttuale, setGiornataAttuale] = useState();
    const [refreshing, setRefreshing] = useState(false);
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [loading, setLoading] = useState(true); // Stato di loading per il cambiamento di isPast
    const isPast = useSelector((state) => state.liveStatus.isLive);

    const [members, setMembers] = useState([]);  // Stato che indica se la giornata è passata

    const giornataAttuale = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const infogiornataAttuale = useSelector((state) => state.infogiornataAttuale);
    const schedinaGiocata = useSelector((state) => state.insertPredictions.schedinaInserita.schedina);

    const leaguesState = useSelector((state) => state.leagues.leagues); // Stato delle leghe

    // Selettori per ottenere le informazioni necessarie
    const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));

    const giornateCalcolate = useSelector((state) => state.giornateDaCalcolareReducer.giornate);
    const giornateCalcolateLoading = useSelector((state) => state.giornateDaCalcolareReducer.loading);

    // selettore di refreshdata
    const refreshRequired = useSelector((state) => state.refresh.refreshRequired);

    const matches = [...infogiornataAttuale.matches].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const [updatedParticipants, setUpdatedParticipants] = useState([]);

    const matchdayNumber = infogiornataAttuale.dayId && infogiornataAttuale.dayId.replace('RegularSeason-', '') || 0;
    const startDate = infogiornataAttuale && infogiornataAttuale.startDate;

    // controllo per evidenziare la tua posizione
    const sortedRanking = [...members].sort((a, b) => b.punti - a.punti).slice(0, 6);


    useEffect(() => {
        if (giornataAttuale) {
            fetchDataInParallel();
        }
    }, [giornataAttuale, leagueId]);

    useEffect(() => {
        fetchLeagueById(leagueId);
    }, [isPast, leagueId]); // Effettua il fetch quando isPast cambia a true

    useEffect(() => {
        if (selectedLeague.ownerId.includes(userId)) {
            fetchGiornateDaCalcolare(leagueId)
        }
    }, [dispatch, leagueId]);

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
        if (refreshRequired) {
            // Effettua la chiamata per aggiornare i dati
            if (giornataAttuale && leagueId && userId) {
                dispatch(fetchPrediction({ giornataAttuale, leagueId, userId })).unwrap()// Controlla la predizione
                // Se sono disponibili, esegui fetchDataInParallel
                if (selectedLeague.ownerId.includes(userId)) {
                    fetchGiornateDaCalcolare(leagueId)
                }
                fetchGiornataAttuale().then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
                dispatch(fetchDayDetails(giornataAttuale)).unwrap(), // Recupera i dettagli della giornata
                    fetchLeagueById(leagueId).then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh

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
                console.log('pastResult', result);
                if (result !== null) {
                    // setIsPast(result);
                    dispatch(setLiveStatus(result))
                }

            } catch (error) {
                console.error('Errore durante il controllo della data:', error);
            } finally {
                setLoading(false); // Imposta loading su false una volta terminato
            }
        };

        checkIsPast();
    }, [startDate]); // Ogni volta che cambia startDate, ricontrolla isPast

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

            if (days === 0 && hours === 0 && minutes === 0) {
                // setIsPast(true)
                dispatch(setLiveStatus(true))
            }

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
            let membersResult;
            dispatch(showLoading()); // Mostra lo stato di caricamento
            if (isPast) {
                membersResult = await getMembersInfoForLeagueLive(leagueId, giornataAttuale);
            }
            if (isPast === false) {
                membersResult = await getMembersInfoForLeague(leagueId);
            }
            setMembers(membersResult)
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
            dispatch(setSelectedGiornata({ giornataAttuale: giornata }));
        } catch (error) {
            console.error('Errore durante il recupero della giornata attuale:', error);
        }
    };

    const fetchGiornateDaCalcolare = async (leagueId) => {
        try {
            await dispatch(fetchGiornateCalcolateThunk(leagueId)).unwrap();
        } catch (error) {
            console.error('Errore durante il recupero delle giornate da calcolare:', error);
        }
    };

    const fetchDataInParallel = async () => {
        try {
            dispatch(showLoading()); // Mostra lo stato di caricamento

            // Esegui entrambe le chiamate in parallelo con Promise.all
            await Promise.all([
                dispatch(fetchDayDetails(giornataAttuale)).unwrap(), // Recupera i dettagli della giornata
                dispatch(fetchPrediction({ giornataAttuale, leagueId, userId })).unwrap(),// Controlla la predizione
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
        fetchGiornataAttuale().then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
        dispatch(fetchDayDetails(giornataAttuale)).unwrap(), // Recupera i dettagli della giornata
            fetchLeagueById(leagueId).then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
    };

    const changeLeague = async (idLega) => {
        dispatch(setSelectedLeagueGiornata({ giornataAttuale: giornataAttuale, legaSelezionata: idLega }));
    }

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
                mode="contained"
                onPress={() => navigation.navigate('InsertResults')}
                style={styles.insertButton}
                labelStyle={{
                    ...fontStyle.textBold
                }}
            >
                {schedinaGiocata ? 'Modifica Esiti' : 'Inserisci Esiti'}
            </Button>

        </>
    );

    // Sezione Live
    const liveSection = (
        <>
            <Text style={{ textAlign: 'center', color: 'red', fontSize: 30, ...fontStyle.textMedium }}>LIVE</Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate('EsitiInseriti', { members: members })}
                style={styles.insertButton}
                labelStyle={{
                    ...fontStyle.textBold
                }}
            >
                Clicca per guardare gli esiti
            </Button>

        </>
    );

    const giornataSingolaDaCalcolare = () => {
        if (selectedLeague.ownerId.includes(userId) && giornateCalcolate.length > 0 && [...giornateCalcolate].some(el => !el.calcolate)) {
            if (giornateCalcolateLoading) {
                return (
                    <View style={{ height: 60 }}>
                        <ActivityIndicator size={'large'} />
                    </View>
                )
            } else {
                return (
                    <View>
                        <Text style={{ color: 'white', ...fontStyle.textLight, fontSize: 20, marginBottom: 10 }}>Giornate non calcolata</Text>
                        <GiornateDaCalcolareItemList leagueId={leagueId} giornateCalcolate={[...giornateCalcolate].filter(el => !el.calcolate)} />
                    </View>
                )

            }
        } else {
            return null
        }
    }


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.headerOptions}>
                <View style={styles.headerOptionsTitle}>
                    <CustomDropdownSelectLeague data={leaguesState} onSelect={changeLeague} leagueId={leagueId} />
                </View>
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    {/* <TouchableOpacity>
                        <Avatar.Icon backgroundColor={'transparent'} color={COLORJS.primary} size={35} icon="bell" />
                    </TouchableOpacity> */}
                    {selectedLeague.ownerId.includes(userId) ?
                        <TouchableOpacity onPress={() => navigation.navigate('EditLeagueScreen')} >
                            <Avatar.Icon backgroundColor={'transparent'} color={COLORJS.primary} size={35} icon="cog" />
                        </TouchableOpacity> : null
                    }
                </View>
            </View>
            {/* Countdown Section */}
            <ImageBackground
                source={require('../campo2.jpg')} // Sostituisci con il percorso dell'immagine
                resizeMode="cover"
                style={{ ...styles.sectionCountDown, backgroundColor: colors.background }}>
                <View style={styles.countdownHeader}>
                    {/* Badge compatto */}
                    <View style={styles.leagueBadgeCountDown}>
                        <Badge style={{ backgroundColor: colors.primary, ...fontStyle.textBold }}>Serie A</Badge>
                    </View>

                    {/* Numero di giornata */}
                    <View style={styles.leagueBadgeCountDown}>
                        <Badge style={{ backgroundColor: colors.primary, ...fontStyle.textBold }}> Giornata {matchdayNumber}</Badge>
                    </View>

                </View>

                {/* Contenuto della sezione Countdown e Live */}
                {renderConuntDown()}

            </ImageBackground>

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                        refreshing={refreshing}
                        onRefresh={onRefresh} />}>
                <Wrapper>
                    {/* <View style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <BannerAdComponent />
                    </View> */}
                    {/* Classifica Provvisoria */}
                    <View style={[{ ...styles.section, marginBottom: 0 },
                    isPast ? styles.activeStyle : {}  // Aggiunge activeStyle quando isActive è true
                    ]}>
                        <View style={styles.rowHeaderRanking}>
                            <Text style={{ ...styles.sectionTitle, color: 'white' }}>Classifica
                                {isPast ? <Text style={{ color: 'red', ...fontStyle.textBoldItalic }}> LIVE</Text> : null}
                            </Text>
                            <Text style={{ color: COLORJS.primary }}>{members.length} Partecipanti</Text>
                        </View>
                        <>
                            <RankingList ranking={sortedRanking} size={20} />

                            {/* Bottone per vedere la classifica completa */}
                            <Button
                                mode="outlined"
                                icon={'format-list-bulleted'}
                                onPress={() => navigation.navigate('FullParticipantsRankingScreen')}
                                style={styles.fullRankingButton}
                                labelStyle={{
                                    ...fontStyle.textBold
                                }}
                            >
                                Classifica Completa
                            </Button>
                        </>
                    </View>
                    <View style={styles.shareAction}>
                        <View style={{ paddingRight: 10 }}>
                            <Text style={{ fontSize: 15, ...fontStyle.textBold }}>{leagueId}</Text>
                            <Text style={{ fontSize: 12, ...fontStyle.textLight }}>Condividi con i tuoi amici</Text>
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
                    {giornataSingolaDaCalcolare()}



                    {/* Daily question */}
                    {/* <DailyQuestion /> */}

                    {/* Schema delle Partite */}
                    <View style={{ ...styles.section, backgroundColor: 'transparent', padding: 0, marginBottom: 10 }}>
                        <Text style={{ color: 'white', ...fontStyle.textLight, fontSize: 20, marginBottom: 10 }}>{`Giornata ${giornataAttuale}`.replace('RegularSeason-', '') || 0}</Text>

                        {matches.map((match, i) => {
                            if (i === 5) {
                                return (
                                    <React.Fragment key={`match-${match.matchId}`}>
                                        {/* <View style={{ marginTop: 10, marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <BannerAdComponent />
                                        </View> */}
                                        <MatchItem match={match} isPast={isPast} />
                                    </React.Fragment>
                                );
                            } else {
                                return <MatchItem key={`match-${match.matchId}`} match={match} isPast={isPast} />;
                            }

                        }
                        )}

                    </View>
                </Wrapper>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    sectionCountDown: {
        padding: 20,
        paddingHorizontal: 10,
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
        padding: 10,
        borderRadius: 5,
        backgroundColor: COLORJS.secondaryBackGroud
    },
    sectionTitle: {
        fontSize: 20,
        // marginBottom: 10,
        ...fontStyle.textMedium
    },
    fullRankingButton: {
        marginTop: 10,
    },
    rowHeaderRanking: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 5,
    },
    flexRow: {
        display: 'flex',
        flexDirection: 'row'
    },
    shareAction: {
        backgroundColor: COLORJS.primary,
        padding: 10,
        borderRadius: 5,
        borderColor: COLORJS.surface,
        borderWidth: 1,
        marginVertical: 10,
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },
    followAction: {
        backgroundColor: COLORJS.primary, // Usa lo stesso sfondo per coerenza
        padding: 10,
        borderRadius: 5,
        borderColor: COLORJS.surface,
        borderWidth: 1,
        marginVertical: 10,
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },

    headerOptions: {
        padding: 5,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 0

    },
    textHeaderOptions: {
        color: COLORJS.primary,
    },
    headerOptionsTitle: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },
    activeStyle: {
        borderWidth: 3,
        borderColor: 'red'
    },
});

