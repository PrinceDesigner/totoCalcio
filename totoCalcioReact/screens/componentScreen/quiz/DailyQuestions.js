import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORJS } from '../../../theme/themeColor';
import fontStyle from '../../../theme/fontStyle';

const DailyQuestion = () => {
    const [question, setQuestion] = useState("Chi ha vinto la Champions League nel 2005?");
    const [options, setOptions] = useState(["Liverpool", "Milan", "Real Madrid", "Barcelona"]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(false);
    const correctAnswer = "Liverpool"; // Risposta corretta

    const handleSelectOption = (option) => {
        setSelectedOption(option);
        setLoading(true);
        
        // Simula una chiamata al server con un timeout di 2 secondi
        setTimeout(() => {
            setLoading(false);
            console.log(option);
        }, 2000);
    };

    return (
        <>
            <Text style={styles.textTitle}>Domanda del giorno</Text>
            <View style={styles.container}>
                <Text style={styles.questionText}>{question}</Text>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORJS.primary} style={styles.loadingIndicator} />
                ) : (
                    <View style={styles.optionsContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    selectedOption && option === correctAnswer && selectedOption === option && styles.correctOptionButton,
                                    selectedOption && option !== correctAnswer && selectedOption === option && styles.incorrectOptionButton,
                                ]}
                                onPress={() => handleSelectOption(option)}
                                disabled={selectedOption !== null} // Disabilita i pulsanti dopo la selezione
                            >
                                <Text style={[
                                    styles.optionText,
                                    selectedOption && option === correctAnswer && selectedOption === option && styles.correctOptionText,
                                    selectedOption && option !== correctAnswer && selectedOption === option && styles.incorrectOptionText,
                                ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORJS.surface,
        borderRadius: 15,
    },
    questionText: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        ...fontStyle.textItalic,
        color: 'white',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    optionButton: {
        backgroundColor: COLORJS.primary,
        padding: 10,
        borderRadius: 8,
        margin: 8,
        alignItems: 'center',
        width: '40%', // Riduci la larghezza per adattarsi meglio alla visualizzazione orizzontale
    },
    correctOptionButton: {
        backgroundColor: 'green', // Sfondo verde se l'opzione è corretta
    },
    incorrectOptionButton: {
        backgroundColor: 'red', // Sfondo rosso se l'opzione è sbagliata
    },
    optionText: {
        color: '#ffffff',
        fontSize: 12,
        textAlign: 'center',
    },
    correctOptionText: {
        color: '#ffffff', // Manteniamo il testo bianco per contrasto con lo sfondo verde
    },
    incorrectOptionText: {
        color: '#ffffff', // Manteniamo il testo bianco per contrasto con lo sfondo rosso
    },
    textTitle: {
        color: 'white',
        fontSize: 18,
        ...fontStyle.textMedium,
        marginVertical: 10,
    },
    loadingIndicator: {
        marginTop: 20,
    },
});

export default DailyQuestion;
