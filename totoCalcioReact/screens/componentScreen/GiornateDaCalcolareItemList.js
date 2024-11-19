import { useNavigation } from '@react-navigation/native';
import { httpsCallable } from 'firebase/functions';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Avatar, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { functions } from '../../firebaseConfig';
import { triggerRefresh } from '../../redux/slice/refreshSlice';
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
        backgroundColor: COLORJS.secondaryBackGroud,
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
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        borderRadius: 5,
        marginTop: 10,
        marginLeft: 5
    },
    buttonCancel: {
        backgroundColor: '#e74c3c',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 20,
    },
});

// Il componente principale
const GiornateDaCalcolareItemList = ({ giornateCalcolate, leagueId }) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const [selectedGiornata, setSelectedGiornata] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleCalculatePoints = async (giornata) => {
        try {
            dispatch(showLoading());
            const calcolaPuntiGiornata = httpsCallable(functions, 'calcolaPuntiGiornata');
            const result = await calcolaPuntiGiornata({ leagueId, dayId: giornata.dayId });

            if (result.data.success) {
                showToast('success', 'Calcolo dei punti completato con successo!');
                dispatch(triggerRefresh())
                navigation.navigate('Home Lega');
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

    const handleOpenModal = (giornata) => {
        setSelectedGiornata(giornata);
        setModalVisible(true);
    };

    const handleConfirmCalculation = () => {
        if (selectedGiornata) {
            handleCalculatePoints(selectedGiornata);
        }
        setModalVisible(false);
    };

    const handleCancel = () => {
        setModalVisible(false);
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
                                    onPress={() => handleOpenModal(giornata)}
                                    style={styles.calculateButton}
                                >
                                    Calcola
                                </Button>
                            </View>
                        </View>
                    ) : null;
                })}

            {/* Modale di conferma */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Sei sicuro di voler calcolare la giornata {selectedGiornata?.dayId.replace('RegularSeason-', '')}?</Text>
                        <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Button
                            mode="contained"
                            onPress={() => handleConfirmCalculation(false)}
                            style={[styles.button, styles.buttonConfirm]}

                        >
                            Conferma
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => handleCancel(false)}
                            style={[styles.button]}

                        >
                            Annulla
                        </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default GiornateDaCalcolareItemList;
