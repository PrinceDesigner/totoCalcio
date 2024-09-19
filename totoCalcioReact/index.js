import { AppRegistry } from 'react-native';
import App from './App'; // Assicurati che 'App' sia il componente principale
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
