import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Card, useTheme, Avatar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { selectLeagueById } from '../redux/slice/leaguesSlice';
import { fetchStoricoPerUtenteSelezionato } from '../redux/slice/storicoPerUtenteSelezionatoSlice';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';

export default function FullParticipantsRankingScreen({navigation}) {
    const { colors } = useTheme();
    const participants = useSelector((state) => state.partecipantiLegaCorrente.participants);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const dispatch = useDispatch(); // Usa dispatch per inviare l'azione Redux


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
            
            // Mostra un messaggio di successo se necessario
        } catch (error) {
            console.error('Errore durante il caricamento dei dati:', error);
    
            // Nascondi lo stato di caricamento
            dispatch(hideLoading());
    
            // Mostra un messaggio di errore
        }
    };
    

    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 100 }}>
            {[...participants]
            .sort((a, b) => b.punti - a.punti)
            .map((participant, index) => (
                <TouchableOpacity key={index +1 } onPress={() => handleParticipantPress(participant)}>
                <Card  style={{ ...styles.card, backgroundColor: colors.surface }}>
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
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
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
        marginRight: 0
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
