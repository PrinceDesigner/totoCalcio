import React from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { loginFailure, loginSuccess } from '../../redux/slice/authSlice';
import { hideLoading, showLoading } from '../../redux/slice/uiSlice';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'; // Firebase auth
import { saveToken } from '../../AsyncStorage/AsyncStorage'; // Salva il token JWT
import {jwtDecode} from 'jwt-decode'; // Decodifica JWT se necessario

export default function LoginScreen({ navigation }) {
    const { colors } = useTheme();
    const dispatch = useDispatch();
    const auth = getAuth(); // Ottieni l'istanza di Firebase Auth
    const [pressed, setPressed] = React.useState(false);

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const [emailError, setEmailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');

    const handleForgotPassword = () => {
        console.log('Password dimenticata');
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

    // Funzione di validazione
    const validateInputs = () => {
        let valid = true;
        setEmailError('');
        setPasswordError('');

        if (email.trim() === '') {
            setEmailError('Il campo email è obbligatorio');
            valid = false;
        }

        if (password.trim() === '') {
            setPasswordError('Il campo password è obbligatorio');
            valid = false;
        }

        return valid;
    };

    const handleLogin = async () => {
        if (validateInputs()) {
            try {
                dispatch(showLoading());

                // Effettua il login con Firebase Auth
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Ottieni il token JWT
                const token = await user.getIdToken();
                const decodedToken = jwtDecode(token); // Decodifica il token se necessario

                // Salva il token in AsyncStorage
                await saveToken(token);

                // Dispatch del loginSuccess con le informazioni dell'utente
                dispatch(loginSuccess({
                    user: {
                        userId: user.uid,
                        email: user.email,
                        fullName: user.displayName || decodedToken.name, // Usa il nome dal token decodificato se disponibile
                    },
                    token, // Salva il token JWT nello stato Redux
                }));

                // Naviga alla schermata Home
                navigation.navigate('Home');
            } catch (error) {
                console.error('Errore durante il login:', error);
                dispatch(loginFailure('Credenziali errate o problema di rete'));
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
        marginTop: 20,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        textAlign: 'left',
        width: '100%',
        marginBottom: 10,
    }
});
