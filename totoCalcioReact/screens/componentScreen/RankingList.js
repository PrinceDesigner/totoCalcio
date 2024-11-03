import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchStoricoPerUtenteSelezionato, setUser } from '../../redux/slice/storicoPerUtenteSelezionatoSlice';
import { hideLoading, showLoading } from '../../redux/slice/uiSlice';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar } from 'react-native-paper';


const RankingList = ({ ranking, showAvatar = true }) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);



    const handleParticipantPress = async (participant) => {
        try {
            // Mostra lo stato di caricamento
            dispatch(showLoading());

            // Effettua la chiamata all'API
            await dispatch(fetchStoricoPerUtenteSelezionato({ leagueId, userId: participant.userId })).unwrap();
            dispatch(setUser({...participant}));

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

    return (
        <>
        {[...ranking]
          .sort((a, b) => b.punti - a.punti)
          .map((player, index) => (
            <TouchableOpacity key={index + 1} onPress={() => handleParticipantPress(player)}>
              <View style={styles.rankItem}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.rankPosition}>{index + 1}</Text>
                  {showAvatar && <Avatar.Image source={{ uri: player.photoURL }} size={40} style={styles.avatar} />}
                  <Text style={styles.rankName}>{player.displayName}</Text>
                </View>
                <Text style={{ ...styles.rankPoints, color: 'white' }}>{player.punti} punti</Text>
              </View>
            </TouchableOpacity>
          ))}
      </>
    );
};

RankingList.propTypes = {
    ranking: PropTypes.arrayOf(
        PropTypes.shape({
            displayName: PropTypes.string.isRequired,
            punti: PropTypes.number.isRequired,
        })
    ).isRequired,
    showAvatar: PropTypes.bool, // Added showAvatar prop with default true

};

const styles = StyleSheet.create({
    rankItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomColor: '#ddd',
      borderBottomWidth: 1,
    },
    rankPosition: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
      marginRight: 10,
    },
    rankName: {
      fontSize: 16,
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 10,
    },
    rankPoints: {
      fontSize: 16,
    },
    avatar: {
      marginRight: 5,
    },
  });

export default RankingList;
