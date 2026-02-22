import api from './api';

export const notificationService = {
    /**
     * Register push token with backend
     * @param token Expo push token
     */
    registerPushToken: async (token: string) => {
        try {
            const response = await api.post('/notifications/push-token', { token });
            return response.data;
        } catch (error) {
            console.error('Error registering push token:', error);
            throw error;
        }
    },

    /**
     * Remove push token from backend (logout)
     * @param token Expo push token
     */
    removePushToken: async (token: string) => {
        try {
            const response = await api.delete('/notifications/push-token', { data: { token } });
            return response.data;
        } catch (error) {
            console.error('Error removing push token:', error);
            throw error;
        }
    },
};
