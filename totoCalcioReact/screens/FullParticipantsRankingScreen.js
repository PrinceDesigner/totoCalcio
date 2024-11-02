import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Card, useTheme, Avatar, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { COLORJS } from '../theme/themeColor';
import DropDownPicker from 'react-native-dropdown-picker';
import { fetchStoricoPerUtenteSelezionato } from '../redux/slice/storicoPerUtenteSelezionatoSlice';
import RankingList from './componentScreen/RankingList';

export default function FullParticipantsRankingScreen({ navigation }) {
    const { colors } = useTheme();
    const participants = useSelector((state) => state.partecipantiLegaCorrente.participants);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dispatch = useDispatch();
    const [selectedTab, setSelectedTab] = useState('Generale'); // Stato per selezionare il tab attivo
    const [selectedGiornata, setSelectedGiornata] = useState('1'); // Stato per selezionare la giornata attiva
    const [open, setOpen] = useState(false);
    const [giornate, setGiornate] = useState(
        [...Array(38).keys()].map((giornata) => ({ label: `Giornata ${giornata + 1}`, value: `${giornata + 1}` }))
    );

    useEffect(() => {
        if (selectedTab === 'Giornate') {
            handleGiornataChange(selectedGiornata);
        }
    }, [selectedGiornata]);

    const handleParticipantPress = async (participant) => {
        try {
            // Mostra lo stato di caricamento
            dispatch(showLoading());

            // Effettua la chiamata all'API
            await dispatch(fetchStoricoPerUtenteSelezionato({ leagueId, userId: participant.userId })).unwrap();

            // Nascondi lo stato di caricamento
            dispatch(hideLoading());

            // Naviga alla schermata successiva, ad esempio "UserHistoryScreen"
            navigation.navigate('UserHistoryScreen');

        } catch (error) {
            console.error('Errore durante il caricamento dei dati:', error);

            // Nascondi lo stato di caricamento
            dispatch(hideLoading());

            // Mostra un messaggio di errore
        }
    };

    const handleGiornataChange = async (giornata) => {
        try {
            // Mostra lo stato di caricamento
            dispatch(showLoading());

            // Effettua la chiamata all'API (immaginando che esista un'azione per ottenere dati per la giornata specifica)
            // await dispatch(fetchDataPerGiornata({ leagueId, giornata })).unwrap();

            // Nascondi lo stato di caricamento
            dispatch(hideLoading());

        } catch (error) {
            console.error('Errore durante il caricamento dei dati per la giornata:', error);
            // Nascondi lo stato di caricamento
            dispatch(hideLoading());
        }
    };

    const renderGeneraleTab = () => (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* {[...participants]
                .sort((a, b) => b.punti - a.punti)
                .map((participant, index) => (
                    <TouchableOpacity key={index + 1} onPress={() => handleParticipantPress(participant)}>
                        <Card style={{ ...styles.card, backgroundColor: colors.surface }}>
                            <View style={styles.rankRow}>
                                <Text style={{ color: 'white', fontSize: 20 }}>{index + 1}</Text>
                                <Avatar.Image
                                    source={{ uri: participant.photoURL }}
                                    size={40}
                                    style={styles.avatar}
                                />
                                <Text style={{ ...styles.participantName, color: 'white' }}>{participant.displayName}</Text>
                                <Text style={{ ...styles.points, color: colors.primary }}>{participant.punti}pt</Text>
                            </View>
                        </Card>
                        <RankingList ranking={participants} />

                    </TouchableOpacity>
                ))} */}
            <RankingList ranking={participants} />
        </ScrollView>
    );

    const renderGiornateTab = () => (
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
            <DropDownPicker
                open={open}
                value={selectedGiornata}
                items={giornate}
                setOpen={setOpen}
                setValue={setSelectedGiornata}
                setItems={setGiornate}
                containerStyle={styles.pickerContainer}
                style={styles.picker}
                dropDownStyle={styles.dropDownPicker}
                textStyle={{ color: 'black' }}
            />

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontSize: 18 }}>Classifica per Giornata {selectedGiornata} - In costruzione</Text>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            {/* Tab Custom */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === 'Generale' && styles.activeTab]}
                    onPress={() => setSelectedTab('Generale')}
                >
                    <Text style={[styles.tabText, { color: selectedTab === 'Generale' ? 'white' : colors.text }]}>Generale</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === 'Giornate' && styles.activeTab]}
                    onPress={() => setSelectedTab('Giornate')}
                >
                    <Text style={[styles.tabText, { color: selectedTab === 'Giornate' ? 'white' : colors.text }]}>Giornate</Text>
                </TouchableOpacity>
            </View>

            {/* Contenuto del Tab */}
            {selectedTab === 'Generale' ? renderGeneraleTab() : renderGiornateTab()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
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
    pickerContainer: {
        marginBottom: 20,
    },
    picker: {
        backgroundColor: 'white',
        borderColor: 'transparent',
    },
    dropDownPicker: {
        backgroundColor: '#444',
    },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    rankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
        marginRight: 0,
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
    points: {
        fontSize: 16,
        fontWeight: 'bold',
        width: '25%',
        textAlign: 'right',
    },
});
