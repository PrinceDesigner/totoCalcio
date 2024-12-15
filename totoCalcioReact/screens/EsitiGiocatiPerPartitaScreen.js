import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { selectParticipantAndMatchByMatchId } from '../redux/slice/partecipantsSlice';
import fontStyle from '../theme/fontStyle';
import { COLORJS } from '../theme/themeColor';
import Wrapper from './componentScreen/Container';

const EsitiGiocatiPerPartitaScreen = ({ route }) => {
    const { fixtureId } = route.params;
    const participantsWithMatch = useSelector((state) =>
        selectParticipantAndMatchByMatchId(state, fixtureId)
    );




    return (
        <Wrapper style={styles.container}>
            <Text style={{ ...styles.sectionTitle, color: COLORJS.primary }}>Esiti inseriti per questa partita </Text>

            <ScrollView>
                {participantsWithMatch.map(({ displayName, match }, index) => (
                    <View
                        key={index}
                        style={[
                            styles.nameUser,
                            { backgroundColor: index % 2 === 0 ? COLORJS.surface : COLORJS.secondaryBackGroud },
                        ]}
                    >
                        <Text style={styles.matchText}>
                            {displayName}
                        </Text>
                        <View style={styles.resultContainer}>
                            <Text style={styles.resultText}>{match.esitoGiocato}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flex: 1,
        backgroundColor: COLORJS.background
    },
    nameUser: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: COLORJS.secondaryBackGroud,
    },
    matchText: {
        fontSize: 16,
        color: '#fff',
        ...fontStyle.textMedium,
    },
    resultContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultText: {
        fontSize: 18,
        ...fontStyle.textMedium,
        color: 'white',
    },
    sectionTitle: {
        fontSize: 18,
        paddingBottom: 10,
        ...fontStyle.textMedium,
    },
});

export default EsitiGiocatiPerPartitaScreen;
