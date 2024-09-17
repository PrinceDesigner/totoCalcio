import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { loginSuccess, logout } from '../redux/slice/authSlice';
import { saveToken, removeToken } from '../AsyncStorage/AsyncStorage';
import { useTheme } from 'react-native-paper';

const SplashScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { colors } = useTheme();
    const auth = getAuth(); // Ottieni l'istanza di Firebase Auth

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // L'utente è autenticato, recupera il token JWT
                    const token = await user.getIdToken(true); // Recupera il token ID di Firebase

                    // Salva il token JWT in AsyncStorage
                    await saveToken(token);

                    // Popola il Redux store con i dati dell'utente
                    dispatch(loginSuccess({
                        user: {
                            userId: user.uid,
                            email: user.email,
                            fullName: user.displayName || 'Utente', // Puoi usare user.displayName se esiste
                        },
                        token,
                    }));

                    // Naviga alla schermata Home
                    navigation.replace('Home');
                } catch (error) {
                    console.error('Errore durante il recupero del token:', error);
                    await removeToken(); // Se fallisce, rimuovi il token
                    dispatch(logout());
                    navigation.replace('LoginScreen');
                }
            } else {
                // L'utente non è autenticato, reindirizza alla schermata di login
                await removeToken();
                dispatch(logout());
                navigation.replace('LoginScreen');
            }
        });

        // Cleanup del listener quando il componente viene smontato
        return () => unsubscribe();
    }, [auth, dispatch, navigation]);

    return (
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
            {/* Logo o immagine splash */}
            <Image
                source={require('../league1.png')} // Cambia con il tuo logo
                style={styles.logo}
            />

            <Text style={styles.title}>Benvenuto in TotoCalcio</Text>

            {/* Spinner di caricamento */}
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    loader: {
        marginTop: 20,
    },
});

export default SplashScreen;
