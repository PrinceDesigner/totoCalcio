import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme, Card } from 'react-native-paper';
import { selectStoricoByDayId } from '../redux/slice/storicoPerUtenteSelezionatoSlice';

export default function GiornataSchedinaDetailsUserScreen({ route }) {
    const { dayId } = route.params; // Recupera i parametri passati
    const { colors } = useTheme();

    // Recupera lo storico corrispondente al dayId
    const storicoItem = useSelector(selectStoricoByDayId(dayId));
    const loading = useSelector((state) => state.ui.loading);

    // Funzione per rendere le predizioni
    const renderPrediction = () => {
        // Se non esiste una predizione per questa giornata
        if (!storicoItem || !storicoItem.prediction || !storicoItem.prediction.schedina) {
            return (
                <Text style={{ ...styles.noDataText, color: colors.text }}>Nessuna predizione per questa giornata.</Text>
            );
        }

        const { prediction } = storicoItem;

        return (
            <View style={styles.sectionContainer}>
                <Text style={{ ...styles.sectionTitle, color: colors.primary }}>
                    Esiti giornata {dayId.replace('RegularSeason-', '')}
                </Text>
                {prediction.schedina.map((item) => (
                    <Card key={item.matchId} style={{ ...styles.matchCard, backgroundColor: colors.surface }}>
                        <View style={styles.matchInfo}>
                            <Text style={[styles.matchText, { color: 'white' }]}>
                                {item.homeTeam} - {item.awayTeam}
                            </Text>
                            <Text style={[styles.predictionText, { color: colors.accent }]}>
                                {item.esitoGiocato}
                            </Text>
                        </View>
                    </Card>
                ))}
            </View>
        );
    };

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
    matchCard: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    matchInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    matchText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    predictionText: {
        fontSize: 18,
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        color: 'gray',
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 18,
    },
});
