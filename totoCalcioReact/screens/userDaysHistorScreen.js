import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Card, useTheme, Avatar, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment-timezone';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORJS } from '../theme/themeColor';
import TabContainer from '../components/Tabs/TabContainer';
import { selectUser } from '../redux/slice/storicoPerUtenteSelezionatoSlice';
import ProfileCard from './componentScreen/ProfilCard';
import { makeUserAdminReducer, removeUserAdminReducer, selectLeagueById } from '../redux/slice/leaguesSlice';
import { makeUserAdmin } from '../services/leagueService';
import { removeUserAdmin } from '../services/leagueService';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';

export default function UserHistoryScreen({ route, navigation }) {
    const { colors } = useTheme();

    const userHistory = useSelector((state) => state.storicoPerUtenteSelezionato.storico); // Seleziona la lista delle giornate dallo stato
    const inizioGiornata = useSelector((state) => state.infogiornataAttuale.startDate);
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));
    // UTENTE LOGGATO
    const userIdLogged = useSelector((state) => state.auth.user && state.auth.user.user.userId);
    const dayId = useSelector((state) => state.infogiornataAttuale.dayId);
    const [selectedTab, setSelectedTab] = useState('Storico'); // Stato per selezionare il tab attivo
    const user = useSelector(selectUser);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalVisibleRemove, setIsModalVisibleRemove] = useState(false);

    const dispatch = useDispatch();


    // Configurazione dei tab
    const tabs = [
        {
            label: 'Storico',
            onPress: () => setSelectedTab('Storico'),
        },
        {
            label: 'Profilo',
            onPress: () => setSelectedTab('Profilo'),
        },
    ];

    const isDatePast = () => {
        // Configura la data di input usando moment e imposta il fuso orario a "Europe/Rome"
        const date = moment.tz(inizioGiornata, "Europe/Rome");

        // Ottieni l'orario attuale e imposta il fuso orario a "Europe/Rome"
        const currentDate = moment().utc(true).tz("Europe/Rome");

        // Confronta le date e restituisci true se la data di input è minore dell'orario attuale
        return date.isBefore(currentDate);
    };

    const renderStoricoTab = () => (
        <>
            {/* Avviso in alto */}
            <View style={styles.warningContainer}>
                <MaterialIcons name="info-outline" size={24} color="yellow" />
                <Text style={styles.warningText}>
                    I punti sono aggiornati solo quando la giornata sarà calcolata.
                </Text>
            </View>

            {[...userHistory]
                .sort((a, b) => {
                    const dayA = parseInt(a.daysId.split('-')[1]);
                    const dayB = parseInt(b.daysId.split('-')[1]);
                    return dayB - dayA; // Ordinamento decrescente
                })
                .map((giornata, index) => {
                    if (giornata.daysId !== dayId || (giornata.daysId === dayId && isDatePast())) {
                        return (
                            <TouchableOpacity
                                key={index + 1}
                                onPress={() => navigation.navigate('GiornataSchedinaDetailsUserScreen', { dayId: giornata.daysId })} // Modifica in base alla logica che desideri
                                style={{ ...styles.cardTouchable }} // Modifica per includere lo stile
                            >
                                <Card style={[styles.card, giornata.daysId === dayId ? styles.activeCard : {}]}>
                                    <View style={styles.participantRow}>
                                        <Avatar.Icon
                                            icon="calendar"
                                            size={40}
                                            style={styles.avatar}
                                        />
                                        <Text style={{ ...styles.participantName, color: 'white' }}>Giornata {giornata.daysId.replace('RegularSeason-', '')}</Text>
                                        <Text style={{ ...styles.participantName, color: 'white' }}>{giornata.punti} punti</Text>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        )
                    } else {
                        return null;
                    }
                })}
        </>
    );

    const buttonMakeRemoveAdmin = () => {
        if (user.userId === userIdLogged) {
            return
        }

        if (selectedLeague.ownerId.includes(user.userId)) {
            return <Button
                style={styles.button}
                mode='contained'
                onPress={() => setIsModalVisibleRemove(true)}
            >
                Rimuovi amministratore
            </Button>
        }
        return <Button
            style={styles.button}
            mode='contained'
            onPress={() => setIsModalVisible(true)}
        >
            Rendi amministratore
        </Button>
    }

    const renderProfiloTab = () => (
        <>
            <ProfileCard fullName={user.displayName} photoProfile={user.photoURL} />
            {buttonMakeRemoveAdmin()}
        </>
    );

    const handleConfirmAdmin = async () => {
        try {
            setIsModalVisible(false);
            dispatch(showLoading());

            // Call the makeUserAdmin function to assign admin role to the user
            const result = await makeUserAdmin(leagueId, user.userId);
            dispatch(makeUserAdminReducer({ leagueId, userId: user.userId }));

            // Log success message or handle response data if needed
            console.log('Utente reso amministratore --->', result);

            // Close the modal after success
            dispatch(hideLoading());

        } catch (error) {
            dispatch(hideLoading());

            console.error('Errore durante l\'assegnazione del ruolo di amministratore:', error);
            // Handle any error notification or UI updates here if necessary
        }
    };
    const handleConfirmRemoveAdmin = async () => {
        try {
            setIsModalVisibleRemove(false);
            dispatch(showLoading());

            // Effettua la chiamata al servizio per rimuovere l'utente come amministratore
            await removeUserAdmin(leagueId, user.userId);
            dispatch(removeUserAdminReducer({ leagueId, userId: user.userId }));
            console.log('Utente tolto amministratore --->', leagueId);

            // Chiudi il caricamento dopo il successo
            dispatch(hideLoading());

        } catch (error) {
            dispatch(hideLoading());

            console.error('Errore durante la rimozione del ruolo di amministratore:', error);
            // Gestisci notifiche di errore o aggiornamenti dell'interfaccia utente qui, se necessario
        }
    };
    return (
        <View style={{ flex: 1 }}>
            {/* Tab Custom */}
            <TabContainer tabs={tabs} />
            <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }}>
                {selectedTab === 'Storico' ? renderStoricoTab() : renderProfiloTab()}
            </ScrollView>

            {/* Modale di conferma */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalText}>Sei sicuro di voler rendere questo utente amministratore?</Text>
                        <View style={styles.modalButtonContainer}>
                            <Button style={styles.button}
                                mode='contained' onPress={handleConfirmAdmin} color='white' >Conferma</Button>
                            <Button style={styles.button}
                                mode='outlined' onPress={() => setIsModalVisible(false)} color='white' > Annulla</Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modale di conferma Rimuovi*/}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisibleRemove}
                onRequestClose={() => setIsModalVisibleRemove(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalText}>Sei sicuro di voler rimuovere il ruolo a questo utente?</Text>
                        <View style={styles.modalButtonContainer}>
                            <Button style={styles.button}
                                mode='contained' onPress={handleConfirmRemoveAdmin} color='white' >Conferma</Button>
                            <Button style={styles.button}
                                mode='outlined' onPress={() => setIsModalVisibleRemove(false)} color='white' > Annulla</Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
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
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 8,
    },
    warningText: {
        color: 'yellow',
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    participantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
        backgroundColor: '#6200ea',
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
    activeCard: {
        backgroundColor: COLORJS.primary,
    },
    adminButton: {
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        color: COLORJS.background,
    },
});
