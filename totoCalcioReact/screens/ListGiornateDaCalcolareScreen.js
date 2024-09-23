import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, useTheme, Avatar, Button } from 'react-native-paper'; // Importa il bottone da react-native-paper
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { fetchGiornateCalcolate } from '../services/storicoService';

export default function ListGiornateDaCalcolareScreen({ navigation }) {
    const { colors } = useTheme();
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);

    const dispatch = useDispatch();
    const [giornateCalcolate, setGiornateCalcolate] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        const getGiornateCalcolate = async () => {
            try {
                dispatch(showLoading()); // Mostra il caricamento
                const data = await fetchGiornateCalcolate(leagueId);
                setGiornateCalcolate(data);
            } catch (error) {
                console.error('Errore durante il recupero delle giornate calcolate:', error);
                setError('Errore durante il recupero delle giornate calcolate');
            } finally {
                dispatch(hideLoading()); // Nascondi il caricamento
            }
        };

        getGiornateCalcolate();
    }, [dispatch, leagueId]);


    // Funzione per gestire il calcolo della giornata
    const handleCalculateDay = (giornata) => {
        console.log(`Calcola la ${giornata.dayId}`);
        // Implementa la logica per calcolare la giornata
    };

    const isDateAfter = (endDate) => {
        if (endDate) {      
            // Configura la data di input usando moment e imposta il fuso orario a "Europe/Rome"
            const date = moment.tz(endDate, "Europe/Rome");
    
            // Ottieni l'orario attuale e imposta il fuso orario a "Europe/Rome"
            const currentDate = moment.tz("Europe/Rome");
            // Confronta le date e restituisci true se la data di input è minore dell'orario attuale
            return currentDate.add(5, 'hours').isBefore(date);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
                {giornateCalcolate.map((giornata, index) => {
                    return !isDateAfter(giornata.endDate) ? (
                        <View
                            key={index + 1}
                            style={{ ...styles.cardTouchable }} // Modifica per includere lo stile
                        >
                            <Card style={styles.card}>
                                <View style={styles.participantRow}>
                                    <Avatar.Icon
                                        icon="calendar"
                                        size={40}
                                        style={styles.avatar}
                                    />
                                    <Text style={{ ...styles.participantName, color: 'white' }}>Giornata {giornata.dayId.replace('RegularSeason-', '')}</Text>

                                    <Text style={{ ...styles.participantPoints, color: 'white' }}>{giornata.punti} punti</Text>
                                </View>

                                {/* Bottone per calcolare la giornata */}
                                <Button
                                    mode="contained"
                                    onPress={() => handleCalculateDay(giornata)}
                                    style={styles.calculateButton}
                                    color={colors.primary} // Colore del bottone
                                >
                                    Calcola Giornata
                                </Button>
                            </Card>
                        </View>
                    ) : ''
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    participantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
        backgroundColor: '#6200ea', // Colore dell'avatar
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
    participantPoints: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingRight: 10,
    },
    calculateButton: {
        marginTop: 10,
    },
});
