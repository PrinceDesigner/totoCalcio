import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme, Card } from 'react-native-paper';
import PredictionComponent from './componentScreen/SchedinaInserita';

export default function GiornataDetailsUserScreen({ route }) {
    const { prediction, user } = route.params; // Recupera i parametri passati

    const { colors } = useTheme();

    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);
    const matchdayNumber = dayId.replace('RegularSeason-', '') || 0;
    const matches = useSelector((state) => state.infogiornataAttuale.matches);

    // Dati dal Redux store
    // const prediction = useSelector((state) => state.insertPredictions.schedinaInserita);
    const loading = useSelector((state) => state.ui.loading);

    const renderPrediction = () => (
        <View style={styles.sectionContainer}>
            <Text style={{ ...styles.sectionTitle, color: colors.primary }}>{user} esiti giornata {matchdayNumber} </Text>
            <PredictionComponent prediction={prediction} />
        </View>
    );

    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
            {loading ? (
                <Text style={{ ...styles.loadingText, color: colors.primary }}>Caricamento...</Text>
            ) : (
                <>
                    {renderPrediction()}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 18,
    },
    card: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 10,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    avatar: {
        marginHorizontal: 10,
    },
});

