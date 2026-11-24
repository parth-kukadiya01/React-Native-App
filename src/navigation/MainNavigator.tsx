import { StyleSheet, AppState, AppStateStatus } from 'react-native';
import React, { useEffect, useRef } from 'react';
import SplashScreen from '../app/SplashScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { hydrateAuth, logoutUser } from '../store/slices/authSlice';
import { storage } from '../services/storage';

/** Decode a JWT and return the expiry epoch (seconds), or null if invalid. */
const getTokenExpiry = (token: string): number | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        // Base64url → Base64 → JSON
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = JSON.parse(atob(payload));
        return typeof json.exp === 'number' ? json.exp : null;
    } catch {
        return null;
    }
};

/** Returns true if the stored token is missing or past its expiry. */
const isTokenExpired = async (): Promise<boolean> => {
    const token = await storage.getItem('userToken');
    if (!token) return true;
    const exp = getTokenExpiry(token);
    if (exp === null) return false; // can't tell — let the server decide
    return Date.now() / 1000 >= exp;
};

const MainNavigation: React.FC = () => {
    const dispatch = useAppDispatch();
    const { token, isLoading } = useAppSelector((state) => state.auth);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        // Read token + user from AsyncStorage once on mount
        dispatch(hydrateAuth());
    }, [dispatch]);

    // Proactively check token expiry whenever app comes to foreground
    useEffect(() => {
        if (!token) return; // already logged out — nothing to check

        const checkExpiry = async () => {
            const expired = await isTokenExpired();
            if (expired) {
                console.log('Token expired — redirecting to login');
                dispatch(logoutUser());
            }
        };

        // Check immediately when this effect runs (token just set / app boot)
        checkExpiry();

        // Also check every time the app returns to the foreground
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;
            if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
                checkExpiry();
            }
        });

        return () => subscription.remove();
    }, [token, dispatch]);

    if (isLoading) {
        return <SplashScreen />;
    }

    return token ? <AppNavigator /> : <AuthNavigator />;
};

export default MainNavigation;

const styles = StyleSheet.create({});