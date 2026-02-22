import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GlassView from '../components/GlassView';
import Icon from '../components/Icon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';

interface BottomNavProps {
    activeTab: 'Home' | 'Catalog' | 'Orders' | 'Account' | 'Saved' | 'Profile';
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { cartCount } = useCart();

    const navItems = [
        { id: 'Home', icon: 'home', label: 'HOME', route: '/home' },
        { id: 'Catalog', icon: 'grid-view', label: 'CATALOG', route: '/catalog' },
        { id: 'Saved', icon: 'favorite-border', label: 'SAVED', route: '/favorites' },
        { id: 'Orders', icon: 'shopping-cart', label: 'ORDERS', route: '/cart' },
        { id: 'Account', icon: 'account-circle', label: 'ACCOUNT', route: '/profile' },
    ];

    const isActive = (itemId: string) => {
        if (itemId === activeTab) return true;
        if (itemId === 'Account' && activeTab === 'Profile') return true;
        return false;
    };

    // Some screens use 'Profile' instead of 'Account', 'Saved' instead of 'Favorites' etc. 
    // We'll normalize these labels for the UI but keep routes consistent.

    return (
        <GlassView blurType="light" blurAmount={90} style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            {navItems.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.navItem}
                    onPress={() => navigation.navigate(item.route.replace('/', '') as any)}
                >
                    <View>
                        <Icon
                            name={item.icon as any}
                            size={26}
                            color={isActive(item.id) ? '#4A90E2' : '#94a3b8'}
                        />
                        {item.id === 'Orders' && cartCount > 0 && (
                            <View style={styles.badgeCount}>
                                <Text style={styles.badgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.navText, isActive(item.id) && { color: '#4A90E2' }]}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </GlassView>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 16,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    badgeCount: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#6366f1',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
});

export default BottomNav;
