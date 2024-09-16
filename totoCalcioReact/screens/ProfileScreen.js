import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Button, TextInput, Avatar, useTheme } from 'react-native-paper';

// Dati di esempio per le leghe
const leagues = [
  { id: '1', name: 'Lega Serie A', image: require('../league1.png') },
  { id: '2', name: 'Lega Champions', image: require('../league2.png') },
  { id: '3', name: 'Lega Europa', image: require('../league2.png') },
]

export default function ProfileScreen({ navigation }) {
  const [userName, setUserName] = useState('Mario Rossi'); // Stato per il nome dell'utente
  const [userEmail, setUserEmail] = useState('mario.rossi@example.com'); // Stato per l'email dell'utente
  const { colors } = useTheme(); // Colori del tema

  const handleChangeImage = () => {
    console.log('Cambia immagine');
  };

  const handleSaveProfile = () => {
    console.log(`Salva profilo: Nome = ${userName}, Email = ${userEmail}`);
  };

  const handleLeaguePress = (league) => {
    console.log(`Naviga alla lega: ${league.name}`);
    navigation.navigate('LeagueDetails', { leagueId: league.id });
  };

  // Funzione per renderizzare ogni lega
  const renderLeagues = () => {
    return leagues.map((league) => (
      <TouchableOpacity
        key={league.id}
        onPress={() => handleLeaguePress(league)}
        style={styles.leagueContainer}
      >
        <Image source={league.image} style={styles.leagueImage} />
        <Text style={styles.leagueName}>{league.name}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={{ ...styles.container, backgroundColor: colors.background }}>
        {/* Prima sezione: Immagine profilo e campi di testo */}
        <View style={styles.profileSection}>
          <Avatar.Image size={100} source={{ uri: 'https://via.placeholder.com/150' }} />
          <Button mode="text" onPress={handleChangeImage} style={styles.changeImageButton}>
            Cambia immagine
          </Button>

          <TextInput
            label="Nome"
            value={userName}
            onChangeText={setUserName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={userEmail}
            onChangeText={setUserEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
          />

          <Button mode="contained" onPress={handleSaveProfile} style={styles.saveButton}>
            Salva modifiche
          </Button>
        </View>

        {/* Seconda sezione: Leghe dove partecipo */}
        <View style={styles.leaguesSection}>
          <Text style={styles.sectionTitle}>Le mie leghe</Text>
          {/* Renderizza le leghe */}
          {renderLeagues()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  changeImageButton: {
    marginTop: 10,
  },
  input: {
    width: '100%',
    marginBottom: 20,
  },
  saveButton: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  leagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    elevation: 3, // Aggiunge un'ombra per dare profondità
  },
  leagueImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  leagueName: {
    fontSize: 16,
  },
});
