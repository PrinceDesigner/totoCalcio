import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'; // Importa functions


const firebaseConfig = {
    apiKey: "AIzaSyAmvM9n8lLu_POr6in4R87-jv1MRvX1VN0",
    authDomain: "totocalcioreact.firebaseapp.com",
    projectId: "totocalcioreact",
    storageBucket: "totocalcioreact.appspot.com",
    messagingSenderId: "700309241728",
    appId: "1:700309241728:web:38f12c82fb5f684e44cb65",
    measurementId: "G-J1KBDWK4SS"
};

const app = initializeApp(firebaseConfig);

// Inizializza Firebase Auth con persistenza
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Inizializza Firestore
const firestore = getFirestore(app);
const functions = getFunctions(app);

export { auth, firestore, functions };
