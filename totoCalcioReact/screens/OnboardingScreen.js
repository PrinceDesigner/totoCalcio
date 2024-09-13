// screens/OnboardingScreen.js

import * as React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export default function OnboardingScreen({ navigation }) {
    const { colors } = useTheme(); // Recupera i colori dal tema

    return (
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
            <Image
                source={require('../image.png')} // Path relativo al file image.png
                style={styles.logo} // Applica gli stili
            />
            <Text style={styles.title}>Benvenuto nell'app Totocalcio!</Text>
            <Text style={styles.description}>
                Unisciti a leghe e fai il tuo pronostico sulle partite settimanali.
            </Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate('LeagueDetailsStack')}
                style={styles.joinButton}
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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    description: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: "Source Sans Pro"

    },
    joinButton: {
        marginTop: 80,
        width: '100%',
        height: 49,
        border: '0',
        borderRadius: '24px',
        fontSize: 16,
        fontWeight: 500,
        fontFamily: 'Helvetica',
        lineHeight: 21,
        display: 'flex',
        justifyContent: 'center'
    },
});
