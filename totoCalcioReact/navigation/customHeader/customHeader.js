import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';

// Funzione per generare l'header personalizzato
export function CustomHeader({ navigation }) {
    const userPhoto = 'https://via.placeholder.com/150'; // Puoi sostituirlo con l'URL della foto utente dal tuo backend o Redux
  
    return {
      headerLeft: () => (
        <Avatar.Image
          source={{ uri: userPhoto }}
          size={36}
          style={{ marginLeft: 15 }} // Posiziona la foto profilo a sinistra
        />
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
        backgroundColor: '#323232', // Colore di sfondo dell'header
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
  export function CreateLeagueHeader({ navigation }) {
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
        backgroundColor: '#323232', // Sfondo dell'header
      },
      headerTintColor: '#FFFFFF', // Colore del testo e delle icone
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    };
  }