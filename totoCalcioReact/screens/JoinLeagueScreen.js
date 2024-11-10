import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper'; 
import { useDispatch, useSelector } from 'react-redux';
import { joinLeagueThunk } from '../redux/slice/leaguesSlice'; 
import { showLoading, hideLoading } from '../redux/slice/uiSlice';
import fontStyle from '../theme/fontStyle';
import { showToast } from '../ToastContainer';



export default function JoinLeagueScreen({ navigation }) {
  const [leagueCode, setLeagueCode] = useState('');
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const loading = useSelector((state) => state.ui.loading);

  const handleJoinLeague = async () => {
    if (leagueCode.trim()) {
      dispatch(showLoading());
      try {
        await dispatch(joinLeagueThunk(leagueCode)).unwrap();
        showToast('success', 'Ti sei unito alla lega con successo');
        navigation.goBack();
      } catch (error) {
        // Controlla se l'errore è un oggetto e visualizza il messaggio correttamente
        showToast('error', error.message);
      } finally {
        dispatch(hideLoading());
      }
    } else {
      Alert.alert('Errore', 'Il codice della lega non può essere vuoto.');
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

          <TextInput
            label="Codice della lega"
            value={leagueCode}
            onChangeText={setLeagueCode}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleJoinLeague}
            style={styles.button}
            labelStyle={{
              ...fontStyle.textLight
          }}
            loading={loading}
            disabled={loading}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    ...fontStyle.textBold,
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
  errorText: {
    marginTop: 10,
    color: 'red',
    fontSize: 14,
  },
});
