import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LeagueDetailsTabs from './tabs/LeagueDetailsTabs';
import InsertResultsScreen from '../screens/InsertResultScreen';
import { CustomHeaderBackArrow } from './customHeader/customHeader';
import FullParticipantsRankingScreen from '../screens/FullParticipantsRankingScreen';
import GiornataDetailsScreen from '../screens/giornataDetailsScreen';
import GiornataDetailsUserScreen from '../screens/GiornataDetailsUserScreen';
import UserHistoryScreen from '../screens/userDaysHistorScreen';
import GiornataSchedinaDetailsUserScreen from '../screens/SchedinaStoricoUtenteScreen';
import EditLeagueScreen from '../screens/EditLeagueScreen';
import FormazioneScreen from '../screens/FormazioneScreen';
import { useSelector } from 'react-redux';

const Stack = createStackNavigator();

export default function LeagueStackNavigator() {
    const userDetail = useSelector((state) => state.auth.user && state.auth.user.user);

    return (
        <Stack.Navigator>
            {/* Schermata LeagueDetails con i tab */}
            <Stack.Screen
                name="LeagueDetails"
                component={LeagueDetailsTabs}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="InsertResults"
                component={InsertResultsScreen}
                options={({ navigation }) => ({
                    title: 'Inserisci esiti',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="FormazioneScreen"
                component={FormazioneScreen}
                options={({ navigation }) => ({
                    title: 'Formazioni',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="EsitiInseriti"
                component={GiornataDetailsScreen}
                options={({ navigation }) => ({
                    title: 'Esiti Inseriti',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="EsitiUtenteInseriti"
                component={GiornataDetailsUserScreen}
                options={({ navigation, route }) => ({
                    title: route.params.user + ' Esiti',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="FullParticipantsRankingScreen"
                component={FullParticipantsRankingScreen}
                options={({ navigation }) => ({
                    title: 'Classifica',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="UserHistoryScreen"
                component={UserHistoryScreen}
                options={({ navigation }) => ({
                    title: `Storia e Profilo`,
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="GiornataSchedinaDetailsUserScreen"
                component={GiornataSchedinaDetailsUserScreen}
                options={({ navigation }) => ({
                    title: 'Storia giornate schedina',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="EditLeagueScreen"
                component={EditLeagueScreen}
                options={({ navigation }) => ({
                    title: 'Modifica Lega',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CustomHeaderBackArrow({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
        </Stack.Navigator>
    );
}
