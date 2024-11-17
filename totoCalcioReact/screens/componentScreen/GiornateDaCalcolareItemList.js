import { useNavigation } from '@react-navigation/native';
import { httpsCallable } from 'firebase/functions';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { functions } from '../../firebaseConfig';
import { hideLoading, showLoading } from '../../redux/slice/uiSlice';
import { COLORJS } from '../../theme/themeColor';
import { showToast } from '../../ToastContainer';


// Funzione per determinare se la data è successiva (esempio, da implementare)
const isDateAfter = (dayId) => {
    // Aggiungi la tua logica per verificare se la data è successiva
    return false;
};

// Stili personalizzati
const styles = StyleSheet.create({
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
});



// Il componente principale
const GiornateDaCalcolareItemList = ({ giornateCalcolate, leagueId }) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

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

    return (
        <View>
            {giornateCalcolate
                // Ordina le giornate in base al numero estratto da dayId
                .sort((a, b) => {
                    const numeroA = parseInt(a.dayId.replace('RegularSeason-', ''));
                    const numeroB = parseInt(b.dayId.replace('RegularSeason-', ''));
                    return numeroB - numeroA;
                })
                // Mappa gli elementi ordinati
                .map((giornata, index) => {
                    return !isDateAfter(giornata.dayId) ? (
                        <View key={index + 1} style={styles.cardTouchable}>
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
                                    color="#3498db" // Colore primario
                                >
                                    Calcola
                                </Button>
                            </View>
                        </View>
                    ) : null;
                })}
        </View>
    );
};

export default GiornateDaCalcolareItemList;
