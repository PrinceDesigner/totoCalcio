import * as React from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'; // Aggiungi MaterialCommunityIcons

export default function LoginScreen() {
    const { colors } = useTheme(); // Recupera i colori dal tema
    const [pressed, setPressed] = React.useState(false); // Stato per gestire l'opacità
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

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
                        onChangeText={text => setUsername(text)}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { text: 'black', placeholder: 'gray' } }}
                    />
                </View>

                {/* Wrappa l'input per password e icona in una View */}
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

                <View style={{ width: '100%' }}>
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotPassword}>Dimenticato password?</Text>
                    </TouchableOpacity>
                </View>

                {/* Pulsante Login */}
                <Button mode="contained" style={styles.authButton}>
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
        marginBottom: 20,
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
});
