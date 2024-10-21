import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { loginFailure, loginSuccess } from '../../redux/slice/authSlice';
import { hideLoading, showLoading } from '../../redux/slice/uiSlice';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'; // Firebase auth
import { saveToken } from '../../AsyncStorage/AsyncStorage'; // Salva il token JWT
import { jwtDecode } from 'jwt-decode'; // Decodifica JWT se necessario
import * as LocalAuthentication from 'expo-local-authentication'; // Per autenticazione biometrica
import * as SecureStore from 'expo-secure-store'; // Importa SecureStore
import AuthErrors from '../../AuthErrorFirebase';


export default function LoginScreen({ navigation }) {
    const { colors } = useTheme();
    const dispatch = useDispatch();
    const auth = getAuth(); // Ottieni l'istanza di Firebase Auth
    const [pressed, setPressed] = React.useState(false);

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    // Stati per gestire gli errori
    const [emailError, setEmailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');

    // Stato per la modale di errore
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [isBiometricSupported, setIsBiometricSupported] = useState(false); // Per controllare il supporto biometrico


    const handleForgotPassword = () => {
        navigation.navigate('ForgotPasswordScreen');
    };

    const handleGoogleLogin = () => {
        console.log('Login con Google');
    };

    const handleFacebookLogin = () => {
        console.log('Login con Facebook');
    };

    const handleSignUp = () => {
        navigation.navigate('SignupScreen');
    };

    useEffect(() => {
        // Verifica se il dispositivo supporta Face ID o Touch ID
        const checkDeviceForHardware = async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(compatible);
        };
        checkDeviceForHardware();
    }, []);

    const handleBiometricAuth = async () => {
        try {
            const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
            if (!savedBiometrics) {
                return Alert.alert('Errore', 'Non sono state salvate impronte digitali o Face ID sul dispositivo');
            }
    
            const biometricAuth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Accedi con Face ID / Touch ID',
                fallbackLabel: 'Inserisci la tua password',
            });
    
            if (biometricAuth.success) {
                // Recupera le credenziali salvate da SecureStore
                const savedEmail = await SecureStore.getItemAsync('userEmail');
                const savedPassword = await SecureStore.getItemAsync('userPassword');

                if (savedEmail && savedPassword) {
                    setEmail(savedEmail);
                    setPassword(savedPassword);
                    // Usa direttamente le credenziali salvate senza aspettare l'aggiornamento dello stato
            
                    // Esegui il login automatico con le credenziali salvate
                    handleLogin(savedEmail, savedPassword);
                } else {
                    Alert.alert('Errore', 'Nessuna credenziale salvata per l\'accesso automatico.');
                }
            
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Errore', 'Errore durante l\'autenticazione biometrica');
        }
    };
    




    // Funzione di validazione
    const validateInputs = (emailInput = email, passwordInput = password) => {
        let valid = true;
        setEmailError('');
        setPasswordError('');

        if (emailInput.trim() === '') {
            setEmailError('Il campo email è obbligatorio');
            valid = false;
        }

        if (passwordInput.trim() === '') {
            setPasswordError('Il campo password è obbligatorio');
            valid = false;
        }

        return valid;
    };

    const handleLogin = async (emailInput = email, passwordInput = password) => {
        console.log('creenzialiLog' ,emailInput);
        if (validateInputs(emailInput, passwordInput )) {
            try {
                dispatch(showLoading());

                // Effettua il login con Firebase Auth
                const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    // Naviga alla schermata di verifica email se non è verificata
                    navigation.navigate('EmailVerificationScreen');
                    return; // Esci dalla funzione
                }

                // Ottieni il token JWT
                const token = await user.getIdToken();
                const decodedToken = jwtDecode(token); // Decodifica il token se necessario

                // Salva il token in AsyncStorage
                await saveToken(token);

                // Salva email e password in SecureStore
                await SecureStore.setItemAsync('userEmail', emailInput);
                await SecureStore.setItemAsync('userPassword', passwordInput);


                // Dispatch del loginSuccess con le informazioni dell'utente
                dispatch(loginSuccess({
                    user: {
                        userId: user.uid,
                        email: user.email,
                        fullName: user.displayName || decodedToken.name, // Usa il nome dal token decodificato se disponibile
                    },
                    token, // Salva il token JWT nello stato Redux
                    photoUri: user.photoURL
                }));

                // Naviga alla schermata Home
                navigation.navigate('Home');
            } catch (error) {
                console.error('Errore durante il login:', error.code);
                dispatch(loginFailure('Credenziali errate o problema di rete'));

                // Mostra la modale di errore
                setErrorMessage(AuthErrors[error.code] || 'Errore durante il login.');
                setErrorModalVisible(true);
            } finally {
                dispatch(hideLoading());
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <ScrollView contentContainerStyle={{ ...styles.container, backgroundColor: colors.background }}>
                <Image
                    source={require('../../image.png')}
                    style={styles.logo}
                />

                <Text style={styles.title}>Accedi o Registrati</Text>

                <View style={styles.inputContainer}>
                    <MaterialIcons name="email" size={24} color={colors.primary} style={styles.icon} />
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { text: 'black', placeholder: 'gray' } }}
                    />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                <View style={styles.inputContainer}>
                    <MaterialIcons name="lock" size={24} color={colors.primary} style={styles.icon} />
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                        theme={{ colors: { text: 'black', placeholder: 'gray' } }}
                    />
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                <View style={{ width: '100%' }}>
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotPassword}>Dimenticato password?</Text>
                    </TouchableOpacity>
                </View>

                {/* Pulsante Login */}
                <Button mode="contained" style={styles.authButton} onPress={() => handleLogin(email, password)}>
                    Login
                </Button>

                {/* Separator Line with "or" */}
                {/* <View style={styles.separatorContainer}>
                    <View style={styles.line} />
                    <Text style={styles.separatorText}>or</Text>
                    <View style={styles.line} />
                </View> */}

                {/* Pulsanti Google e Facebook */}
                {/* <View style={styles.socialButtonsContainer}>
                    <Button
                        mode="contained"
                        icon={() => <MaterialCommunityIcons name="google" size={24} color="white" />}
                        onPress={handleGoogleLogin}
                        style={[styles.socialButtonGoogle, { opacity: pressed ? 0.5 : 1 }]}
                    >
                        Google
                    </Button>
                    <Button
                        mode="contained"
                        icon={() => <MaterialCommunityIcons name="facebook" size={24} color="white" />}
                        onPress={handleFacebookLogin}
                        style={[styles.socialButtonFacebook, { opacity: pressed ? 0.5 : 1 }]}
                    >
                        Facebook
                    </Button>

                </View> */}
                {/* Pulsante per l'autenticazione biometrica */}


                {/* Scritta "Creare un account? Registrati" */}
                <TouchableOpacity onPress={handleSignUp}>
                    <Text style={styles.signUpText}>Creare un account? Registrati</Text>
                </TouchableOpacity>
                {isBiometricSupported && (
                    <TouchableOpacity onPress={handleBiometricAuth} style={styles.biometricButton}>
                        <MaterialIcons name="fingerprint" size={24} color={colors.primary} />
                        <Text style={{ color: colors.primary }}>Accedi con Face ID / Touch ID</Text>
                    </TouchableOpacity>
                )}

                {/* Modale di errore */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={errorModalVisible}
                    onRequestClose={() => {
                        setErrorModalVisible(!errorModalVisible);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Errore</Text>
                            <Text style={styles.modalMessage}>{errorMessage}</Text>
                            <Pressable
                                style={styles.modalButton}
                                onPress={() => setErrorModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>OK</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    // ... gli altri stili già presenti
    biometricButton: {
        marginTop: 20,
        alignItems: 'center',
    },

    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        justifyContent: 'center',
        width: '100%',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#d3d3d3',
        outline: 'none',
    },
    forgotPassword: {
        fontSize: 14,
        color: 'white',
        marginBottom: 20,
        textAlign: 'right',
    },
    authButton: {
        height: 48,
        width: '100%',
        paddingHorizontal: 8,
        borderRadius: 24,
        justifyContent: 'center',
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        width: '100%',
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'gray',
    },
    separatorText: {
        marginHorizontal: 10,
        fontSize: 16,
        color: 'gray',
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    socialButtonGoogle: {
        flex: 1,
        backgroundColor: '#db4437',
        marginRight: 10,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
    },
    socialButtonFacebook: {
        flex: 1,
        backgroundColor: '#4267B2',
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
    },
    signUpText: {
        fontSize: 14,
        marginTop: 20,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        textAlign: 'left',
        width: '100%',
        marginBottom: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Sfondo semi-trasparente
    },
    modalContent: {
        width: 320,
        padding: 25,
        backgroundColor: 'white',
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8, // Per dare l'effetto di ombra su Android
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#ff4c4c', // Colore per il titolo di errore
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333', // Colore del messaggio
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: '#ff4c4c', // Colore per il pulsante OK
        borderRadius: 8,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
