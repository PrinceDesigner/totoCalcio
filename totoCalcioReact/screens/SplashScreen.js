import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { jwtDecode } from 'jwt-decode'
import { loginSuccess, logout } from '../redux/slice/authSlice';
import { getToken } from '../AsyncStorage/AsyncStorage';
import { useTheme } from 'react-native-paper';

const SplashScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { colors } = useTheme(); // Recupera i colori dal tema


    useEffect(() => {
        const checkAuth = async () => {
            const token = await getToken();
            if (token) {
                try {
                    console.log('token-preso', token);
                    const decodedToken = jwtDecode(token)
                    const currentTime = Date.now() / 1000;

                    if (decodedToken.exp > currentTime) {
                        // Popola Redux con le informazioni utente
                        dispatch(loginSuccess({
                            userId: decodedToken.userId,
                            fullName: decodedToken.displayName,
                            email: decodedToken.email,
                        }));
                        navigation.navigate('Home'); // Naviga alla schermata principale
                    } else {
                        // Se il token è scaduto, fai il logout
                        dispatch(logout());
                        navigation.navigate('LoginScreen');
                    }
                } catch (error) {
                    console.error('Errore durante la decodifica del token:', error);
                    dispatch(logout());
                    navigation.navigate('Onboarding');
                }
            } else {
                // Se il token non esiste, vai alla schermata di Onboarding
                navigation.navigate('Onboarding');
            }
        };

        checkAuth();
    }, []);

    return (
        <View style={{...styles.container, backgroundColor: colors.background }}>
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
