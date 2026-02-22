import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    Modal,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { cartService } from '../services/cartService';
import { useCart } from '../context/CartContext';
import { Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../services/storage';
import ScreenHeader from '../components/ScreenHeader';
import { tpinService } from '../services/tpinService';

// Initial items removed to use backend data

export default function CartScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { updateCartCount } = useCart();
    const [quickAddSku, setQuickAddSku] = useState('');
    const [quickAddQty, setQuickAddQty] = useState('1');
    const [submitting, setSubmitting] = useState(false);

    // T-PIN state
    const [showTpinModal, setShowTpinModal] = useState(false);
    const [tpinMode, setTpinMode] = useState<'verify' | 'generate' | 'confirm'>('verify');
    const [tpinInput, setTpinInput] = useState('');
    const [tpinConfirm, setTpinConfirm] = useState('');
    const [tpinError, setTpinError] = useState('');
    const [tpinLoading, setTpinLoading] = useState(false);

    const fetchCart = async () => {
        const token = await storage.getItem('userToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await cartService.getCart();
            if (response.success) {
                setCartItems(response.data.items);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            // Alert.alert('Error', 'Failed to fetch cart');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchCart();
        }, [])
    );

    const updateQuantity = async (id: string, currentQty: number, delta: number) => {
        const newQty = Math.max(1, currentQty + delta);
        try {
            await cartService.updateCartItem(id, newQty);
            await updateCartCount();
            fetchCart(); // Refresh cart
        } catch (error) {
            Alert.alert('Error', 'Failed to update quantity');
        }
    };

    const removeItem = async (id: string) => {
        try {
            await cartService.removeCartItem(id);
            await updateCartCount();
            fetchCart(); // Refresh cart
        } catch (error) {
            Alert.alert('Error', 'Failed to remove item');
        }
    };

    const clearCart = async () => {
        try {
            await cartService.clearCart();
            await updateCartCount();
            fetchCart(); // Refresh cart
        } catch (error) {
            Alert.alert('Error', 'Failed to clear cart');
        }
    };

    // T-PIN: Start order flow — check status then show appropriate modal
    const handleSubmitOrder = async () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart before submitting.');
            return;
        }

        try {
            setTpinLoading(true);
            const statusRes = await tpinService.getStatus();
            const { hasTpin, isLocked, minutesLeft } = statusRes.data;

            if (isLocked) {
                Alert.alert('Account Locked', `Too many failed attempts. Try again in ${minutesLeft} minute(s).`);
                setTpinLoading(false);
                return;
            }

            setTpinInput('');
            setTpinConfirm('');
            setTpinError('');

            if (hasTpin) {
                setTpinMode('verify');
            } else {
                setTpinMode('generate');
            }
            setShowTpinModal(true);
        } catch (error) {
            Alert.alert('Error', 'Failed to check T-PIN status. Please try again.');
        } finally {
            setTpinLoading(false);
        }
    };

    // T-PIN: Generate new T-PIN
    const handleGenerateTpin = async () => {
        if (tpinInput.length !== 4) {
            setTpinError('T-PIN must be exactly 4 digits');
            return;
        }
        if (tpinMode === 'generate') {
            // Move to confirm step
            setTpinMode('confirm');
            setTpinConfirm('');
            setTpinError('');
            return;
        }
        // Confirm step
        if (tpinConfirm !== tpinInput) {
            setTpinError('T-PINs do not match. Please try again.');
            return;
        }
        try {
            setTpinLoading(true);
            await tpinService.generate(tpinInput);
            setTpinMode('verify');
            setTpinInput('');
            setTpinError('');
            Alert.alert('Success', 'T-PIN created! Now enter your T-PIN to place the order.');
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to create T-PIN';
            setTpinError(msg);
        } finally {
            setTpinLoading(false);
        }
    };

    // T-PIN: Verify and place order
    const handleVerifyAndOrder = async () => {
        if (tpinInput.length !== 4) {
            setTpinError('T-PIN must be exactly 4 digits');
            return;
        }
        try {
            setTpinLoading(true);
            setSubmitting(true);
            const response = await cartService.placeOrder(tpinInput);

            if (response.success) {
                setShowTpinModal(false);
                Alert.alert(
                    'Order Placed!',
                    `Your order #${response.data.orderId} has been submitted successfully.`,
                    [
                        {
                            text: 'View Orders',
                            onPress: () => {
                                updateCartCount();
                                fetchCart();
                                navigation.navigate('orders' as any);
                            }
                        },
                        {
                            text: 'OK',
                            onPress: () => {
                                updateCartCount();
                                fetchCart();
                            }
                        }
                    ]
                );
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to place order. Please try again.';
            setTpinError(msg);
        } finally {
            setTpinLoading(false);
            setSubmitting(false);
        }
    };

    // Dynamic weight computation based on actual cart items
    const weightBreakdown = useMemo(() => {
        let totalNetWt = 0;
        let totalGrossWt = 0;

        cartItems.forEach((item: any) => {
            const qty = item.quantity || 1;
            const netWt = parseFloat(item.product?.netWt) || 0;
            const grossWt = parseFloat(item.product?.grossWt) || 0;
            totalNetWt += netWt * qty;
            totalGrossWt += grossWt * qty;
        });

        return {
            totalNetWt: totalNetWt.toFixed(2),
            totalGrossWt: totalGrossWt.toFixed(2),
        };
    }, [cartItems]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Gradient simulating radial effects */}
            <LinearGradient
                colors={Colors.gradient}
                locations={Colors.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />

            <ScreenHeader
                showBack
                title="Bulk Order Cart"
                rightElement={
                    <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
                        <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Quick Add SKU */}
                <GlassView blurType="light" blurAmount={30} style={styles.card}>
                    <Text style={styles.cardLabel}>QUICK ADD SKU</Text>
                    <View style={styles.quickAddRow}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="SKU-99283"
                                placeholderTextColor="#94a3b8"
                                value={quickAddSku}
                                onChangeText={setQuickAddSku}
                            />
                        </View>
                        <View style={styles.qtyInputWrapper}>
                            <TextInput
                                style={[styles.input, styles.qtyInput]}
                                value={quickAddQty}
                                onChangeText={setQuickAddQty}
                                keyboardType="numeric"
                            />
                        </View>
                        <TouchableOpacity style={styles.addButton}>
                            <LinearGradient
                                colors={['#60a5fa', '#3b82f6', '#2563eb']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <Icon name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </GlassView>

                {/* Order Items Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Order Items ({cartItems.length})</Text>
                    {loading && <ActivityIndicator size="small" color="#6366f1" />}
                </View>

                {/* Order Items List */}
                <View style={styles.itemsList}>
                    {!loading && cartItems.length === 0 && (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Icon name="shopping-cart" size={64} color="#cbd5e1" />
                            <Text style={{ marginTop: 16, fontSize: 16, color: '#64748b' }}>Your cart is empty</Text>
                            <TouchableOpacity
                                style={{ marginTop: 24, padding: 12, backgroundColor: '#6366f1', borderRadius: 8 }}
                                onPress={() => navigation.navigate('home' as any)}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Browse Products</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {cartItems.map((item) => (
                        <GlassView key={item._id} blurType="light" blurAmount={30} style={styles.itemCard}>
                            <View style={styles.itemMain}>
                                <Image source={{ uri: item.product?.images?.[0] || 'https://lh3.googleusercontent.com/aida-public/placeholder' }} style={styles.itemImage} />
                                <View style={styles.itemInfo}>
                                    <View style={styles.itemHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName} numberOfLines={1}>{item.product?.name || 'Unknown Product'}</Text>
                                            <Text style={styles.itemSku}>{item.product?.sku || 'NO-SKU'}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item._id)}>
                                            <Icon name="close" size={20} color="#94a3b8" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.tagsRow}>
                                        <View style={[styles.tag, styles.tagBlue]}>
                                            <Text style={[styles.tagText, { color: '#2563eb' }]}>
                                                {item.purity || '18K'} {item.material || 'Yellow Gold'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.itemControls}>
                                <View style={styles.controlGroup}>
                                    <Text style={styles.controlLabel}>SIZE</Text>
                                    <View style={styles.dateDisplay}>
                                        <Text style={styles.dateText}>{item.size || 'N/A'}</Text>
                                    </View>
                                </View>
                                <View style={styles.controlGroup}>
                                    <Text style={[styles.controlLabel, { textAlign: 'right' }]}>QUANTITY</Text>
                                    <View style={styles.qtyControl}>
                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, item.quantity, -1)}>
                                            <Icon name="remove" size={16} color="#475569" />
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{item.quantity}</Text>
                                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, item.quantity, 1)}>
                                            <Icon name="add" size={16} color="#475569" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.itemWeights}>
                                <View style={styles.weightCol}>
                                    <Text style={styles.weightLabel}>NET WT.</Text>
                                    <Text style={styles.weightValue}>{(parseFloat(item.product?.netWt || '0') * (item.quantity || 1)).toFixed(2)}g</Text>
                                </View>
                                <View style={[styles.weightCol, styles.weightBorder]}>
                                    <Text style={styles.weightLabel}>GROSS WT.</Text>
                                    <Text style={styles.weightValue}>{(parseFloat(item.product?.grossWt || '0') * (item.quantity || 1)).toFixed(2)}g</Text>
                                </View>
                            </View>
                        </GlassView>
                    ))}
                </View>

                {/* Weight Breakdown */}
                <GlassView blurType="light" blurAmount={40} style={[styles.card, styles.breakdownCard]}>
                    <Text style={styles.breakdownTitle}>WEIGHT BREAKDOWN</Text>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>TOTAL NET WEIGHT</Text>
                        <Text style={styles.breakdownValue}>{weightBreakdown.totalNetWt} g</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>TOTAL GROSS WEIGHT</Text>
                        <Text style={styles.breakdownValue}>{weightBreakdown.totalGrossWt} g</Text>
                    </View>

                    <View style={styles.totalRow}>
                        <View>
                            <Text style={styles.totalLabel}>AGGREGATE TOTAL</Text>
                            <Text style={styles.totalSubLabel}>Gross Weight</Text>
                        </View>
                        <Text style={styles.totalValue}>{weightBreakdown.totalGrossWt} <Text style={styles.unitText}>g</Text></Text>
                    </View>
                </GlassView>

                {/* Info Card */}
                <GlassView blurType="light" blurAmount={30} style={styles.infoCard}>
                    <Icon name="info" size={20} color="#3b82f6" />
                    <Text style={styles.infoText}>
                        Estimated weights are provided for reference. Final verified gross weight and shipping documentation will be provided upon dispatch. Delivery dates are item-specific.
                    </Text>
                </GlassView>

            </ScrollView>

            {/* Bottom Bar */}
            <GlassView blurType="light" blurAmount={60} style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity
                    style={[styles.submitButton, (submitting || cartItems.length === 0) && { opacity: 0.7 }]}
                    onPress={handleSubmitOrder}
                    disabled={submitting || cartItems.length === 0}
                >
                    <LinearGradient
                        colors={['#60a5fa', '#3b82f6', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.submitText}>{submitting ? 'Placing Order...' : 'Submit Order Request'}</Text>
                    {/* {!submitting && <Icon name="send" size={20} color="white" />} */}
                    {submitting && <ActivityIndicator size="small" color="white" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
            </GlassView>

            {/* T-PIN Modal */}
            <Modal visible={showTpinModal} transparent animationType="fade" onRequestClose={() => setShowTpinModal(false)}>
                <View style={tpinStyles.overlay}>
                    <GlassView blurType="dark" blurAmount={40} style={tpinStyles.modalCard}>
                        <TouchableOpacity style={tpinStyles.closeBtn} onPress={() => setShowTpinModal(false)}>
                            <Icon name="close" size={24} color="#94a3b8" />
                        </TouchableOpacity>

                        <View style={tpinStyles.iconCircle}>
                            <Icon name={tpinMode === 'verify' ? 'lock' : 'vpn-key'} size={32} color="#3b82f6" />
                        </View>

                        <Text style={tpinStyles.title}>
                            {tpinMode === 'verify' ? 'Enter T-PIN' : tpinMode === 'generate' ? 'Create T-PIN' : 'Confirm T-PIN'}
                        </Text>
                        <Text style={tpinStyles.subtitle}>
                            {tpinMode === 'verify'
                                ? 'Enter your 4-digit T-PIN to place the order'
                                : tpinMode === 'generate'
                                    ? 'Create a 4-digit T-PIN for secure order placement'
                                    : 'Re-enter your T-PIN to confirm'}
                        </Text>

                        {tpinMode === 'confirm' ? (
                            <View style={tpinStyles.inputGroup}>
                                <Text style={tpinStyles.inputLabel}>Re-enter T-PIN</Text>
                                <TextInput
                                    style={tpinStyles.input}
                                    value={tpinConfirm}
                                    onChangeText={(t) => { setTpinConfirm(t.replace(/[^0-9]/g, '').slice(0, 4)); setTpinError(''); }}
                                    placeholder="● ● ● ●"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry
                                    autoFocus
                                    textAlign="center"
                                />
                            </View>
                        ) : (
                            <View style={tpinStyles.inputGroup}>
                                <Text style={tpinStyles.inputLabel}>
                                    {tpinMode === 'verify' ? 'Enter T-PIN' : 'Create 4-digit T-PIN'}
                                </Text>
                                <TextInput
                                    style={tpinStyles.input}
                                    value={tpinInput}
                                    onChangeText={(t) => { setTpinInput(t.replace(/[^0-9]/g, '').slice(0, 4)); setTpinError(''); }}
                                    placeholder="● ● ● ●"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry
                                    autoFocus
                                    textAlign="center"
                                />
                            </View>
                        )}

                        {!!tpinError && (
                            <View style={tpinStyles.errorRow}>
                                <Icon name="error-outline" size={16} color="#ef4444" />
                                <Text style={tpinStyles.errorText}>{tpinError}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[tpinStyles.actionBtn, tpinLoading && { opacity: 0.7 }]}
                            onPress={tpinMode === 'verify' ? handleVerifyAndOrder : handleGenerateTpin}
                            disabled={tpinLoading}
                        >
                            <LinearGradient
                                colors={['#60a5fa', '#3b82f6', '#2563eb']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            {tpinLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={tpinStyles.actionBtnText}>
                                    {tpinMode === 'verify' ? 'Verify & Place Order' : tpinMode === 'generate' ? 'Next' : 'Create T-PIN'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </GlassView>
                </View>
            </Modal>

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
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: -0.5,
    },
    clearButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    clearText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6366f1',
    },
    scrollContent: {
        paddingTop: 24,
        paddingBottom: 140,
        paddingHorizontal: 20,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
        marginBottom: 32,
        overflow: 'hidden',
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    quickAddRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputWrapper: {
        flex: 1,
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    qtyInputWrapper: {
        width: 72,
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        width: '100%',
    },
    qtyInput: {
        textAlign: 'center',
        fontWeight: '800',
    },
    addButton: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    itemsList: {
        gap: 20,
        marginBottom: 32,
    },
    itemCard: {
        borderRadius: 24,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        overflow: 'hidden',
    },
    itemMain: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    itemImage: {
        width: 72,
        height: 72,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    itemInfo: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    removeButton: {
        padding: 8,
        marginRight: -8,
        marginTop: -8,
        opacity: 0.6,
    },
    tagsRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    tagBlue: {
        backgroundColor: 'rgba(239, 246, 255, 0.6)',
        borderColor: 'rgba(219, 234, 254, 0.8)',
    },
    tagPink: {
        backgroundColor: 'rgba(253, 242, 248, 0.6)',
        borderColor: 'rgba(252, 231, 243, 0.8)',
    },
    tagSlate: {
        backgroundColor: 'rgba(248, 250, 252, 0.6)',
        borderColor: 'rgba(226, 232, 240, 0.8)',
    },
    tagText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemControls: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    controlGroup: {
        flex: 1,
        gap: 8,
    },
    controlLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dateDisplay: {
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 16,
    },
    qtyBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    qtyText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        width: 24,
        textAlign: 'center',
    },
    itemWeights: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.5)',
        paddingTop: 16,
    },
    weightCol: {
        flex: 1,
        gap: 4,
    },
    weightBorder: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.6)',
        paddingLeft: 20,
    },
    weightLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    weightValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    breakdownCard: {
        marginBottom: 32,
    },
    breakdownTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.6)',
        paddingBottom: 20,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    breakdownLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    breakdownValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    allowanceLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    allowanceText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366f1',
        textTransform: 'uppercase',
    },
    allowanceValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#6366f1',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.6)',
        paddingTop: 24,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    totalSubLabel: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        marginTop: 4,
    },
    totalValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0f172a',
    },
    unitText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#64748b',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 24,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        gap: 16,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        lineHeight: 20,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    submitButton: {
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

const tpinStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(59,130,246,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: 12,
        paddingHorizontal: 20,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 13,
        color: '#ef4444',
        fontWeight: '600',
    },
    actionBtn: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
});
