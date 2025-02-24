import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import LottieView from 'lottie-react-native';

const LevelUpAnimation = () => {
    return (
        <View style={styles.container}>
            <View>
                <LottieView
                    source={require('../../assets/animation/levelup.json')}  // Percorso del file .json
                    autoPlay  // Inizia a riprodurre l'animazione automaticamente
                    loop={true}    // L'animazione non si ripeterà
                    style={styles.animation}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', // Posizione assoluta per sovrapporre il contenuto
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center', // Centra verticalmente
        alignItems: 'center',     // Centra orizzontalmente
        zIndex: 1000,             // Assicurati che l'animazione sia sopra gli altri contenuti
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Sfondo scuro per l'animazione
    },
    animation: {
        width: Dimensions.get('window').width * 0.6,  // Imposta la larghezza in base alla larghezza dello schermo
        height: Dimensions.get('window').height * 0.6, // Imposta l'altezza in base all'altezza dello schermo
    }
});

export default LevelUpAnimation;