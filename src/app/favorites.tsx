import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,

    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { favoriteService } from '../services/favoriteService';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';
import { useCart } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';


export default function FavoritesScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { width } = useResponsive();
    const CARD_WIDTH = (width - 48) / 2;

    const { updateCartCount } = useCart();

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const res = await favoriteService.getFavorites();
            if (res.success) {
                setFavorites(res.data || []);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch favorites every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            updateCartCount();
            fetchFavorites();
        }, [])
    );

    const removeFavorite = async (id: string) => {
        try {
            await favoriteService.removeFavorite(id);
            setFavorites(current => current.filter((item: any) => (item.id || item._id) !== id));
        } catch (error: any) {
            // If already removed (404), just update UI
            if (error?.response?.status === 404) {
                setFavorites(current => current.filter((item: any) => (item.id || item._id) !== id));
            } else {
                console.error('Error removing favorite:', error);
                Alert.alert('Error', 'Failed to remove from favorites');
            }
        }
    };

    const renderFavorite = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.productCard, { width: CARD_WIDTH }]}
            onPress={() => navigation.navigate('product-details' as any, {
                id: item.id || item._id,
                name: item.name,
                netWt: item.netWt,
                grossWt: item.grossWt,
                image: item.image
            })}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => removeFavorite((item.id || item._id).toString())}
                >
                    <Icon name="favorite" size={18} color="#f43f5e" />
                </TouchableOpacity>
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
                    <Text style={styles.materialText}>{item.goldType || 'Gold'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

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

            <ScreenHeader showBack title="Curated Favorites" showCart />

            <View style={styles.headerFilters}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >
                    <TouchableOpacity style={[styles.filterChip, styles.activeFilterChip]}>
                        <Text style={[styles.filterText, styles.activeFilterText]}>ALL ITEMS</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#0f172a" />
                    <Text style={{ marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '600' }}>Loading favorites...</Text>
                </View>
            ) : favorites.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
                    <Icon name="favorite-border" size={64} color="#cbd5e1" />
                    <Text style={{ marginTop: 16, color: '#1e293b', fontSize: 18, fontWeight: '700' }}>No favorites yet</Text>
                    <Text style={{ marginTop: 6, color: '#64748b', fontSize: 13, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 }}>
                        Tap the heart icon on any product to save it here
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('catalog' as any)}
                    >
                        <Text style={styles.browseButtonText}>BROWSE CATALOG</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderFavorite}
                    keyExtractor={item => (item.id || item._id || '').toString()}
                    numColumns={2}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.gridColumn}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <BottomNav activeTab="Saved" />
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
    headerFilters: {
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.6)',
        zIndex: 10,
    },
    filterContainer: {
        gap: 8,
        paddingBottom: 16,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    activeFilterChip: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    filterText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    activeFilterText: {
        color: '#fff',
        fontWeight: '900',
    },
    gridContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 140, // Increased bottom padding
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
    browseButton: {
        marginTop: 24,
        backgroundColor: '#0f172a',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    browseButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});
