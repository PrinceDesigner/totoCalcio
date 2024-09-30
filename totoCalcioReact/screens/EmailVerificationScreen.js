import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { showToast } from '../ToastContainer';

const EmailVerificationScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const auth = getAuth();

    const resendVerificationEmail = async () => {
        const user = auth.currentUser;
        if (user) {
            await sendEmailVerification(user);
            showToast('success', 'Email di verifica inviata! Controlla la tua casella di posta.');
        }
    };

    const checkEmailVerified = () => {
        const user = auth.currentUser;
            navigation.replace('LoginScreen'); // Naviga alla schermata di login se l'email è già verificata

    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verifica la tua Email</Text>
            <Text style={styles.message}>
                Per favore, controlla la tua email e verifica il tuo account. Se non hai ricevuto l'email, clicca su "Rinvia Email".
            </Text>
            <Button 
                mode="contained" 
                onPress={resendVerificationEmail} 
                style={styles.button}
                color={colors.primary}
            >
                Rinvia Email
            </Button>
            <Button 
                mode="outlined" 
                onPress={checkEmailVerified} 
                style={styles.button}
                color={colors.primary}
            >
                Già verificato?
            </Button>
            <Button 
                mode="text" 
                onPress={() => navigation.navigate('LoginScreen')}
                style={styles.linkButton}
                color={colors.primary}
            >
                Torna al Login
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5', // Utilizza il colore di sfondo personalizzato
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333', // Colore del titolo
    },
    message: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#666', // Colore del messaggio
    },
    button: {
        width: '100%',
        marginBottom: 10,
    },
    linkButton: {
        marginTop: 20,
        textDecorationLine: 'underline', // Sottolinea il testo
    },
});

export default EmailVerificationScreen;
