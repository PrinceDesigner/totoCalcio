import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { COLORJS } from '../theme/themeColor';
import DropDownPicker from 'react-native-dropdown-picker';
import RankingList from './componentScreen/RankingList';
import { getPredictionsForDay } from '../services/predictionsService';
import TabContainer from '../components/Tabs/TabContainer';
import fontStyle from '../theme/fontStyle';
import Wrapper from './componentScreen/Container';

export default function FullParticipantsRankingScreen({ navigation }) {
    const { colors } = useTheme();
    const participants = useSelector((state) => state.partecipantiLegaCorrente.participants);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dispatch = useDispatch();
    const [selectedTab, setSelectedTab] = useState('Generale'); // Stato per selezionare il tab attivo
    const [selectedGiornata, setSelectedGiornata] = useState('1'); // Stato per selezionare la giornata attiva
    const [updatedParticipants, setiUpdatedParticipants] = useState([]); // Stato per selezionare la giornata attiva
    const [open, setOpen] = useState(false);
    const [giornate, setGiornate] = useState(
        [...Array(38).keys()].map((giornata) => ({ label: `Giornata ${giornata + 1}`, value: `${giornata + 1}` }))
    );

    const tabs = [
        {
            label: 'Generale',
            onPress: () => setSelectedTab('Generale'),
        },
        {
            label: 'Giornate',
            onPress: () => setSelectedTab('Giornate'),
        },
    ];

    useEffect(() => {
        if (selectedTab === 'Giornate') {
            handleGiornataChange(selectedGiornata);
        }
    }, [selectedGiornata, selectedTab]);

    const handleGiornataChange = async (giornata) => {
        try {
            console.log('TAB-GIORNATA');
            // Mostra lo stato di caricamento
            dispatch(showLoading());

            if (selectedTab === 'Giornate') {
                const predictions = await getPredictionsForDay(leagueId, `RegularSeason-${giornata}`);
                console.log('Predizioni recuperate:', predictions);

                // Crea un nuovo array con gli userId che sono presenti sia in predictions che in participants
                setiUpdatedParticipants(participants.map(participant => {
                    console.log(participant.userId);
                    const prediction = predictions[participant.userId]
                    return {
                        ...participant,
                        punti: prediction ? prediction.punti : 0
                    };
                }))
                console.log('Nuovo array di partecipanti aggiornati:', updatedParticipants);
            }

            // Nascondi lo stato di caricamento
            dispatch(hideLoading());
        } catch (error) {
            console.error('Errore durante il caricamento dei dati per la giornata:', error);
            setiUpdatedParticipants([])
            // Nascondi lo stato di caricamento
            dispatch(hideLoading());
        }
    };

    const renderGeneraleTab = () => (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <RankingList ranking={participants} />
        </ScrollView>
    );

    const renderGiornateTab = () => (
        <View>
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
                textStyle={{ color: 'black', ...fontStyle.textMedium }}
            />

            {/* <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontSize: 18 }}>Classifica per Giornata {selectedGiornata} - In costruzione</Text>
            </View> */}
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <RankingList ranking={updatedParticipants} />
            </ScrollView>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            {/* Tab Custom */}
            <TabContainer tabs={tabs} />
            {/* Contenuto del Tab */}
            <Wrapper>
                {selectedTab === 'Generale' ? renderGeneraleTab() : renderGiornateTab()}
            </Wrapper>
            {/* Contenuto del Tab */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10,
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
