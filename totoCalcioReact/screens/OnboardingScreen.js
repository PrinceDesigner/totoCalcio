// screens/OnboardingScreen.js

import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text, useTheme,use } from 'react-native-paper';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';


export default function OnboardingScreen({ navigation }) {
    const { colors } = useTheme(); // Recupera i colori dal tema

    useEffect(() => {
        const askPermission = async () => {
          const { status } = await requestTrackingPermissionsAsync();
          if (status === 'granted') {
            console.log('Permesso di tracciamento concesso.');
            // Puoi procedere con il tracciamento
          } else {
            console.log('Permesso di tracciamento negato.');
            // Gestisci il caso in cui il permesso è negato
          }
        };
        askPermission();
      }, []); // Chiede il permesso al caricamento dell'app

    return (
        <View style={{ ...styles.container, backgroundColor: '#00f310' }}>
            <Image
                source={require('../league1.png')} // Path relativo al file image.png
                style={styles.logo} // Applica gli stili
            />
            <Text style={styles.title}>Benvenuto!</Text>
            <Text style={styles.description}>
                Crea/Unisciti una/ad leghe, invita amici, fai il tuo pronostico sulle partite settimanali. E arriva in cima alla classifica
            </Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate('LoginScreen')}
                style={styles.joinButton}
                labelStyle={{
                    color: 'white',
                    ...fontStyle.textBold

                }}
            >
                Join
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
        marginBottom: 20, // Spazio sotto l'immagine
        backgroundColor: '#00f310'
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
        textAlign: 'center',
        color: COLORJS.secondaryBackGroud,
        ...fontStyle.textBold
        
    },
    description: {
        fontSize: 13,
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
});
