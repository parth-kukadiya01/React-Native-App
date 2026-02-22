import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import GlassView from '../components/GlassView';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';

interface ScreenHeaderProps {
    title?: string;
    showBrand?: boolean;
    showBack?: boolean;
    showSearch?: boolean;
    showNotification?: boolean;
    showCart?: boolean;
    rightElement?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    showBrand = false,
    showBack = false,
    showSearch = false,
    showNotification = false,
    showCart = false,
    rightElement
}) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { cartCount } = useCart();

    return (
        <GlassView blurType="light" blurAmount={80} style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <View style={styles.headerLeft}>
                {showBack && (
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                        {/* <MaterialIcons name="arrow-back-ios" size={20} color="#475569" style={{ marginLeft: 6 }} /> */}
                    </TouchableOpacity>
                )}

                {showBrand && (
                    <View style={styles.brandRow}>
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
                )}

                {title && !showBrand && (
                    <Text style={styles.headerTitle}>{title}</Text>
                )}
            </View>

            <View style={styles.headerRight}>
                {showSearch && (
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('search' as any)}>
                        {/* <MaterialIcons name="search" size={24} color="#475569" /> */}
                    </TouchableOpacity>
                )}

                {showNotification && (
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('notifications' as any)}>
                        {/* <MaterialIcons name="notifications-none" size={24} color="#475569" /> */}
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                )}

                {showCart && (
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('cart' as any)}>
                        {/* <MaterialIcons name="shopping-bag" size={22} color="#475569" /> */}
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {rightElement}
            </View>
        </GlassView>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingBottom: 8,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.4)',
        // position: 'absolute',
        // top: 0,
        // left: 0,
        // right: 0,
        // zIndex: 100,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    brandRow: {
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
    headerTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 2,
        textTransform: 'uppercase',
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
        backgroundColor: '#fb7185',
        borderWidth: 1,
        borderColor: 'white',
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
});

export default ScreenHeader;
