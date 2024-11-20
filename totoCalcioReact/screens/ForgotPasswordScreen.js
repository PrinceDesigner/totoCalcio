import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Keyboard } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // Firebase import
import { showToast } from '../ToastContainer'; // Assume che il tuo ToastContainer gestisca i messaggi

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    Keyboard.dismiss();
    if (email.trim()) {
      setLoading(true);
      const auth = getAuth();
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('success', 'Email per il reset della password inviata con successo. Controlla la tua posta.');
        navigation.goBack();
      } catch (error) {
        const errorMessage = error.message || 'Errore durante l\'invio della richiesta';
        showToast('error', errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Errore', 'L\'email non può essere vuota.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
          <Text style={styles.title}>Recupero Password</Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleForgotPassword}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Invia Email di Recupero
          </Button>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  input: {
    width: '80%',
    marginBottom: 20,
  },
  button: {
    width: '80%',
    height: 50,
    justifyContent: 'center',
    borderRadius: 10,
  },
});
