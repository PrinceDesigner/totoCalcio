import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
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
    const [refreshing, setRefreshing] = useState(false); // Stato per gestire il refresh

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

    // Funzione per gestire il refresh
    const onRefresh = async () => {
        setRefreshing(true); // Imposta lo stato di refresh su true
        try {
            const data = await fetchGiornateCalcolate(leagueId);
            setGiornateCalcolate(data);
        } catch (error) {
            setError('Errore durante il recupero delle giornate calcolate');
        } finally {
            setRefreshing(false); // Termina il refresh
        }
    };

    const handleCalculatePoints = async (giornata) => {
        try {
            dispatch(showLoading()); // Mostra il caricamento
            const calcolaPuntiGiornata = httpsCallable(functions, 'calcolaPuntiGiornata');
            const result = await calcolaPuntiGiornata({ leagueId, dayId: giornata.dayId });

            if (result.data.success) {
                showToast('success', 'Calcolo dei punti completato con successo!');
                navigation.navigate('Home1', { refresh: true });
            } else {
                showToast('error', result.data.message);
            }
        } catch (error) {
            console.error('Errore durante il calcolo dei punti:', error);
            showToast('error', 'Errore durante il calcolo dei punti');
        } finally {
            dispatch(hideLoading()); // Nascondi il caricamento
        }
    };

    const createTask = async (giornata) => {
        try {
            dispatch(showLoading());
            const createtask = httpsCallable(functions, 'scheduleDayUpdateTasks');
            const result = await createtask({ leagueId, dayId: giornata.dayId });

            if (result.data.success) {
                showToast('success', 'Task Creati');
                navigation.navigate('Home1', { refresh: true });
            } else {
                showToast('error', result.data.message);
            }
        } catch (error) {
            console.error('Errore durante il task:', error);
            showToast('error', 'Errore durante il task');
        } finally {
            dispatch(hideLoading());
        }
    };

    const isDateAfter = (dayIdPar) => {
        console.log('dayIdPar', dayId);
        return dayIdPar === dayId;
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={{ ...styles.container, backgroundColor: colors.background }}
                contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> // Aggiungi il RefreshControl
                }
            >
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
                                    <Text style={{ ...styles.participantName, color: 'white' }}>
                                        Giornata {giornata.dayId.replace('RegularSeason-', '')}
                                    </Text>
                                </View>

                                <Button
                                    mode="contained"
                                    onPress={() => handleCalculatePoints(giornata)}
                                    style={styles.calculateButton}
                                    color={colors.primary}
                                >
                                    Calcola Giornata
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={() => createTask(giornata)}
                                    style={styles.calculateButton}
                                    color={colors.primary}
                                >
                                    Calcola Giornata 2
                                </Button>
                            </Card>
                        </View>
                    ) : null;
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
        backgroundColor: '#6200ea',
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
    calculateButton: {
        marginTop: 10,
    },
});
