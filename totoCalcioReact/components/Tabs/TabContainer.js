import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TabButton from './TabButton'; // Assicurati che il percorso sia corretto

const TabContainer = ({ tabs, selectedTab }) => { // Seleziona il primo tab di default

    return (
        <View style={styles.tabContainer}>
            {tabs.map((tab, index) => (
                <TabButton
                    key={index}
                    label={tab.label}
                    isSelected={selectedTab === tab.label}
                    onPress={() => {
                        // setSelectedTab(tab.label);
                        if (tab.onPress) {
                            tab.onPress(); // Esegui il callback passato al tab
                        }
                    }}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#333',
        paddingVertical: 10,
    },
});

export default TabContainer;
