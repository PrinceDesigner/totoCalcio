import 'react-native-gesture-handler'; // Importa all'inizio del file
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Avvolgi l'app con questo componente
import * as React from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { StyleSheet, View } from 'react-native';
import store from './redux/store'; // Importa lo store di Redux
import { ActivityIndicator, Provider as PaperProvider, useTheme, Avatar, Text } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Aggiungi Drawer Navigation
import { customDarkTheme } from './theme/temi'; // Importa i temi personalizzati
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import HomeScreen from './screens/HomeScreen'; // Aggiungi la schermata Home
import JoinLeagueScreen from './screens/JoinLeagueScreen'; // Aggiungi la schermata Home
import CustomDrawerContent from './components/CustomDrawerContent';
import LeagueStackNavigator from './navigation/LeagueStackNavigator';
import CreateLeagueScreen from './screens/CreateLeagueScreen';
import { CustomHeaderBackArrow, CustomHeader } from './navigation/customHeader/customHeader';

import ProfileScreen from './screens/ProfileScreen';
import SignupScreen from './screens/auth/SignupScreen';
import SplashScreen from './screens/SplashScreen';
import { COLORJS } from './theme/themeColor';

import * as Font from 'expo-font';

import ToastContainer from './ToastContainer';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import fontStyle from './theme/fontStyle';
import { configureAxios } from './services/axiosInterceptor';
import { navigationRef } from './navigation/navigationRef';
import OnboardingCarousel from './screens/onBoardingScreen/OnBoardingTutorial';

import NetInfo from '@react-native-community/netinfo'; // Per monitorare la connessione
import TutorialAccordion from './screens/comegiocare/tutorialAccordion';
import ContactPage from './screens/contatti/contattiScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator(); // Crea un Drawer Navigator


function GlobalLoadingIndicator() {
  const loading = useSelector((state) => state.ui.loading); // Ottieni lo stato di loading dal Redux store
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const isConnected = useSelector((state) => state.network.isConnected); // Stato della connessione
  const dispatch = useDispatch(); // Usa il dispatch di Redux

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: state.isConnected });
    });


    return () => unsubscribe(); // Cleanup del listener
  }, [dispatch]);

  React.useEffect(() => {
    const loadFonts = async () => {
      try {
        // Carica tutti i font dalla cartella assets/fonts
        await Font.loadAsync({
          'Roboto-Black': require('./assets/fonts/Roboto-Black.ttf'),
          'Roboto-BlackItalic': require('./assets/fonts/Roboto-BlackItalic.ttf'),
          'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
          'Roboto-BoldItalic': require('./assets/fonts/Roboto-BoldItalic.ttf'),
          'Roboto-Italic': require('./assets/fonts/Roboto-Italic.ttf'),
          'Roboto-Light': require('./assets/fonts/Roboto-Light.ttf'),
          'Roboto-LightItalic': require('./assets/fonts/Roboto-LightItalic.ttf'),
          'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
          'Roboto-MediumItalic': require('./assets/fonts/Roboto-MediumItalic.ttf'),
          'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Thin': require('./assets/fonts/Roboto-Thin.ttf'),
          'Roboto-ThinItalic': require('./assets/fonts/Roboto-ThinItalic.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Errore durante il caricamento dei font:', error);
      }
    };
    loadFonts();
  }, []);


  // Mostra il loading solo se c'è una richiesta in corso o manca la connessione
  if (!loading && isConnected && fontsLoaded) {
    return null; // Nessun overlay se non ci sono problemi
  }

  return (
    <View style={styles.loadingOverlay}>
      {!isConnected ? (
        <View>
          <ActivityIndicator size="large" color={COLORJS.primary} />
          <Text style={styles.loadingText}>Stiamo connettendo...</Text>
        </View>
      ) : (
        <ActivityIndicator size="large" color={COLORJS.primary} />
      )}
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
          backgroundColor: COLORJS.background, // Sfondo del drawer
        },
        drawerLabelStyle: {
          ...fontStyle.textBold,
          color: 'white',
        },
        drawerActiveBackgroundColor: COLORJS.surface, // Colore di sfondo della voce attiva
        drawerActiveTintColor: COLORJS.primary, // Colore del testo della voce attiva
        drawerInactiveTintColor: COLORJS.primary, // Colore del testo delle voci inattive
      })}
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home1"
        component={HomeScreen}
        options={{ title: 'Le mie leghe', headerShown: false }}
      />
      <Drawer.Screen
        name="CreateLeague"
        component={CreateLeagueScreen}
        options={({ navigation }) => ({
          title: 'Crea una nuova lega',
          headerShown: true, // Mostra l'header solo per questa schermata
          ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
        })}
      />
      <Drawer.Screen
        name="JoinLeague"
        component={JoinLeagueScreen}
        options={({ navigation }) => ({
          title: 'Unisciti ad una lega',
          headerShown: true, // Mostra l'header solo per questa schermata
          ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
        })}
      />
      <Drawer.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Profilo',
          headerShown: true, // Mostra l'header solo per questa schermata
          ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
        })}
      />
      <Drawer.Screen
        name="TutorialAccordionScreen"
        component={TutorialAccordion}
        options={({ navigation }) => ({
          title: 'Domande Frequenti',
          headerShown: true, // Mostra l'header solo per questa schermata
          ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
        })}
      />
      <Drawer.Screen
        name="ContactPageScreen"
        component={ContactPage}
        options={({ navigation }) => ({
          title: 'Contattaci',
          headerShown: true, // Mostra l'header solo per questa schermata
          ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
        })}
      />
      {/* Aggiungi altre schermate nel Drawer qui */}
    </Drawer.Navigator>
  );
}
configureAxios(store.dispatch, navigationRef);

export default function App() {
  // Cambia il tema in base allo stato
  const theme = customDarkTheme;
  const toastRef = React.useRef(); // Usa useRef per gestire il ref

  React.useEffect(() => {
    if (toastRef.current) {
      Toast.setRef(toastRef.current); // Assicurati di settare il ref solo dopo che il componente è montato
    }
  }, [toastRef]);




  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <Provider store={store}>
          <NavigationContainer ref={navigationRef}>
            <View style={{ flex: 1 }}>
              <Stack.Navigator initialRouteName="SplashScreen">
                <Stack.Screen
                  name="SplashScreen"
                  component={SplashScreen}
                  options={{ headerShown: false }}
                />
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
                <Stack.Screen
                  name="OnBoardingTutorial"
                  component={OnboardingCarousel}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="SignupScreen"
                  component={SignupScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ForgotPasswordScreen"
                  component={ForgotPasswordScreen}
                  options={({ navigation }) => ({
                    title: 'Password Dimenticata',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                  })}
                />
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
                <Stack.Screen name="EmailVerificationScreen" component={EmailVerificationScreen} options={{ headerShown: false }} />

              </Stack.Navigator>
              <GlobalLoadingIndicator />
            </View>
          </NavigationContainer>
          <ToastContainer />
        </Provider>
      </PaperProvider>
    </GestureHandlerRootView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: 'white',
  },
});
