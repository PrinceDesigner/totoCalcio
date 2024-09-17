
import * as React from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { signupFailure, signupSuccess } from '../../redux/slice/authSlice';
import { hideLoading, showLoading } from '../../redux/slice/uiSlice';
import { saveToken } from '../../AsyncStorage/AsyncStorage';
import { auth, firestore } from '../../firebaseConfig'; // Importa la configurazione di Firebase
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Firebase Auth SDK
import { doc, setDoc } from 'firebase/firestore'; // Firebase Firestore SDK

export default function SignupScreen({ navigation }) {
    const { colors } = useTheme();
    const dispatch = useDispatch();

    const [pressed, setPressed] = React.useState(false); // Stato per gestire l'opacità
    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    // Stati per gestire gli errori
    const [fullNameError, setFullNameError] = React.useState('');
    const [emailError, setEmailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');

    // Funzione di validazione
    const validateInputs = () => {
        let valid = true;

        // Reset degli errori
        setFullNameError('');
        setEmailError('');
        setPasswordError('');

        if (fullName.trim() === '') {
            setFullNameError('Il campo nome completo è obbligatorio');
            valid = false;
        }

        // Validazione email
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            setEmailError('Inserisci un indirizzo email valido');
            valid = false;
        }

        // Validazione password
        if (password.trim() === '') {
            setPasswordError('Il campo password è obbligatorio');
            valid = false;
        }

        return valid;
    };

    const handleSignUp = async () => {
        if (validateInputs()) {
            try {
                dispatch(showLoading());

                // Crea un nuovo utente con Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Aggiorna il displayName dell'utente
                await updateProfile(user, { displayName: fullName });

                // Ottieni il token JWT generato da Firebase
                const token = await user.getIdToken();

                // Salva l'utente in Firestore
                await setDoc(doc(firestore, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: fullName,
                });

                // Salva il token JWT in AsyncStorage
                await saveToken(token);

                // Dispatch dell'azione signupSuccess con le informazioni dell'utente
                dispatch(signupSuccess({
                    user: {
                        userId: user.uid,
                        email: user.email,
                        fullName
                    },
                    token,
                }));

                // Naviga alla schermata principale
                navigation.navigate('Home');
            } catch (error) {
                console.error('Errore durante la registrazione:', error);
                dispatch(signupFailure('Errore nella registrazione'));

                if (error.response) {
                    console.error('Errore durante la registrazione:', error.response.data.message);
                    dispatch(signupFailure(error.response.data.message));
                } else {
                    console.error('Errore durante la registrazione:', error.message);
                    dispatch(signupFailure('Errore nella registrazione'));
                }
            } finally {
                dispatch(hideLoading());
            }
        }
    };



    // Funzione per il signup con Google
    const handleGoogleSignup = async () => {

    };

    // Funzione per il signup con Facebook
    const handleFacebookSignup = async () => {

    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Offset per iOS per evitare che la tastiera copra il contenuto
        >
            <ScrollView contentContainerStyle={{ ...styles.container, backgroundColor: colors.background }}>
                <Image source={require('../../image.png')} style={styles.logo} />

                <Text style={styles.title}>Crea il tuo Account</Text>

                {/* Nome Completo */}
                <View style={styles.inputContainer}>
                    <MaterialIcons name="person" size={24} color={colors.primary} style={styles.icon} />
                    <TextInput
                        label="Nome Completo"
                        value={fullName}
                        onChangeText={text => setFullName(text)}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { text: 'black', placeholder: 'gray' } }}
                    />
                </View>
                {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

                {/* Email */}
                <View style={styles.inputContainer}>
                    <MaterialIcons name="email" size={24} color={colors.primary} style={styles.icon} />
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={text => setEmail(text)}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { text: 'black', placeholder: 'gray' } }}
                    />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                {/* Password */}
                <View style={styles.inputContainer}>
                    <MaterialIcons name="lock" size={24} color={colors.primary} style={styles.icon} />
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={text => setPassword(text)}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                        theme={{ colors: { text: 'black', placeholder: 'gray' } }}
                    />
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                {/* Pulsante di registrazione */}
                <Button mode="contained" style={styles.authButton} onPress={handleSignUp}>
                    Registrati
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
                        onPress={handleGoogleSignup}
                        style={[styles.socialButtonGoogle, { opacity: pressed ? 0.5 : 1 }]}
                    >
                        Google
                    </Button>
                    <Button
                        mode="contained"
                        icon={() => <MaterialCommunityIcons name="facebook" size={24} color="white" />}
                        onPress={handleFacebookSignup}
                        style={[styles.socialButtonFacebook, { opacity: pressed ? 0.5 : 1 }]}
                    >
                        Facebook
                    </Button>
                </View>

                {/* Scritta "Hai già un account? Accedi" */}
                <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                    <Text style={styles.signUpText}>Hai già un account? Accedi</Text>
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
