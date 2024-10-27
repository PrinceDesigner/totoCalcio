import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Badge } from 'react-native-paper';
import { getMatchLineup } from '../services/leagueService';
import { COLORJS } from '../theme/themeColor';

const FormationScreen = ({ route }) => {
    const { fixtureId } = route.params;
    const [loading, setLoading] = useState(true);
    const [response, setLineupData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0); // Stato per gestire il tab attivo (0 per la prima squadra, 1 per la seconda)

    useEffect(() => {
        const fetchLineup = async () => {
            try {
                setLoading(true);
                const data = await getMatchLineup(fixtureId);
                setLineupData(data);
            } catch (err) {
                setError('Errore durante il recupero delle formazioni. Riprova più tardi.');
            } finally {
                setLoading(false);
            }
        };
        fetchLineup();
    }, [fixtureId]);

    if (loading) {
        return (
            <View style={styles.centeredView}>
                <ActivityIndicator size="large" color={COLORJS.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredView}>
                <Text style={styles.noDataText}>{error}</Text>
            </View>
        );
    }

    if (!response || response.length === 0) {
        return (
            <View style={styles.centeredView}>
                <Text style={styles.noDataText}>Le formazioni non sono disponibili al momento.</Text>
            </View>
        );
    }

    // Ottieni i dati della squadra attualmente selezionata
    const teamData = response[selectedTab];

    return (
        <View style={styles.container}>
            {/* Barra di tab personalizzata */}
            <View style={styles.tabBar}>
                {response.map((team, index) => (
                    <TouchableOpacity
                        key={team.team.id}
                        style={[styles.tabButton, selectedTab === index && styles.activeTabButton]}
                        onPress={() => setSelectedTab(index)}
                    >
                        <Text style={[styles.tabText, selectedTab === index && styles.activeTabText]}>
                            {team.team.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Informazioni sulla squadra */}
                <View style={styles.teamContainer}>
                    <View style={styles.teamInfo}>
                        <Image source={{ uri: teamData.team.logo }} style={styles.teamLogo} />
                        <Text style={styles.teamName}>{teamData.team.name}</Text>
                        <Text style={styles.formation}>Formazione: {teamData.formation}</Text>
                    </View>

                    {/* Giocatori Titolari */}
                    <View style={styles.startXIContainer}>
                        <Text style={styles.sectionTitle}>Giocatori Titolari</Text>
                        {teamData.startXI.map((item) => (
                            <View key={item.player.id} style={styles.playerContainer}>
                                <Badge style={styles.playerBadge}>{item.player.number}</Badge>
                                <Text numberOfLines={1} style={styles.playerName}>
                                    {item.player.name} - {item.player.pos}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Panchina */}
                    <View style={styles.substitutesContainer}>
                        <Text style={styles.sectionTitle}>Panchina</Text>
                        {teamData.substitutes.map((item) => (
                            <View key={item.player.id} style={styles.substitutePlayer}>
                                <Badge style={styles.playerBadge}>{item.player.number}</Badge>
                                <Text numberOfLines={1} style={styles.playerName}>
                                    {item.player.name} - {item.player.pos}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// Stili aggiornati per il tema
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORJS.background,
    },
    scrollContainer: {
        paddingVertical: 20,
        flexGrow: 1,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORJS.background,
    },
    noDataText: {
        padding: 20,
        textAlign: 'center',
        fontSize: 18,
        color: COLORJS.primary,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORJS.surface,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: COLORJS.primary,
    },
    tabText: {
        fontSize: 16,
        color: '#fff',
    },
    activeTabText: {
        color: COLORJS.primary,
        fontWeight: 'bold',
    },
    teamContainer: {
        backgroundColor: COLORJS.surface,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    teamInfo: {
        alignItems: 'center',
        marginBottom: 15,
    },
    teamLogo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    teamName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORJS.primary,
        marginTop: 10,
        textAlign: 'center',
    },
    formation: {
        fontSize: 14,
        color: '#fff',
        marginTop: 5,
        textAlign: 'center',
    },
    startXIContainer: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORJS.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    playerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#424242',
    },
    playerBadge: {
        backgroundColor: COLORJS.primary,
        marginRight: 10,
        paddingHorizontal: 8,
    },
    playerName: {
        fontSize: 14,
        color: '#fff',
        flexShrink: 1,
    },
    substitutesContainer: {
        marginBottom: 15,
    },
    substitutePlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#424242',
    },
});

export default FormationScreen;
