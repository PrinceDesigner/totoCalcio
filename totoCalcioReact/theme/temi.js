// temi.js
import { DefaultTheme, MD2DarkTheme } from 'react-native-paper';

// Tema personalizzato (Default)
export const customDefaultTheme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    accent: '#f1c40f',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    
    // Altri colori personalizzabili
  },
};

// Tema personalizzato (Dark)
export const customDarkTheme = {
  ...MD2DarkTheme,
  roundness: 8,
  colors: {
    ...MD2DarkTheme.colors,
    primary: '#a21fec',
    accent: '#f1c40f',
    background: '#161616',
    surface: '#323232',
    text: '#ffffff',
    // Altri colori personalizzabili
  },
};
