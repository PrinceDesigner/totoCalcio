import React, { useState, useEffect } from 'react';
import { View, Alert, Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePushToken, verifyPushToken } from '../services/authServices';
import { useSelector } from 'react-redux';
import { Button, Text, ActivityIndicator, Card, Divider } from 'react-native-paper';

const NotificationSettings = () => {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false); // Stato per il controllo del token nel database
  const userId = useSelector((state) => state.auth.user && state.auth.user.user.userId);

  useEffect(() => {
    // Controlla lo stato dei permessi all'avvio della pagina
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);

    if (status === 'granted') {
      // Controlla il token nel database
      await checkTokenInDatabase();
    }
  };

  const checkTokenInDatabase = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('expoPushToken');
      if (!savedToken) {
        console.log('Nessun token salvato localmente.');
        return;
      }

      const tokenIsValid = await verifyPushToken(userId, savedToken);
      setIsTokenValid(tokenIsValid);

      if (!tokenIsValid) {
        console.log('Token non trovato nel database, lo salvo nuovamente...');
        await savePushToken(userId, savedToken);
        Alert.alert('Token sincronizzato', 'Il token è stato salvato nel database.');
      } else {
        console.log('Token già valido nel database.');
      }
    } catch (error) {
      console.error('Errore durante la verifica del token nel database:', error);
    }
  };

  const requestPermissionsAndSaveToken = async () => {
    try {
      setLoading(true);

      // Richiedi i permessi
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        // Genera il token
        const token = (await Notifications.getExpoPushTokenAsync()).data;

        // Salva il token su AsyncStorage
        await AsyncStorage.setItem('expoPushToken', token);

        // Salva il token sul server
        await savePushToken(userId, token);

        Alert.alert('Notifiche attivate!', 'Ora riceverai notifiche importanti.');
        setIsTokenValid(true); // Aggiorna lo stato del token
      } else {
        Alert.alert(
          'Permessi non concessi',
          'Non puoi ricevere notifiche. Vai nelle impostazioni per abilitarle.'
        );
      }

      setPermissionStatus(status);
    } catch (error) {
      console.error('Errore durante la richiesta di permessi:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'attivazione delle notifiche.');
    } finally {
      setLoading(false);
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Card style={{ width: '100%', padding: 16, elevation: 4 }}>
        <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 16 }}>
          Impostazioni Notifiche
        </Text>
        <Divider style={{ marginBottom: 16 }} />

        <Text
          variant="bodyLarge"
          style={{
            textAlign: 'center',
            marginBottom: 16,
            color: permissionStatus === 'granted' ? 'green' : 'red',
          }}
        >
          Stato notifiche: {permissionStatus === 'granted' ? 'Attivate' : 'Disattivate'}
        </Text>

        {loading ? (
          <ActivityIndicator animating={true} size="large" />
        ) : permissionStatus === 'granted' ? (
          <Text
            variant="bodyLarge"
            style={{
              textAlign: 'center',
              color: isTokenValid ? 'green' : 'orange',
              marginVertical: 16,
            }}
          >
            {isTokenValid
              ? 'Le notifiche sono attive e sincronizzate.'
              : 'Le notifiche sono attive ma non sincronizzate. Sincronizzando...'}
          </Text>
        ) : (
          <>
            <Text
              variant="bodyMedium"
              style={{ textAlign: 'center', marginBottom: 16, color: 'gray' }}
            >
              Le notifiche non sono attive. Abilita le notifiche per ricevere aggiornamenti
              importanti.
            </Text>
            <Button
              mode="contained"
              onPress={requestPermissionsAndSaveToken}
              loading={loading}
              style={{ marginBottom: 16 }}
            >
              Attiva Notifiche
            </Button>
            <Button
              mode="outlined"
              onPress={openAppSettings}
              style={{ marginTop: 8 }}
              disabled={loading}
            >
              Vai alle Impostazioni
            </Button>
          </>
        )}
      </Card>
    </View>
  );
};

export default NotificationSettings;
