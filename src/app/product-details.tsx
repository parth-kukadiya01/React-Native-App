import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,

    Dimensions,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { cartService } from '../services/cartService';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { Alert, ActivityIndicator } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { getImageUrl } from '../constants/api';
import ImageView from "react-native-image-viewing";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MATERIALS = ['Yellow Gold', 'Rose Gold', 'White Gold'];
const PURITY = ['14k', '18k', '22k'];

const getDynamicSizes = (productName: string = ''): string[] => {
    const name = productName.toLowerCase();

    if (name.includes('bracelet') || name.includes('breslet') || name.includes('bangle') || name.includes('bangal')) {
        return ['6.5', '7', '7.5', '8'];
    }
    if (name.includes('necklace') || name.includes('nackless')) {
        return ['110', '111', '112', '113', '114', '115'];
    }
    if (name.includes('pendant') || name.includes('earring') || name.includes('pandal')) {
        return []; // No size for pendants or earrings
    }
    if (name.includes('chain')) {
        return ['18', '19', '20'];
    }
    if (name.includes('kadali')) {
        return ['2.2', '2.4', '2.6', '2.8', '2.10', '2.12', '2.14'];
    }
    // Default (Ring)
    return Array.from({ length: 34 }, (_, i) => (i + 3).toString());
};

