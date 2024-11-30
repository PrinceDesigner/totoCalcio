import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity, Image, Text, TouchableWithoutFeedback } from 'react-native';
import { Button, TextInput,useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker'; // Libreria per selezionare immagini
import { useDispatch, useSelector } from 'react-redux';
import { updateProfilePhoto, updateProfileThunk, logout } from '../redux/slice/authSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { showToast } from '../ToastContainer';
import { COLORJS } from '../theme/themeColor';
import { getAuth } from 'firebase/auth';
import ProfileCard from './componentScreen/ProfilCard';
import * as ImageManipulator from 'expo-image-manipulator';
import fontStyle from '../theme/fontStyle';

export default function ProfileScreen({ navigation }) {
  const userDetail = useSelector((state) => state.auth.user && state.auth.user.user);
  const photoProfile = useSelector((state) => state.auth.photoUri);
  const [userName, setUserName] = useState(userDetail && userDetail.fullName);
  const [userEmail, setUserEmail] = useState(userDetail && userDetail.email);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

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
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImageUri = pickerResult.assets[0].uri;
  
      // Ridimensionamento dell'immagine
      const resizedImage = await ImageManipulator.manipulateAsync(
        selectedImageUri,
        [{ resize: { width: 500 } }], // Modifica la larghezza a 500px (proporzionale)
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // comprime l'immagine al 70%
      );
  
      // Carica l'immagine ridimensionata
      uploadImage(resizedImage.uri);
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

  const closeImageModal = () => {
    setImageModalVisible(false);
  };

  const openDeleteModal = () => {
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
  };

  const handleDeleteAccount = async () => {
    try {
      dispatch(showLoading());
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await user.delete(); // Elimina l'account da Firebase Auth
        dispatch(logout()); // Logout dallo stato Redux
        navigation.navigate('LoginScreen'); // Naviga alla schermata di login
        showToast('success', 'Account eliminato con successo');
      } else {
        throw new Error('Utente non trovato');
      }
    } catch (error) {
      console.error(`Errore durante l'eliminazione dell'account:`, error);
      showToast('error', `Errore durante l'eliminazione dell'account. Devi prima autenticarti di nuovo.`);
    } finally {
      dispatch(hideLoading());
      closeDeleteModal(); // Chiudi la modale di conferma
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={{ ...styles.container, backgroundColor: colors.background }}>
        <ProfileCard onAvatarPress={handleChangeImage} fullName={userDetail?.fullName} photoProfile={photoProfile} />
        <View style={styles.tabsContainer}>
          {/* <TouchableWithoutFeedback onPress={() => setActiveTab('other')}>
            <View style={[styles.tab, activeTab === 'other' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'other' && styles.activeTabText]}>Altro</Text>
            </View>
          </TouchableWithoutFeedback> */}
          <TouchableWithoutFeedback onPress={() => setActiveTab('info')}>
            <View style={[styles.tab, activeTab === 'info' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Informazioni</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>

        {activeTab === 'info' && (
          <View style={styles.tabContent}>
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
            <Button mode="contained" onPress={openDeleteModal} style={styles.deleteButton}>
              Elimina Account
            </Button>
          </View>
        )}

        {activeTab === 'other' && (
          <View style={styles.tabContent}>
            <Text>Contenuto del tab "Altro" (da definire).</Text>
          </View>
        )}
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

      {/* Modale per la conferma di eliminazione dell'account */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.modalText}>Sei sicuro di voler eliminare il tuo account? Questa operazione è irreversibile.</Text>
            <View style={styles.modalButtons}>
              <Button mode="contained" onPress={handleDeleteAccount} style={styles.modalButton}>
                Elimina
              </Button>
              <Button mode="outlined" onPress={closeDeleteModal} style={styles.modalButton}>
                Annulla
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 50,
    backgroundColor: COLORJS.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORJS.primary,
  },
  tabText: {
    fontSize: 16,
    color: 'gray',
    ...fontStyle.textMedium
  },
  activeTabText: {
    color: COLORJS.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    marginTop: 20,
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
  deleteButton: {
    width: '100%',
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: 'red',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullScreenImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  deleteModalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 10,
    ...fontStyle.textMedium
  },
});
