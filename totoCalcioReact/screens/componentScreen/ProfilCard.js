import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar, Button } from 'react-native-paper';
import { useSelector } from 'react-redux'; // Importa useSelector
import fontStyle from '../../theme/fontStyle';
import { COLORJS } from '../../theme/themeColor';

const ProfileCard = ({ onAvatarPress, fullName, photoProfile }) => {
    // Utilizza useSelector per ottenere le informazioni dell'utente dallo store Redux

    return (
        <View style={styles.profileSectionRow}>
            <View style={styles.avatarContainer}>
                {onAvatarPress ? (
                    // Se onAvatarPress è definito, avvolgi l'avatar in un TouchableOpacity per renderlo cliccabile
                    <TouchableOpacity onPress={onAvatarPress}>
                        <Avatar.Image
                            size={80}
                            source={photoProfile ? { uri: photoProfile } : { uri: 'https://via.placeholder.com/150' }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                ) : (
                    // Se onAvatarPress non è definito, mostra solo l'avatar senza interazione
                    <Avatar.Image
                        size={80}
                        source={photoProfile ? { uri: photoProfile } : { uri: 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                )}
            </View>
            <View style={styles.profileInfoContainer}>
                <Text style={styles.userNameText}>{fullName}</Text>
                <Button style={styles.inviteButton}>
                    Invita amici
                </Button>
            </View>
        </View>
    );
};

// Stili per il componente `ProfileCard`
const styles = StyleSheet.create({
    profileSectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: COLORJS.primary,
        padding: 15,
        borderRadius: 10,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        marginRight: 20,

    },

    userNameText: {
        fontSize: 20,
        ...fontStyle.textBold,
        marginBottom: 5,
    },
    inviteButton: {
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        color: COLORJS.primary,
        ...fontStyle.textBold,
      },
});

export default ProfileCard;
