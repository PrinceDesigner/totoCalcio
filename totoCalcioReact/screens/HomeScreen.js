import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const leagues = [
    { id: '1', name: 'Lega Serie A', description: 'Lega per gli appassionati della Serie A', image: require('../league2.png') },
    { id: '2', name: 'Lega Champions', description: 'Sfida per la Champions League', image: require('../league1.png') },
];

export default function HomeScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation(); // Ottieni l'oggetto di navigazione

    const [refreshing, setRefreshing] = useState(false); // Stato per gestire il refresh

    // Funzione di refresh
    const onRefresh = () => {
        setRefreshing(true);
        console.log('Eseguo il refresh dei dati...');

        // Simula una richiesta di aggiornamento dati (es. da un server)
        setTimeout(() => {
            setRefreshing(false);
            console.log('Dati aggiornati');
        }, 1000); // Simulazione di un delay di 2 secondi
    };

    // Funzione per gestire il click su una lega
    const handleLeaguePress = (league) => {
        console.log('Lega selezionata:', league.name);
        navigation.navigate('LeagueDetailsStack', { league }); // Esempio di navigazione alla schermata dei dettagli della lega
    };

    // Renderizza ogni lega nella FlatList
    const renderLeagueItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleLeaguePress(item)}>
            <View style={{ ...styles.leagueContainer, backgroundColor: colors.surface }}>
                <Image source={item.image} style={styles.leagueImage} />
                <View style={styles.leagueTextContainer}>
                    <Text style={{ ...styles.leagueName, color: colors.primary }}>{item.name}</Text>
                    <Text style={styles.leagueDescription}>{item.description}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
            {/* Intestazione con "Le mie leghe" e "Crea Lega" */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Le mie leghe</Text>
                <Button mode="contained" onPress={() => navigation.navigate('CreateLeague')}>Crea Lega</Button>
            </View>

            {/* Lista delle leghe con RefreshControl */}
            <FlatList
                data={leagues}
                renderItem={renderLeagueItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary} // Colore dell'animazione su iOS
                        colors={[colors.primary]} // Colori dell'animazione su Android
                    />
                }
            />

            {/* Pulsante "Unisciti alla lega" */}
            <Button mode="contained" onPress={() => navigation.navigate('JoinLeague')} style={styles.joinButton}>
                Unisciti alla Lega
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    leagueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 3, // Aggiungi un po' di ombra su Android
    },
    leagueImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    leagueTextContainer: {
        flex: 1,
    },
    leagueName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    leagueDescription: {
        fontSize: 14,
        color: 'white',
    },
    listContainer: {
        paddingBottom: 20, // Per evitare che il pulsante di join copra la lista
    },
    joinButton: {
        marginBottom: 20,
        borderRadius: 10,
    },
});
