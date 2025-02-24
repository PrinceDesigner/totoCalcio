import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';

const XPBar = ({ level = 1, xp =70, maxXp = 100 }) => {
    const progress = xp / maxXp; // Calcola il progresso della barra XP

    return (
        <View style={styles.xpContainer}>
            <Text style={styles.levelText}>Livello {level}</Text>
            <ProgressBar progress={progress} color={COLORJS.primary} style={styles.progressBar} />
            <Text style={styles.xpText}>XP: {xp} / {maxXp}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    xpContainer: {
        width: '100%',
    },
    levelText: {
        color: COLORJS.primary,
        fontWeight: 'bold',
        fontSize: 16,
        ...fontStyle.textBold,
    },
    progressBar: {
        marginTop: 5,
        height: 6,
        borderRadius: 3,
    },
    xpText: {
        color: '#cccccc',
        fontSize: 12,
        marginTop: 5,
    },
});

export default XPBar;
