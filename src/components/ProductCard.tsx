import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import Icon from '../components/Icon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getImageUrl } from '../constants/api';

const { width } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
    item: any;
    width?: number;
    onFavoritePress?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, width = DEFAULT_CARD_WIDTH, onFavoritePress }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const handlePress = () => {
        navigation.navigate('product-details' as any, {
            id: item.id || item._id,
            name: item.name,
            ref: item.sku || item.ref,
            netWt: item.netWt,
            grossWt: item.grossWt,
            image: item.images?.[0] || item.image
        });
    };

    return (
        <TouchableOpacity
            style={[styles.productCard, { width }]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={styles.productImageContainer}>
                <Image
                    source={{ uri: getImageUrl(item.images?.[0] || item.image) }}
                    style={styles.productImage}
                />
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => onFavoritePress && onFavoritePress(item.id || item._id)}
                >
                    <Icon
                        name={item.isFavorite ? "favorite" : "favorite-border"}
                        size={18}
                        color={item.isFavorite ? "#f43f5e" : "#94a3b8"}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productRef}>Ref: {item.sku || item.ref}</Text>

                <View style={styles.materialRow}>
                    <View style={[styles.materialDot, { backgroundColor: '#f3d7d4' }]} />
                    <Text style={styles.materialText}>{item.materials?.[0] || 'Gold'}</Text>
                </View>

                <View style={styles.productDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>NET WT</Text>
                        <Text style={styles.detailValue}>{item.netWt}g</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>GROSS WT</Text>
                        <Text style={styles.detailValue}>{item.grossWt}g</Text>
                    </View>
                </View>

                <View style={styles.addToOrderButton}>
                    <Text style={styles.addToOrderText}>VIEW DETAILS</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
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
        marginBottom: 8,
    },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    materialDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'white',
    },
    materialText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
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
});

export default ProductCard;
