import { async } from '@firebase/util';
import React, { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { getDayDetails } from '../services/infoGiornataService';
import { COLORJS } from '../theme/themeColor';
import MatchItem from './componentScreen/MatchItem';

export const CalendarScreen = () => {
    // colors theme
    const { colors } = useTheme();
    const dispatch = useDispatch();


    const [calendario, setCalendario] = ['Giornata 1', 'Giornata 2'];
    const [matches, setMatches] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const DATA = Array.from({ length: 38 }, (_, i) => ({
        id: i.toString(),
        title: `Giornata ${i + 1}`,
        dayId: `RegularSeason-${i + 1}` // Genera l'ID nel formato richiesto
    }));

    const handlePress = async (item) => {
        dispatch(showLoading()); // Imposta lo stato di caricamento su true
        setSelectedId(item.id)
        const data = await getDayDetails(item.dayId);
        setMatches(data.matches);
        dispatch(hideLoading()); // Imposta lo stato di caricamento su true

    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.containerItem}>
                <FlatList
                    data={DATA}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isSelected = item.id === selectedId;
                        return (
                            <TouchableOpacity
                                onPress={() => handlePress(item)}
                                style={[
                                    styles.item,
                                    isSelected && { backgroundColor: COLORJS.primary } // Cambia colore se selezionato
                                ]}
                            >
                                <Text style={styles.text}>{item.title}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
            <ScrollView style={styles.containerCalendar}>
                {matches?.map((match, i) => <MatchItem key={`match-${match.matchId}`} match={match} />)}
            </ScrollView>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    containerItem: {
        paddingVertical: 20
    },
    containerCalendar: {
        paddingHorizontal: 10
    },
    item: {
        height: 50,
        width: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        borderRadius: 10,
        backgroundColor: COLORJS.surface,
        border: 1,
        borderWidth: 1,
        borderColor: COLORJS.primary
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
