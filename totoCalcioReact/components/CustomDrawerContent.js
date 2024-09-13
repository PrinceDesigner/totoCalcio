// CustomDrawerContent.js

import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Button, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slice/authSlice';

export default function CustomDrawerContent(props) {
  const dispatch = useDispatch();
  const { colors } = useTheme();

  const handleLogout = () => {
    // Dispatch del logout
    dispatch(logout());
    // Puoi anche fare altre azioni come navigare alla pagina di login se necessario
    props.navigation.replace('LoginScreen'); // Naviga alla schermata di login
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        {/* Renderizza le voci di menu */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Aggiungi il pulsante di logout in fondo */}
      <View style={styles.logoutContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
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
    backgroundColor: '#a21fec', // Colore di sfondo del pulsante di logout
    borderRadius: 5,
    paddingVertical: 10,
  },
});
