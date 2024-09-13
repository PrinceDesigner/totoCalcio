import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import LeagueDetails from '../../screens/LeagueDetails';

const Tab = createBottomTabNavigator();

// Schermata Partecipanti
function ParticipantsScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Partecipanti della Lega</Text>
        </View>
    );
}

export default function LeagueDetailsTabs() {
    const { colors } = useTheme();
    const navigation = useNavigation(); // Ottieni l'oggetto di navigazione

    return (
        <Tab.Navigator screenOptions={{
            headerStyle: {
                backgroundColor: '#323232', // Colore di sfondo dell'header
                borderBottomColor: '#e5e7eb', // Colore del bordo inferiore
                borderBottomWidth: 1, // Spessore del bordo inferiore
            },
            headerTintColor: '#FFFFFF', // Colore del testo (bianco)
            headerTitleStyle: {
                fontWeight: 'bold', // Stile del testo nell'header
            },
            tabBarStyle: {
                backgroundColor: '#323232', // Sfondo della tab bar
                borderTopColor: '#e5e7eb', // Colore del bordo superiore della tab bar
            },
            tabBarActiveTintColor: '#FFFFFF', // Colore delle icone e del testo quando attivi
            tabBarInactiveTintColor: '#888888', // Colore delle icone e del testo quando inattivi
            tabBarLabelStyle: {
                fontSize: 12, // Dimensione del testo delle etichette
                fontWeight: 'bold', // Grassetto per le etichette
            }
        }}>
            <Tab.Screen name="Dettagli" component={LeagueDetails} />
            <Tab.Screen name="Partecipanti" component={ParticipantsScreen} />
            {/* Tab per tornare direttamente alla schermata Home */}
            <Tab.Screen
                name="Home"
                component={LeagueDetails} // Può essere qualsiasi componente, ma non verrà caricato
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault(); // Previene il comportamento predefinito del Tab Navigator
                        navigation.navigate('Home'); // Naviga direttamente alla schermata Home dello stack principale
                    },
                }}
            />
        </Tab.Navigator>
    );
}
