import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Card, Button, useTheme, Checkbox } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { updateStartDate } from '../redux/slice/infogiornataAttualeSlice';
import { savePrediction } from '../redux/slice/predictionsSlice';
import { triggerRefresh } from '../redux/slice/refreshSlice';
import { showLoading, hideLoading } from '../redux/slice/uiSlice';
import { showToast } from '../ToastContainer';
import moment from 'moment';
import 'moment/locale/it';
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';
import { BannerAdComponent } from '../components/Adv/AdvBanner';






export default function InsertResultsScreen({ navigation }) {
    moment.locale('it');

    const { colors } = useTheme();
    const myLeagues = useSelector((state) => state.leagues); // Stato delle leghe
    let matches = useSelector((state) => state.infogiornataAttuale.matches);
    const userId = useSelector((state) => state.auth.user.user.userId);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const giornataAttuale = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const schedinaGiocata = useSelector((state) => state.insertPredictions.schedinaInserita.schedina);
    const dispatch = useDispatch();

    const [results, setResults] = useState({});
    const [modalVisible, setModalVisible] = useState(false);

    const [checked, setChecked] = useState(false);


    // Funzione per mappare l'array di predizioni in un oggetto compatibile con `setResults`
    const mapPredictionsToResults = (predictionsArray) => {
        return predictionsArray.reduce((acc, curr) => {
            acc[curr.matchId] = {
                matchId: curr.matchId,
                result: curr.result,
                esitoGiocato: curr.esitoGiocato,
                homeTeam: curr.homeTeam,
                awayTeam: curr.awayTeam
            };
            return acc;
        }, {});
    };

    // Esempio di come usarlo nel tuo componente
    useEffect(() => {
        // Supponiamo di ricevere questo array di predizioni
        if (schedinaGiocata) {
            setResults(mapPredictionsToResults(schedinaGiocata));
        }
        // Popola lo stato con i dati mappati
    }, [schedinaGiocata]);


    // Funzione per gestire la selezione dell'esito
    const handleSelectResult = (match, result) => {
        setResults(prevResults => ({
            ...prevResults,
            [match.matchId]: {
                matchId: match.matchId,
                result: null,
                esitoGiocato: result,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                startTime: match.startTime
            }
        }));
    };

    // Funzione per gestire la conferma degli esiti
    const handleConfirmResults = () => {
        const predictionData = {
            userId: userId,
            leagueId: leagueId,
            daysId: giornataAttuale,
            schedina: Object.values(results).map(result => ({
                matchId: result.matchId,
                result: null,
                esitoGiocato: result.esitoGiocato,
                homeTeam: result.homeTeam,
                awayTeam: result.awayTeam,
                startTime: result.startTime

            })),
        };

        insert(predictionData)

        // Invio al server (axios/fetch) o aggiornamento dello stato
    };

    const insert = async (predictionData) => {
        try {
            setModalVisible(false); // Chiudi la modale
            dispatch(showLoading()); // Mostra lo stato di caricamento
            await dispatch(savePrediction(predictionData)).unwrap(); // Attendi che il thunk termini

            // Se tutto va bene, mostra il toast di successo e naviga
            showToast('success', 'Esiti caricati con successo!');
            navigation.navigate('LeagueDetails'); // Naviga alla schermata LeagueDetails
        } catch (error) {
            console.error('Errore durante il salvataggio delle predizioni:', error);
            if (error.message === 'La giornata è già iniziata.') {

                showToast('error', 'La giornata è già iniziata. Aggiorna la pagina' + error.data);
                dispatch(updateStartDate({ startDate: error.data }));

                navigation.navigate('LeagueDetails'); // Sostituisci la schermata per evitare duplicazioni

            } else {
                showToast('error', 'Errore durante il salvataggio delle predizioni');
            }

            // Mostra un toast di errore
        } finally {
            dispatch(hideLoading()); // Nascondi lo stato di caricamento
            setModalVisible(false); // Chiudi la modale
        }
    };


    // Funzione per gestire il checkbox
    const renderCheckbox = () => {
        const handleToggleCheckbox = () => {
            setChecked(!checked);
            console.log(checked);

        };

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                <Checkbox
                    status={checked ? 'checked' : 'unchecked'}
                    onPress={handleToggleCheckbox}
                    color="#6200ee" // Cambia il colore del checkbox
                />
                <Text onPress={handleToggleCheckbox} style={{ marginLeft: 8, color: 'white' }}>
                    Inserisci per tutte le tue leghe
                </Text>
            </View>
        );
    };

    // Funzione per raggruppare i match per giorno
    const groupMatchesByDay = (matches) => {
        return matches.reduce((acc, match) => {
            const day = moment(match.startTime).format('YYYY-MM-DD'); // Estrai solo la data in formato yyyy-MM-dd
            if (!acc[day]) {
                acc[day] = [];
            }
            acc[day].push(match);
            return acc;
        }, {});
    };

    const sortedMatches = [...matches].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 20 }}>
                {Object.entries(groupMatchesByDay(sortedMatches)).map(([day, dayMatches], i) => (
                    <View key={day}>
                        {/* Intestazione per il giorno */}
                        <View style={{ ...styles.dayHeader }}>
                            <Text style={{ fontSize: 15, color: 'white', ...fontStyle.textMedium }}>
                                {moment(day).format('dddd, DD MMMM YYYY')} {/* E.g., "Sunday, 24 November 2024" */}
                            </Text>
                        </View>
                        {(i === 0 ||i === 1 || i === 2) ? <View style={{ marginTop: 10, marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <BannerAdComponent />
                        </View> : null}
                        {/* Matches per ogni giorno */}
                        {dayMatches.map((match) => (

                            <View key={match.matchId} style={{ ...styles.matchCard, backgroundColor: colors.secondaryBackGroud }}>
                                <View style={styles.matchInfo}>
                                    <Text style={styles.matchText}>{match.homeTeam} vs {match.awayTeam}</Text>
                                    <Text style={styles.matchTextHour}>{moment(match.startTime).utc().format('HH:mm')}</Text>
                                </View>
                                <View style={styles.resultOptions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.resultBox,
                                            results[match.matchId]?.esitoGiocato === '1' && styles.selectedResult
                                        ]}
                                        onPress={() => handleSelectResult(match, '1')}
                                    >
                                        <Text style={styles.resultText}>1</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.resultBox,
                                            results[match.matchId]?.esitoGiocato === 'X' && styles.selectedResult
                                        ]}
                                        onPress={() => handleSelectResult(match, 'X')}
                                    >
                                        <Text style={styles.resultText}>X</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.resultBox,
                                            results[match.matchId]?.esitoGiocato === '2' && styles.selectedResult
                                        ]}
                                        onPress={() => handleSelectResult(match, '2')}
                                    >
                                        <Text style={styles.resultText}>2</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>

            {/* Bottone per inserire gli esiti */}
            <View style={styles.buttonContainer}>
                {/* DA PENSARE  */}
                {/* {renderCheckbox()} */}

                <Button
                    mode="contained"
                    disabled={Object.keys(results).length !== matches.length}
                    onPress={() => setModalVisible(true)}
                    style={styles.submitButton}
                    labelStyle={{
                        ...fontStyle.textBold
                    }}
                >
                    Controlla e Conferma Esiti
                </Button>
            </View>

            {/* Modale di conferma */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Riepilogo Esiti</Text>

                        {matches.map(match => (
                            <View key={match.matchId} style={styles.resultSummaryItem}>
                                <Text style={styles.summaryText}>{match.homeTeam} vs {match.awayTeam}</Text>
                                <Text style={styles.summaryResultText}>{results[match.matchId]?.esitoGiocato || '-'}</Text>
                            </View>
                        ))}

                        <Button
                            mode="contained"
                            onPress={handleConfirmResults}
                            style={styles.confirmButton}
                        >
                            Conferma Esiti
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => setModalVisible(false)}
                            style={styles.cancelButton}
                        >
                            Annulla
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    matchCard: {
        marginBottom: 10,
        padding: 20,
        borderRadius: 10,
    },
    matchInfo: {
        marginBottom: 10,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    matchText: {
        fontSize: 18,
        color: 'white',
        ...fontStyle.textBold
    },
    matchTextHour: {
        fontSize: 16,
        color: 'white',
        ...fontStyle.textBold
    },
    resultOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    resultBox: {
        width: '30%',
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 10,
    },
    resultText: {
        fontSize: 18,
        color: 'white',
        ...fontStyle.textBold
    },
    selectedResult: {
        backgroundColor: COLORJS.primary, // Colore del risultato selezionato
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    submitButton: {
        paddingVertical: 10,
        marginBottom: 30
    },
    //modale
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Sfondo semitrasparente
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 20,
        ...fontStyle.textBold,
        marginBottom: 20,
        textAlign: 'center',
    },
    resultSummaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd', // Colore del bordo inferiore
        paddingBottom: 10, // Aggiunge un po' di padding sotto per distanziare
    },
    summaryText: {
        fontSize: 16,
    },
    summaryResultText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmButton: {
        marginTop: 20,
        paddingVertical: 10,
    },
    cancelButton: {
        marginTop: 10,
    },
    dayHeader: {
        marginBottom: 10,
        backgroundColor: COLORJS.primary, // Colore di sfondo per evidenziare l'intestazione (puoi cambiarlo con `colors.primary` se hai definito un tema)
        color: '#ffffff',           // Colore del testo (in contrasto con il colore di sfondo)
        fontWeight: 'bold',
        padding: 10,
        borderRadius: 5         // Rendere l'intestazione più evidente
        // Arrotondamento degli angoli per un aspetto più moderno
    },
});
