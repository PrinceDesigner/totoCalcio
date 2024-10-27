import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Badge, useTheme } from 'react-native-paper';
import moment from 'moment-timezone';
import { useNavigation } from '@react-navigation/native';

const MatchItem = ({ match }) => {
    const { colors } = useTheme();
    const navigation = useNavigation();

    const convertToItalianTime = (dateString) => {
        // Crea un nuovo oggetto Date dalla stringa ISO
        return moment(dateString).utc().format('HH:mm');
    };

    const handlePress = () => {
        // Naviga alla schermata di formazione quando viene premuto il MatchItem
        // navigation.navigate('FormazioneScreen', { fixtureId: match.matchId });
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={{ ...styles.matchItem, backgroundColor: colors.surface }}>
                {/* Dettaglio del match */}
                <View style={styles.matchDetails}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <View style={styles.leagueBadgeContainer}>
                            <Badge style={{ backgroundColor: colors.primary }}>Serie A</Badge>
                        </View>
                        <View style={styles.leagueBadgeContainer}>
                            <Badge style={{ backgroundColor: colors.primary }}>{match.stadio}</Badge>
                        </View>
                    </View>

                    {/* Sezione con i loghi delle squadre e i nomi */}
                    <View style={styles.teamContainer}>
                        <View style={styles.team}>
                            <Image
                                source={{ uri: match.homeLogo }}
                                style={styles.teamLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.teamName}>{match.homeTeam}</Text>
                        </View>

                        <Text style={styles.vsText}>vs</Text>

                        <View style={styles.team}>
                            <Image
                                source={{ uri: match.awayLogo }}
                                style={styles.teamLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.teamName}>{match.awayTeam}</Text>
                        </View>
                    </View>

                    <Text style={styles.matchTime}>{convertToItalianTime(match.startTime)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    matchItem: {
        marginVertical: 5,
        borderRadius: 5,
        padding: 10,
    },
    matchDetails: {
        // paddingHorizontal: 10,
    },
    leagueBadgeContainer: {
        marginBottom: 5,
    },
    teamContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
    },
    team: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    teamLogo: {
        width: 30,
        height: 30,
        marginRight: 5,
    },
    teamName: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    vsText: {
        color: 'white',
        fontSize: 14,
        marginHorizontal: 5,
    },
    matchTime: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
    },
});

export default MatchItem;