const getDynamicSizeLabel = (productName: string = ''): string => {
    const name = productName.toLowerCase();
    if (name.includes('bracelet') || name.includes('breslet') || name.includes('bangle') || name.includes('bangal')) return 'BRACELET SIZE';
    if (name.includes('necklace') || name.includes('nackless')) return 'NECKLACE SIZE';
    if (name.includes('chain')) return 'CHAIN SIZE';
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
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const { updateCartCount } = useCart();

    // Image Viewer State
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
                // Try to infer string fallback from data, otherwise use standard 'Yellow Gold'
                let defaultMat = 'Yellow Gold';
                if (data.materials?.[0]) {
                    const matStr = data.materials[0].toLowerCase();
                    if (matStr.includes('rose')) defaultMat = 'Rose Gold';
                    else if (matStr.includes('white')) defaultMat = 'White Gold';
                }
                setSelectedMaterial(defaultMat);
                setSelectedPurity(data.availablePurity?.[0] || '18k');
                const dynamicSizes = getDynamicSizes(data?.name || name);
                setSelectedSize(data.availableSizes?.[0] || dynamicSizes[0] || '');
                setLoading(false);
                // Track this product view
                recentlyViewedService.trackView(id as string).catch(() => { });
            } catch (error: any) {
                console.error('Error fetching product details:', error);
                const msg = error.response?.data?.message || 'Failed to load product details';
                Alert.alert('Error', msg);
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        if (!id) {
            Alert.alert('Error', 'Product ID missing');
            return;
        }

        setAddingToCart(true);
        try {
            await cartService.addToCart(id as string, quantity);
            await updateCartCount();
            Alert.alert(
                'Success',
                'Product added to cart successfully',
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    { text: 'View Cart', onPress: () => navigation.navigate('cart' as any) }
                ]
            );
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to add to cart';
            Alert.alert('Error', message);
        } finally {
            setAddingToCart(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <LinearGradient
                colors={Colors.gradient}
                locations={Colors.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />

            <ScreenHeader
                showBack
                title="Product Detail"
                rightElement={
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="more-horiz" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                }
            />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#1e293b" />
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Image Gallery — Carousel & Zoom */}
                        <View style={styles.imageContainer}>
                            <GlassView blurType="light" blurAmount={30} style={styles.imageWrapper}>
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    snapToInterval={SCREEN_WIDTH - 64} // W - (24*2 container padding) - (8*2 wrapper padding)
                                    decelerationRate="fast"
                                    showsHorizontalScrollIndicator={false}
                                    onMomentumScrollEnd={(e) => {
                                        const newIndex = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 64));
                                        setActiveImageIndex(newIndex);
                                    }}
                                    contentContainerStyle={{ alignItems: 'center' }}
                                >
                                    {(product?.images && product.images.length > 0 ? product.images : [product?.image || image]).map((img: string, index: number) => (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.9}
                                            onPress={() => setIsVisible(true)}
                                            style={{ width: SCREEN_WIDTH - 64, height: SCREEN_WIDTH - 64, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(img) }}
                                                style={styles.productImage}
                                                resizeMode="contain"
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <View style={styles.paginationDots}>
                                    {(product?.images && product.images.length > 0 ? product.images : [image]).map((_: any, index: number) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                activeImageIndex === index && styles.activeDot
                                            ]}
                                        />
                                    ))}
                                </View>

                                <View style={styles.zoomHint}>
                                    <Icon name="fullscreen" size={14} color="#94a3b8" />
                                    <Text style={styles.zoomHintText}>Tap to zoom</Text>
                                </View>
                            </GlassView>
                        </View>

                        <ImageView
                            images={(product?.images && product.images.length > 0 ? product.images : [product?.image || image]).map((img: string) => ({ uri: getImageUrl(img) }))}
                            imageIndex={activeImageIndex}
                            visible={isVisible}
                            onRequestClose={() => setIsVisible(false)}
                            swipeToCloseEnabled={true}
                            doubleTapToZoomEnabled={true}
                            FooterComponent={({ imageIndex }) => (
                                <View style={styles.footerContainer}>
                                    <Text style={styles.footerText}>{`${imageIndex + 1} / ${(product?.images?.length || 1)}`}</Text>
                                </View>
                            )}
                        />

                        {/* Product Info */}
                        <View style={styles.infoSection}>
                            <View style={styles.badgeRow}>
                                <View style={styles.stockBadge}>
                                    <Text style={styles.stockText}>{product?.stockStatus || 'IN STOCK'}</Text>
                                </View>
                                {product?.sku || ref ? <Text style={styles.skuText}>REF: {product?.sku || ref}</Text> : null}
                            </View>
                            <Text style={styles.productTitle}>{product?.name || name}</Text>
                        </View>

                        {/* Details Tables */}
                        <View style={styles.detailsSection}>
                            <GlassView blurType="light" blurAmount={40} style={styles.detailsCard}>
                                <View style={styles.detailsHeader}>
                                    <Text style={styles.detailsHeaderText}>PRODUCT DETAILS</Text>
                                </View>
                                <View style={styles.detailsBody}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Metal Type</Text>
                                        <Text style={styles.detailValue}>{selectedMaterial || 'Gold'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Net Weight</Text>
                                        <Text style={styles.detailValue}>{product?.netWt || netWt} GM</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Gross Weight</Text>
                                        <Text style={styles.detailValue}>{product?.grossWt || grossWt} GM</Text>
                                    </View>
                                </View>

                                <View style={[styles.detailsHeader, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Text style={styles.detailsHeaderText}>DIAMOND DETAILS</Text>
                                </View>
                                <View style={styles.detailsBody}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Carat Weight</Text>
                                        <Text style={styles.detailValue}>{product?.diamondDetails?.caratWeight || '0.00 CT'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Clarity</Text>
                                        <Text style={styles.detailValue}>{product?.diamondDetails?.clarity || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Color Grade</Text>
                                        <Text style={styles.detailValue}>{product?.diamondDetails?.colorGrade || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Cut Grade</Text>
                                        <Text style={styles.detailValue}>{product?.diamondDetails?.cutGrade || 'N/A'}</Text>
                                    </View>
                                </View>
                            </GlassView>
                        </View>

                        {/* Selectors */}
                        <View style={styles.selectorsSection}>
                            {/* Material */}
                            <GlassView blurType="light" blurAmount={30} style={styles.selectorCard}>
                                <Text style={styles.selectorLabel}>MATERIAL</Text>
                                <View style={styles.selectorRow}>
                                    {MATERIALS.map((material: string) => (
                                        <TouchableOpacity
                                            key={material}
                                            style={[styles.selectorButton, selectedMaterial === material && styles.selectorButtonActive]}
                                            onPress={() => setSelectedMaterial(material)}
                                        >
                                            <Text style={[styles.selectorButtonText, selectedMaterial === material && styles.selectorButtonTextActive]}>
                                                {material.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </GlassView>

                            {/* Purity */}
                            <GlassView blurType="light" blurAmount={30} style={styles.selectorCard}>
                                <Text style={styles.selectorLabel}>PURITY</Text>
                                <View style={styles.selectorRow}>
                                    {(product?.availablePurity && product.availablePurity.length > 0 ? product.availablePurity : PURITY).map((purity: string) => (
                                        <TouchableOpacity
                                            key={purity}
                                            style={[styles.selectorButton, selectedPurity === purity && styles.selectorButtonActive]}
                                            onPress={() => setSelectedPurity(purity)}
                                        >
                                            <Text style={[styles.selectorButtonText, selectedPurity === purity && styles.selectorButtonTextActive]}>
                                                {purity.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </GlassView>

                            {/* Size */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeScroll}>
                                {(() => {
                                    const availableSizes = product?.availableSizes && product.availableSizes.length > 0 ? product.availableSizes : getDynamicSizes(product?.name || name);

                                    if (!availableSizes || availableSizes.length === 0) {
                                        return null; // Don't render sizes if there are none (like earrings/pendants)
                                    }

                                    return (
                                        <GlassView blurType="light" blurAmount={30} style={[styles.selectorCard, { width: '100%' }]}>
                                            <View style={styles.sizeHeader}>
                                                <Text style={styles.selectorLabel}>{getDynamicSizeLabel(product?.name || name)}</Text>
                                                <TouchableOpacity>
                                                    <Text style={styles.sizeGuideText}>SIZE GUIDE</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeScroll}>
                                                {availableSizes.map((size: string) => (
                                                    <TouchableOpacity
                                                        key={size}
                                                        style={[styles.sizeButton, selectedSize === size && styles.selectorButtonActive]}
                                                        onPress={() => setSelectedSize(size)}
                                                    >
                                                        <Text style={[styles.selectorButtonText, selectedSize === size && styles.selectorButtonTextActive]}>
                                                            {size}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </GlassView>
                                    );
                                })()}
                            </ScrollView>
                        </View>

                    </ScrollView>

                    {/* Bottom Action Bar */}
                    <View style={[styles.bottomBarContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                        <GlassView blurType="light" blurAmount={60} style={styles.bottomBar}>
                            <View style={styles.actionRow}>

                                <View style={styles.quantityControl}>
                                    <TouchableOpacity
                                        style={styles.quantityBtn}
                                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        <Icon name="remove" size={18} color="rgba(26, 26, 26, 0.6)" />
                                    </TouchableOpacity>
                                    <Text style={styles.quantityText}>{quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.quantityBtn}
                                        onPress={() => setQuantity(quantity + 1)}
                                    >
                                        <Icon name="add" size={18} color="rgba(26, 26, 26, 0.6)" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.addToCartBtn}
                                    onPress={handleAddToCart}
                                    disabled={addingToCart}
                                >
                                    <LinearGradient
                                        colors={['#1a1a1a', '#333333']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                        }}
                                    />
                                    {addingToCart ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Icon name="shopping-bag" size={20} color="rgba(255,255,255,0.8)" />
                                            <Text style={styles.addToCartText}>ADD TO CART</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                            </View>

                            <View style={styles.wholesaleBadge}>
                                <Icon name="verified" size={14} color="rgba(5, 150, 105, 0.7)" />
                                <Text style={styles.wholesaleText}>WHOLESALE STOCK CONFIRMED</Text>
                            </View>
                        </GlassView>
                    </View>
                </>
            )}
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
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    scrollContent: {
        paddingBottom: 140, // Space for bottom bar
        paddingTop: 16,
    },
    imageContainer: {
        paddingHorizontal: 24, // Matched with other sections
        marginBottom: 32,
    },
    imageWrapper: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 32, // 3xl
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24, // 2xl
    },
    zoomHint: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    zoomHintText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94a3b8',
    },
    paginationDots: {
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(26, 26, 26, 0.1)',
    },
    activeDot: {
        backgroundColor: '#1e293b',
        width: 24,
    },
    infoSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    stockBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    stockText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    skuText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    productTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: '#1e293b',
        letterSpacing: -1,
        lineHeight: 36,
    },
    selectorsSection: {
        paddingHorizontal: 24,
        gap: 20,
        marginBottom: 32,
    },
    selectorCard: {
        borderRadius: 24,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    selectorLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 2, // 0.2em
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    selectorRow: {
        flexDirection: 'row',
        gap: 8,
    },
    selectorButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 16, // xl
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
    },
    selectorButtonActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    selectorButtonText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 1, // widest
        textTransform: 'uppercase',
    },
    selectorButtonTextActive: {
        color: '#fff',
    },
    sizeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sizeGuideText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6366f1',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sizeScroll: {
        gap: 8,
    },
    sizeButton: {
        minWidth: 56,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsSection: {
        paddingHorizontal: 24,
        marginBottom: 32, // Added spacing between details and selectors
    },
    detailsCard: {
        borderRadius: 32, // 3xl
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
    },
    detailsHeader: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    detailsHeaderText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 2, // 0.2em
        textTransform: 'uppercase',
    },
    detailsBody: {
        padding: 24,
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    bottomBar: {
        borderRadius: 32,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 20, // 2xl
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 56,
    },
    quantityBtn: {
        width: 40,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        width: 24,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    addToCartBtn: {
        flex: 1,
        height: 56, // h-14
        borderRadius: 20, // 2xl
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        overflow: 'hidden', // for gradient
        backgroundColor: '#0f172a',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    addToCartText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2, // 0.2em
        textTransform: 'uppercase',
    },
    wholesaleBadge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        opacity: 0.6,
    },
    wholesaleText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#475569',
        letterSpacing: 1.5, // 0.15em
        textTransform: 'uppercase',
    },
    footerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40
    },
    footerText: {
        fontSize: 16,
        color: "#FFF",
        fontWeight: '600',
    },
});
