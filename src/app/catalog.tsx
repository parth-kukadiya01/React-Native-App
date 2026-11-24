import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { B2B } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { productService } from '../services/productService';
import { favoriteService } from '../services/favoriteService';
import { getImageUrl } from '../constants/api';
import { useResponsive } from '../hooks/useResponsive';
import BottomNav from '../components/BottomNav';

const { GOLD, GOLD_LIGHT, GOLD_DARK, NAVY, NAVY_CARD, NAVY_BORDER, NAVY_INPUT, TEXT_PRIMARY, TEXT_MUTED, GOLD_DIM, GOLD_BORDER, NAVY_MID } = B2B;

export default function CatalogScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { categoryId, categoryName, timestamp } = route.params || {};
    const { width } = useResponsive();
    const CARD_WIDTH = (width - 48) / 2;

    const [activeFilter, setActiveFilter] = useState('All');
    const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { cartCount, updateCartCount } = useCart();

    const [showRefine, setShowRefine] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    // Weight filter — stored as strings so TextInput works naturally
    const [minWeight, setMinWeight] = useState('');
    const [maxWeight, setMaxWeight] = useState('');

    const routeParamsRef = useRef(route.params);
    routeParamsRef.current = route.params;

    const sortRef = useRef({ sortBy, sortOrder });
    sortRef.current = { sortBy, sortOrder };
    const weightRef = useRef({ minWeight, maxWeight });
    weightRef.current = { minWeight, maxWeight };
    const isFetchingRef = useRef(false);

    const fetchProducts = useCallback(async (filterId: string | null, page: number = 1) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);

            const params: any = {
                sortBy: sortRef.current.sortBy,
                sortOrder: sortRef.current.sortOrder,
                page,
                limit: 20,
            };
            if (filterId) params.category = filterId;

            // Weight range — only send if user has entered a value
            const minVal = parseFloat(weightRef.current.minWeight);
            const maxVal = parseFloat(weightRef.current.maxWeight);
            if (!isNaN(minVal) && minVal > 0) params.minNetWt = minVal;
            if (!isNaN(maxVal) && maxVal > 0) params.maxNetWt = maxVal;

            const res = await productService.getProducts(params);
            const resData = res.data.data;
            const products = resData.products || [];
            const pages = resData.totalPages ?? resData.pagination?.totalPages ?? 1;

            setTotalPages(pages);
            setCurrentPage(page);
            if (page === 1) {
                setFilteredProducts(products);
            } else {
                setFilteredProducts(prev => [...prev, ...products]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            if (page === 1) setFilteredProducts([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, []);
    useFocusEffect(
        useCallback(() => {
            console.log("categoryId", categoryId);
            updateCartCount();
            const params: any = routeParamsRef.current || {};
            const catId: string | null = params.categoryId || activeFilterId || null;
            const catName: string = params.categoryName || 'All';
            setActiveFilterId(catId);
            setActiveFilter(catName);
            console.log("catId", catId);
            fetchProducts(catId, 1);
        }, [categoryId, sortBy, sortOrder])
    );

    // useEffect(() => {
    //     console.log("sortBy", sortBy);
    //     fetchProducts(activeFilterId);
    // }, [sortBy, sortOrder]);

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

    const handleFilterPress = (filterName: string, filterId: string | null) => {
        if (activeFilter !== filterName) {
            setActiveFilter(filterName);
            setActiveFilterId(filterId);
            fetchProducts(filterId, 1);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && !loading && currentPage < totalPages) {
            if (isSearchMode && searchQuery.trim()) {
                handleSearchPage(currentPage + 1);
            } else {
                fetchProducts(activeFilterId, currentPage + 1);
            }
        }
    };

    const handleSearchPage = async (page: number = 1) => {
        if (!searchQuery.trim()) return;
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);
            setCurrentPage(page);
            const res = await productService.getProducts({ search: searchQuery.trim(), limit: 20, page });
            const resData = res.data.data;
            const products = resData.products || [];
            const pages = resData.totalPages ?? resData.pagination?.totalPages ?? 1;
            setTotalPages(pages);
            setCurrentPage(page);
            if (page === 1) {
                setFilteredProducts(products);
            } else {
                setFilteredProducts(prev => [...prev, ...products]);
            }
        } catch (error: any) {
            console.error('Error searching products:', error);
            if (page === 1) setFilteredProducts([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
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
            setFilteredProducts(current =>
                current.map(p =>
                    (p._id || p.id) === productId
                        ? { ...p, isFavorite: !p.isFavorite }
                        : p
                )
            );
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to update favorite';
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
        // weightRef is already synced via state; re-fetch with current filterId
        fetchProducts(activeFilterId, 1);
    };

    const handleResetFilters = () => {
        setSortBy('createdAt');
        setSortOrder('desc');
        setMinWeight('');
        setMaxWeight('');
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setIsSearchMode(true);
        handleSearchPage(1);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearchMode(false);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        fetchProducts(activeFilterId, 1);
    };

    const handleSearchTextChange = (text: string) => {
        setSearchQuery(text);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!text.trim()) {
            setIsSearchMode(false);
            fetchProducts(activeFilterId, 1);
            return;
        }
        searchDebounceRef.current = setTimeout(() => {
            setIsSearchMode(true);
            handleSearchPage(1);
        }, 500);
    };

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.productCard, { width: CARD_WIDTH }]}
            onPress={() => navigation.navigate('product-details' as any, {
                id: item._id || item.id,
                ...item
            })}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: getImageUrl(item.image || item.images?.[0]) }}
                    style={styles.productImage}
                    resizeMode="cover"
                    resizeMethod="resize"
                />
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleToggleFavorite(item)}
                >
                    <Icon
                        name={item.isFavorite ? "favorite" : "favorite-border"}
                        size={18}
                        color={item.isFavorite ? GOLD : TEXT_MUTED}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item?.name?.toLowerCase() || ''}</Text>
                <Text style={styles.designText}>DESIGN NO. {item.designNumber || item.ref || 'N/A'}</Text>
                <Text style={styles.tagText}>TAG NO. {item.tagNumber || 'N/A'}</Text>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>NET WT</Text>
                    <Text style={styles.weightValue}>{item.netWt} GM</Text>
                </View>
                <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => navigation.navigate('product-details' as any, { id: item._id || item.id, ...item })}
                >
                    <Text style={styles.viewBtnText}>VIEW DETAILS</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={NAVY} />

            <LinearGradient
                colors={[NAVY, NAVY, NAVY, NAVY]}
                style={styles.background}
            />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.replace('home' as any)}>
                        <Icon name="arrow-back-ios" size={20} color={GOLD} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>COLLECTIONS</Text>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('cart' as any)}>
                        <Icon name="shopping-cart" size={20} color={GOLD} />
                        {cartCount > 0 && <View style={styles.badge} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.searchWrap}>
                    <View style={styles.searchBar}>
                        <Icon name="search" size={18} color={GOLD} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search masterpiece..."
                            placeholderTextColor={TEXT_MUTED}
                            value={searchQuery}
                            onChangeText={handleSearchTextChange}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                                <Icon name="close" size={16} color={TEXT_MUTED} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.refineBtn} onPress={() => setShowRefine(true)}>
                        <Icon name="tune" size={20} color={GOLD} />
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity
                        style={[styles.filterPill, activeFilter === 'All' && styles.filterPillActive]}
                        onPress={() => handleFilterPress('All', null)}
                    >
                        <Text style={[styles.filterText, activeFilter === 'All' && styles.filterTextActive]}>ALL</Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat._id}
                            style={[styles.filterPill, activeFilter === cat.name && styles.filterPillActive]}
                            onPress={() => handleFilterPress(cat.name, cat._id)}
                        >
                            <Text style={[styles.filterText, activeFilter === cat.name && styles.filterTextActive]}>{cat.name.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={GOLD} />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProduct}
                    keyExtractor={item => (item._id || item.id || '').toString()}
                    numColumns={2}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.resultsCount}>{filteredProducts.length} DESIGNS LOADED</Text>
                            <View style={styles.headerLine} />
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="search-off" size={60} color={NAVY_BORDER} />
                            <Text style={styles.emptyText}>No matches found</Text>
                        </View>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={GOLD} />
                                <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 6, fontWeight: '600' }}>Loading more...</Text>
                            </View>
                        ) : currentPage < totalPages ? (
                            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '600' }}>Scroll for more</Text>
                            </View>
                        ) : filteredProducts.length > 0 ? (
                            <></>
                        ) : null
                    }
                />
            )}

            <BottomNav activeTab="Catalog" />

            <Modal visible={showRefine} transparent animationType="slide" onRequestClose={() => setShowRefine(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>

                        {/* ── Header ── */}
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>REFINE RESULTS</Text>
                                <Text style={styles.modalSubtitle}>Sort & filter your collection</Text>
                            </View>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowRefine(false)}>
                                <Icon name="close" size={20} color={GOLD} />
                            </TouchableOpacity>
                        </View>

                        {/* ── Sort section ── */}
                        <Text style={styles.modalSub}>SORT BY PREFERENCE</Text>
                        <View style={styles.sortList}>
                            {[
                                { label: 'Newest First', value: 'createdAt', order: 'desc' },
                                { label: 'Weight: Low to High', value: 'netWt', order: 'asc' },
                                { label: 'Weight: High to Low', value: 'netWt', order: 'desc' },
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={`${opt.value}-${opt.order}`}
                                    style={[styles.sortOpt, sortBy === opt.value && sortOrder === opt.order && styles.sortOptActive]}
                                    onPress={() => { setSortBy(opt.value); setSortOrder(opt.order); }}
                                >
                                    <Text style={[styles.sortText, sortBy === opt.value && sortOrder === opt.order && styles.sortTextActive]}>{opt.label}</Text>
                                    {sortBy === opt.value && sortOrder === opt.order && <Icon name="check" size={18} color={NAVY} />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Input row */}
                        <View style={styles.weightInputRow}>
                            <View style={styles.weightInputWrap}>
                                <Text style={styles.weightInputLabel}>MIN</Text>
                                <View style={styles.weightInputBox}>
                                    <TextInput
                                        style={styles.weightInput}
                                        value={minWeight}
                                        onChangeText={v => setMinWeight(v.replace(/[^0-9.]/g, ''))}
                                        placeholder="0"
                                        placeholderTextColor={TEXT_MUTED}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                        maxLength={6}
                                    />
                                    <Text style={styles.weightUnit}>g</Text>
                                </View>
                            </View>

                            <View style={styles.weightDividerLine} />

                            <View style={styles.weightInputWrap}>
                                <Text style={styles.weightInputLabel}>MAX</Text>
                                <View style={styles.weightInputBox}>
                                    <TextInput
                                        style={styles.weightInput}
                                        value={maxWeight}
                                        onChangeText={v => setMaxWeight(v.replace(/[^0-9.]/g, ''))}
                                        placeholder="0"
                                        placeholderTextColor={TEXT_MUTED}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                        maxLength={6}
                                    />
                                    <Text style={styles.weightUnit}>g</Text>
                                </View>
                            </View>
                        </View>

                        {/* ── Footer buttons ── */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                                <Icon name="refresh" size={16} color={TEXT_MUTED} />
                                <Text style={styles.resetText}>RESET</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyRefine}>
                                <LinearGradient colors={[GOLD_DARK, GOLD, GOLD_LIGHT]} style={styles.applyGradient}>
                                    <Text style={styles.applyText}>APPLY FILTERS</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: NAVY },
    background: { ...StyleSheet.absoluteFillObject },
    header: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: NAVY_BORDER,
        paddingBottom: 15,
    },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 50 },
    headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: NAVY_CARD, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: NAVY_BORDER },
    headerTitle: { fontSize: 13, fontWeight: '900', color: GOLD, letterSpacing: 2 },
    badge: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#BA1A1A', borderWidth: 1, borderColor: NAVY },
    searchWrap: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 15 },
    searchBar: { flex: 1, height: 48, borderRadius: 14, backgroundColor: NAVY_INPUT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: NAVY_BORDER },
    searchInput: { flex: 1, marginLeft: 10, color: TEXT_PRIMARY, fontSize: 14, fontWeight: '500' },
    clearBtn: { padding: 4, marginLeft: 4 },
    refineBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: NAVY_CARD, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: NAVY_BORDER },
    filterScroll: { paddingHorizontal: 20, gap: 10, marginTop: 15 },
    filterPill: { paddingHorizontal: 18, height: 34, borderRadius: 12, backgroundColor: NAVY_CARD, borderWidth: 1, borderColor: NAVY_BORDER, justifyContent: 'center', alignItems: 'center' },
    filterPillActive: { backgroundColor: GOLD, borderColor: GOLD },
    filterText: { fontSize: 10, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1 },
    filterTextActive: { color: NAVY },
    listContent: { paddingHorizontal: 20, paddingTop: 20 },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 20 },
    productCard: { backgroundColor: NAVY_CARD, borderRadius: 24, padding: 10, borderWidth: 1, borderColor: NAVY_BORDER },
    imageContainer: { width: '100%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: NAVY_INPUT },
    productImage: { ...StyleSheet.absoluteFillObject },
    favoriteButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    productInfo: { padding: 8, },
    productName: { fontSize: 14, fontWeight: '500', color: TEXT_PRIMARY, textTransform: 'capitalize' },
    designText: { fontSize: 9, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 0.5 },
    tagText: { fontSize: 9, fontWeight: '900', color: '#B29146', letterSpacing: 0.5, marginTop: 2 },
    weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingVertical: 6, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: 'rgba(232,201,122,0.5)' },
    weightLabel: { fontSize: 8, fontWeight: '900', color: GOLD_LIGHT },
    weightValue: { fontSize: 11, fontWeight: '800', color: TEXT_PRIMARY },
    viewBtn: { height: 36, backgroundColor: 'rgba(232,201,122,0.08)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: 'rgba(232,201,122,0.2)' },
    viewBtnText: { color: GOLD, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    listHeader: { marginBottom: 20 },
    resultsCount: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 1.5 },
    headerLine: { height: 1, width: 30, backgroundColor: GOLD, marginTop: 4 },
    emptyState: { padding: 60, alignItems: 'center', gap: 15 },
    emptyText: { color: TEXT_MUTED, fontSize: 14, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(5,10,20,0.92)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: NAVY_CARD, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderWidth: 1, borderColor: NAVY_BORDER },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: NAVY_BORDER, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: NAVY_INPUT, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: NAVY_BORDER },
    modalTitle: { fontSize: 14, fontWeight: '900', color: GOLD, letterSpacing: 2 },
    modalSubtitle: { fontSize: 11, fontWeight: '500', color: TEXT_MUTED, marginTop: 3 },
    modalSub: { fontSize: 9, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1.5, marginBottom: 12 },
    sortList: { gap: 8, marginBottom: 28 },
    sortOpt: { height: 50, borderRadius: 14, backgroundColor: NAVY_INPUT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderWidth: 1, borderColor: NAVY_BORDER },
    sortOptActive: { backgroundColor: GOLD, borderColor: GOLD },
    sortText: { color: TEXT_PRIMARY, fontSize: 14, fontWeight: '600' },
    sortTextActive: { color: NAVY, fontWeight: '900' },
    // weight range
    weightRangeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GOLD_DIM, borderWidth: 1, borderColor: GOLD_BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start', marginBottom: 16 },
    weightRangeText: { fontSize: 13, fontWeight: '800', color: GOLD, letterSpacing: 0.5 },
    weightInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
    weightInputWrap: { flex: 1, gap: 6 },
    weightInputLabel: { fontSize: 9, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1.5 },
    weightInputBox: { height: 48, borderRadius: 14, backgroundColor: NAVY_INPUT, borderWidth: 1, borderColor: NAVY_BORDER, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    weightInput: { flex: 1, color: TEXT_PRIMARY, fontSize: 18, fontWeight: '500' },
    weightUnit: { fontSize: 13, fontWeight: '700', color: TEXT_MUTED },
    weightDividerLine: { width: 1, height: 54, backgroundColor: NAVY_BORDER },
    // footer
    modalFooter: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 54, paddingHorizontal: 18, borderRadius: 14, backgroundColor: NAVY_INPUT, borderWidth: 1, borderColor: NAVY_BORDER },
    resetText: { fontSize: 11, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 1 },
    applyBtn: { flex: 1, height: 54, borderRadius: 14, overflow: 'hidden', elevation: 8 },
    applyGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    applyText: { color: NAVY, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
