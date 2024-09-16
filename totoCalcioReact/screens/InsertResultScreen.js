import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Card, Button, useTheme } from 'react-native-paper';

// Dati delle partite
const matches = [
    { id: '1', home: 'Juventus', away: 'Inter' },
    { id: '2', home: 'Milan', away: 'Napoli' },
    { id: '3', home: 'Roma', away: 'Lazio' },
    { id: '4', home: 'Atalanta', away: 'Torino' },
    { id: '5', home: 'Fiorentina', away: 'Sassuolo' },
    { id: '6', home: 'Udinese', away: 'Sampdoria' },
    { id: '7', home: 'Bologna', away: 'Verona' },
    { id: '8', home: 'Empoli', away: 'Monza' },
    { id: '9', home: 'Salernitana', away: 'Cagliari' },
    { id: '10', home: 'Genoa', away: 'Frosinone' },
];

export default function InsertResultsScreen({ navigation }) {
    const { colors } = useTheme();
    const [results, setResults] = useState({}); // Stato per gli esiti delle partite
    const [modalVisible, setModalVisible] = useState(false); // Stato per la visibilità della modale

    // Funzione per gestire la selezione dell'esito
    const handleSelectResult = (matchId, result) => {
        setResults(prevResults => ({
            ...prevResults,
            [matchId]: result
        }));
    };

    // Verifica se tutti gli esiti sono stati selezionati
    const allResultsSelected = Object.keys(results).length === matches.length;

    // Funzione per mostrare la modale di conferma
    const handleShowModal = () => {
        setModalVisible(true);
    };

    // Funzione per chiudere la modale e confermare gli esiti
    const handleConfirmResults = () => {
        console.log('Esiti confermati', results);
        setModalVisible(false);
        navigation.navigate('LeagueDetails'); // Naviga alla schermata LeagueDetails
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background  }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 20 }}>
                {matches.map(match => (
                    <Card key={match.id} style={{ ...styles.matchCard, backgroundColor: colors.surface }}>
                        <View style={styles.matchInfo}>
                            <Text style={styles.matchText}>{match.home} vs {match.away}</Text>
                        </View>

                        <View style={styles.resultOptions}>
                            <TouchableOpacity
                                style={[styles.resultBox, results[match.id] === '1' && styles.selectedResult]}
                                onPress={() => handleSelectResult(match.id, '1')}
                            >
                                <Text style={styles.resultText}>1</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.resultBox, results[match.id] === 'X' && styles.selectedResult]}
                                onPress={() => handleSelectResult(match.id, 'X')}
                            >
                                <Text style={styles.resultText}>X</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.resultBox, results[match.id] === '2' && styles.selectedResult]}
                                onPress={() => handleSelectResult(match.id, '2')}
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
                    disabled={!allResultsSelected} // Disattiva se non tutti gli esiti sono selezionati
                    onPress={handleShowModal} // Mostra la modale di conferma
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

                        {/* Lista di riepilogo degli esiti */}
                        {matches.map(match => (
                            <View key={match.id} style={styles.resultSummaryItem}>
                                <Text style={styles.summaryText}>{match.home} vs {match.away}</Text>
                                <Text style={styles.summaryResultText}>{results[match.id]}</Text>
                            </View>
                        ))}

                        {/* Bottone per confermare gli esiti */}
                        <Button
                            mode="contained"
                            onPress={handleConfirmResults}
                            style={styles.confirmButton}
                        >
                            Conferma Esiti
                        </Button>

                        {/* Bottone per annullare */}
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
}

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
