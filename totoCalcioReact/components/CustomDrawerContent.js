import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slice/authSlice';
import { removeToken } from '../AsyncStorage/AsyncStorage';
import { hideLoading, showLoading } from '../redux/slice/uiSlice';
import { getAuth, signOut } from 'firebase/auth'; // Importa signOut da Firebase
import { COLORJS } from '../theme/themeColor';
import fontStyle from '../theme/fontStyle';

export default function CustomDrawerContent(props) {
  const dispatch = useDispatch();
  const [pressed, setPressed] = useState(false);

  const handleLogout = async () => {
    dispatch(showLoading()); // Imposta lo stato di caricamento su true
    const auth = getAuth(); // Ottieni l'istanza di Firebase Auth

    try {
      // Esegui il logout da Firebase
      await signOut(auth);

      // Rimuovi il token da AsyncStorage
      await removeToken(); 

      // Dispatch del logout per aggiornare lo stato di Redux
      dispatch(logout());
      // Naviga alla schermata di login
      props.navigation.replace('LoginScreen');

    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      dispatch(hideLoading()); // Nascondi l'indicatore di caricamento
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  logoutButton: {
    backgroundColor: COLORJS.primary,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    ...fontStyle.textLight
  },
});
