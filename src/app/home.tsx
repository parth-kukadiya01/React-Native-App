import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    Platform,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import BottomNav from '../components/BottomNav';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';

// Static mock data removed

import { productService } from '../services/productService';
import { favoriteService } from '../services/favoriteService';
import { recentlyViewedService } from '../services/recentlyViewedService';
import { getImageUrl } from '../constants/api';

import { bannerService } from '../services/bannerService';

export default function HomeScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { width, isTablet, isDesktop, columns } = useResponsive();
    const [activeCategory, setActiveCategory] = useState(1);
    const [activeTab, setActiveTab] = useState('Home');
    const [newArrivals, setNewArrivals] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const { cartCount, updateCartCount } = useCart();
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            updateCartCount();
            loadRecentlyViewed();
        }, [])
    );

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoading(true);
                // Use allSettled so one failure doesn't break everything
                const [arrivalsRes, categoriesRes, bannersRes] = await Promise.allSettled([
                    productService.getNewArrivals(6),
                    productService.getCategories(),
                    bannerService.getBanners()
                ]);

                if (arrivalsRes.status === 'fulfilled') {
                    setNewArrivals(arrivalsRes.value?.data?.data || []);
                }
                if (categoriesRes.status === 'fulfilled') {
                    setCategories(categoriesRes.value?.data?.data || []);
                }
                if (bannersRes.status === 'fulfilled') {
                    setBanners(bannersRes.value?.data?.data || []);
                }
            } catch (error) {
                // Silently handle — API interceptor handles auth redirects
            } finally {
                setLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    const loadRecentlyViewed = async () => {
        try {
            const res = await recentlyViewedService.getRecentlyViewed(10);
            if (res.data?.success) {
                setRecentlyViewed(res.data.data?.products || []);
            }
        } catch (e: any) {
            console.log('Recently viewed error:', e?.response?.data || e.message);
        }
    };

    // Auto-scroll logic for Hero Carousel

    const onHeroScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        if (roundIndex !== currentHeroIndex) {
            setCurrentHeroIndex(roundIndex);
        }
    };

    // Map icon name strings from DB to MaterialIcons names
    const getIconName = (iconStr: string): string => {
        const iconMap: Record<string, string> = {
            'diamond': 'diamond',
            'blur-circular': 'blur-circular',
            'layers': 'layers',
            'diamond-plus': 'diamond',
            'filter-vintage': 'filter-vintage',
            'link': 'link',
        };
        return iconMap[iconStr] || 'category';
    };

    const toggleFavorite = async (id: string) => {
        // Find item in either list to check status (prefer newArrivals if in both, just for reference)
        const item = newArrivals.find((p: any) => (p._id || p.id) === id) ||
            recentlyViewed.find((p: any) => (p._id || p.id) === id);

        if (!item) return;

        try {
            if (item.isFavorite) {
                await favoriteService.removeFavorite(id);
            } else {
                await favoriteService.addFavorite(id);
            }

            // Update New Arrivals state
            setNewArrivals(current =>
                current.map((p: any) =>
                    (p._id || p.id) === id ? { ...p, isFavorite: !p.isFavorite } : p
                )
            );

            // Update Recently Viewed state
            setRecentlyViewed(current =>
                current.map((p: any) =>
                    (p._id || p.id) === id ? { ...p, isFavorite: !p.isFavorite } : p
                )
            );
        } catch (error: any) {
            // Handle "already in favorites" case gracefully (400 or specific message)
            const isAlreadyFav = error?.response?.status === 400 || error?.response?.data?.error === 'Product already in favorites';
            if (isAlreadyFav) {
                // Ensure it's marked as favorite in both lists
                setNewArrivals(current =>
                    current.map((p: any) =>
                        (p._id || p.id) === id ? { ...p, isFavorite: true } : p
                    )
                );
                setRecentlyViewed(current =>
                    current.map((p: any) =>
                        (p._id || p.id) === id ? { ...p, isFavorite: true } : p
                    )
                );
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background radial-like gradient approximation */}
            {/* Background radial-like gradient approximation */}
            <LinearGradient
                colors={Colors.gradient}
                locations={Colors.locations}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header */}
            <GlassView blurType="light" blurAmount={80} style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.navigate('profile' as any)}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmYvC62LstT5Ho5pBcRjIiD_AxipO6HhqLcSMQeJ2uHa6XvKnzZnJ4BJbXnGruYjLa2MWTYuVH2rdzHrfGp0YTZT2gvHg_vZ8Ctxd7HRIFoO1XeYxejhUkSc87ay0WEqYIF_CyIJvaGD33hrq86GxSKFga3qgeepv-Mr1zEQbnJSptOY20C07PiR4n4VIi-W-NMf7eFTJ1DZjil7GBMnchOgBS5eXLsMoMDoOeSWpR8B__6rRTykuwsFfG50Bg8XRcN5x8zLwEeEA' }}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.portalText}>SV GOLD</Text>
                        <Text style={styles.brandText}>Wholesale Portal</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('search' as any)}>
                        <Icon name="search" size={24} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('notifications' as any)}>
                        <Icon name="notifications-none" size={24} color="#475569" />
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                </View>
            </GlassView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Hero Section Carousel */}
                <View style={styles.heroSection}>
                    {banners.length > 0 ? (
                        <>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={onHeroScroll}
                                scrollEventThrottle={16}
                            >
                                {banners.map((banner: any, index: number) => (
                                    <View key={banner._id || index} style={[styles.heroCard, { width: width - 32, marginRight: 0, height: isTablet ? 320 : isDesktop ? 400 : 250 }]}>
                                        <Image
                                            source={{ uri: getImageUrl(banner.image) }}
                                            style={styles.heroImage}
                                            resizeMode="cover"
                                        />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                                            style={styles.heroOverlay}
                                        >
                                            {banner.tag && (
                                                <View style={styles.heroTagContainer}>
                                                    <View style={styles.heroDot} />
                                                    <Text style={styles.heroTag}>{banner.tag}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.heroTitle}>
                                                {banner.title}
                                            </Text>
                                            {banner.subtitle && (
                                                <Text style={styles.heroSubtitle}>{banner.subtitle}</Text>
                                            )}
                                        </LinearGradient>
                                    </View>
                                ))}
                            </ScrollView>
                            {/* Pagination Dots */}
                            <View style={styles.paginationContainer}>
                                {banners.map((_: any, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.paginationDot,
                                            {
                                                height: currentHeroIndex === index ? 24 : 6,
                                                backgroundColor: currentHeroIndex === index ? '#fff' : 'rgba(255,255,255,0.4)'
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                        </>
                    ) : (
                        // Fallback static banner if no API banners
                        <View style={styles.heroCard}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2938&auto=format&fit=crop' }}
                                style={styles.heroImage}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.heroOverlay}
                            >
                                <View style={styles.heroTagContainer}>
                                    <View style={styles.heroDot} />
                                    <Text style={styles.heroTag}>NEW COLLECTION</Text>
                                </View>
                                <Text style={styles.heroTitle}>Exquisite<Text style={{ fontWeight: 'bold' }}> Gold</Text></Text>
                                <Text style={styles.heroSubtitle}>DISCOVER TIMELESS ELEGANCE</Text>
                            </LinearGradient>
                        </View>
                    )}
                </View>

                {/* Categories */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PRODUCT CATEGORIES</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                    >
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[styles.categoryPill, activeCategory === cat._id && styles.activeCategoryPill]}
                                onPress={() => navigation.navigate('catalog' as any, { categoryId: cat._id, categoryName: cat.name })}
                            >
                                <View style={[styles.categoryIconContainer, activeCategory === cat._id && styles.activeCategoryIconContainer]}>
                                    <Icon
                                        name={getIconName(cat.icon) as any}
                                        size={24}
                                        color={activeCategory === cat._id ? '#fff' : '#64748b'}
                                    />
                                </View>
                                <Text style={[styles.categoryName, activeCategory === cat._id && styles.activeCategoryName]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* New Arrivals */}
                <View style={[styles.section, { marginBottom: 30 }]}>
                    <View style={styles.sectionHeaderLine}>
                        <View>
                            <Text style={styles.newArrivalsTitle}>New Arrivals</Text>
                            <View style={styles.newArrivalsUnderline} />
                        </View>
                        <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('catalog' as any)}>
                            <Text style={styles.seeAllText}>SEE ALL</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.newArrivalsContainer}
                    >
                        {newArrivals.map((item) => (
                            <View key={item._id || item.id} style={[styles.productCard, { width: (width - 32 - (columns * 12)) / columns }]}>
                                <View style={styles.productImageContainer}>
                                    <Image
                                        source={{ uri: getImageUrl(item.image || item.images?.[0]) }}
                                        style={styles.productImage}
                                    />
                                    <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item._id || item.id)}>
                                        <Icon
                                            name={item.isFavorite ? "favorite" : "favorite-border"}
                                            size={18}
                                            color={item.isFavorite ? "#f43f5e" : "#94a3b8"}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.productRef}>Ref: {item.ref || item.sku}</Text>

                                    <View style={styles.productDetails}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>NET WT</Text>
                                            <Text style={styles.detailValue}>{item.netWt || '—'}g</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>GROSS WT</Text>
                                            <Text style={styles.detailValue}>{item.grossWt || '—'}g</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.addToOrderButton}
                                        onPress={() => {
                                            recentlyViewedService.trackView(item._id || item.id).catch(() => { });
                                            navigation.navigate('product-details' as any, {
                                                id: item._id || item.id,
                                                name: item.name,
                                                ref: item.ref || item.sku,
                                                netWt: item.netWt,
                                                grossWt: item.grossWt,
                                                image: item.image || item.images?.[0]
                                            });
                                        }}
                                    >
                                        <Text style={styles.addToOrderText}>VIEW DETAILS</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Recently Viewed */}
                {recentlyViewed.length > 0 && (
                    <View style={[styles.section, { marginBottom: 30 }]}>
                        <View style={styles.sectionHeaderLine}>
                            <View>
                                <Text style={styles.newArrivalsTitle}>Recently Viewed</Text>
                                <View style={[styles.newArrivalsUnderline, { backgroundColor: '#f59e0b' }]} />
                            </View>
                            <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('catalog' as any)}>
                                <Text style={styles.seeAllText}>SEE ALL</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.newArrivalsContainer}
                        >
                            {recentlyViewed.map((item) => (
                                <View key={item._id || item.id} style={[styles.productCard, { width: (width - 32 - (columns * 12)) / columns }]}>
                                    <View style={styles.productImageContainer}>
                                        <Image
                                            source={{ uri: getImageUrl(item.image || item.images?.[0]) }}
                                            style={styles.productImage}
                                        />
                                        <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item._id || item.id)}>
                                            <Icon
                                                name={item.isFavorite ? "favorite" : "favorite-border"}
                                                size={18}
                                                color={item.isFavorite ? "#f43f5e" : "#94a3b8"}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.productRef}>Ref: {item.ref || item.sku}</Text>

                                        <View style={styles.productDetails}>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>NET WT</Text>
                                                <Text style={styles.detailValue}>{item.netWt || '—'}g</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>GROSS WT</Text>
                                                <Text style={styles.detailValue}>{item.grossWt || '—'}g</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.addToOrderButton}
                                            onPress={() => navigation.navigate('product-details' as any, {
                                                id: item._id || item.id,
                                                name: item.name,
                                                ref: item.ref || item.sku,
                                                netWt: item.netWt,
                                                grossWt: item.grossWt,
                                                image: item.image || item.images?.[0]
                                            })}
                                        >
                                            <Text style={styles.addToOrderText}>VIEW DETAILS</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Featured Selection */}
                <View style={[styles.section, { marginBottom: 100 }]}>
                    <View style={styles.featuredCard}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4EEVS0P0z80W6N5OvUzdFrzszG1sSQFQBUmGMaqrdsQlqHijdiANASStpG8PIp_tBAYULHJ2em5n0-w7lEfTkYqYw8SpFIsew5K3S1KmJrdkU8SMlhNmpCAQlz-MCpZxFOZvNTgCYuuPq3-O17_MNDeRfZX3kbNspLzPTa8idFREMZyshy7sMLXAC583HSPTJoMQ5OgZQJEgJKnyY8pLX2be-CxFc-1lEI4E_TKgHBMLTlIBkn0fODZmkh0JUQK0uZlROXQ9XEkQ' }}
                            style={styles.featuredImage}
                        />
                        <View style={styles.featuredContent}>
                            <View style={styles.featuredTagContainer}>
                                <Text style={styles.featuredTag}>FEATURED SELECTION</Text>
                            </View>
                            <Text style={styles.featuredTitle}>Bridal <Text style={{ fontWeight: 'bold' }}>Sets</Text></Text>
                            <Text style={styles.featuredSubtitle}>PREMIUM WHOLESALE PORTFOLIO</Text>
                        </View>
                        <GlassView blurType="light" blurAmount={50} style={styles.featureArrow}>
                            <Icon name="arrow-forward-ios" size={16} color="#1e293b" />
                        </GlassView>
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Navigation */}
            <BottomNav activeTab="Home" />
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
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.4)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profileImage: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    portalText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    brandText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fb7185', // rose-400
        borderWidth: 1,
        borderColor: 'white',
    },
    scrollContent: {
        paddingTop: 100, // Adjusted dynamically but kept as safe fallback
        paddingBottom: 100,
    },
    heroSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    heroCard: {
        borderRadius: 24,
        overflow: 'hidden',
        height: 250,
        backgroundColor: '#fff',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    heroImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: 24,
    },
    heroTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    heroDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
        marginRight: 8,
    },
    heroTag: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    heroTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    browseButton: {
        marginTop: 24,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        alignSelf: 'flex-start',
    },
    browseButtonText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        color: '#0f172a',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        flexDirection: 'column',
        gap: 8,
    },
    paginationDot: {
        width: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b', // slate-400
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    categoriesContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    categoryPill: {
        width: 76,
        height: 96,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    activeCategoryPill: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderColor: '#6366f1',
    },
    categoryIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    activeCategoryIconContainer: {
        backgroundColor: '#6366f1',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        borderColor: 'transparent',
    },
    categoryName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
    },
    activeCategoryName: {
        color: '#0f172a',
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    newArrivalsTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    newArrivalsUnderline: {
        width: 32,
        height: 4,
        backgroundColor: '#6366f1',
        borderRadius: 2,
        marginTop: 4,
    },
    seeAllButton: {
        backgroundColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    seeAllText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6366f1',
        letterSpacing: 1,
    },
    newArrivalsContainer: {
        paddingHorizontal: 16,
        gap: 20,
    },
    productCard: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    productImageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    productImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    productInfo: {
        paddingHorizontal: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    productRef: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 2,
    },
    productDetails: {
        marginTop: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 8,
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#334155',
    },
    addToOrderButton: {
        marginTop: 12,
        backgroundColor: '#0f172a',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    addToOrderText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    featuredCard: {
        marginHorizontal: 16,
        height: 160,
        borderRadius: 32,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        paddingHorizontal: 32,
        borderWidth: 1, // glass-card
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    featuredImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.25,
    },
    featuredContent: {
        zIndex: 1,
    },
    featuredTagContainer: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)', // yellow-500
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.2)',
    },
    featuredTag: {
        color: '#ca8a04', // yellow-600
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    featuredTitle: {
        fontSize: 24,
        fontWeight: '300',
        color: '#0f172a',
        marginBottom: 4,
    },
    featuredSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    featureArrow: {
        position: 'absolute',
        right: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.4)', // glass-panel
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },

});
