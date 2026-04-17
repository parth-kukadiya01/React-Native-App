import React, { useEffect, useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Provider } from 'react-redux';
import RNScreenshotPrevent from 'react-native-screenshot-prevent';
// import SplashScreen from 'react-native-splash-screen';
// import { ErrorBoundary } from 'react-error-boundary';

import { CartProvider } from './src/context/CartContext';
import { setOnUnauthorizedCallback } from './src/services/api';
import { storage } from './src/services/storage';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import SplashScreen from './src/app/SplashScreen';
import MainNavigation from './src/navigation/MainNavigator';
import { store } from './src/store';

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

    useEffect(() => {
        if (Platform.OS === 'android') {
            RNScreenshotPrevent.enabled(true);
        }
        if (Platform.OS === 'ios') {
            if (!__DEV__) RNScreenshotPrevent.enableSecureView();
        }

        return () => {
            if (Platform.OS === 'android') {
                RNScreenshotPrevent.enabled(false);
            }
            if (Platform.OS === 'ios') {
                if (!__DEV__) RNScreenshotPrevent.disableSecureView();
            }
        };
    }, []);

    useEffect(() => {
        setOnUnauthorizedCallback(() => {
            if (navigationRef.isReady()) {
                navigationRef.reset({
                    index: 0,
                    routes: [{ name: 'index' }],
                });
            }
        });
    }, []);

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
        backgroundColor: '#f8fafc',
        padding: 32,
    },
    emoji: { fontSize: 48, marginBottom: 16 },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 32,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});