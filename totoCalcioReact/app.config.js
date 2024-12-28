export default ({ config }) => {
    // Imposta l'API_URL in base all'ambiente di build
    const API_URL =
      process.env.EXPO_ENV === 'development'
        ? 'https://test-dot-totocalcioreact.uc.r.appspot.com/api' // URL per lo sviluppo
        : 'https://totocalcioreact.uc.r.appspot.com/api'; // URL per la produzione
  
    return {
      ...config,
      name: "Soccer Challenge",
      slug: "soccer-challenge",
      version: "1.0.5",
      orientation: "portrait",
      newArchEnabled: true,
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#00f310"
      },
      extra: {
        FIREBASE_API_KEY: "AIzaSyAmvM9n8lLu_POr6in4R87-jv1MRvX1VN0",
        FIREBASE_AUTH_DOMAIN: "totocalcioreact.firebaseapp.com",
        FIREBASE_PROJECT_ID: "totocalcioreact",
        FIREBASE_STORAGE_BUCKET: "totocalcioreact.appspot.com",
        FIREBASE_MESSAGING_SENDER_ID: "700309241728",
        FIREBASE_APP_ID: "1:700309241728:web:38f12c82fb5f684e44cb65",
        FIREBASE_MEASUREMENT_ID: "G-J1KBDWK4SS",
        API_URL, // Aggiungi qui l'API_URL dinamico
        eas: {
          projectId: "d4c88629-f66e-43b4-ad2c-ad1094af38eb"
        }
      },
      ios: {
        supportsTablet: true,
        infoPlist: {
          NSFaceIDUsageDescription: "Questa app utilizza Face ID per autenticare l'utente.",
          NSUserTrackingUsageDescription: "Questa identificazione verrà utilizzata per fornire annunci personalizzati.",
          UIBackgroundModes: ["remote-notification"]
        },
        bundleIdentifier: "com.anonymous.soccerChallenge"
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff"
        },
        package: "com.anonymous.soccerChallenge",
        permissions: ["com.google.android.gms.permission.AD_ID"]
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      plugins: [
        "expo-asset",
        "expo-secure-store",
        "expo-font",
        [
          "react-native-google-mobile-ads",
          {
            androidAppId: "ca-app-pub-4136467313498542~4203300084",
            iosAppId: "ca-app-pub-4136467313498542~3558342379"
          }
        ],
        "expo-tracking-transparency"
      ]
    };
  };
  