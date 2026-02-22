import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Modal,
    Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { productService } from '../services/productService';
import { favoriteService } from '../services/favoriteService';
import { getImageUrl } from '../constants/api';
import { useResponsive } from '../hooks/useResponsive';
import BottomNav from '../components/BottomNav';


export default function CatalogScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { categoryId, categoryName } = route.params || {};
    const { width } = useResponsive();
    const CARD_WIDTH = (width - 48) / 2;

    const [activeTab, setActiveTab] = useState('Catalog');
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { cartCount, updateCartCount } = useCart();

    // Refine modal state
    const [showRefine, setShowRefine] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    useFocusEffect(
        useCallback(() => {
            updateCartCount();
        }, [])
    );

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await productService.getCategories();
                setCategories(res.data.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (categoryId) {
            setActiveFilterId(categoryId as string);
            setActiveFilter((categoryName as string) || 'All');
        } else {
            setActiveFilterId(null);
            setActiveFilter('All');
        }
    }, [categoryId, categoryName]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const params: any = { sortBy, sortOrder };
                if (activeFilterId) {
                    params.category = activeFilterId;
                }
                const res = await productService.getProducts(params);
                const products = res.data.data.products || [];
                setFilteredProducts(products);
            } catch (error) {
                console.error('Error fetching products:', error);
                setFilteredProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [activeFilterId, sortBy, sortOrder]);

    const handleFilterPress = (filterName: string, filterId: string | null) => {
        if (activeFilter === filterName) {
            setActiveFilter('All');
            setActiveFilterId(null);
        } else {
            setActiveFilter(filterName);
            setActiveFilterId(filterId);
        }
    };

    const handleToggleFavorite = async (item: any) => {
        const productId = item._id || item.id;
        try {
            if (item.isFavorite) {
                await favoriteService.removeFavorite(productId);
            } else {
                await favoriteService.addFavorite(productId);
            }
            // Toggle local state for instant UI feedback
            setFilteredProducts(current =>
                current.map(p =>
                    (p._id || p.id) === productId
                        ? { ...p, isFavorite: !p.isFavorite }
                        : p
                )
            );
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Failed to update favorite';
            // If already in favorites (400), just toggle the UI
            if (error?.response?.status === 400 || msg === 'Product already in favorites') {
                setFilteredProducts(current =>
                    current.map(p =>
                        (p._id || p.id) === productId
                            ? { ...p, isFavorite: true }
                            : p
                    )
                );
            }
        }
    };

    const handleApplyRefine = () => {
        setShowRefine(false);
        // Refetch is triggered by sortBy/sortOrder useEffect
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            setLoading(true);
            const res = await productService.getProducts({ search: searchQuery });
            const products = res.data.data.products || [];
            setFilteredProducts(products);
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.productCard, { width: CARD_WIDTH }]}
            onPress={() => navigation.navigate('product-details' as any, {
                id: item._id || item.id,
                name: item.name,
                ref: item.ref || item.sku,
                netWt: item.netWt,
                grossWt: item.grossWt,
                image: item.image || item.images?.[0]
            })}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: getImageUrl(item.image || item.images?.[0]) }} style={styles.productImage} />

                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleToggleFavorite(item)}
                >
                    <Icon
                        name={item.isFavorite ? "favorite" : "favorite-border"}
                        size={18}
                        color={item.isFavorite ? "#f43f5e" : "#1e293b"}
                    />
                </TouchableOpacity>

                {item.stockStatus && item.stockStatus !== 'In Stock' && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.stockStatus}</Text>
                    </View>
                )}
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>

                <View style={styles.weightRow}>
                    <View style={styles.weightItem}>
                        <Text style={styles.weightLabel}>NET WT</Text>
                        <Text style={styles.weightValue}>{item.netWt}g</Text>
                    </View>
                    <View style={styles.weightItem}>
                        <Text style={styles.weightLabel}>GROSS WT</Text>
                        <Text style={styles.weightValue}>{item.grossWt}g</Text>
                    </View>
                </View>

                <View style={styles.materialRow}>
                    <View style={[styles.materialDot, { backgroundColor: '#f3d7d4' }]} />
                    <Text style={styles.materialText}>{item.materials?.[0] || 'Gold'}</Text>
                </View>

                <Text style={styles.skuText}>REF: {item.ref || item.sku}</Text>
            </View>
        </TouchableOpacity>
    );

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

            <GlassView blurType="light" blurAmount={40} style={[styles.header, { paddingTop: insets.top + 12 }]}>
                {/* Top Header Row */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back-ios" size={20} color="#1e293b" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>CATALOG</Text>

                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('cart' as any)}>
                        <Icon name="shopping-bag" size={20} color="#1e293b" />
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <View style={styles.searchIcon}>
                            <Icon name="search" size={20} color="#64748b" />
                        </View>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or SKU..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                style={{ paddingRight: 12 }}
                                onPress={() => {
                                    setSearchQuery('');
                                    setActiveFilterId(null);
                                    setActiveFilter('All');
                                }}
                            >
                                <Icon name="close" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    <TouchableOpacity
                        style={activeFilter === 'All' ? styles.filterButtonBlack : styles.filterButton}
                        onPress={() => handleFilterPress('All', null)}
                    >
                        <Text style={activeFilter === 'All' ? styles.filterTextWhite : styles.filterText}>ALL</Text>
                    </TouchableOpacity>

                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat._id}
                            style={activeFilter === cat.name ? styles.filterButtonBlack : styles.filterButton}
                            onPress={() => handleFilterPress(cat.name, cat._id)}
                        >
                            <Text style={activeFilter === cat.name ? styles.filterTextWhite : styles.filterText}>{cat.name.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </GlassView>

            {/* Main Content */}
            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#0f172a" />
                        <Text style={{ marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '600' }}>Loading products...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        renderItem={renderProduct}
                        keyExtractor={item => (item._id || item.id || '').toString()}
                        numColumns={2}
                        contentContainerStyle={styles.gridContent}
                        columnWrapperStyle={styles.gridColumn}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.collectionHeader}>
                                <View>
                                    <Text style={styles.collectionTag}>Collection 2024</Text>
                                    <Text style={styles.collectionTitle}>
                                        {activeFilter === 'All' ? 'All Products' : `${activeFilter}`}
                                    </Text>
                                    <Text style={styles.collectionSubtitle}>
                                        {filteredProducts.length} pieces available
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.refineButton} onPress={() => setShowRefine(true)}>
                                    <Icon name="tune" size={16} color="#0f172a" />
                                    <Text style={styles.refineText}>Refine</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 60 }}>
                                <Icon name="inventory-2" size={56} color="#cbd5e1" />
                                <Text style={{ marginTop: 16, color: '#64748b', fontSize: 16, fontWeight: '600' }}>No products found</Text>
                                <Text style={{ marginTop: 4, color: '#94a3b8', fontSize: 13 }}>Try adjusting your filters</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Bottom Navigation */}
            <BottomNav activeTab="Catalog" />

            {/* Refine Modal */}
            <Modal visible={showRefine} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <GlassView blurType="light" blurAmount={60} style={styles.refineModal}>
                        <View style={styles.refineModalHeader}>
                            <Text style={styles.refineModalTitle}>REFINE RESULTS</Text>
                            <TouchableOpacity onPress={() => setShowRefine(false)}>
                                <Icon name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.refineSection}>
                            <Text style={styles.refineSectionTitle}>SORT BY</Text>
                            {[
                                { label: 'Newest First', value: 'createdAt', order: 'desc' },
                                { label: 'Oldest First', value: 'createdAt', order: 'asc' },
                                { label: 'Net Weight ↑', value: 'netWt', order: 'asc' },
                                { label: 'Net Weight ↓', value: 'netWt', order: 'desc' },
                                { label: 'Gross Weight ↑', value: 'grossWt', order: 'asc' },
                                { label: 'Gross Weight ↓', value: 'grossWt', order: 'desc' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={`${option.value}-${option.order}`}
                                    style={[
                                        styles.refineOption,
                                        sortBy === option.value && sortOrder === option.order && styles.refineOptionActive,
                                    ]}
                                    onPress={() => {
                                        setSortBy(option.value);
                                        setSortOrder(option.order);
                                    }}
                                >
                                    <Text style={[
                                        styles.refineOptionText,
                                        sortBy === option.value && sortOrder === option.order && styles.refineOptionTextActive,
                                    ]}>{option.label}</Text>
                                    {/* {sortBy === option.value && sortOrder === option.order && (
                                        <Icon name="check" size={18} color="#fff" />
                                    )} */}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.applyButton} onPress={handleApplyRefine}>
                            <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
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
    header: {
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.6)',
        backgroundColor: 'rgba(255,255,255,0.4)',
        zIndex: 10,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
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
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: 2,
        flex: 1,
        textAlign: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fb7185',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    cartBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    searchIcon: {
        paddingLeft: 14,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 10,
        fontSize: 14,
        fontWeight: '500',
        color: '#0f172a',
    },
    filtersContainer: {
        paddingHorizontal: 20,
        paddingVertical: 4,
        gap: 8,
        paddingBottom: 8,
    },
    filterButtonBlack: {
        height: 34,
        paddingHorizontal: 18,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    filterTextWhite: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    filterButton: {
        height: 34,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterText: {
        color: '#334155',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    gridContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 140, // Increased bottom padding
    },
    collectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    collectionTag: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6366f1',
        letterSpacing: 2,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    collectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    collectionSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 4,
    },
    refineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    refineText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    gridColumn: {
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    productCard: {
        borderRadius: 20,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 0.9,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 10,
        backgroundColor: '#f8fafc',
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
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    badge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 247, 237, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    badgeText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#9a3412',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productInfo: {
        paddingHorizontal: 4,
        paddingTop: 2,
    },
    productName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
    },
    weightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        paddingVertical: 6,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    weightItem: {
        alignItems: 'center',
    },
    weightLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    weightValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
    },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    materialDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'white',
    },
    materialText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    skuText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },


    // Refine Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    refineModal: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.8)',
    },
    refineModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    refineModalTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 2,
    },
    refineSection: {
        marginBottom: 24,
    },
    refineSectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 2,
        marginBottom: 12,
    },
    refineOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 6,
        backgroundColor: 'rgba(241,245,249,0.8)',
    },
    refineOptionActive: {
        backgroundColor: '#0f172a',
    },
    refineOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    refineOptionTextActive: {
        color: '#fff',
    },
    applyButton: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
