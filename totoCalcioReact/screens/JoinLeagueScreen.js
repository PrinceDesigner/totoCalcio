import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper'; // Importiamo TextInput da React Native Paper

export default function JoinLeagueScreen({ navigation }) {
  const [leagueCode, setLeagueCode] = useState(''); // Stato per il codice della lega
  const { colors } = useTheme();

  const handleJoinLeague = () => {
    if (leagueCode.trim()) {
      console.log(`Unito alla lega con codice: ${leagueCode}`);
      // Puoi aggiungere logica aggiuntiva qui, ad esempio inviare il codice della lega a un server
      navigation.goBack(); // Torna indietro o naviga verso un'altra schermata
    } else {
      console.log('Il codice della lega non può essere vuoto.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
          <Text style={styles.title}>Inserisci il codice della lega</Text>

          {/* Campo di input per il codice della lega usando React Native Paper */}
          <TextInput
            label="Codice della lega"
            value={leagueCode}
            onChangeText={setLeagueCode}
            mode="outlined" // Stile dell'input (outlined o flat)
            style={styles.input}
          />

          {/* Bottone per unirsi alla lega */}
          <Button
            mode="contained"
            onPress={handleJoinLeague}
            style={styles.button}
          >
            Unisciti alla Lega
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra orizzontalmente
    backgroundColor: '#f5f5f5', // Sfondo leggero
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  input: {
    width: '80%', // Larghezza dell'input
    marginBottom: 20,
  },
  button: {
    width: '80%',
    height: 50,
    justifyContent: 'center', // Centra il testo del bottone
    borderRadius: 10,
  },
});
