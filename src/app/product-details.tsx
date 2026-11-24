import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    StatusBar,
    TextInput,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from '../components/Icon';
import MessageModal from '../components/MessageModal';
import CartToast from '../components/CartToast';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { B2B } from '../constants/Colors';
import { cartService } from '../services/cartService';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { getImageUrl } from '../constants/api';
import ImageView from "react-native-image-viewing";

const { GOLD, GOLD_LIGHT, GOLD_DARK, NAVY, NAVY_CARD, NAVY_BORDER, NAVY_INPUT, TEXT_PRIMARY, TEXT_MUTED, GOLD_DIM, GOLD_BORDER, NAVY_MID } = B2B;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MATERIALS = ['Yellow Gold', 'Rose Gold'];

const getDynamicSizes = (productName: string = '', categoryName: string = ''): string[] => {
    const name = (productName + ' ' + categoryName).toLowerCase();
    if (name.includes('bangle') || name.includes('bangal') || name.includes('kada') || name.includes('kangan')) {
        return ['2.2', '2.4', '2.5', '2.6', '2.8', '2.10', '2.11'];
    }
    if (name.includes('bracelet') || name.includes('breslet')) {
        return ['6.0', '6.5', '7.0', '7.5', '8.0'];
    }
    if (name.includes('necklace') || name.includes('nackless') || name.includes('choker')) {
        return ['14', '16', '18', '20', '22'];
    }
    if (name.includes('chain')) {
        return ['16', '18', '20', '22', '24'];
    }
    if (name.includes('kadali')) {
        return ['1.2', '1.4', '1.6', '1.8', '1.10'];
    }
    if (name.includes('pendant') || name.includes('earring') || name.includes('top') || name.includes('pandal')) {
        return [];
    }
    return Array.from({ length: 23 }, (_, i) => (i + 5).toString());
};

const getDynamicSizeLabel = (productName: string = '', categoryName: string = ''): string => {
    const name = (productName + ' ' + categoryName).toLowerCase();
    if (name.includes('bangle') || name.includes('bangal') || name.includes('kada') || name.includes('kankan') || name.includes('kangan')) return 'SIZE (INCHES)';
    if (name.includes('bracelet') || name.includes('breslet')) return 'BRACELET SIZE';
    if (name.includes('necklace') || name.includes('nackless') || name.includes('choker')) return 'LENGTH (INCHES)';
    if (name.includes('chain')) return 'CHAIN LENGTH';
    if (name.includes('kadali')) return 'KADALI SIZE';
    return 'RING SIZE';
};

