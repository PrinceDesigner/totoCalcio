// App.js

import * as React from 'react';
import { Provider, useSelector } from 'react-redux';
import store from './redux/store'; // Importa lo store di Redux
import { ActivityIndicator, Provider as PaperProvider, useTheme, Avatar } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Aggiungi Drawer Navigation
import { customDarkTheme } from './theme/temi'; // Importa i temi personalizzati
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import HomeScreen from './screens/HomeScreen'; // Aggiungi la schermata Home
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Importa l'icona dell'hamburger menu

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator(); // Crea un Drawer Navigator

function GlobalLoadingIndicator() {
  const loading = useSelector((state) => state.ui.loading); // Ottieni lo stato di loading dal Redux store
  const { colors } = useTheme(); // Usa il tema per il colore del caricamento

  if (!loading) {
    return null; // Non mostrare nulla se non c'è caricamento
  }

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// Funzione per generare l'header personalizzato
function CustomHeader({ navigation }) {
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

// Configura il Drawer Navigation con il colore personalizzato
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        ...CustomHeader({ navigation }), // Applica l'header personalizzato a ogni schermata
        drawerStyle: {
          backgroundColor: '#161616', // Sfondo del drawer
        },
        drawerActiveBackgroundColor: '#323232', // Colore di sfondo della voce attiva
        drawerActiveTintColor: '#a21fec', // Colore del testo della voce attiva
        drawerInactiveTintColor: '#a21fec', // Colore del testo delle voci inattive
      })}
      initialRouteName="Home"
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Le mie leghe' }} 
      />
      {/* Aggiungi altre schermate nel Drawer qui, come "Profilo", "Impostazioni", ecc. */}
    </Drawer.Navigator>
  );
}

export default function App() {
  // Cambia il tema in base allo stato
  const theme = customDarkTheme;

  return (
    <PaperProvider theme={theme}>
      <Provider store={store}>
        <NavigationContainer>
          <View style={{ flex: 1 }}>
            <Stack.Navigator initialRouteName="Onboarding">
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              {/* Usa il DrawerNavigator una volta loggato */}
              <Stack.Screen
                name="Home"
                component={DrawerNavigator}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
            <GlobalLoadingIndicator />
          </View>
        </NavigationContainer>
      </Provider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Sfondo trasparente scuro
    justifyContent: 'center',
    alignItems: 'center',
  },
});
