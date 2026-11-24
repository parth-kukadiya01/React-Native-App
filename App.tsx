import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Provider } from 'react-redux';
// import SplashScreen from 'react-native-splash-screen';
// import { ErrorBoundary } from 'react-error-boundary';

import { CartProvider } from './src/context/CartContext';
import { setOnUnauthorizedCallback } from './src/services/api';
import { storage } from './src/services/storage';
import { userService } from './src/services/userService';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import SplashScreen from './src/app/SplashScreen';
import MainNavigation from './src/navigation/MainNavigator';
import { store } from './src/store';
import { useAppSelector } from './src/store/hooks';
import { logoutUser } from './src/store/slices/authSlice';



function ErrorFallback({ resetErrorBoundary }: any) {
    const handleReset = async () => {
        try {
            await storage.deleteItem('userToken');
            await storage.deleteItem('userData');
        } catch (e) { }
        resetErrorBoundary();
    };

    return (
        <View style={errorStyles.container}>
            <Text style={errorStyles.emoji}>⚠️</Text>
            <Text style={errorStyles.title}>Something went wrong</Text>
            <Text style={errorStyles.subtitle}>
                Please try logging in again
            </Text>
            <TouchableOpacity
                style={errorStyles.button}
                onPress={handleReset}
            >
                <Text style={errorStyles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
        </View>
    );
}

function AppContent() {
    usePushNotifications();

    const token = useAppSelector((state) => state.auth.token);
    const prevTokenRef = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        if (Platform.OS === 'ios' && !__DEV__) {
            try {
                const { enableSecureView } = require('react-native-screenshot-prevent');
                if (typeof enableSecureView === 'function') enableSecureView();
            } catch (e) { /* ignore on unsupported RN versions */ }
        }
        return () => {
            if (Platform.OS === 'ios' && !__DEV__) {
                try {
                    const { disableSecureView } = require('react-native-screenshot-prevent');
                    if (typeof disableSecureView === 'function') disableSecureView();
                } catch (e) { }
            }
        };
    }, []);

    useEffect(() => {
        setOnUnauthorizedCallback(() => {
            store.dispatch(logoutUser());
        });
    }, []);
    useEffect(() => {
        const prev = prevTokenRef.current;
        prevTokenRef.current = token;

        if (token && (prev === undefined || prev === null)) {
            userService.trackAppOpen();
        }
    }, [token]);

    return <MainNavigation />;
}

export default function App() {
    // const handleError = useCallback((error: Error) => {
    //     console.warn('App Error Boundary caught:', error.message);
    // }, []);

    return (
        <Provider store={store}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                {/* <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onError={handleError}
            > */}
                <SafeAreaProvider>
                    <CartProvider>
                        <NavigationContainer ref={navigationRef}>
                            <AppContent />
                        </NavigationContainer>
                    </CartProvider>
                </SafeAreaProvider>
                {/* </ErrorBoundary> */}
            </GestureHandlerRootView>
        </Provider>
    );
}

const errorStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FCF9F8',
        padding: 32,
    },
    emoji: { fontSize: 48, marginBottom: 16 },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1C1B1B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#4D4638',
        marginBottom: 32,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#B29146',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});