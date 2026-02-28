import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
import { Colors } from '../constants/Colors';
import ScreenHeader from '../components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    isRead: boolean;
}

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.data.notifications);
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
            const msg = error.response?.data?.message || 'Failed to load notifications';
            // Optional: Alert.alert('Error', msg); 
            // Notifications often fail silently or show a Toast, but "show msg" implies user feedback.
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error: any) {
            console.error('Error marking as read:', error);
            const msg = error.response?.data?.message || 'Failed to update notification';
            Alert.alert('Error', msg);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ORDER': return 'local-shipping';
            case 'PROMOTION': return 'local-offer';
            case 'SYSTEM': return 'info';
            default: return 'notifications';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'ORDER': return '#10b981'; // emerald
            case 'PROMOTION': return '#f59e0b'; // amber
            case 'SYSTEM': return '#3b82f6'; // blue
            default: return '#6366f1'; // indigo
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <LinearGradient
                colors={Colors.gradient}
                locations={Colors.locations}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScreenHeader
                showBack
                title="Notifications"
                rightElement={
                    <TouchableOpacity style={styles.iconButton} onPress={fetchNotifications}>
                        <Icon name="refresh" size={24} color="#1e293b" />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 20 }} />
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="notifications-none" size={48} color="#94a3b8" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                ) : (
                    notifications.map((item) => (
                        <TouchableOpacity
                            key={item._id}
                            onPress={() => !item.isRead && handleMarkAsRead(item._id)}
                            activeOpacity={0.8}
                        >
                            <GlassView blurType="light" blurAmount={40} style={styles.card}>
                                <View style={[styles.iconContainer, { backgroundColor: `${getColor(item.type)}20` }]}>
                                    <Icon name={getIcon(item.type) as any} size={24} color={getColor(item.type)} />
                                </View>
                                <View style={styles.textContainer}>
                                    <View style={styles.row}>
                                        <Text style={styles.title}>{item.title}</Text>
                                        <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.message}>{item.message}</Text>
                                </View>
                                {!item.isRead && <View style={styles.dot} />}
                            </GlassView>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    content: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 40,
        // gap: 16,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        gap: 16,
        overflow: 'hidden',
        marginBottom: 16
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    time: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
    },
    message: {
        fontSize: 12,
        fontWeight: '500',
        color: '#475569',
        lineHeight: 18,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
    },
});
