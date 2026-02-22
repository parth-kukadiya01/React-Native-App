import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,

    ActivityIndicator,
    RefreshControl,
    Platform,
    Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orderService } from '../services/orderService';
import { useCart } from '../context/CartContext';
import { storage } from '../services/storage';
import { API_BASE_URL } from '../constants/api';
import BottomNav from '../components/BottomNav';

const TABS = ['All', 'Processing', 'Shipment', 'Completed'];

interface Order {
    _id: string;
    orderId: string;
    status: string;
    totalNetWeight: number;
    totalGrossWeight: number;
    createdAt: string;
    items: any[];
}

export default function OrderHistoryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('All');
    const { updateCartCount } = useCart();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await orderService.getOrders({ limit: 50 });
            if (response.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        updateCartCount();
        fetchOrders();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, []);

    const handleDownloadInvoice = async (orderId: string) => {
        try {
            const token = await storage.getItem('userToken');
            if (!token) {
                Alert.alert('Error', 'You need to be logged in to view invoices');
                return;
            }

            const downloadDir = RNFS.CachesDirectoryPath;
            if (!downloadDir) {
                Alert.alert('Error', 'Storage not available on this device');
                return;
            }

            const fileUri = downloadDir + `/Invoice-${orderId}.pdf`;
            const downloadRes = await RNFS.downloadFile({
                fromUrl: `${API_BASE_URL}/orders/${orderId}/invoice`,
                toFile: fileUri,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).promise;

            if (downloadRes.statusCode === 200) {
                await Share.open({ url: `file://${fileUri}`, type: 'application/pdf' });
            } else {
                Alert.alert('Error', 'Failed to download invoice');
            }
        } catch (error) {
            console.error('Invoice download error:', error);
            Alert.alert('Error', 'Could not download invoice');
        }
    };

    const getFilteredOrders = () => {
        if (activeTab === 'All') return orders;
        if (activeTab === 'Processing') return orders.filter(o => ['PENDING', 'PROCESSING'].includes(o.status));
        if (activeTab === 'Shipment') return orders.filter(o => ['SHIPPED', 'SHIPMENT'].includes(o.status));
        if (activeTab === 'Completed') return orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));
        return orders;
    };

    const filteredOrders = getFilteredOrders();

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'PROCESSING':
            case 'PENDING':
                return {
                    label: 'Processing',
                    color: '#92400e', // amber-800
                    bg: 'rgba(251, 191, 36, 0.2)', // amber-400/20
                    icon: null
                };
            case 'SHIPMENT':
            case 'SHIPPED':
                return {
                    label: 'Shipment',
                    color: '#6366f1', // primary
                    bg: 'rgba(99, 102, 241, 0.2)', // primary/20
                    icon: 'local-shipping'
                };
            case 'COMPLETED':
            case 'DELIVERED':
                return {
                    label: 'Delivered',
                    color: '#059669', // emerald-600
                    bg: 'rgba(52, 211, 153, 0.2)', // emerald-400/20
                    icon: 'check-circle'
                };
            case 'CANCELLED':
                return {
                    label: 'Cancelled',
                    color: '#dc2626', // red-600
                    bg: 'rgba(248, 113, 113, 0.2)', // red-400/20
                    icon: 'cancel'
                };
            default:
                return {
                    label: status,
                    color: '#4b5563',
                    bg: 'rgba(156, 163, 175, 0.2)',
                    icon: null
                };
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <LinearGradient
                colors={['#FDE7F9', '#E3F2FD', '#F3E5F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />

            <GlassView blurType="light" blurAmount={80} style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        {/* <MaterialIcons name="arrow-back-ios" size={20} color="#334155" /> */}
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Order History</Text>
                    <TouchableOpacity style={styles.iconButton}>
                        {/* <MaterialIcons name="search" size={24} color="#334155" /> */}
                    </TouchableOpacity>
                </View>

                <View style={styles.tabsContainer}>
                    <View style={styles.tabsWrapper}>
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </GlassView>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                            <View key={order._id} style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>
                                        {activeTab === 'All' ? statusConfig.label : activeTab}
                                    </Text>
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countText}>Order #{order.orderId}</Text>
                                    </View>
                                </View>

                                <GlassView blurType="light" blurAmount={40} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.orderId}>Order #{order.orderId}</Text>
                                            <Text style={styles.orderDate}>Ordered {formatDate(order.createdAt)}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                                            {/* {statusConfig.icon && (
                                                // <MaterialIcons name={statusConfig.icon as any} size={12} color={statusConfig.color} style={{ marginRight: 4 }} />
                                            )} */}
                                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                                {statusConfig.label.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardStats}>
                                        <View style={styles.statCol}>
                                            <Text style={styles.statLabel}>Total Net Weight</Text>
                                            <Text style={styles.statValue}>{order.totalNetWeight}g</Text>
                                        </View>
                                        <View style={styles.statCol}>
                                            <Text style={styles.statLabel}>Total Gross Weight</Text>
                                            <Text style={styles.statValue}>{order.totalGrossWeight}g</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.itemsInfo}>
                                            <View style={styles.itemsIcon}>
                                                {/* <MaterialIcons name="inventory-2" size={16} color="#475569" /> */}
                                            </View>
                                            <Text style={styles.itemsText}>{order.items.length} Luxury Items</Text>
                                        </View>
                                        {/* <MaterialIcons name="chevron-right" size={20} color="#94a3b8" /> */}
                                    </View>

                                    {['SHIPMENT', 'SHIPPED', 'COMPLETED', 'DELIVERED'].includes(order.status) && (
                                        <View style={{ marginTop: 16 }}>
                                            <TouchableOpacity
                                                style={styles.invoiceButton}
                                                onPress={() => handleDownloadInvoice(order.orderId)}
                                            >
                                                {/* <MaterialIcons name="receipt-long" size={20} color="#1e293b" /> */}
                                                <Text style={styles.invoiceText}>View Digital Invoice</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </GlassView>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyState}>
                        {/* <MaterialIcons name="shopping-bag" size={48} color="#cbd5e1" /> */}
                        <Text style={styles.emptyText}>No orders found</Text>
                    </View>
                )}
            </ScrollView>

            <BottomNav activeTab="Orders" />
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
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 12,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    tabsWrapper: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    activeTabText: {
        color: '#0f172a',
        fontWeight: '700',
    },
    scrollContent: {
        paddingTop: 140,
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    countBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    countText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
    },
    card: {
        borderRadius: 24,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    orderDate: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardStats: {
        flexDirection: 'row',
        gap: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        marginBottom: 20,
    },
    statCol: {
        flex: 1,
        gap: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    itemsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemsIcon: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemsText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    invoiceButton: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    invoiceText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
    },
});
