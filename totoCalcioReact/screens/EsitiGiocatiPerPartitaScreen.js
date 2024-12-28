import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getResultOfUserForMatch } from '../services/predictionsService';
import fontStyle from '../theme/fontStyle';
import { COLORJS } from '../theme/themeColor';
import Wrapper from './componentScreen/Container';
import { showLoading, hideLoading } from '../redux/slice/uiSlice';


const EsitiGiocatiPerPartitaScreen = ({ route }) => {
    const { fixtureId } = route.params;
    const [participantsWithMatch, setParticipantsWithMatch] = useState([]);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dispatch = useDispatch();


    useEffect(() => {
        const fetchResult = async () => {
            dispatch(showLoading()); // Mostra lo stato di caricamento
            try {
                const result = await getResultOfUserForMatch(leagueId, fixtureId);
                setParticipantsWithMatch(result)
            } catch (error) {
                console.error("Errore durante il fetch del risultato:", error);
            } finally {
                dispatch(hideLoading()); // Mostra lo stato di caricamento
            }
        };

        if (fixtureId) {
            fetchResult(); // Chiamata della funzione
        }
    }, [leagueId, fixtureId]); // Aggiungi tutte le dipendenze necessarie


    return (
        <Wrapper style={styles.container}>
            <Text style={{ ...styles.sectionTitle, color: COLORJS.primary }}>Esiti inseriti per questa partita </Text>

            <ScrollView>
                {participantsWithMatch.map(({ displayName, esito_giocato }, index) => (
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
                            <Text style={styles.resultText}>{esito_giocato}</Text>
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
