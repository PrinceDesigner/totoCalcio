import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux'; // Per dispatchare azioni
import { createLeagueThunk } from '../redux/slice/leaguesSlice'; // Importa il thunk
import { showLoading, hideLoading } from '../redux/slice/uiSlice'; // Importa per mostrare/nascondere caricamento

export default function CreateLeagueScreen({ navigation }) {
  const [leagueName, setLeagueName] = useState(''); // Stato per il nome della lega
  const { colors } = useTheme();
  const dispatch = useDispatch(); // Usa dispatch per inviare l'azione Redux

  const handleCreateLeague = async () => {
    if (leagueName.trim()) {
      try {
        dispatch(showLoading()); // Mostra il caricamento

        // Dispatcha il thunk per creare la lega
        await dispatch(createLeagueThunk(leagueName)).unwrap();

        Alert.alert('Successo', `Lega "${leagueName}" creata con successo!`);
        navigation.goBack(); // Torna indietro o naviga verso un'altra schermata
      } catch (error) {
        Alert.alert('Errore', 'Errore durante la creazione della lega.');
        console.error('Errore durante la creazione della lega:', error);
      } finally {
        dispatch(hideLoading()); // Nascondi il caricamento
      }
    } else {
      Alert.alert('Errore', 'Il nome della lega non può essere vuoto.');
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

          {/* Campo di input per il nome della lega */}
          <TextInput
            label="Nome della lega"
            value={leagueName}
            onChangeText={setLeagueName}
            mode="outlined"
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
