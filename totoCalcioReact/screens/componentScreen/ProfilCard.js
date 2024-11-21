import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity } from 'react-native';
import { Avatar, Button } from 'react-native-paper';
import fontStyle from '../../theme/fontStyle';
import { COLORJS } from '../../theme/themeColor';

const ProfileCard = ({ onAvatarPress, fullName, photoProfile }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleLongPress = () => {
        setIsModalVisible(true); // Mostra il modal
    };

    const closeModal = () => {
        setIsModalVisible(false); // Chiudi il modal
    };

    return (
        <View style={styles.profileSectionRow}>
            <View style={styles.avatarContainer}>
                <TouchableOpacity
                    onPress={onAvatarPress ? onAvatarPress: handleLongPress } // Funzionalità già esistente per il click
                    onLongPress={handleLongPress} // Aggiungi l'azione per il long press
                >
                    <Avatar.Image
                        size={80}
                        source={photoProfile ? { uri: photoProfile } : require('../../User-avatar.svg.png')}
                        style={styles.avatar}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.profileInfoContainer}>
                <Text style={styles.userNameText}>{fullName}</Text>
                <Button style={styles.inviteButton}>Invita amici</Button>
            </View>

            {/* Modal per l'immagine fullscreen */}
            <Modal
                transparent={true}
                visible={isModalVisible}
                onRequestClose={closeModal}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} />
                    <View style={styles.modalContent}>
                        <Image
                            source={photoProfile ? { uri: photoProfile } : require('../../User-avatar.svg.png')}
                            style={styles.fullscreenImage}
                        />
                        <Button onPress={closeModal} mode="contained" style={styles.closeButton}>
                            Chiudi
                        </Button>
                    </View>
                </View>
            </Modal>
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
        borderWidth: 2,
        borderColor: COLORJS.background,
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
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: COLORJS.primary,
    },
});

export default ProfileCard;
