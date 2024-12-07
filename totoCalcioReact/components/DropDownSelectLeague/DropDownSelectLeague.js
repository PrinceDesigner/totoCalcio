import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { selectLeagueById } from '../../redux/slice/leaguesSlice';
import fontStyle from '../../theme/fontStyle';
import { COLORJS } from '../../theme/themeColor';

const CustomDropdownSelectLeague = ({ data, onSelect, leagueId }) => {
    const selectedLeague = useSelector(state => selectLeagueById(leagueId)(state));
    const [modalVisible, setModalVisible] = useState(false);

    const toggleModal = () => setModalVisible(!modalVisible);

    const handleSelection = (item) => {
        toggleModal();
        if (onSelect) onSelect(item); // Chiama il metodo del padre con l'elemento selezionato
    };

    return (
        <View>
            {/* Pulsante per aprire il dropdown */}
            <TouchableOpacity style={styles.selector} onPress={toggleModal}>
                <Text style={styles.selectText}>
                    {selectedLeague?.name || 'Seleziona'}
                </Text>
                <Icon name="keyboard-arrow-down" size={30} color={COLORJS.primary} />
            </TouchableOpacity>

            {/* Modal per la selezione */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={toggleModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => handleSelection(item.id)}
                                >
                                    <Text style={styles.modalItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
                            <Text style={styles.closeButtonText}>Chiudi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        // alignItems: 'center',
        // justifyContent: 'space-between',
        paddingVertical: 5,
        // borderWidth: 1,
        borderColor: '#ccc',
        // borderRadius: 30,
        // width: 250,
        paddingHorizontal: 10,
        // backgroundColor: COLORJS.primary
        
    },
    selectText: {
        color: COLORJS.primary,
        fontSize: 20,
        ...fontStyle.textBoldItalic
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORJS.secondaryBackGroud,
        borderRadius: 10,
        padding: 15,
    },
    modalItem: {
        padding: 15,
        paddingVertical: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalItemText: {
        fontSize: 16,
        color: 'white',
        ...fontStyle.textBold
    },
    closeButton: {
        marginTop: 15,
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: COLORJS.primary,
        borderRadius: 5,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default CustomDropdownSelectLeague;
