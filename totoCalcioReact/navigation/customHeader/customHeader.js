import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import { COLORJS } from '../../theme/themeColor';
import { getAuth } from 'firebase/auth'; // Importa Firebase Authentication
import { useDispatch, useSelector } from 'react-redux';
import { updatePhotoUri } from '../../redux/slice/authSlice';
import fontStyle from '../../theme/fontStyle';

// Funzione per generare l'header personalizzato
export function CustomHeader({ navigation }) {
  const photoProfile = useSelector((state) => state.auth.photoUri); // Stato delle leghe

  return {
    headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
        <Avatar.Image
          source={{ uri: photoProfile || 'https://via.placeholder.com/150' }}
          size={36}
          style={{ marginLeft: 15 }} // Posiziona la foto profilo a sinistra
        />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
        <MaterialIcons
          name="menu"
          size={28}
          color="#FFFFFF" // Colore dell'icona hamburger (bianco)
          style={{ marginRight: 15 }} // Posiziona l'hamburger menu a destra
        />
      </TouchableOpacity>
    ),
    headerStyle: {
      backgroundColor: COLORJS.surface, // Colore di sfondo dell'header
      borderBottomColor: '#e5e7eb', // Colore del bordo inferiore
      borderBottomWidth: 1, // Spessore del bordo inferiore
    },
    headerTintColor: '#FFFFFF', // Colore del testo (bianco)
    headerTitleStyle: {
      fontWeight: 'bold', // Stile del testo nell'header
    },
  };
}

// Funzione per generare l'header con il Go Back per "CreateLeagueScreen"
export function CustomHeaderBackArrow({ navigation }) {
  return {
    headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <MaterialIcons
          name="arrow-back"
          size={28}
          color="#FFFFFF"
          style={{ marginLeft: 15 }} // Posiziona il pulsante Go Back a sinistra
        />
      </TouchableOpacity>
    ),
    headerStyle: {
      backgroundColor: COLORJS.secondaryBackGroud, // Sfondo dell'header
    },
    headerTintColor: '#FFFFFF', // Colore del testo e delle icone
    headerTitleStyle: {
      ...fontStyle.textLight
    },
  };
}