export default function ProductDetailsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<any>();
    const { name, ref, netWt, grossWt, image, id } = route.params || {};
    const insets = useSafeAreaInsets();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [selectedPurity, setSelectedPurity] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [note, setNote] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    // Tracks whether the keyboard is currently open so we can move the
    // "Add to Cart" action bar from its fixed/sticky position (keyboard closed)
    // into the scrollable content, right below "Special Instructions"
    // (keyboard open) — this way it's never hidden behind the keyboard.
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Cart Toast state (replaces the 'Added to Cart' popup)
    const [showCartToast, setShowCartToast] = useState(false);

    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
        onClose?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });

    const { cartCount, updateCartCount } = useCart();

    const [isVisible, setIsVisible] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await productService.getProductDetails(id as string);
                const data = res.data.data;
                setProduct(data);

                let defaultMat = 'Yellow Gold';
                if (data.materials?.[0]) {
                    const matStr = data.materials[0].toLowerCase();
                    if (matStr.includes('rose')) defaultMat = 'Rose Gold';
                }
                setSelectedMaterial(defaultMat);

                const apiPurity = data.materials?.[0] || '';
                const purityList: string[] = data.availablePurity || [];
                const matchedPurity = purityList.find(
                    (p: string) => p.toLowerCase() === apiPurity.toLowerCase()
                );
                setSelectedPurity(matchedPurity || purityList[0] || '18k');

                const dynamicSizes = getDynamicSizes(data?.name || name, data?.category?.name || '');
                const preselectedSize =
                    data.size ||
                    data.availableSizes?.[0] ||
                    dynamicSizes[0] ||
                    '';
                setSelectedSize(preselectedSize);
                setLoading(false);
                recentlyViewedService.trackView(id as string).catch(() => { });
            } catch (error: any) {
                console.error('Error fetching product details:', error);
                const msg = error.response?.data?.message || 'Failed to load product details';
                setModalConfig({ visible: true, title: 'Error', message: msg, type: 'error' });
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Listen for keyboard show/hide so we can reposition the action bar.
    // iOS: keyboardWillShow/Hide fire earlier and animate in sync with the keyboard.
    // Android: keyboardWillShow/Hide aren't reliably emitted, so we use Did* events.
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleAddToCart = async () => {
        if (!id) {
            setModalConfig({ visible: true, title: 'Error', message: 'Product ID missing', type: 'error' });
            return;
        }

        if (!selectedMaterial) {
            setModalConfig({ visible: true, title: 'Selection Required', message: 'Please select a Material Finish (Yellow Gold or Rose Gold) before adding to cart.', type: 'info' });
            return;
        }
        if (!selectedPurity) {
            setModalConfig({ visible: true, title: 'Selection Required', message: 'Please select a Gold Purity (e.g. 18K, 22K) before adding to cart.', type: 'info' });
            return;
        }
        const applicableSizes = getDynamicSizes(product?.name || name, product?.category?.name || '');
        if (applicableSizes.length > 0 && !selectedSize) {
            setModalConfig({ visible: true, title: 'Selection Required', message: `Please select a ${getDynamicSizeLabel(product?.name || name, product?.category?.name || '')} before adding to cart.`, type: 'info' });
            return;
        }

        setAddingToCart(true);
        try {
            await cartService.addToCart(id as string, quantity, {
                material: selectedMaterial,
                purity: selectedPurity,
                size: selectedSize,
                note: note.trim()
            });
            await updateCartCount();
            // Show non-blocking toast instead of a blocking popup
            setShowCartToast(true);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to add to cart';
            setModalConfig({ visible: true, title: 'Error', message: message, type: 'error' });
        } finally {
            setAddingToCart(false);
        }
    };

    const productImages = product?.images && product.images.length > 0 ? product.images : [image];

    // Shared action bar markup, reused both inline (keyboard open) and sticky (keyboard closed).
    const actionBar = (
        <View style={styles.actionBar}>
            <View style={styles.qtyBox}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                    <Icon name="remove" size={16} color={GOLD} />
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                    <Icon name="add" size={16} color={GOLD} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleAddToCart}
                disabled={addingToCart}
            >
                <LinearGradient
                    colors={[GOLD_DARK, GOLD, GOLD_DARK]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
                {addingToCart ? (
                    <ActivityIndicator color={NAVY} />
                ) : (
                    <>
                        <Icon name="add-shopping-cart" size={20} color={NAVY} />
                        <Text style={styles.btnText}>ADD TO CART</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
            <StatusBar barStyle="dark-content" backgroundColor={NAVY} />

            <LinearGradient
                colors={[NAVY, NAVY, NAVY, NAVY]}
                style={styles.background}
            />

            <MessageModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                    if (modalConfig.onClose) modalConfig.onClose();
                }}
            />

            {/* Non-blocking Cart Toast */}
            <CartToast
                visible={showCartToast}
                cartCount={cartCount}
                onViewCart={() => navigation.navigate('cart' as any)}
                onDismiss={() => setShowCartToast(false)}
            />

            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back-ios" size={20} color={GOLD} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PRODUCT PROFILE</Text>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={GOLD} />
                    <Text style={styles.loaderText}>Retrieving Specifications...</Text>
                </View>
            ) : (
                <>
                    {/*
                     * KeyboardAvoidingView: On iOS, behavior="padding" pushes the KAV's
                     * content up by the keyboard height. keyboardVerticalOffset accounts
                     * for the fixed header (approx 56px) + safe-area top inset.
                     * On Android, windowSoftInputMode=adjustResize (set in AndroidManifest)
                     * already resizes the window, so behavior="height" trims the KAV height
                     * to the remaining space without causing a double-shift.
                     */}
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Image Showcase */}
                            <View style={styles.imageContainer}>
                                <View style={styles.imageCard}>
                                    <ScrollView
                                        horizontal
                                        pagingEnabled
                                        snapToInterval={SCREEN_WIDTH - 40}
                                        decelerationRate="fast"
                                        showsHorizontalScrollIndicator={false}
                                        onMomentumScrollEnd={(e) => {
                                            const newIndex = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40));
                                            setActiveImageIndex(newIndex);
                                        }}
                                    >
                                        {productImages.map((img: string, index: number) => (
                                            <TouchableOpacity
                                                key={index}
                                                activeOpacity={0.9}
                                                onPress={() => setIsVisible(true)}
                                                style={styles.imageTouch}
                                            >
                                                <Image
                                                    source={{ uri: getImageUrl(img) }}
                                                    style={styles.mainImage}
                                                    resizeMode="contain"
                                                    resizeMethod="resize"
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <View style={styles.paginationRow}>
                                        {productImages.map((_: any, index: number) => (
                                            <View key={index} style={[styles.dot, activeImageIndex === index && styles.activeDot]} />
                                        ))}
                                    </View>

                                    <TouchableOpacity style={styles.zoomAffordance} onPress={() => setIsVisible(true)}>
                                        <Icon name="fullscreen" size={20} color={GOLD} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <ImageView
                                images={productImages.map((img: string) => ({ uri: getImageUrl(img) }))}
                                imageIndex={activeImageIndex}
                                visible={isVisible}
                                onRequestClose={() => setIsVisible(false)}
                                doubleTapToZoomEnabled={false}
                            />

                            {/* Title, Design Number & Tag Number Area */}
                            <View style={styles.metaRow}>
                                <View style={styles.titleCol}>
                                    <Text style={styles.productName}>{product?.name?.toLowerCase() || name?.toLowerCase() || ''}</Text>
                                    <View style={styles.identifierRow}>
                                        <View style={styles.refBadge}>
                                            <Text style={styles.refLabel}>DESIGN NO.</Text>
                                            <Text style={styles.refText}>{product?.designNumber || ref || 'N/A'}</Text>
                                        </View>
                                        <View style={[styles.refBadge, styles.tagBadge]}>
                                            <Text style={styles.refLabel}>TAG NO.</Text>
                                            <Text style={styles.refText}>{product?.tagNumber || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.stockStatus}>
                                    <View style={styles.pulse} />
                                    <Text style={styles.stockLabel}>LIVE STOCK</Text>
                                </View>
                            </View>

                            {/* Technical Specifications */}
                            <View style={styles.specSection}>
                                <Text style={styles.sectionLabel}>Product Specifications</Text>
                                <View style={styles.specGrid}>
                                    <View style={styles.specCard}>
                                        <Text style={styles.specSmall}>NET WT</Text>
                                        <Text style={styles.specLarge}>{product?.netWt || netWt}g</Text>
                                    </View>
                                    <View style={styles.specCard}>
                                        <Text style={styles.specSmall}>GROSS WT</Text>
                                        <Text style={styles.specLarge}>{product?.grossWt || grossWt}g</Text>
                                    </View>
                                    <View style={styles.specCard}>
                                        <Text style={styles.specSmall}>PURITY</Text>
                                        <Text style={styles.specLarge}>{product?.materials?.[0] || '18K'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Configuration Selectors */}
                            <View style={styles.configSection}>
                                <Text style={styles.sectionLabel}>CUSTOMIZE SPECIFICATIONS</Text>

                                <View style={styles.configCard}>
                                    <Text style={styles.configTitle}>MATERIAL FINISH</Text>
                                    <View style={styles.optionsRow}>
                                        {MATERIALS.map(m => {
                                            const active = selectedMaterial === m;
                                            return (
                                                <TouchableOpacity
                                                    key={m}
                                                    style={[styles.optionBtn, active && styles.optionBtnActive]}
                                                    onPress={() => setSelectedMaterial(m)}
                                                >
                                                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{m.split(' ')[0]}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View style={styles.configCard}>
                                    <Text style={styles.configTitle}>GOLD PURITY</Text>
                                    <View style={styles.optionsRow}>
                                        {(product?.category?.name === 'Kadali'
                                            ? ['18k', '22k']
                                            : ['9k', '14k', '18k', '22k']
                                        ).map((p: string) => {
                                            const active = (selectedPurity || '').toLowerCase() === p.toLowerCase();
                                            return (
                                                <TouchableOpacity
                                                    key={p}
                                                    style={[styles.optionBtn, active && styles.optionBtnActive]}
                                                    onPress={() => setSelectedPurity(p)}
                                                >
                                                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{p.toUpperCase()}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {(() => {
                                    const sizes = getDynamicSizes(product?.name || name, product?.category?.name || '');
                                    if (sizes.length === 0) return null;
                                    return (
                                        <View style={styles.configCard}>
                                            <View style={styles.sizeHeader}>
                                                <Text style={styles.configTitle}>{getDynamicSizeLabel(product?.name || name, product?.category?.name || '')}</Text>
                                                <TouchableOpacity><Text style={styles.guideText}>SIZE GUIDE</Text></TouchableOpacity>
                                            </View>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeScroll}>
                                                {sizes.map(s => {
                                                    const active = selectedSize === s;
                                                    return (
                                                        <TouchableOpacity
                                                            key={s}
                                                            style={[styles.sizeBtn, active && styles.sizeBtnActive]}
                                                            onPress={() => setSelectedSize(s)}
                                                        >
                                                            <Text style={[styles.sizeText, active && styles.sizeTextActive]}>{s}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                    );
                                })()}

                                <View style={styles.configCard}>
                                    <Text style={styles.configTitle}>SPECIAL INSTRUCTIONS</Text>
                                    <TextInput
                                        style={styles.noteInput}
                                        placeholder="Add custom notes here..."
                                        placeholderTextColor={TEXT_MUTED}
                                        value={note}
                                        onChangeText={setNote}
                                        multiline
                                    />
                                </View>

                                {/* When the keyboard is open, the sticky bottom bar below the
                                    ScrollView gets covered by the keyboard on some devices, so we
                                    render the same action bar here instead — right below Special
                                    Instructions, inside the scrollable area, where it stays visible
                                    and scrolls into view naturally. */}
                                {keyboardVisible && (
                                    <View style={styles.inlineActionBarWrap}>
                                        {actionBar}
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Sticky Action Bar — only rendered while the keyboard is closed.
                            Sits naturally at the bottom, pushed above the keyboard by the KAV
                            when it does appear briefly during the show/hide transition. */}
                        {!keyboardVisible && (
                            <View style={styles.actionBarContainer}>
                                {actionBar}
                            </View>
                        )}
                    </KeyboardAvoidingView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: NAVY },
    background: { ...StyleSheet.absoluteFillObject },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: NAVY_CARD,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '900',
        color: GOLD,
        letterSpacing: 2,
        flex: 1,
        marginRight: 44
    },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
    loaderText: { color: GOLD_LIGHT, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    scrollContent: { paddingBottom: 12, marginBottom: 12 },
    imageContainer: { paddingHorizontal: 20, marginTop: 8 },
    imageCard: {
        width: '100%',
        aspectRatio: 0.8,
        backgroundColor: NAVY_CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#1C1B1B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    imageTouch: { width: SCREEN_WIDTH - 40, height: '100%', justifyContent: 'center', alignItems: 'center' },
    mainImage: { width: '85%', height: '85%' },
    paginationRow: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: { width: 6, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
    activeDot: { width: 20, backgroundColor: GOLD },
    zoomAffordance: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 16,
        alignItems: 'flex-start',
    },
    titleCol: { flex: 1, marginRight: 15 },
    productName: { fontSize: 22, fontWeight: '300', color: TEXT_PRIMARY, lineHeight: 30, letterSpacing: -0.5, textTransform: 'capitalize' },
    identifierRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
    refBadge: {
        backgroundColor: 'rgba(232,201,122,0.05)',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        alignSelf: 'flex-start',
        borderWidth: 0.5,
        borderColor: 'rgba(232,201,122,0.2)',
    },
    tagBadge: {
        backgroundColor: 'rgba(99,102,241,0.07)',
        borderColor: 'rgba(99,102,241,0.3)',
    },
    refLabel: { fontSize: 7, fontWeight: '900', color: GOLD, letterSpacing: 1, marginBottom: 2 },
    refText: { fontSize: 9, fontWeight: '600', color: TEXT_MUTED, letterSpacing: 1 },
    stockStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#765A13' },
    stockLabel: { fontSize: 10, fontWeight: '900', color: '#765A13', letterSpacing: 1 },
    specSection: { paddingHorizontal: 20, marginTop: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: GOLD, letterSpacing: 2, marginBottom: 12, marginLeft: 5 },
    specGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    specCard: {
        flex: 1,
        backgroundColor: NAVY_CARD,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
    },
    specSmall: { fontSize: 8, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1, marginBottom: 5 },
    specLarge: { fontSize: 15, fontWeight: '500', color: TEXT_PRIMARY },
    infoCard: { backgroundColor: NAVY_CARD, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: NAVY_BORDER },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    infoLabel: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 0.5 },
    infoValue: { fontSize: 11, fontWeight: '900', color: GOLD_LIGHT, letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: NAVY_BORDER, marginVertical: 12 },
    configSection: { paddingHorizontal: 20, marginTop: 16 },
    configCard: {
        backgroundColor: NAVY_CARD,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        marginBottom: 12,
    },
    configTitle: { fontSize: 10, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1, marginBottom: 12 },
    optionsRow: { flexDirection: 'row', gap: 10 },
    optionBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        backgroundColor: NAVY_INPUT,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionBtnActive: { backgroundColor: GOLD, borderColor: GOLD },
    optionText: { fontSize: 11, fontWeight: '800', color: TEXT_MUTED, letterSpacing: 1 },
    optionTextActive: { color: NAVY },
    sizeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    guideText: { fontSize: 10, fontWeight: '900', color: GOLD, letterSpacing: 1 },
    sizeScroll: { gap: 8 },
    sizeBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: NAVY_INPUT,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sizeBtnActive: { backgroundColor: GOLD, borderColor: GOLD },
    sizeText: { fontSize: 13, fontWeight: '800', color: TEXT_MUTED },
    sizeTextActive: { color: NAVY },
    noteInput: {
        height: 64,
        backgroundColor: NAVY_INPUT,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        color: TEXT_PRIMARY,
        fontSize: 13,
        padding: 10,
        paddingTop: 10,
        textAlignVertical: 'top',
    },
    // Inline (in-scroll) version of the action bar, shown only while the keyboard is open.
    inlineActionBarWrap: { marginTop: 0 },
    actionBarContainer: { paddingHorizontal: 20, backgroundColor: NAVY, paddingTop: 12 },
    barShadow: { position: 'absolute', top: -100, left: 0, right: 0, height: 100 },
    actionBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        gap: 8,
    },
    qtyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: NAVY_INPUT,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: NAVY_BORDER,
    },
    qtyBtn: { width: 36, height: 48, justifyContent: 'center', alignItems: 'center' },
    qtyVal: { width: 30, textAlign: 'center', color: TEXT_PRIMARY, fontSize: 16, fontWeight: '800' },
    primaryBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        overflow: 'hidden',
    },
    btnText: { color: NAVY, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    trustRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 15 },
    trustText: { fontSize: 8, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1 },
});