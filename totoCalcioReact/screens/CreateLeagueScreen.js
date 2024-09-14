import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper'; // Importiamo TextInput da React Native Paper

export default function CreateLeagueScreen({ navigation }) {
  const [leagueName, setLeagueName] = useState(''); // Stato per il nome della lega
  const { colors } = useTheme();

  const handleCreateLeague = () => {
    if (leagueName.trim()) {
      console.log(`Lega creata: ${leagueName}`);
      // Puoi aggiungere logica aggiuntiva qui, ad esempio inviare il nome della lega a un server
      navigation.goBack(); // Torna indietro o naviga verso un'altra schermata
    } else {
      console.log('Nome della lega non può essere vuoto.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
          <Text style={styles.title}>Nome della tua nuova lega</Text>

          {/* Campo di input per il nome della lega usando React Native Paper */}
          <TextInput
            label="Nome della lega"
            value={leagueName}
            onChangeText={setLeagueName}
            mode="outlined" // Stile dell'input (outlined o flat)
            style={styles.input}
          />

          {/* Bottone per creare la lega */}
          <Button
            mode="contained"
            onPress={handleCreateLeague}
            style={styles.button}
          >
            Crea Lega
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
