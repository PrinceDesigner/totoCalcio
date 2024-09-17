import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LeagueDetailsTabs from './tabs/LeagueDetailsTabs';
import InsertResultsScreen from '../screens/InsertResultScreen';
import { CreateLeagueHeader } from './customHeader/customHeader';
import FullParticipantsRankingScreen from '../screens/FullParticipantsRankingScreen';

const Stack = createStackNavigator();

export default function LeagueStackNavigator() {
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
                    ...CreateLeagueHeader({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            <Stack.Screen
                name="FullParticipantsRankingScreen"
                component={FullParticipantsRankingScreen}
                options={({ navigation }) => ({
                    title: 'Classifica',
                    headerShown: true, // Mostra l'header solo per questa schermata
                    ...CreateLeagueHeader({ navigation }), // Applica l'header personalizzato con Go Back
                })}
            />
            {/* Schermate successive nel stack */}
        </Stack.Navigator>
    );
}