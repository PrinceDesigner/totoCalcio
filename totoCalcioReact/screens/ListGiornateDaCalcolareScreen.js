import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, useTheme, Avatar, Button } from 'react-native-paper'; // Importa il bottone da react-native-paper
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { fetchGiornateCalcolate } from '../services/storicoService';
import { functions } from '../firebaseConfig'; // Importa le functions dal tuo file di configurazione
import { httpsCallable } from 'firebase/functions';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../ToastContainer';


export default function ListGiornateDaCalcolareScreen() {
    const { colors } = useTheme();
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const navigation = useNavigation();

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
                setError('Errore durante il recupero delle giornate calcolate');
            } finally {
                dispatch(hideLoading()); // Nascondi il caricamento
            }
        };

        getGiornateCalcolate();
    }, [dispatch, leagueId]);


    const handleCalculatePoints = async (giornata) => {
        try {
            // Mostra il caricamento
            dispatch(showLoading());
    
            // Ottieni la reference alla Cloud Function
            const calcolaPuntiGiornata = httpsCallable(functions, 'calcolaPuntiGiornata');
    
            // Chiama la function passando i parametri
            const result = await calcolaPuntiGiornata({ leagueId, dayId: giornata.dayId });
    
            if (result.data.success) {
                // Mostra un messaggio di successo usando showToast
                showToast('success', 'Calcolo dei punti completato con successo!');
    
                // Naviga a LeagueDetails passando un parametro di aggiornamento
                navigation.navigate('Home1', { refresh: true });
            } else {
                // Mostra un messaggio di errore usando showToast
                showToast('error', result.data.message);
            }
        } catch (error) {
            console.error('Errore durante il calcolo dei punti:', error);
            
            // Mostra un messaggio di errore usando showToast
            showToast('error', 'Errore durante il calcolo dei punti');
        } finally {
            // Nascondi il caricamento indipendentemente dal risultato
            dispatch(hideLoading());
        }
    };
    


    const isDateAfter = (dayIdPar) => {
        console.log('dayIdPar', dayId);
        return dayIdPar === dayId
        // if (endDate) {
        //     // Configura la data di input usando moment e imposta il fuso orario a "Europe/Rome"
        //     const date = moment.tz(endDate, "Europe/Rome");

        //     // Ottieni l'orario attuale e imposta il fuso orario a "Europe/Rome"
        //     const currentDate = moment.tz("Europe/Rome");
        //     // Confronta le date e restituisci true se la data di input è minore dell'orario attuale
        //     return currentDate.add(5, 'hours').isBefore(date);
        // }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
                {giornateCalcolate.map((giornata, index) => {
                    return !isDateAfter(giornata.dayId) ? (
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
                                </View>

                                {/* Bottone per calcolare la giornata */}
                                <Button
                                    mode="contained"
                                    onPress={() => handleCalculatePoints(giornata)}
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
