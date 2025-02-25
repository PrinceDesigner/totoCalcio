import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { showToast } from '../ToastContainer'; // Toast per messaggi di successo
import fontStyle from '../theme/fontStyle';
import XPBar from '../components/XPBar';
import { useDispatch } from 'react-redux';
import { updateXp } from '../redux/slice/authSlice';

export default function MissionsScreen() {
  const { colors } = useTheme();
  dispatch = useDispatch();

  // Mock delle missioni con XP
  const [missions, setMissions] = useState([
    {
      id: 1,
      title: 'Completa il tutorial',
      description: "Completa il tutorial per iniziare a usare l'app.",
      xp: 50,
      completed: false,
    },
    {
      id: 2,
      title: 'Vinci una partita',
      description: 'Partecipa a una partita e vincila.',
      xp: 100,
      completed: false,
    },
    {
      id: 3,
      title: 'Raggiungi il livello 5',
      description: 'Aumenta il tuo livello al raggiungimento del punteggio di 500.',
      xp: 200,
      completed: true,
    },
  ]);

  const handleCompleteMission = (missionId, xp) => {
    // Simula il completamento della missione
    setMissions((prevMissions) =>
      prevMissions.map((mission) =>
        mission.id === missionId
          ? { ...mission, completed: true }
          : mission
      )
    );

    dispatch(updateXp(xp));
    // Mostra un messaggio di successo
    showToast('success', 'Missione completata!');
  };

  // Render della missione
  const renderMissionItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.missionTitle}>{item.title}</Text>
        <Text style={styles.missionDescription}>{item.description}</Text>
        <Text style={styles.xpText}>XP: {item.xp}</Text>

        <Button
          mode="contained"
          onPress={() => handleCompleteMission(item.id, item.xp)}
          style={styles.completeButton}
          disabled={item.completed} // Disabilita il bottone se la missione è già completata
        >
          <Text style={styles.buttonTitle}>{item.completed ? 'Completata' : 'Completa Missione'}</Text>
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      {/* FlatList per le missioni */}
      <>
        <XPBar />
        <FlatList
          data={missions}
          renderItem={renderMissionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.flatListContainer}
        />
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  flatListContainer: {
    paddingHorizontal: 6,
  },
  card: {
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,           // Aggiungi un bordo per l'outline
    borderColor: '#ddd',      // Colore del bordo
    backgroundColor: 'transparent', // Nessun colore di sfondo
    borderRadius: 15,         // Bordi arrotondati
    shadowColor: '#000',      // Ombra per dare profondità
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  missionTitle: {
    fontSize: 18,
    ...fontStyle.textBold,
    color: '#fff',
  },
  missionDescription: {
    fontSize: 14,
    ...fontStyle.textItalic,
    color: '#fff',
    marginVertical: 10,
  },
  xpText: {
    fontSize: 20,
    ...fontStyle.textBold,
    color: '#FFA500', // Arancione per far risaltare gli XP+
    marginBottom: 10,
  },
  completeButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  buttonTitle: {
    ...fontStyle.textMedium,
  },
});
