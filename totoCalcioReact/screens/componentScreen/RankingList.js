import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchStoricoPerUtenteSelezionato, setUser } from '../../redux/slice/storicoPerUtenteSelezionatoSlice';
import { hideLoading, showLoading } from '../../redux/slice/uiSlice';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar } from 'react-native-paper';
import fontStyle from '../../theme/fontStyle';
import { COLORJS } from '../../theme/themeColor';


const RankingList = ({ ranking, showAvatar = true, size = 40 }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
  const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId);


  const handleParticipantPress = async (participant) => {
    try {
      // Mostra lo stato di caricamento
      dispatch(showLoading());

      // Effettua la chiamata all'API
      await dispatch(fetchStoricoPerUtenteSelezionato({ leagueId, userId: participant.userId })).unwrap();
      dispatch(setUser({ ...participant }));

      // Nascondi lo stato di caricamento
      dispatch(hideLoading());

      // Naviga alla schermata successiva, ad esempio "UserHistoryScreen"
      navigation.navigate('UserHistoryScreen',
        {
          user: participant.displayName, // Passa i dettagli del partecipante se necessario
        });
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
        .map((player, index) => (
          <TouchableOpacity key={index + 1} onPress={() => handleParticipantPress(player)}>
            <View style={[
              styles.rankItem,
              player?.userId === userId && styles.currentUserRankItem, // Applica stile condizionale
            ]}
            >
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.rankPosition}>{index + 1}</Text>
                {showAvatar && <Avatar.Image

                  source={player?.photoURL ? { uri: player?.photoURL } : require('../../User-avatar.svg.png')}
                  size={size}
                  style={styles.avatar} />}
                <Text style={styles.rankName}>{player?.displayName}</Text>
              </View>
              <Text style={{ ...styles.rankPoints, color: 'white' }}>{player?.punti} punti</Text>
            </View>
          </TouchableOpacity>
        )
        )}
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
    ...fontStyle.textLight
  },
  rankName: {
    fontSize: 16,
    color: 'white',
    ...fontStyle.textBold,
    marginLeft: 10,
  },
  rankPoints: {
    fontSize: 16,
    ...fontStyle.textMedium
  },
  avatar: {
    marginRight: 5,
    backgroundColor: 'transparent'
  },
  currentUserRankItem: {
    backgroundColor: COLORJS.primary
  }
});

export default RankingList;
