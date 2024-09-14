import * as React from 'react';
import { Provider, useSelector } from 'react-redux';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import store from './redux/store'; // Importa lo store di Redux
import { ActivityIndicator, Provider as PaperProvider, useTheme, Avatar } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Aggiungi Drawer Navigation
import { customDarkTheme } from './theme/temi'; // Importa i temi personalizzati
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import HomeScreen from './screens/HomeScreen'; // Aggiungi la schermata Home
import { MaterialIcons } from '@expo/vector-icons'; // Importa l'icona dell'hamburger menu
import CustomDrawerContent from './components/CustomDrawerContent';
import LeagueStackNavigator from './navigation/LeagueStackNavigator';
import CreateLeagueScreen from './screens/CreateLeagueScreen';
import { CreateLeagueHeader, CustomHeader } from './navigation/customHeader/customHeader';
import JoinLeagueScreen from './screens/joinLeagueScreen';

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


// Configura il Drawer Navigation con Custom Drawer Content
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />} // Usa il CustomDrawerContent
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
        name="Home1"
        component={HomeScreen}
        options={{ title: 'Le mie leghe' }}
      />
      <Drawer.Screen
        name="CreateLeague"
        component={CreateLeagueScreen}
        options={({ navigation }) => ({
          title: 'Crea una nuova lega',
          headerShown: true, // Mostra l'header solo per questa schermata
          ...CreateLeagueHeader({ navigation }), // Applica l'header personalizzato con Go Back
        })}
      />
      <Drawer.Screen
        name="JoinLeague"
        component={JoinLeagueScreen}
        options={({ navigation }) => ({
          title: 'Unisciti ad una lega',
          headerShown: true, // Mostra l'header solo per questa schermata
          ...CreateLeagueHeader({ navigation }), // Applica l'header personalizzato con Go Back
        })}
      />
      {/* Aggiungi altre schermate nel Drawer qui */}
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
              <Stack.Screen
                name="LeagueDetailsStack"
                component={LeagueStackNavigator}
                options={{ headerShown: false }} // Nascondi l'header per LeagueStackNavigator
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
