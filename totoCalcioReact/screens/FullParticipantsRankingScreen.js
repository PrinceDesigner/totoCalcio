import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { COLORJS } from '../theme/themeColor';
import DropDownPicker from 'react-native-dropdown-picker';
import RankingList from './componentScreen/RankingList';
import { getPredictionsForDay } from '../services/predictionsService';
import TabContainer from '../components/Tabs/TabContainer';
import fontStyle from '../theme/fontStyle';
import Wrapper from './componentScreen/Container';
import { getMembersInfoForLeague, getMembersInfoForLeagueLive } from '../services/leagueService';

export default function FullParticipantsRankingScreen({ navigation }) {
    const { colors } = useTheme();
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const isLive = useSelector((state) => state.liveStatus.isLive);

    const [members, setMembers] = useState([]);
    const [liveMembers, setLiveMembers] = useState([]);
    const dispatch = useDispatch();
    const [selectedTab, setSelectedTab] = useState('Generale');
    const [selectedGiornata, setSelectedGiornata] = useState('1');
    const [updatedParticipants, setUpdatedParticipants] = useState([]);
    const dayId = useSelector((state) => state.giornataAttuale.giornataAttuale);

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
        ...(isLive ? [{
            label: 'Live',
            onPress: () => setSelectedTab('Live'),
        }] : []),
    ];

    useEffect(() => {
        if (selectedTab === 'Giornate') {
            // handleGiornataChange(selectedGiornata);
        }
    }, [selectedGiornata, selectedTab]);

    const fetchLeagueById = async (leagueId) => {
        try {
            dispatch(showLoading());
            let membersResult = await getMembersInfoForLeague(leagueId);
            setMembers(membersResult);

            if (isLive) {
                const liveMembersResult = await getMembersInfoForLeagueLive(leagueId, dayId);
                setLiveMembers(liveMembersResult);
            }
        } catch (error) {
            console.error('Errore durante il recupero della lega:', error);
        } finally {
            dispatch(hideLoading());
        }
    };

    useEffect(() => {
        fetchLeagueById(leagueId);
    }, [leagueId, isLive]);

    const handleGiornataChange = async (giornata) => {
        try {
            dispatch(showLoading());
            if (selectedTab === 'Giornate') {
                const predictions = await getPredictionsForDay(leagueId, `RegularSeason-${giornata}`);
                setUpdatedParticipants(members.map(participant => ({
                    ...participant,
                    punti: predictions[participant.userId]?.punti || 0,
                })));
            }
        } catch (error) {
            console.error('Errore durante il caricamento dei dati per la giornata:', error);
            setUpdatedParticipants([]);
        } finally {
            dispatch(hideLoading());
        }
    };

    const renderGeneraleTab = () => (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <RankingList ranking={members.sort((a, b) => b.punti - a.punti)} />
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
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <RankingList ranking={updatedParticipants.sort((a, b) => b.punti - a.punti)} />
            </ScrollView>
        </View>
    );

    const renderLiveTab = () => (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <RankingList ranking={liveMembers.sort((a, b) => b.punti - a.punti)} />
        </ScrollView>
    );

    const renderFooter = () => {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
    };

    return (
        <View style={{ flex: 1 }}>
            <TabContainer tabs={tabs} />
            <Wrapper>
                {selectedTab === 'Generale' && renderGeneraleTab()}
                {selectedTab === 'Giornate' && renderGiornateTab()}
                {selectedTab === 'Live' && isLive && renderLiveTab()}
            </Wrapper>
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
