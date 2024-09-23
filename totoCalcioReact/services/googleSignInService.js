// GoogleSignInService.js
import * as Google from 'expo-auth-session/providers/google';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { showToast } from '../ToastContainer'; // Importa il tuo metodo showToast se lo utilizzi

const auth = getAuth();

export const signInWithGoogleAsync = async () => {
  try {
    const [request, response, promptAsync] = Google.useAuthRequest({
      expoClientId: '<YOUR_EXPO_CLIENT_ID>',
    //   iosClientId: '<YOUR_IOS_CLIENT_ID>',
    //   androidClientId: '<YOUR_ANDROID_CLIENT_ID>',
    //   webClientId: '<YOUR_WEB_CLIENT_ID>', // Se utilizzi il web
    });

    if (response?.type === 'success') {
      const { id_token, access_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token, access_token);

      // Effettua il login con Firebase
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential;
    } else {
      showToast('error', 'Autenticazione annullata o fallita');
    }
  } catch (error) {
    console.error('Errore durante il login con Google:', error);
    showToast('error', 'Errore durante il login con Google');
  }
};
