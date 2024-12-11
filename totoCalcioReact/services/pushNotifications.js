import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  console.log('Experience ID:', '@francesco.errico/soccer-challenge');

  // Recupera il projectId dalla configurazione
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  console.log('Project ID dal manifest:', projectId);

  if (!projectId) {
    console.error('Project ID non trovato nella configurazione.');
    return null;
  }

  let token;

  // Controlla lo stato dei permessi
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permessi per le notifiche non concessi');
    return null; // Torna null per indicare che non c'è un token
  }

  try {
    // Ottieni il token utilizzando il projectId
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log('Token push generato:', token);

    // Configura il canale di notifica per Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('Canale di notifica Android configurato');
    }

    return token;
  } catch (error) {
    console.error('Errore durante la generazione del token:', error);
    return null;
  }
}
