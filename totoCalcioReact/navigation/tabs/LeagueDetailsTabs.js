import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Usa Ionicons per le icone
import LeagueDetails from '../../screens/LeagueDetails';
import ParticipantsListScreen from '../../screens/ParticipantsListScreen';
import { COLORJS } from '../../theme/themeColor';
import ListGiornateDaCalcolareScreen from '../../screens/ListGiornateDaCalcolareScreen';
import { useSelector } from 'react-redux';
import { selectLeagueById } from '../../redux/slice/leaguesSlice';

const Tab = createBottomTabNavigator();


export default function LeagueDetailsTabs() {

    const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));
    const ownerid = selectedLeague?.ownerId
    const navigation = useNavigation(); // Ottieni l'oggetto di navigazione


    return (
        <Tab.Navigator
        initialRouteName="Home Lega"
            screenOptions={({ route }) => ({
                headerStyle: {
                    backgroundColor: COLORJS.surface, // Colore di sfondo dell'header
                    borderBottomColor: '#e5e7eb', // Colore del bordo inferiore
                    borderBottomWidth: 1, // Spessore del bordo inferiore
                },
                headerTintColor: '#FFFFFF', // Colore del testo (bianco)
                headerTitleStyle: {
                    fontWeight: 'bold', // Stile del testo nell'header
                },
                tabBarStyle: {
                    backgroundColor: COLORJS.primary, // Sfondo della tab bar
                    borderTopColor: '#e5e7eb', // Colore del bordo superiore della tab bar
                },
                tabBarActiveTintColor: '#FFFFFF', // Colore delle icone e del testo quando attivi
                tabBarInactiveTintColor: '#888888', // Colore delle icone e del testo quando inattivi
                tabBarLabelStyle: {
                    fontSize: 12, // Dimensione del testo delle etichette
                    fontWeight: 'bold', // Grassetto per le etichette
                },
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Home Lega') {
                        iconName = 'home';
                    } else if (route.name === 'Partecipanti') {
                        iconName = 'people';
                    } else if (route.name === 'Le Mie Leghe') {
                        iconName = 'list';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Home Lega"
                component={LeagueDetails}
                options={{ headerShown: false }}
            />
            <Tab.Screen name="Partecipanti" component={ParticipantsListScreen} />
            <Tab.Screen
                name="Le Mie Leghe"
                component={LeagueDetails} // Può essere qualsiasi componente, ma non verrà caricato
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault(); // Previene il comportamento predefinito del Tab Navigator
                        navigation.navigate('Home'); // Naviga direttamente alla schermata Home dello stack principale
                    },
                }}
            />
            {userId === ownerid && (
                <Tab.Screen
                    name="Calcolo Giornate"
                    component={ListGiornateDaCalcolareScreen}
                />
            )}
        </Tab.Navigator>
    );
}
