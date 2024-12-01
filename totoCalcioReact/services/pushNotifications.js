// PushNotifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;

  // Richiedi il permesso per le notifiche
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    // Se l'utente non ha concesso il permesso, esci dalla funzione
    return;
  }

  // Se il permesso è stato concesso, ottieni il token
  token = (await Notifications.getExpoPushTokenAsync()).data;

  // Configura il canale di notifica per Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
