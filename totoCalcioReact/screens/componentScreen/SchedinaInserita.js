import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import fontStyle from '../../theme/fontStyle';
import { COLORJS } from '../../theme/themeColor';

const PredictionComponent = ({ prediction }) => {
    const { colors } = useTheme();
    const matches = useSelector((state) => state.infogiornataAttuale.matches);

    const getMatchById = (matchId) => {
        return matches.find(match => match.matchId === matchId) || {}; // Ritorna un oggetto vuoto se il match non viene trovato
    };

    return (
        <>
            {prediction.schedina && prediction.schedina.length > 0 ? (
                <View style={{ marginBottom: 20, }}>
                    {prediction.schedina.map((item) => {
                        const match = getMatchById(item.matchId);
                        return (
                            <View key={item.matchId} style={[styles.matchCard]}>
                                <View style={styles.matchInfo}>
                                    <Text style={[styles.matchText, { color: 'white' }]}>
                                        {match.homeTeam || 'Sconosciuto'}
                                        <Text> - </Text>
                                        {match.awayTeam || 'Sconosciuto'}
                                    </Text>
                                    <Text style={[styles.predictionText, { color: colors.accent }]}>
                                        {item.esitoGiocato || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : (
                    <Text style={[styles.noDataText, { color: colors.text }]}>Nessuna predizione per questa giornata.</Text>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    matchCard: {
        borderBottomWidth: 1,
        borderBottomColor: COLORJS.secondaryBackGroud,
        paddingBottom: 10,
        paddingTop: 10
    },
    matchInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    matchText: {
        fontSize: 16,
        ...fontStyle.textMedium
    },
    predictionText: {
        fontSize: 18,
        ...fontStyle.textLight
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        color: 'gray',
        justifyContent: 'center',
        ...fontStyle.textLight
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 18,
    },
});

export default PredictionComponent;
