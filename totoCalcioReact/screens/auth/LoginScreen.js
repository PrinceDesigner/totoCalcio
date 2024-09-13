import * as React from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';

import { useDispatch } from 'react-redux'; // Importa useDispatch per inviare azioni
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'; // Aggiungi MaterialCommunityIcons

import { loginFailure, loginSuccess } from '../../redux/slice/authSlice';
import { hideLoading, showLoading } from '../../redux/slice/uiSlice';


export default function LoginScreen({ navigation }) {
    const { colors } = useTheme(); // Recupera i colori dal tema
    const dispatch = useDispatch(); // Ottieni la funzione dispatch di Redux

    const [pressed, setPressed] = React.useState(false); // Stato per gestire l'opacità
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    // Stati per gestire gli errori
    const [usernameError, setUsernameError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');

    const handleForgotPassword = () => {
        // Azione quando si clicca su "Dimenticato password?"
        console.log('Password dimenticata');
    };

    const handleGoogleLogin = () => {
        // Azione per il login con Google
        console.log('Login con Google');
    };

    const handleFacebookLogin = () => {
        // Azione per il login con Facebook
        console.log('Login con Facebook');
    };

    const handleSignUp = () => {
        // Azione per la registrazione
        console.log('Vai alla registrazione');
    };

    // Funzione di validazione
    const validateInputs = () => {
        let valid = true;

        // Reset degli errori
        setUsernameError('');
        setPasswordError('');

        if (username.trim() === '') {
            setUsernameError('Il campo username è obbligatorio');
            valid = false;
        }


        // Validazione password
        if (password.trim() === '') {
            setPasswordError('Il campo password è obbligatorio');
            valid = false;
        }

        return valid;
    };

    const resetInput = () => {
        setUsernameError('');
        setPasswordError('');
    }

    const onChangeUsername = (text) => {
        resetInput();
        setUsername(text);
    }

    const onChangePassword = (text) => {
        resetInput();
        setPassword(text);
    }

    const handleLogin = () => {

        dispatch(showLoading()); // Mostra il caricamento

        setTimeout(() => {
            if (validateInputs()) {
                // Simula la logica di autenticazione
                if (username === 'test' && password === 'password') {
                    // Esegui l'azione di login success
                    dispatch(loginSuccess(username));
                    navigation.navigate('Home'); // Usa l'oggetto navigation per andare alla schermata Home

                } else {
                    // Esegui l'azione di login failure
                    dispatch(loginFailure('Credenziali errate'));
                    console.log('Login fallito');
                }
                console.log('Login con', username, password);
            }
            dispatch(hideLoading()); // Nascondi il caricamento
        }, 2000); // Simula un ritardo di 2 secondi
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Offset per iOS per evitare che la tastiera copra il contenuto
        >
            <ScrollView contentContainerStyle={{ ...styles.container, backgroundColor: colors.background }}>
                <Image
                    source={require('../../image.png')}
                    style={styles.logo}
                />

                <Text style={styles.title}>Accedi o Registrati</Text>

                {/* Wrappa l'input per username e icona in una View */}
                <View style={styles.inputContainer}>
                    <MaterialIcons name="person" size={24} color={colors.primary} style={styles.icon} />
                    <TextInput
                        label="Username"
                        value={username}
                        onChangeText={text => onChangeUsername(text)}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { text: 'black', placeholder: 'gray' } }}
                    />
                </View>
                {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

                {/* Wrappa l'input per password e icona in una View */}
                <View style={styles.inputContainer}>
                    <MaterialIcons name="lock" size={24} color={colors.primary} style={styles.icon} />
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={text => onChangePassword(text)}
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
                <Button mode="contained" style={styles.authButton} onPress={handleLogin}>
                    Login
                </Button>

                {/* Separator Line with "or" */}
                <View style={styles.separatorContainer}>
                    <View style={styles.line} />
                    <Text style={styles.separatorText}>or</Text>
                    <View style={styles.line} />
                </View>

                {/* Pulsanti Google e Facebook */}
                <View style={styles.socialButtonsContainer}>
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
                </View>

                {/* Scritta "Creare un account? Registrati" */}
                <TouchableOpacity onPress={handleSignUp}>
                    <Text style={styles.signUpText}>Creare un account? Registrati</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
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
        marginTop: 20, // Spazio sopra la scritta
        textAlign: 'center', // Allinea il testo al centro
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        textAlign: 'left',
        width: '100%',
        marginBottom: 10,
    }
});
