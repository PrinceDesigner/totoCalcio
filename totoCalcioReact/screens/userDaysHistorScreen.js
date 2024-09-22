import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, useTheme, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment-timezone';


import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function UserHistoryScreen({ route, navigation }) {
    const { colors } = useTheme();

    const userHistory = useSelector((state) => state.storicoPerUtenteSelezionato.storico); // Seleziona la lista delle giornate dallo stato
    const inizioGiornata = useSelector((state) => state.infogiornataAttuale.startDate);
    const dayId = useSelector((state) => state.infogiornataAttuale.dayId);
    console.log('inizioGiornata', inizioGiornata);

    const isDatePast = () => {
            // Configura la data di input usando moment e imposta il fuso orario a "Europe/Rome"
            const date = moment.tz(inizioGiornata, "Europe/Rome");

            // Ottieni l'orario attuale e imposta il fuso orario a "Europe/Rome"
            const currentDate = moment.tz("Europe/Rome");

            // Confronta le date e restituisci true se la data di input è minore dell'orario attuale
            console.log('DDDATE',date.isBefore(currentDate));
            return date.isBefore(currentDate);
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
                {userHistory.map((giornata, index) => {
                    if (giornata.dayId !== dayId || (giornata.dayId === dayId && isDatePast()) ) {        
                    return (<TouchableOpacity
                        key={index + 1}
                        onPress={() => navigation.navigate('GiornataSchedinaDetailsUserScreen', {dayId: giornata.dayId})} // Modifica in base alla logica che desideri
                        style={{ ...styles.cardTouchable }} // Modifica per includere lo stile
                    >
                        <Card style={styles.card}>
                            <View style={styles.participantRow}>
                                <Avatar.Icon
                                    icon="calendar"
                                    size={40}
                                    style={styles.avatar}
                                />
                                <Text style={{ ...styles.participantName, color: 'white' }}>Giornata {giornata.dayId.replace('RegularSeason-', '')}</Text>

                                <Text style={{ ...styles.participantName, color: 'white' }}>8 punti</Text>
                            </View>
                        </Card>
                    </TouchableOpacity>)
                    } else null
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    participantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
        backgroundColor: '#6200ea', // Colore dell'avatar
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
});
