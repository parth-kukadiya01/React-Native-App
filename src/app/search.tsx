import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,

    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import ScreenHeader from '../components/ScreenHeader';
import ProductCard from '../components/ProductCard';
import BottomNav from '../components/BottomNav';
import { useCart } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { productService } from '../services/productService';
import { favoriteService } from '../services/favoriteService';
import { storage } from '../services/storage';

const RECENT_SEARCHES_KEY = 'sv_gold_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export default function SearchScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { updateCartCount } = useCart();

    // State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-search when query changes (2+ chars)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length >= 2) {
            debounceRef.current = setTimeout(() => {
                performSearch(query.trim(), selectedCategory, sortBy, sortOrder);
            }, 400);
        } else if (query.trim().length === 0 && hasSearched) {
            setHasSearched(false);
            setResults([]);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // Load recent searches + categories + recommendations on mount
    useFocusEffect(
        useCallback(() => {
            updateCartCount();
            loadRecentSearches();
            loadCategories();
            loadRecommendations();
        }, [])
    );

    const loadRecentSearches = async () => {
        try {
            const stored = await storage.getItem(RECENT_SEARCHES_KEY);
            if (stored) setRecentSearches(JSON.parse(stored));
        } catch (e) {
            console.log('Error loading recent searches', e);
        }
    };

    const saveRecentSearch = async (term: string) => {
        try {
            const trimmed = term.trim();
            if (!trimmed) return;
            let updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)];
            if (updated.length > MAX_RECENT_SEARCHES) updated = updated.slice(0, MAX_RECENT_SEARCHES);
            setRecentSearches(updated);
            await storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (e) {
            console.log('Error saving recent search', e);
        }
    };

    const clearRecentSearches = async () => {
        setRecentSearches([]);
        await storage.deleteItem(RECENT_SEARCHES_KEY);
    };

    const loadCategories = async () => {
        try {
            const res = await productService.getCategories();
            if (res.data?.success) {
                setCategories(res.data.data || []);
            }
        } catch (e) {
            console.log('Error loading categories', e);
        }
    };

    const loadRecommendations = async () => {
        try {
            setLoadingRecommendations(true);
            const res = await productService.getNewArrivals(6);
            if (res.data?.success) {
                const products = res.data.data?.products || res.data.data || [];
                setRecommendations(products);
            }
        } catch (e) {
            console.log('Error loading recommendations', e);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const performSearch = async (term: string, catId?: string | null, currentSortBy?: string, currentSortOrder?: string, saveTerm = false) => {
        if (term.length < 2) return;

        setLoading(true);
        setHasSearched(true);
        if (saveTerm) saveRecentSearch(term);

        try {
            const params: any = {
                sortBy: currentSortBy || sortBy,
                sortOrder: currentSortOrder || sortOrder,
            };
            if (catId) params.category = catId;

            const res = await productService.searchProducts(term, params);
            if (res.data?.success) {
                setResults(res.data.data?.results || []);
            } else {
                setResults([]);
            }
        } catch (error: any) {
            console.log('Search error:', error?.response?.data || error.message);
            // Fallback: getProducts + client-side filter
            try {
                const fallbackRes = await productService.getProducts({
                    sortBy: currentSortBy || sortBy,
                    sortOrder: currentSortOrder || sortOrder,
                    category: catId || undefined,
                });
                if (fallbackRes.data?.success) {
                    const allProducts = fallbackRes.data.data?.products || [];
                    const filtered = allProducts.filter((p: any) =>
                        p.name?.toLowerCase().includes(term.toLowerCase()) ||
                        p.sku?.toLowerCase().includes(term.toLowerCase())
                    );
                    setResults(filtered);
                }
            } catch (fallbackErr) {
                setResults([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (searchQuery?: string) => {
        const term = (searchQuery || query).trim();
        if (term.length < 2) return;
        saveRecentSearch(term);
        performSearch(term, selectedCategory, sortBy, sortOrder, false);
    };

    const handleFilterByCategory = async (catId: string | null) => {
        setSelectedCategory(catId);
        const term = query.trim();
        if (term.length >= 2) {
            performSearch(term, catId, sortBy, sortOrder);
        } else if (catId) {
            // Browse by category without search query
            setLoading(true);
            setHasSearched(true);
            try {
                const res = await productService.getProducts({ category: catId, sortBy, sortOrder });
                if (res.data?.success) {
                    setResults(res.data.data?.products || []);
                }
            } catch (e) {
                setResults([]);
            } finally {
                setLoading(false);
            }
        } else {
            setHasSearched(false);
            setResults([]);
        }
    };

    const handleSortChange = (newSortBy: string, newSortOrder: string) => {
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setShowFilters(false);
        const term = query.trim();
        if (term.length >= 2) {
            performSearch(term, selectedCategory, newSortBy, newSortOrder);
        } else if (selectedCategory) {
            // Re-fetch category products with new sort
            setLoading(true);
            productService.getProducts({ category: selectedCategory, sortBy: newSortBy, sortOrder: newSortOrder })
                .then(res => {
                    if (res.data?.success) setResults(res.data.data?.products || []);
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    };

    const toggleFavorite = async (id: string) => {
        const item = results.find((p: any) => (p._id || p.id) === id);
        if (!item) return;

        try {
            if (item.isFavorite) {
                await favoriteService.removeFavorite(id);
            } else {
                await favoriteService.addFavorite(id);
            }
            setResults(current =>
                current.map((p: any) =>
                    (p._id || p.id) === id ? { ...p, isFavorite: !p.isFavorite } : p
                )
            );
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Failed to update favorite';
            if (error?.response?.status === 400 || msg === 'Product already in favorites') {
                // If it's already a favorite (400), just ensure UI reflects that
                setResults(current =>
                    current.map((p: any) =>
                        (p._id || p.id) === id ? { ...p, isFavorite: true } : p
                    )
                );
            } else if (error?.response?.status === 404) {
                // If favorite not found (404) on remove, ensure UI reflects it's removed
                setResults(current =>
                    current.map((p: any) =>
                        (p._id || p.id) === id ? { ...p, isFavorite: false } : p
                    )
                );
            } else {
                console.log('Favorite toggle error', error);
            }
        }
    };

    const renderProduct = ({ item }: { item: any }) => (
        <ProductCard
            item={item}
            onFavoritePress={() => toggleFavorite(item._id || item.id)}
        />
    );

    const selectedCategoryName = categories.find(c => (c._id || c.id) === selectedCategory)?.name;

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

            {/* Custom header with search bar */}
            <GlassView blurType="light" blurAmount={80} style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        {/* <MaterialIcons name="arrow-back-ios" size={20} color="#475569" style={{ marginLeft: 6 }} /> */}
                    </TouchableOpacity>

                    <View style={styles.searchBarContainer}>
                        {/* <MaterialIcons name="search" size={20} color="#94a3b8" /> */}
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products, SKU..."
                            placeholderTextColor="#94a3b8"
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={() => handleSearch()}
                            returnKeyType="search"
                            autoFocus
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => { setQuery(''); setHasSearched(false); setResults([]); }}>
                                {/* <MaterialIcons name="close" size={20} color="#94a3b8" /> */}
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
                        {/* <MaterialIcons name="tune" size={22} color={showFilters ? '#6366f1' : '#475569'} /> */}
                    </TouchableOpacity>
                </View>

                {/* Category filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContainer}
                >
                    <TouchableOpacity
                        style={[styles.chip, !selectedCategory && styles.activeChip]}
                        onPress={() => handleFilterByCategory(null)}
                    >
                        <Text style={[styles.chipText, !selectedCategory && styles.activeChipText]}>All</Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat._id || cat.id}
                            style={[styles.chip, selectedCategory === (cat._id || cat.id) && styles.activeChip]}
                            onPress={() => handleFilterByCategory(cat._id || cat.id)}
                        >
                            <Text style={[styles.chipText, selectedCategory === (cat._id || cat.id) && styles.activeChipText]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </GlassView>

            {/* Sort filter panel */}
            {showFilters && (
                <View style={[styles.filterPanel, { top: insets.top + 130 }]}>
                    <GlassView blurType="light" blurAmount={60} style={styles.filterPanelInner}>
                        <Text style={styles.filterTitle}>SORT BY</Text>
                        {[
                            { label: 'Newest', sortBy: 'createdAt', sortOrder: 'desc' },
                            { label: 'Oldest', sortBy: 'createdAt', sortOrder: 'asc' },
                            { label: 'Net Weight ↑', sortBy: 'netWt', sortOrder: 'asc' },
                            { label: 'Net Weight ↓', sortBy: 'netWt', sortOrder: 'desc' },
                            { label: 'Gross Weight ↑', sortBy: 'grossWt', sortOrder: 'asc' },
                            { label: 'Gross Weight ↓', sortBy: 'grossWt', sortOrder: 'desc' },
                        ].map(opt => (
                            <TouchableOpacity
                                key={opt.label}
                                style={[styles.filterOption, sortBy === opt.sortBy && sortOrder === opt.sortOrder && styles.filterOptionActive]}
                                onPress={() => handleSortChange(opt.sortBy, opt.sortOrder)}
                            >
                                <Text style={[styles.filterOptionText, sortBy === opt.sortBy && sortOrder === opt.sortOrder && styles.filterOptionTextActive]}>
                                    {opt.label}
                                </Text>
                                {/* {sortBy === opt.sortBy && sortOrder === opt.sortOrder && (
                                    <MaterialIcons name="check" size={18} color="#6366f1" />
                                )} */}
                            </TouchableOpacity>
                        ))}
                    </GlassView>
                </View>
            )}

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 140 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Loading state */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                )}

                {/* Search results */}
                {!loading && hasSearched && (
                    <>
                        <View style={styles.resultHeader}>
                            <Text style={styles.resultCount}>
                                {results.length} {results.length === 1 ? 'result' : 'results'}
                                {selectedCategoryName ? ` in ${selectedCategoryName}` : ''}
                            </Text>
                        </View>

                        {results.length > 0 ? (
                            <FlatList
                                data={results}
                                renderItem={renderProduct}
                                keyExtractor={item => (item._id || item.id || Math.random()).toString()}
                                numColumns={2}
                                scrollEnabled={false}
                                columnWrapperStyle={styles.gridColumn}
                                contentContainerStyle={styles.gridContent}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                {/* <MaterialIcons name="search-off" size={48} color="#cbd5e1" /> */}
                                <Text style={styles.emptyTitle}>No products found</Text>
                                <Text style={styles.emptySubtitle}>Try a different search term or category</Text>
                            </View>
                        )}
                    </>
                )}

                {/* Pre-search: Recent searches + Recommendations */}
                {!loading && !hasSearched && (
                    <>
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
                                    <TouchableOpacity onPress={clearRecentSearches}>
                                        <Text style={styles.clearText}>CLEAR ALL</Text>
                                    </TouchableOpacity>
                                </View>
                                <GlassView blurType="light" blurAmount={30} style={styles.recentCard}>
                                    {recentSearches.map((term, index) => (
                                        <TouchableOpacity
                                            key={`${term}-${index}`}
                                            style={[
                                                styles.recentItem,
                                                index !== recentSearches.length - 1 && styles.recentItemBorder,
                                            ]}
                                            onPress={() => {
                                                setQuery(term);
                                                handleSearch(term);
                                            }}
                                        >
                                            <View style={styles.recentLeft}>
                                                {/* <MaterialIcons name="history" size={20} color="#94a3b8" /> */}
                                                <Text style={styles.recentText}>{term}</Text>
                                            </View>
                                            {/* <MaterialIcons name="north-west" size={18} color="#cbd5e1" /> */}
                                        </TouchableOpacity>
                                    ))}
                                </GlassView>
                            </View>
                        )}

                        {/* Recommendations */}
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>RECOMMENDED FOR YOU</Text>
                            {loadingRecommendations ? (
                                <ActivityIndicator size="small" color="#6366f1" style={{ marginTop: 20 }} />
                            ) : recommendations.length > 0 ? (
                                <FlatList
                                    data={recommendations}
                                    renderItem={renderProduct}
                                    keyExtractor={item => (item._id || item.id || Math.random()).toString()}
                                    numColumns={2}
                                    scrollEnabled={false}
                                    columnWrapperStyle={styles.gridColumn}
                                    contentContainerStyle={styles.gridContent}
                                />
                            ) : (
                                <Text style={styles.emptySubtitle}>No recommendations available</Text>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

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
        paddingBottom: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.4)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    searchBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#0f172a',
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    chipsContainer: {
        gap: 8,
        paddingBottom: 4,
    },
    chip: {
        height: 32,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeChip: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    chipText: {
        color: '#334155',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    activeChipText: {
        color: 'white',
    },
    filterPanel: {
        position: 'absolute',
        right: 20,
        zIndex: 200,
        width: 200,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    filterPanelInner: {
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        overflow: 'hidden',
    },
    filterTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    filterOptionActive: {
        borderBottomColor: 'rgba(99,102,241,0.15)',
    },
    filterOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    filterOptionTextActive: {
        color: '#6366f1',
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    loadingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },
    resultHeader: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    resultCount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    gridContent: {
        paddingHorizontal: 16,
    },
    gridColumn: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#94a3b8',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 14,
    },
    clearText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6366f1',
        letterSpacing: 1,
        marginBottom: 14,
    },
    recentCard: {
        borderRadius: 20,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    recentItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    recentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    recentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
});
