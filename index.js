/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

// Register background handler
try {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Background notification:', remoteMessage);
    });
} catch (e) {
    console.warn('Firebase messaging not ready:', e);
}

AppRegistry.registerComponent(appName, () => App);
