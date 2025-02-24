import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';
import { useSelector } from 'react-redux';

const XPBar = ({ initialLevel = 1, baseMaxXp = 100000 }) => {
    const totalXp = useSelector((state) => state.auth.xp); // XP totali dell'utente

    // Inizializza il livello e il max XP come numeri interi
    let level = initialLevel;
    let maxXp = baseMaxXp; // Max XP del livello corrente (usiamo numeri interi)
    let xp = totalXp;  // XP totali dell'utente (numeri interi)

    // Calcola il livello e gli XP rimanenti (con millipunti per evitare errori)
    while (xp >= maxXp) {
        xp -= maxXp;  // Sottrae XP fino a rientrare nel range del livello successivo
        level++;      // Aumenta il livello
        maxXp = Math.floor(maxXp * 1.2); // Incrementa il max XP per il prossimo livello
    }

    // Calcola la progressione in millipunti (XP in base al maxXP)
    const progress = xp / maxXp; // Progress in numeri interi
    const clampedProgress = Math.max(0, Math.min(1, progress)); // Limita il valore di progress a 1

    return (
        <View style={styles.xpContainer}>
            <Text style={styles.levelText}>Livello {level}</Text>
            <ProgressBar progress={clampedProgress} color={COLORJS.primary} style={styles.progressBar} />
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
