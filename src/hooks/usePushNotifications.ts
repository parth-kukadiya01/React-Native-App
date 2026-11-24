import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useSelector } from 'react-redux';
import { notificationService } from '../services/notificationService';
import type { RootState } from '../store';

export const usePushNotifications = () => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    // Only send push token to backend when the user is authenticated
    const authToken = useSelector((state: RootState) => state.auth.token);

    async function requestUserPermission() {
        if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            return enabled;
        } else if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                    {
                        title: 'Notification Permission',
                        message: 'Allow SVGold to send you order updates and alerts.',
                        buttonPositive: 'Allow',
                        buttonNegative: 'Deny',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true;
        }
        return false;
    }

    async function registerForPushNotificationsAsync() {
        const hasPermission = await requestUserPermission();
        if (!hasPermission) {
            console.log('Push notification permission denied');
            return null;
        }

        try {
            const token = await messaging().getToken();
            console.log('FCM Token:', token);
            return token;
        } catch (e) {
            console.error('Error fetching FCM token:', e);
            return null;
        }
    }

    const showForegroundNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const title = remoteMessage.notification?.title ?? 'SVGold';
        const body = remoteMessage.notification?.body ?? '';

        if (body) {
            Alert.alert(title, body);
        }
    };

    // Get the device FCM token once on mount
    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            setFcmToken(token);
        });

        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
            console.log('Foreground notification received:', remoteMessage);
            showForegroundNotification(remoteMessage);
        });

        const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notification opened app from background:', remoteMessage);
        });

        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                console.log('App opened from quit state by notification:', remoteMessage);
            }
        });

        const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
            console.log('FCM token refreshed:', token);
            setFcmToken(token);
        });

        return () => {
            unsubscribeForeground();
            unsubscribeOpened();
            unsubscribeTokenRefresh();
        };
    }, []);

    useEffect(() => {
        if (!authToken || !fcmToken) return;

        notificationService.registerPushToken(fcmToken).catch(err => {
            console.log('Failed to register token with backend:', err);
        });
    }, [authToken, fcmToken]);

    return {
        fcmToken,
    };
};
