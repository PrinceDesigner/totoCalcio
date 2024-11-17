import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, useTheme, Avatar, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { fetchGiornateCalcolate } from '../services/storicoService';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../ToastContainer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Importa Material Icons
import { COLORJS } from '../theme/themeColor';

export default function ListGiornateDaCalcolareScreen() {
    const { colors } = useTheme();
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const [giornateCalcolate, setGiornateCalcolate] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const getGiornateCalcolate = async () => {
            try {
                dispatch(showLoading());
                const data = await fetchGiornateCalcolate(leagueId);
                setGiornateCalcolate(data);
            } catch (error) {
                setError('Errore durante il recupero delle giornate calcolate');
            } finally {
                dispatch(hideLoading());
            }
        };

        getGiornateCalcolate();
    }, [dispatch, leagueId]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const data = await fetchGiornateCalcolate(leagueId);
            setGiornateCalcolate(data);
        } catch (error) {
            setError('Errore durante il recupero delle giornate calcolate');
        } finally {
            setRefreshing(false);
        }
    };

    const handleCalculatePoints = async (giornata) => {
        try {
            dispatch(showLoading());
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
            dispatch(hideLoading());
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
        return dayIdPar === dayId;
    };

    const renderGiornate = () => {
        if (giornateCalcolate.length === 0) {
            return (
                <View style={styles.noGiornateContainer}>
                    <Text style={styles.noGiornateText}>Non ci sono giornate da calcolare</Text>
                </View>
            );
        }

        return [...giornateCalcolate]
        // Prima ordina le giornate in base al numero estratto da dayId
        .sort((a, b) => {
            // Estrai il numero da entrambe le dayId
            const numeroA = parseInt(a.dayId.replace('RegularSeason-', ''));
            const numeroB = parseInt(b.dayId.replace('RegularSeason-', ''));
            
            // Confronta i numeri per ordinamento crescente
            return numeroB - numeroA;
        })
        // Poi mappa gli elementi ordinati
        .map((giornata, index) => {
            return !isDateAfter(giornata.dayId) ? (
                <View key={index + 1} style={{ ...styles.cardTouchable }}>
                    <View style={styles.card}>
                        <View style={styles.participantRow}>
                            <Avatar.Icon
                                icon="calendar"
                                size={40}
                                style={styles.avatar}
                            />
                            <Text style={{ ...styles.participantName, color: 'white' }}>
                                Giornata {giornata.dayId.replace('RegularSeason-', '')}
                            </Text>
    
                            {/* Aggiungi l'icona "check-circle" se la giornata è stata calcolata */}
                            {giornata.calcolate && (
                                <MaterialIcons name="check-circle" size={24} color="green" />
                            )}
                        </View>
    
                        {/* Mostra sempre i bottoni */}
                        <Button
                            mode="contained"
                            onPress={() => handleCalculatePoints(giornata)}
                            style={styles.calculateButton}
                            color={colors.primary}
                        >
                            Calcola Giornata
                        </Button>
                    </View>
                </View>
            ) : null;
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={{ ...styles.container, backgroundColor: colors.background }}
                contentContainerStyle={{ paddingBottom: 60 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Avviso per le giornate calcolate */}
                <View style={styles.warningContainer}>
                    <Text style={{ color: 'yellow', fontSize: 16 }}>
                        Le giornate con l'icona di spunta verde <MaterialIcons name="check-circle" size={16} color="green" /> sono già state calcolate.
                    </Text>
                </View>
                {renderGiornate()}

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
        backgroundColor: COLORJS.secondaryBackGroud
    },
    participantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
        backgroundColor: COLORJS.primary,
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
    warningContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#333',
        borderRadius: 5,
    },
    noGiornateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    noGiornateText: {
        fontSize: 18,
        color: 'gray',
    },
});
