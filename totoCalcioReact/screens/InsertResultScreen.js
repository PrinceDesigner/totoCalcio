import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Card, Button, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { savePrediction } from '../redux/slice/predictionsSlice';
import { showLoading, hideLoading } from '../redux/slice/uiSlice';
import { showToast } from '../ToastContainer';



export default function InsertResultsScreen({ navigation }) {
    const { colors } = useTheme();
    const matches = useSelector((state) => state.infogiornataAttuale.matches); // Stato delle leghe
    const userId = useSelector((state) => state.auth.user.user.userId); // Stato delle leghe
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata); // Stato delle leghe
    const giornataSchedina = useSelector((state) => state.giornataAttuale.giornataAttuale); // Stato delle leghe
    const dispatch = useDispatch();

    const [results, setResults] = useState({});
    const [modalVisible, setModalVisible] = useState(false);

    // Funzione per gestire la selezione dell'esito
    const handleSelectResult = (matchId, result) => {
        setResults(prevResults => ({
            ...prevResults,
            [matchId]: {
                matchId: matchId,
                result: null,
                esitoGiocato: result
            }
        }));
    };

    // Funzione per gestire la conferma degli esiti
    const handleConfirmResults = () => {
        const predictionData = {
            userId: userId,
            leagueId: leagueId,
            daysId: giornataSchedina,
            schedina: Object.values(results).map(result => ({
                matchId: result.matchId,
                result: null,
                esitoGiocato: result.esitoGiocato,
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
            showToast('success', 'Predizioni salvate con successo!');
            navigation.navigate('LeagueDetails'); // Naviga alla schermata LeagueDetails
        } catch (error) {
            console.error('Errore durante il salvataggio delle predizioni:', error);
    
            // Mostra un toast di errore
            showToast('error', 'Errore durante il salvataggio delle predizioni');
        } finally {
            dispatch(hideLoading()); // Nascondi lo stato di caricamento
            setModalVisible(false); // Chiudi la modale
        }
    };
    


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 20 }}>
                {matches.map(match => (
                    <Card key={match.matchId} style={{ ...styles.matchCard, backgroundColor: colors.surface }}>
                        <View style={styles.matchInfo}>
                            <Text style={styles.matchText}>{match.homeTeam} vs {match.awayTeam}</Text>
                        </View>

                        <View style={styles.resultOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.resultBox,
                                    results[match.matchId]?.esitoGiocato === '1' && styles.selectedResult
                                ]}
                                onPress={() => handleSelectResult(match.matchId, '1')}
                            >
                                <Text style={styles.resultText}>1</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.resultBox,
                                    results[match.matchId]?.esitoGiocato === 'X' && styles.selectedResult
                                ]}
                                onPress={() => handleSelectResult(match.matchId, 'X')}
                            >
                                <Text style={styles.resultText}>X</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.resultBox,
                                    results[match.matchId]?.esitoGiocato === '2' && styles.selectedResult
                                ]}
                                onPress={() => handleSelectResult(match.matchId, '2')}
                            >
                                <Text style={styles.resultText}>2</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                ))}
            </ScrollView>

            {/* Bottone per inserire gli esiti */}
            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    disabled={Object.keys(results).length !== matches.length}
                    onPress={() => setModalVisible(true)}
                    style={styles.submitButton}
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
        padding: 20,
    },
    matchCard: {
        marginBottom: 10,
        padding: 20,
        borderRadius: 10,
    },
    matchInfo: {
        marginBottom: 10,
    },
    matchText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    resultOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    resultBox: {
        width: '30%',
        paddingVertical: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 10,
    },
    resultText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    selectedResult: {
        backgroundColor: '#6200ea', // Colore del risultato selezionato
    },
    buttonContainer: {
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
        fontWeight: 'bold',
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
});
