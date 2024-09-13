import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LeagueDetailsTabs from './tabs/LeagueDetailsTabs';

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
            {/* Schermate successive nel stack */}
        </Stack.Navigator>
    );
}
