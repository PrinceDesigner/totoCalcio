import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, useTheme, Avatar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectLeagueById } from '../redux/slice/leaguesSlice';

export default function FullParticipantsRankingScreen() {
    const { colors } = useTheme();
    const participants = useSelector((state) => state.partecipantiLegaCorrente.participants);


    return (
        <ScrollView style={{ ...styles.container, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 100 }}>
            {participants.map((participant, index) => (
                <Card key={index +1 } style={{ ...styles.card, backgroundColor: colors.surface }}>
                    <View style={styles.rankRow}>
                        <Text style={{ color: 'white', fontSize: 20 }}>{index + 1}</Text>
                        <Avatar.Image
                            source={{ uri: participant.photoURL }}
                            size={40}
                            style={styles.avatar}
                        />
                        <Text style={{ ...styles.participantName, color: 'white' }}>{participant.displayName}</Text>
                        <Text style={{ ...styles.points, color: colors.primary }}>{participant.punti}pt</Text>
                    </View>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    rankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        marginHorizontal: 10,
        marginRight: 0
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'left',
        paddingLeft: 10,
    },
    points: {
        fontSize: 16,
        fontWeight: 'bold',
        width: '25%',
        textAlign: 'right',
    },
});
