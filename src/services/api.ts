import axios, { AxiosError } from 'axios';
import { storage } from './storage';
import { API_BASE_URL } from '../constants/api';

// Callback for unauthorized session events
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorizedCallback = (cb: () => void) => {
    onUnauthorized = cb;
};

// Debounce flag to prevent multiple simultaneous redirects
let isRedirecting = false;

const handleAuthError = async () => {
    if (isRedirecting) return;
    isRedirecting = true;

    try {
        await storage.deleteItem('userToken');
        await storage.deleteItem('userData');
        console.log('Session cleared - redirecting to login');
        if (onUnauthorized) {
            onUnauthorized();
        }
    } catch (storageError) {
        console.error('Error clearing storage:', storageError);
    }

    // Reset debounce after short delay
    setTimeout(() => {
        isRedirecting = false;
    }, 2000);
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 second timeout to prevent hanging
});

console.log('API base URL:', API_BASE_URL);

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await storage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            // Silently fail - don't crash the app
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for error handling and auto-redirect to login
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;

            // 401 Unauthorized → clear session & redirect to login
            // 403 Forbidden is removed from auto-logout to allow handling permission errors in UI
            if (status === 401) {
                console.warn(`Auth error (${status}) - clearing session`);
                await handleAuthError();
            }
        } else if (error.request) {
            // Network error - log but don't crash
            console.warn('Network error - server may be unreachable');
        }
        return Promise.reject(error);
    }
);

export default api;
