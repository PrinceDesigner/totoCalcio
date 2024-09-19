import React from 'react';
import Toast from 'react-native-toast-message';

// Includi il ToastContainer come parte dell'App
const ToastContainer = () => {
  return <Toast />;
};

export const showToast = (type, message) => {
  Toast.show({
    type: type, // 'success', 'error', 'info'
    text1: message,
    position: type === 'success' ? 'bottom' : 'top', // Puoi scegliere 'top' o 'bottom'
    visibilityTime: 3000, // Tempo di visualizzazione in millisecondi
    autoHide: true,
    bottomOffset: 40, // Distanza dal fondo dello schermo
  });
};

export default ToastContainer;
