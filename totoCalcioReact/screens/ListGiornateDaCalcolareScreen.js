import moment from 'moment-timezone';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { fetchGiornateCalcolate } from '../services/storicoService';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useNavigation } from '@react-navigation/native';
import { showToast } from '../ToastContainer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Wrapper from './componentScreen/Container';
import GiornateDaCalcolareItemList from './componentScreen/GiornateDaCalcolareItemList';

export default function ListGiornateDaCalcolareScreen() {
    const { colors } = useTheme();
    const leagueId = useSelector((state) => state.giornataAttuale.legaSelezionata);
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const giornateCalcolate = useSelector((state) => state.giornateDaCalcolareReducer.giornate);



    const createTask = async (giornata) => {
        try {
            dispatch(showLoading());
            const createtask = httpsCallable(functions, 'scheduleDayUpdateTasks');
            const result = await createtask({ leagueId, dayId: giornata.dayId });

            if (result.data.success) {
                showToast('success', 'Task Creati');
                navigation.navigate('Home1', { refresh: true });
            } else {
                showToast('error', result.data.message);
            }
        } catch (error) {
            console.error('Errore durante il task:', error);
            showToast('error', 'Errore durante il task');
        } finally {
            dispatch(hideLoading());
        }
    };

    const renderGiornate = () => {
        if (giornateCalcolate.length === 0) {
            return (
                <View style={styles.noGiornateContainer}>
                    <Text style={styles.noGiornateText}>Non ci sono giornate da calcolare</Text>
                </View>
            );
        }

        return <GiornateDaCalcolareItemList giornateCalcolate={[...giornateCalcolate]} leagueId={leagueId} />
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={{ backgroundColor: colors.background }}
                contentContainerStyle={{ paddingBottom: 60 }}>
                <Wrapper>
                    {/* Avviso per le giornate calcolate */}
                    <View style={styles.warningContainer}>
                        <Text style={{ color: 'yellow', fontSize: 16 }}>
                            Le giornate con l'icona di spunta verde <MaterialIcons name="check-circle" size={16} color="green" /> sono già state calcolate.
                        </Text>
                    </View>
                    {renderGiornate()}
                </Wrapper>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    warningContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#333',
        borderRadius: 5,
    },
    noGiornateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    noGiornateText: {
        fontSize: 18,
        color: 'gray',
    },
});
