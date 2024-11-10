import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import fontStyle from '../../theme/fontStyle';
import { COLORJS } from '../../theme/themeColor';

const TabButton = ({ label, isSelected, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.tabButton, isSelected && styles.activeTab]}
            onPress={onPress}
        >
            <Text style={[styles.tabText, { color: isSelected ? 'white' : '#ccc' }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    tabButton: {
        paddingVertical: 10,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: COLORJS.primary
    },
    tabText: {
        fontSize: 16,
        ...fontStyle.textLight
    },
});

export default TabButton;
