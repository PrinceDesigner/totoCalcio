import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity, Image, Text } from 'react-native';
import { Button, TextInput, Avatar, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker'; // Libreria per selezionare immagini
import { useDispatch, useSelector } from 'react-redux';
import { updateProfilePhoto, updateProfileThunk } from '../redux/slice/authSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { showToast } from '../ToastContainer';

export default function ProfileScreen({ navigation }) {
  const userDetail = useSelector((state) => state.auth.user && state.auth.user.user); // Stato delle leghe
  const photoProfile = useSelector((state) => state.auth.photoUri); // Foto profilo dal Redux store
  const [userName, setUserName] = useState(userDetail && userDetail.fullName); // Stato per il nome utente
  const [userEmail, setUserEmail] = useState(userDetail && userDetail.email); // Stato per l'email
  const [profileImage, setProfileImage] = useState(null); // Stato per l'immagine del profilo
  const [isImageModalVisible, setImageModalVisible] = useState(false); // Stato per mostrare/nascondere la modale dell'immagine

  const dispatch = useDispatch();
  const { colors } = useTheme();

  const handleChangeImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("È necessario concedere l'accesso alla galleria per cambiare l'immagine.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Mantieni un aspetto quadrato per l'immagine
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImageUri = pickerResult.assets[0].uri;
      uploadImage(selectedImageUri); // Carica l'immagine su Firebase
    } else {
      console.log('Immagine non selezionata o cancellata');
    }
  };

  const uploadImage = async (uri) => {
    try {
      dispatch(showLoading());
      await dispatch(updateProfilePhoto(uri)).unwrap();
      showToast('success', 'Foto profilo aggiornata con successo!');
    } catch (error) {
      console.error('Errore durante il caricamento della foto:', error);
      showToast('error', 'Errore durante il caricamento della foto');
    } finally {
      dispatch(hideLoading());
    }
  };

  const handleSaveProfile = async () => {
    try {
      const userId = userDetail.userId;
      dispatch(showLoading());
      await dispatch(updateProfileThunk({ email: userEmail, displayName: userName, userId })).unwrap();
      showToast('success', 'Profilo aggiornato con successo');
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del profilo:', error);
      showToast('error', 'Errore durante l\'aggiornamento del profilo');
    } finally {
      dispatch(hideLoading());
    }
  };

  // Funzione per aprire la modale dell'immagine ingrandita
  const openImageModal = () => {
    setImageModalVisible(true);
  };

  // Funzione per chiudere la modale
  const closeImageModal = () => {
    setImageModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={{ ...styles.container, backgroundColor: colors.background }}>
        <View style={styles.profileSection}>
          {/* Mostra l'avatar dell'utente */}
          <TouchableOpacity onPress={openImageModal}>
            <Avatar.Image
              size={100}
              source={photoProfile ? { uri: photoProfile } : { uri: 'https://via.placeholder.com/150' }}
            />
          </TouchableOpacity>

          <Button mode="text" mode="contained" onPress={handleChangeImage} style={styles.changeImageButton}>
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
        </View>
      </View>

      {/* Modale per l'immagine ingrandita */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={closeImageModal}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeImageModal}>
          <Image
            source={photoProfile ? { uri: photoProfile } : { uri: 'https://via.placeholder.com/150' }}
            style={styles.fullScreenImage}
          />
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Sfondo semitrasparente per la modale
  },
  fullScreenImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain', // Ridimensiona l'immagine senza deformarla
  },
});
