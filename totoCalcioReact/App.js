// App.js

import * as React from 'react';
import { Provider, useSelector } from 'react-redux';
import store from './redux/store'; // Importa lo store di Redux
import { ActivityIndicator, Provider as PaperProvider, useTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { customDarkTheme } from './theme/temi'; // Importa i temi personalizzati
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import { StyleSheet, View } from 'react-native';


const Stack = createStackNavigator();

export default function App() {


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
            </Stack.Navigator>
            {/* Componente per il caricamento globale */}
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