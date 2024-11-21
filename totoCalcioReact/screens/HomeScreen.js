import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { Button, useTheme, Card, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { deleteLeagueThunk, getUserLeaguesThunk } from '../redux/slice/leaguesSlice';
import { showLoading, hideLoading } from '../redux/slice/uiSlice';
import { MaterialIcons } from '@expo/vector-icons';
import { setSelectedLeagueGiornata } from '../redux/slice/selectedLeagueSlice';
import { logout } from '../redux/slice/authSlice';
import { getGiornataAttuale } from '../services/infoGiornataService';
import { SafeAreaView } from 'react-native-safe-area-context'; // Importa SafeAreaView
import { Avatar } from 'react-native-paper';
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';
// import { BannerAdComponent } from '../components/Adv/AdvBanner';
import Wrapper from './componentScreen/Container';

import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';


// React.memo per ottimizzare il rendering di HomeScreen
const HomeScreen = React.memo(() => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const route = useRoute(); // Ottieni l'oggetto route

    const leaguesState = useSelector((state) => state.leagues); // Stato delle leghe
    const leaguesStateLoading = useSelector((state) => state.leagues.loading); // Stato delle leghe
    const loadingState = useSelector((state) => state.ui.loading); // Stato di caricamento
    const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId); // Recupera l'ID utente dallo stato
    const userName = useSelector((state) => state.auth.user && state.auth.user.user.fullName); // Recupera l'ID utente dallo stato
    const photoProfile = useSelector((state) => state.auth.photoUri); // Stato delle leghe

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
            setModalVisible(false); // Nascondi la modale
            dispatch(showLoading());
            await dispatch(deleteLeagueThunk(leagueId)).unwrap(); // Esegui il thunk per eliminare la lega
        } catch (error) {
            console.error('Errore durante l\'eliminazione della lega:', error);
        } finally {
            setModalVisible(false); // Nascondi la modale
            dispatch(hideLoading());
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
            <ReanimatedSwipeable
                renderRightActions={(p, c) => isOwner ? renderRightActions(p, c, item) : null}

            >
                <TouchableOpacity onPress={() => handleLeaguePress(item)}>
                    <Card
                        mode='outlined'
                        style={{ ...styles.leagueContainer }} >
                        <Card.Title
                            title={`${item.name}`}
                            // subtitle={`${item.members.length} Partecipanti`}
                            subtitle={`${item.members.length} Partecipanti`}
                            left={(props) => <Avatar.Icon  {...props} icon="soccer" />}
                        />
                    </Card>
                </TouchableOpacity>
            </ReanimatedSwipeable >
        );
    });

    // Renderizza la UI che appare durante lo swipe
    function renderRightActions(prog, drag, league) {
        const styleAnimation = useAnimatedStyle(() => {

            return {
                transform: [{ translateX: drag.value + 70 }],
            };
        });

        return (
            <Reanimated.View style={[styleAnimation]}>
                <TouchableOpacity style={{ height: '87%', ...styles.deleteButton }} onPress={() => confirmDeleteLeague(league)}>
                    <MaterialIcons name="delete" size={30} color="white" />
                </TouchableOpacity>
            </Reanimated.View>
        )

    }

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
        <SafeAreaView style={[{ backgroundColor: colors.background, flex: 1 }]}>
            <Wrapper>

                {/* Intestazione con "Le mie leghe" e "Crea Lega" */}
                <View style={styles.containerProfile}>
                    {/* Icona Profilo */}
                    <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
                        <Avatar.Image
                            source={{ uri: photoProfile || 'https://via.placeholder.com/150' }}
                            size={40}
                        />
                    </TouchableOpacity>
                    {/* Testo Nome e Sottotitolo */}
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>{userName}</Text>
                        <Text style={styles.subtitle}>Inserisci le tue predizioni</Text>
                    </View>

                    {/* Icona Menu */}
                    <TouchableOpacity
                        onPress={() => navigation.toggleDrawer()}
                    >
                        <MaterialIcons
                            name="menu"
                            size={30}
                            color="#FFFFFF" // Colore dell'icona hamburger (bianco)

                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerContainer}>
                    <Text style={styles.headerText}>Le mie leghe</Text>
                    <Button mode="contained"
                        labelStyle={{ fontSize: 12 }}
                        onPress={() => navigation.navigate('CreateLeague')}>Crea Lega</Button>
                </View>
                {/* <View style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <BannerAdComponent />
                </View> */}


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
                    ListEmptyComponent={!leaguesStateLoading && (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateText}>Nessuna lega trovata</Text>
                        </View>
                    )}
                />

                {/* Pulsante "Unisciti alla lega" */}
                <Button mode="contained" labelStyle={{
                    ...fontStyle.textMedium
                }} onPress={() => navigation.navigate('JoinLeague')} style={styles.joinButton}>
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
            </Wrapper>
        </SafeAreaView>
    );
});


const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    leagueContainer: {
        marginVertical: 5,
        borderBottomWidth: 3,
        borderBottomColor: COLORJS.primary
    },
    listContainer: {
        paddingBottom: 20,
    },
    joinButton: {
        marginBottom: 20,
        borderRadius: 10,
        width: '70%',
        margin: 'auto'
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
        margin: 'auto',
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
        color: COLORJS.background
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
    containerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30
    },
    textContainer: {
        flex: 1, // Occupa lo spazio rimanente
        marginLeft: 10
    },
    name: {
        color: COLORJS.primary, // Colore viola per il nome
        fontWeight: 'bold',
        fontSize: 18,
        ...fontStyle.textBold,
    },
    subtitle: {
        ...fontStyle.textLight,
        color: '#cccccc', // Colore grigio chiaro per il sottotitolo
        fontSize: 14,
    },
});

export default HomeScreen;
