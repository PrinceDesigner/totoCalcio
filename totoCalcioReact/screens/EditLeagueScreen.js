import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux'; // Per dispatchare azioni
import { updateLeagueNameThunk } from '../redux/slice/leaguesSlice'; // Thunk per aggiornare la lega
import { showLoading, hideLoading } from '../redux/slice/uiSlice'; // Importa per mostrare/nascondere caricamento
import { showToast } from '../ToastContainer';

export default function EditLeagueScreen({ route, navigation }) {
  const { leagueId } = route.params; // Ottieni l'ID della lega passato tramite la navigazione
  const { colors } = useTheme();
  const dispatch = useDispatch();

  // Ottieni la lega attuale dallo store
  const league = useSelector((state) => state.leagues.leagues.find((l) => l.id === leagueId));
  
  const [leagueName, setLeagueName] = useState(league ? league.name : ''); // Stato per il nome della lega

  useEffect(() => {
    if (!league) {
      Alert.alert('Errore', 'Lega non trovata');
      navigation.goBack();
    }
  }, [league, navigation]);

  const handleUpdateLeague = async () => {
    if (leagueName.trim()) {
      try {
        dispatch(showLoading()); // Mostra il caricamento
        console.log('handleUpdateLeague', leagueName);
        // Dispatcha il thunk per aggiornare la lega
        await dispatch(updateLeagueNameThunk({ leagueId, leagueName })).unwrap();

        showToast('success', 'Lega aggiornata con successo');
        navigation.goBack(); // Torna indietro o naviga verso un'altra schermata
      } catch (error) {
        Alert.alert('Errore', 'Errore durante l\'aggiornamento della lega.');
        console.error('Errore durante l\'aggiornamento della lega:', error);
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
          <Text style={styles.title}>Modifica la tua Lega</Text>

          {/* Campo di input per il nome della lega */}
          <TextInput
            label="Nome della lega"
            value={leagueName}
            onChangeText={setLeagueName}
            mode="outlined"
            style={styles.input}
          />

          {/* Messaggio di avviso */}
          <Text style={styles.warningText}>
            ⚠️ Modificare il nome della lega non influirà sulle impostazioni o sulle partite in corso. Le modifiche saranno applicate immediatamente.
          </Text>

          {/* Bottone per salvare la modifica */}
          <Button
            mode="contained"
            onPress={handleUpdateLeague}
            style={styles.button}
          >
            Salva Modifiche
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
  warningText: {
    width: '80%',
    color: '#FFD700', // Giallo per attirare l'attenzione
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#333', // Sfondo scuro per evidenziare il messaggio
    borderRadius: 5,
  },
  button: {
    width: '80%',
    height: 50,
    justifyContent: 'center',
    borderRadius: 10,
  },
});
