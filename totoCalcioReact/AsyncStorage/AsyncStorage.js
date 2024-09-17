import AsyncStorage from '@react-native-async-storage/async-storage';

// Quando ricevi il token JWT dopo la registrazione
export const saveToken = async (token) => {
    try {
        await AsyncStorage.setItem('jwt_token', token);
    } catch (e) {
        console.error('Errore durante il salvataggio del token:', e);
    }
};


// Recupera il token JWT da AsyncStorage
export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem('jwt_token');
        return token;
    } catch (e) {
        console.error('Errore durante il recupero del token:', e);
        return null;
    }
};

// Rimuove il token JWT da AsyncStorage
export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem('jwt_token');
    } catch (e) {
        console.error('Errore durante la rimozione del token:', e);
    }
};