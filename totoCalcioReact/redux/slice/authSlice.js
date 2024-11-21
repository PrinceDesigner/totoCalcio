import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, updateProfile } from 'firebase/auth';
import { updateUser } from '../../services/authServices';

// Stato iniziale per l'autenticazione
const initialState = {
  isAuthenticated: false,
  user: null, // Dati utente come email, username, ecc.
  photoUri: null, // URI della foto del profilo utente
  error: null, // Per gestire eventuali errori di autenticazione o signup
};


// Thunk per aggiornare l'email e il displayName
export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async ({ email, displayName, userId }, { rejectWithValue }) => {
    try {
      // Chiama il servizio per aggiornare l'email e il displayName
      const response = await updateUser(email, displayName, userId);
      return response.user; // Restituisce i dati aggiornati dell'utente
    } catch (error) {
      return rejectWithValue(error.response.data || 'Errore durante l\'aggiornamento del profilo');
    }
  }
);

// Thunk per aggiornare l'URI della foto profilo
export const updateProfilePhoto = createAsyncThunk(
  'auth/updateProfilePhoto',
  async (photoUri, { dispatch, rejectWithValue }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Utente non autenticato');
      }

      // Ottieni il file blob dalla foto
      const response = await fetch(photoUri);
      const blob = await response.blob();

      // Carica la foto su Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);

      // Carica l'immagine
      await uploadBytes(storageRef, blob);

      // Ottieni l'URL dell'immagine caricata
      const downloadURL = await getDownloadURL(storageRef);

      // Aggiorna il profilo dell'utente su Firebase Auth con il nuovo photoURL
      await updateProfile(user, { photoURL: downloadURL });

      // Aggiorna l'URI della foto nel Redux store
      dispatch(updatePhotoUri(downloadURL));

      return downloadURL;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// Crea lo slice per l'autenticazione
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Azione per login successo
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload; // Imposta i dati dell'utente
      state.photoUri = action.payload.photoUri; // Imposta l'URI della foto profilo (se esiste)
      state.error = null;
    },
    // Azione per login fallito
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.photoUri = null; // Reset dell'URI della foto
      state.error = action.payload; // Imposta l'errore di login
    },
    // Azione per registrazione successo
    signupSuccess: (state, action) => {
      state.isAuthenticated = true; // Potresti voler mantenere l'utente autenticato dopo il signup
      state.user = action.payload; // Imposta i dati dell'utente (es: email, displayName, ecc.)
      state.photoUri = action.payload.photoUri; // Imposta l'URI della foto profilo
      state.error = null;
    },
    // Azione per registrazione fallita
    signupFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.photoUri = null; // Reset dell'URI della foto
      state.error = action.payload; // Imposta l'errore di registrazione
    },
    // Azione per aggiornare la foto profilo
    updatePhotoUri: (state, action) => {
      state.photoUri = action.payload; // Aggiorna l'URI della foto profilo
    },
    // Azione per il logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.photoUri = null; // Reset dell'URI della foto
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Gestione dell'aggiornamento del profilo
      .addCase(updateProfileThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user.user = {
          ...state.user.user,
          email: action.payload.email,
          displayName: action.payload.displayName,
          fullName: action.payload.displayName,
        };
        state.error = null; // Resetta l'errore
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.error = action.payload || 'Errore durante l\'aggiornamento del profilo';
      });
  },
});

// Esporta le azioni generate automaticamente
export const { loginSuccess, loginFailure, signupSuccess, signupFailure, updatePhotoUri, logout } = authSlice.actions;

// Esporta il reducer per essere usato nel Redux store
export default authSlice.reducer;
