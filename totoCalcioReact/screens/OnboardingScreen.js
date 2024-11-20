// screens/OnboardingScreen.js

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Platform, Modal } from 'react-native';
import { Button, Text, useTheme, use } from 'react-native-paper';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function OnboardingScreen({ navigation }) {
    const { colors } = useTheme(); // Recupera i colori dal tema
    const [modalVisible, setModalVisible] = useState(false); // Stato per la modale


    useEffect(() => {
        const askPermission = async () => {
            if (Platform.OS === 'ios') {
                const { status } = await requestTrackingPermissionsAsync();
                if (status === 'granted') {
                    console.log('Permesso di tracciamento concesso.');
                    // Puoi procedere con il tracciamento
                } else {
                    console.log('Permesso di tracciamento negato.');
                    // Gestisci il caso in cui il permesso è negato
                }
            } else if (Platform.OS === 'android') {
                // Su Android, verifica se il consenso è già stato salvato in AsyncStorage
                const savedConsent = await AsyncStorage.getItem('trackingConsent');
                if (savedConsent === null) {
                    // Se il consenso non è ancora stato chiesto, mostra la modale
                    setModalVisible(true);
                }
            }
        }
        askPermission();
    }, []); // Chiede il permesso al caricamento dell'app



    const handleConsent = async (consent) => {
        setModalVisible(false);
        console.log(consent ? 'Permesso di tracciamento concesso su Android.' : 'Permesso di tracciamento negato su Android.');
        // Salva il consenso dell'utente in AsyncStorage per Android
        await AsyncStorage.setItem('trackingConsent', consent ? 'granted' : 'denied');
    };

    const handlePlayButton = async () => {
        const isFirstAccess = await AsyncStorage.getItem('isFirstAccess');
        console.log('isfirts', isFirstAccess);
        if (isFirstAccess === null) {
            // Primo accesso, porta al tutorial
            await AsyncStorage.setItem('isFirstAccess', 'false'); // Imposta il primo accesso a "false"
            navigation.navigate('OnBoardingTutorial'); // Porta al tutorial
        } else {
            // Accesso successivo, porta alla schermata di login
            navigation.navigate('LoginScreen');
        }
    };


    return (
        <View style={{ ...styles.container, backgroundColor: '#00f310' }}>


            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Consenso al Tracciamento</Text>
                        <Text style={styles.modalDescription}>
                            Per migliorare la tua esperienza, la nostra app desidera utilizzare il tracciamento per mostrarti annunci personalizzati. Vuoi consentire il tracciamento?
                        </Text>
                        <View style={styles.modalButtonsContainer}>
                            <Button
                                mode="contained"
                                onPress={() => handleConsent(true)}
                                style={styles.modalButton}
                                labelStyle={{ color: 'white' }}
                            >
                                Consenti
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => handleConsent(false)}
                                style={styles.modalButton}
                                labelStyle={{ color: colors.primary }}
                            >
                                Nega
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Image
                source={require('../league1.png')} // Path relativo al file image.png
                style={styles.logo} // Applica gli stili
            />
            <Text style={styles.title}>Benvenuto!</Text>
            <Text style={styles.description}>
                Crea o unisciti a una lega, invita amici, fai i tuoi pronostici sulle partite settimanali e scala la classifica!
            </Text>
            <Button
                mode="contained"
                onPress={handlePlayButton}
                style={styles.joinButton}
                labelStyle={{
                    color: 'white',
                    ...fontStyle.textBold

                }}
            >
                GIOCA
            </Button>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    }, logo: {
        width: 300,  // Larghezza dell'immagine
        height: 300, // Altezza dell'immagine
        backgroundColor: '#00f310'
    },
    title: {
        fontSize: 30,
        marginBottom: 10,
        textAlign: 'center',
        color: COLORJS.secondaryBackGroud,
        ...fontStyle.textBold

    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        color: COLORJS.secondaryBackGroud,
        ...fontStyle.textMedium

    },
    joinButton: {
        marginTop: 30,
        width: '100%',
        height: 49,
        border: '0',
        borderRadius: 24,
        fontSize: 16,
        lineHeight: 21,
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: COLORJS.background,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'Transparent',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORJS.background
    },
    modalDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        color: COLORJS.background
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        marginHorizontal: 5,
        flex: 1,
    },

});
