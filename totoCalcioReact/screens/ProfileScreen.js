import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Button, TextInput, Avatar, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker'; // Libreria per selezionare immagini
import { useDispatch, useSelector } from 'react-redux';
import { updateProfilePhoto } from '../redux/slice/authSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { showToast } from '../ToastContainer';

export default function ProfileScreen({ navigation }) {
  const [userName, setUserName] = useState('Mario Rossi');
  const [userEmail, setUserEmail] = useState('mario.rossi@example.com');
  const [profileImage, setProfileImage] = useState(null); // Stato per l'immagine del profilo
  const photoProfile = useSelector((state) => state.auth.photoUri); // Stato delle leghe

  const { colors } = useTheme();
  const dispatch = useDispatch();


  const handleChangeImage = async () => {
    // Richiedi il permesso per accedere alla galleria
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("È necessario concedere l'accesso alla galleria per cambiare l'immagine.");
      return;
    }

    // Apri la galleria e seleziona un'immagine
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImageUri = pickerResult.assets[0].uri;
      uploadImage(selectedImageUri); // Carica l'immagine su Firebase
      setProfileImage(selectedImageUri); // Imposta l'URI dell'immagine selezionata
    } else {
      console.log('Immagine non selezionata o cancellata');
    }
  };

  const uploadImage = async (uri) => {
    try {
      // Mostra il caricamento
      dispatch(showLoading());
  
      // Esegui il caricamento dell'immagine
      await dispatch(updateProfilePhoto(uri)).unwrap();
  
      // Stampa un messaggio di successo
      console.log('Foto profilo aggiornata con successo!');
  
      // Puoi anche mostrare un messaggio di successo con un toast, se necessario
      showToast('success', 'Foto profilo aggiornata con successo!');
    } catch (error) {
      // Stampa un messaggio di errore
      console.error('Errore durante il caricamento della foto:', error);
  
      // Puoi anche mostrare un messaggio di errore con un toast, se necessario
      showToast('error', 'Errore durante il caricamento della foto');
    } finally {
      // Nascondi il caricamento
      dispatch(hideLoading());
    }
  };

  const handleSaveProfile = () => {
    console.log(`Salva profilo: Nome = ${userName}, Email = ${userEmail}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={{ ...styles.container, backgroundColor: colors.background }}>
        <View style={styles.profileSection}>
          {/* Mostra l'avatar dell'utente */}
          <Avatar.Image
            size={100}
            source={photoProfile ? { uri: photoProfile } : { uri: 'https://via.placeholder.com/150' }}
          />
          <Button mode="text" onPress={handleChangeImage} style={styles.changeImageButton}>
            Cambia immagine
          </Button>

          <TextInput
            label="Nome"
            value={userName}
            onChangeText={setUserName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={userEmail}
            onChangeText={setUserEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
          />

          <Button mode="contained" onPress={handleSaveProfile} style={styles.saveButton}>
            Salva modifiche
          </Button>
        </View>

        {/* Sezione leghe */}
        <View style={styles.leaguesSection}>
          <Text style={styles.sectionTitle}>Le mie leghe</Text>
          {/* Aggiungi qui il render delle leghe */}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  changeImageButton: {
    marginTop: 10,
  },
  input: {
    width: '100%',
    marginBottom: 20,
  },
  saveButton: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});
