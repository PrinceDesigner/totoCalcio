import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLeagueThunk, getUserLeaguesThunk } from '../redux/slice/leaguesSlice';
import { showLoading, hideLoading } from '../redux/slice/uiSlice';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { setSelectedLeagueGiornata } from '../redux/slice/selectedLeagueSlice';
import { logout } from '../redux/slice/authSlice';
import { getGiornataAttuale } from '../services/infoGiornataService';


// React.memo per ottimizzare il rendering di HomeScreen
const HomeScreen = React.memo(() => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const route = useRoute(); // Ottieni l'oggetto route

    const leaguesState = useSelector((state) => state.leagues); // Stato delle leghe
    const leaguesStateLoading = useSelector((state) => state.loading); // Stato delle leghe
    const loadingState = useSelector((state) => state.ui.loading); // Stato di caricamento
    const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId); // Recupera l'ID utente dallo stato

    const [giornataAttuale, setGiornataAttuale] = useState();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState(null); // Stato per la lega selezionata per l'eliminazione
    const [isModalVisible, setModalVisible] = useState(false); // Stato per la visibilità della modale

    useEffect(() => {
        if (route.params?.refresh) {
            fetchAllData()
            navigation.setParams({ refresh: false }); // Resetta il parametro refresh
        }
    }, [route.params?.refresh]);


    // Funzione per recuperare entrambe le informazioni in parallelo
    const fetchAllData = async () => {
        try {
            dispatch(showLoading()); // Mostra lo stato di caricamento

            // Esegui fetchLeagues e fetchGiornataAttuale in parallelo
            await Promise.all([
                dispatch(getUserLeaguesThunk()).unwrap(), // Recupera le leghe
                getGiornataAttuale().then((giornata) => setGiornataAttuale(giornata)) // Recupera la giornata attuale
            ]);
        } catch (error) {
            if (error.status === 401 || error.status === 403 || error.status === 500) {
                dispatch(logout());
                navigation.navigate('LoginScreen');
            }
            console.error('Errore durante il recupero dei dati:', error);
        } finally {
            dispatch(hideLoading()); // Nascondi lo stato di caricamento
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);
    

    // Funzione di refresh
    const onRefresh = () => {
        setRefreshing(true);
        fetchAllData().then(() => setRefreshing(false))
    };

    // Funzione per gestire il click su una lega
    const handleLeaguePress = (league) => {
        dispatch(setSelectedLeagueGiornata({ giornataAttuale: giornataAttuale, legaSelezionata: league.id }));
        navigation.navigate('LeagueDetailsStack'); // Naviga alla schermata dei dettagli della lega
    };

    // Funzione per eliminare una lega
    const handleDeleteLeague = async (leagueId) => {
        try {
            dispatch(showLoading());
            await dispatch(deleteLeagueThunk(leagueId)).unwrap(); // Esegui il thunk per eliminare la lega
        } catch (error) {
            console.error('Errore durante l\'eliminazione della lega:', error);
        } finally {
            dispatch(hideLoading());
            setModalVisible(false); // Nascondi la modale
        }
    };

    // Funzione per aprire la modale di conferma
    const confirmDeleteLeague = (league) => {
        setSelectedLeague(league); // Salva la lega selezionata
        setModalVisible(true); // Mostra la modale
    };

    // React.memo per ottimizzare il rendering di ogni lega
    const RenderLeagueItem = React.memo(({ item, handleLeaguePress, renderRightActions, userId }) => {
        // Simula che l'utente è l'owner della lega
        const isOwner = item.ownerId.includes(userId); // Cambia in base alla tua logica reale

        return (
            <Swipeable
                renderRightActions={() => isOwner ? renderRightActions(item) : null}
            >
                <TouchableOpacity onPress={() => handleLeaguePress(item)}>
                    <View style={{ ...styles.leagueContainer, backgroundColor: colors.surface }}>
                        <Image source={require('../league1.png')} style={styles.leagueImage} />
                        <View style={styles.leagueTextContainer}>
                            <Text style={{ ...styles.leagueName, color: colors.primary }}>{item.name}</Text>
                            <Text style={styles.leagueDescription}>{item.members.length} Partecipanti</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    });

    // Renderizza la UI che appare durante lo swipe
    const renderRightActions = (league) => (
        <>
            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteLeague(league)}>
                <MaterialIcons name="delete" size={30} color="white" />
            </TouchableOpacity>
        </>
    );

    // Renderizza ogni lega nella FlatList con swipeable
    const renderLeagueItem = ({ item }) => {
        return (
            <RenderLeagueItem
                item={item}
                handleLeaguePress={handleLeaguePress}
                renderRightActions={renderRightActions}
                userId={userId}
            />
        );
    };

    return (
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
            {/* Intestazione con "Le mie leghe" e "Crea Lega" */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Le mie leghe</Text>
                <Button mode="contained" onPress={() => navigation.navigate('CreateLeague')}>Crea Lega</Button>
            </View>

            {/* Stato di caricamento */}
            {leaguesStateLoading && <ActivityIndicator size="large" color={colors.primary} />}

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

            {/* Modale di conferma eliminazione */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Sei sicuro di voler eliminare la lega {selectedLeague?.name}?</Text>
                        <View style={styles.modalButtons}>
                            <Button mode="contained" onPress={() => handleDeleteLeague(selectedLeague.id)} style={styles.modalButton}>
                                Si
                            </Button>
                            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
                                Annulla
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
});


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
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        marginBottom: 15,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 10,
    },
});

export default HomeScreen;
