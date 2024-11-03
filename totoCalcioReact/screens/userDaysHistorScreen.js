import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, useTheme, Avatar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import moment from 'moment-timezone';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORJS } from '../theme/themeColor';
import TabContainer from '../components/Tabs/TabContainer';

export default function UserHistoryScreen({ route, navigation }) {
    const { colors } = useTheme();

    const userHistory = useSelector((state) => state.storicoPerUtenteSelezionato.storico); // Seleziona la lista delle giornate dallo stato
    const inizioGiornata = useSelector((state) => state.infogiornataAttuale.startDate);
    const dayId = useSelector((state) => state.infogiornataAttuale.dayId);
    const [selectedTab, setSelectedTab] = useState('Storico'); // Stato per selezionare il tab attivo

    // Configurazione dei tab
    const tabs = [
        {
            label: 'Storico',
            onPress: () => setSelectedTab('Storico'),
        },
        {
            label: 'Profilo',
            onPress: () => setSelectedTab('Profilo'),
        },
    ];

    const isDatePast = () => {
        // Configura la data di input usando moment e imposta il fuso orario a "Europe/Rome"
        const date = moment.tz(inizioGiornata, "Europe/Rome");

        // Ottieni l'orario attuale e imposta il fuso orario a "Europe/Rome"
        const currentDate = moment().utc(true).tz("Europe/Rome");

        // Confronta le date e restituisci true se la data di input è minore dell'orario attuale
        return date.isBefore(currentDate);
    };


    const renderStoricoTab = () => (
        <>
            {/* Avviso in alto */}
            <View style={styles.warningContainer}>
                <MaterialIcons name="info-outline" size={24} color="yellow" />
                <Text style={styles.warningText}>
                    I punti sono aggiornati solo quando la giornata sarà calcolata.
                </Text>
            </View>

            {userHistory.map((giornata, index) => {
                if (giornata.daysId !== dayId || (giornata.daysId === dayId && isDatePast())) {
                    return (
                        <TouchableOpacity
                            key={index + 1}
                            onPress={() => navigation.navigate('GiornataSchedinaDetailsUserScreen', { dayId: giornata.daysId })} // Modifica in base alla logica che desideri
                            style={{ ...styles.cardTouchable }} // Modifica per includere lo stile
                        >
                            <Card style={[styles.card, giornata.daysId === dayId ? styles.activeCard : {}]}>
                                <View style={styles.participantRow}>
                                    <Avatar.Icon
                                        icon="calendar"
                                        size={40}
                                        style={styles.avatar}
                                    />
                                    <Text style={{ ...styles.participantName, color: 'white' }}>Giornata {giornata.daysId.replace('RegularSeason-', '')}</Text>
                                    <Text style={{ ...styles.participantName, color: 'white' }}>{giornata.punti} punti</Text>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )
                } else {
                    return null;
                }
            })}
        </>
    );

    return (
        <View style={{ flex: 1 }}>
            {/* Tab Custom */}
            <TabContainer tabs={tabs} />
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>

                {selectedTab === 'Storico' ? renderStoricoTab() : null}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#333',
        paddingVertical: 10,
    },
    tabButton: {
        paddingVertical: 10,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: COLORJS.primary,
    },
    tabText: {
        fontSize: 16,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 8,
    },
    warningText: {
        color: 'yellow',
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
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
    activeCard: {
        backgroundColor: COLORJS.primary, // Colore di sfondo diverso per la giornata in corso (ad esempio arancione)
    }
});
