import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';

const ProfileHeader = ({ navigation, photoProfile, userName }) => {
    return (
        <View style={styles.containerProfile}>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
                <Avatar.Image
                    source={{ uri: photoProfile || 'https://via.placeholder.com/150' }}
                    size={40}
                />
            </TouchableOpacity>

            <View style={styles.textContainer}>
                <Text style={styles.name}>{userName}</Text>
                <Text style={styles.subtitle}>Clicca sull'immagine per il profilo</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
                <MaterialIcons name="menu" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    containerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30
    },
    textContainer: {
        flex: 1,
        marginLeft: 10
    },
    name: {
        color: COLORJS.primary,
        fontWeight: 'bold',
        fontSize: 18,
        ...fontStyle.textBold,
    },
    subtitle: {
        ...fontStyle.textLight,
        color: '#cccccc',
        fontSize: 14,
    },
});

export default ProfileHeader;
