import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux'; // Importa useDispatch e useSelector
import { getUserLeaguesThunk } from '../redux/slice/leaguesSlice'; // Importa il thunk per recuperare le leghe
import { showLoading, hideLoading } from '../redux/slice/uiSlice'; // Slice per la gestione del caricamento

export default function HomeScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const leaguesState = useSelector((state) => state.leagues); // Stato delle leghe
    const loadingState = useSelector((state) => state.ui.loading); // Stato di caricamento


    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchLeagues(); // Recupera le leghe quando la schermata viene caricata
        console.log('leaguesState', leaguesState);
    }, []);
    
    console.log('leaguesState', leaguesState);


    // Funzione per recuperare le leghe
    const fetchLeagues = async () => {
        try {
            dispatch(showLoading()); // Mostra lo stato di caricamento
            await dispatch(getUserLeaguesThunk()).unwrap(); // Attendi che il thunk termini
        } catch (error) {
            console.error('Errore durante il recupero delle leghe:', error);
        } finally {
            dispatch(hideLoading()); // Nascondi lo stato di caricamento
        }
    };


    // Funzione di refresh
    const onRefresh = () => {
        setRefreshing(true);
        fetchLeagues().then(() => setRefreshing(false)); // Ricarica le leghe e disabilita il refresh
    };

    // Funzione per gestire il click su una lega
    const handleLeaguePress = (league) => {
        navigation.navigate('LeagueDetailsStack', { league }); // Naviga alla schermata dei dettagli della lega
    };

    // Renderizza ogni lega nella FlatList
    const renderLeagueItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleLeaguePress(item)}>
            <View style={{ ...styles.leagueContainer, backgroundColor: colors.surface }}>
                {/* Puoi usare immagini statiche o caricarle dinamicamente */}
                <Image source={require('../league1.png')} style={styles.leagueImage} />
                <View style={styles.leagueTextContainer}>
                    <Text style={{ ...styles.leagueName, color: colors.primary }}>{item.name} {item.id}</Text>
                    <Text style={styles.leagueDescription}>{item.members.length} Partecipanti</Text>

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

            {/* Stato di caricamento */}
            {loadingState && <ActivityIndicator size="large" color={colors.primary} />}

            {/* Lista delle leghe con RefreshControl */}
            <FlatList
                data={leaguesState.leagues} // Usa le leghe dallo stato
                renderItem={renderLeagueItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={!loadingState && (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>Nessuna lega trovata</Text>
                    </View>
                )}
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
        elevation: 3,
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
        paddingBottom: 20,
    },
    joinButton: {
        marginBottom: 20,
        borderRadius: 10,
    },
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    emptyStateText: {
        fontSize: 16,
        color: 'gray',
    },
});

