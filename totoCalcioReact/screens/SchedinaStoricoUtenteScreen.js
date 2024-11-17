import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme, Card } from 'react-native-paper';
import { selectStoricoByDayId } from '../redux/slice/storicoPerUtenteSelezionatoSlice';
import { COLORJS } from '../theme/themeColor';
import { selectLeagueById } from '../redux/slice/leaguesSlice';
import fontStyle from '../theme/fontStyle';
import Wrapper from './componentScreen/Container';

export default function GiornataSchedinaDetailsUserScreen({ route }) {
    const { dayId } = route.params; // Recupera i parametri passati
    const { colors } = useTheme();

    // Recupera lo storico corrispondente al dayId
    const storicoItem = useSelector(selectStoricoByDayId(dayId));
    const loading = useSelector((state) => state.ui.loading);

    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));
    const leagueName = selectedLeague.name;

    // Funzione per rendere le predizioni
    const renderPrediction = () => {
        // Se non esiste una predizione per questa giornata
        if (!storicoItem || !storicoItem.schedina) {
            return (
                <Text style={{ ...styles.noDataText, color: colors.text }}>Nessuna predizione per questa giornata.</Text>
            );
        }

        const { schedina } = storicoItem;

        return (
            <View style={styles.sectionContainer}>
                <View style={styles.titleLeague}>

                    <Text style={{ ...styles.sectionTitle, color: colors.primary }}>
                        Esiti giornata {dayId.replace('RegularSeason-', '')}
                    </Text>
                    <Text style={{ ...styles.leagueNameText }}>
                        {leagueName}
                    </Text>
                </View>
                <View style={{ marginTop: 10 }}>
                    {schedina.map((item) => (
                        <View key={item.matchId} style={{ ...styles.matchCard }}>
                            <View style={styles.matchInfo}>
                                <View style={{ flex: 9 }}>
                                    <Text style={[styles.matchText, { color: 'white' }]}>
                                        {item.homeTeam} - {item.awayTeam}
                                    </Text>
                                </View>

                                <Text style={{ flex: 1 }}>
                                    {/* CERCHIO */}
                                    {/* item.esitoGiocato === item.result ?  'green' : item.result === null ? colors.surface : 'red'  */}
                                    <View style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                                        <View
                                            style={[
                                                styles.circle,
                                                {
                                                    backgroundColor:
                                                        item.result === null ? colors.secondaryBackGroud : item.esitoGiocato === item.result ? 'green' : 'red',
                                                },
                                            ]}
                                        />
                                        <Text style={styles.predictionText}>{item.esitoGiocato}</Text>
                                    </View>
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
            <Wrapper style={{paddingTop: 10}}>
                {loading ? (
                    <Text style={{ ...styles.loadingText, color: colors.primary }}>Caricamento...</Text>
                ) : (
                    <>
                        {renderPrediction()}
                    </>
                )}
            </Wrapper>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    titleLeague: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        paddingBottom: 10,
        paddingTop: 10,
        borderBottomWidth: 5,
        borderBottomColor: COLORJS.primary,
        // borderTopWidth: 1, 
        // borderTopColor: COLORJS.primary
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 10,
        ...fontStyle.textMedium,
        flex: 1,
    },
    leagueNameText: {
        fontSize: 18,
        marginBottom: 10,
        color: 'white',
        ...fontStyle.textBold,
        flex: 1,
        textAlign: 'right'
    },
    matchCard: {
        borderBottomWidth: 1,
        borderBottomColor: COLORJS.secondaryBackGroud,
        paddingBottom: 15,
        paddingTop: 15
    },
    matchInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    matchText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    predictionText: {
        fontSize: 18,
        color: 'white'
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
    circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 6,
    },
});
