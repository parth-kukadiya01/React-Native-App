import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '../components/Icon';
import { Colors } from '../constants/Colors';
import { authService } from '../services/authService';

export default function RegisterScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        companyName: '',
        email: '',
        phone: '',
        taxId: '',
        password: '',
    });

    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleRegister = async () => {
        if (!formData.fullName || !formData.email || !formData.password || !formData.companyName) {
            Alert.alert('Missing Information', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                companyName: formData.companyName,
                phone: formData.phone,
                taxId: formData.taxId
            });
            setLoading(false);

            // Registration Successful - User is pending
            Alert.alert(
                'Registration Successful',
                response.message || 'Your account has been created and is pending approval. You will be notified once an admin approves your request.',
                [{ text: 'Return to Login', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'index' }] }) }]
            );
        } catch (error: any) {
            setLoading(false);
            const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.';
            Alert.alert('Registration Error', message);
        }
    };

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

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back-ios" size={20} color="#475569" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registration</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.titleContainer}>
                        <Text style={styles.mainTitle}>Partner Registration</Text>
                        <Text style={styles.subTitle}>Apply for a wholesale account to browse our exclusive jewelry collections.</Text>
                    </View>

                    <GlassView blurType="light" blurAmount={50} style={styles.glassPanel}>
                        <View style={styles.formSpace}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="person" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor="#cbd5e1"
                                        value={formData.fullName}
                                        onChangeText={(text) => handleChange('fullName', text)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Company Name</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="storefront" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Jewelry Co."
                                        placeholderTextColor="#cbd5e1"
                                        value={formData.companyName}
                                        onChangeText={(text) => handleChange('companyName', text)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Business Email</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="alternate-email" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="contact@company.com"
                                        placeholderTextColor="#cbd5e1"
                                        keyboardType="email-address"
                                        value={formData.email}
                                        onChangeText={(text) => handleChange('email', text)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="smartphone" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="+1 (555) 000-0000"
                                        placeholderTextColor="#cbd5e1"
                                        keyboardType="phone-pad"
                                        value={formData.phone}
                                        onChangeText={(text) => handleChange('phone', text)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Tax ID / EIN</Text>
                                    <Text style={styles.requiredBadge}>REQUIRED</Text>
                                </View>
                                <View style={styles.inputContainer}>
                                    <Icon name="verified-user" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Registration Number"
                                        placeholderTextColor="#cbd5e1"
                                        value={formData.taxId}
                                        onChangeText={(text) => handleChange('taxId', text)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#cbd5e1"
                                        secureTextEntry={!showPassword}
                                        value={formData.password}
                                        onChangeText={(text) => handleChange('password', text)}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Icon name="visibility" size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <TouchableOpacity style={styles.glowButton} onPress={handleRegister} disabled={loading}>
                                    <LinearGradient
                                        colors={['#e0f2fe', '#f0f9ff', '#faf5ff']}
                                        style={styles.glowButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#6366f1" />
                                        ) : (
                                            <Text style={styles.buttonText}>Create Business Account</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </GlassView>

                    <View style={styles.footerContainer}>
                        <View style={styles.loginLinkRow}>
                            <Text style={styles.footerText}>Already a partner? </Text>
                            <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'index' }] })}>
                                <Text style={styles.loginLink}>Log In</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>AUTHORIZED B2B</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.bannerContainer}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9Kq1DO2lq_m98Wyxvers9S7urBES_1JPGq49YJY_sOxcswyPfczVI6mpWnT2FTUa1sk99C1bcPA_g1EUh4MzrPYJGBaKLDN9Yb0I5nQO13jbAJLObEtuCztZ_WoDM0eIGbMApeN9oTou999ipzSWA7MJvpxp17WYhiAXOQC73ixAAmtwi4x4g5EUxW-e1AYpI4rW94iQswu7nXRiKwEtROZzmjLgSuQFmt9qG6Q_kMYtM3-9JTHTy3GU3TrowyipBtE3rEkYjE5M' }}
                                style={styles.bannerImage}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.8)']}
                                style={styles.bannerOverlay}
                            >
                                <Text style={styles.bannerTagLine}>SV GOLD WHOLESALE</Text>
                                <Text style={styles.bannerTitle}>Crafting Excellence for Retailers</Text>
                            </LinearGradient>
                        </View>
                    </View>

                    <View style={styles.bottomBar} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#475569', letterSpacing: -0.5 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
    titleContainer: { marginBottom: 32 },
    mainTitle: { fontSize: 32, fontWeight: '800', color: '#1e293b', marginBottom: 12, letterSpacing: -1 },
    subTitle: { fontSize: 15, fontWeight: '500', color: '#64748b', lineHeight: 24 },
    glassPanel: {
        borderRadius: 32,
        padding: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        backgroundColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
    },
    formSpace: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#475569', paddingHorizontal: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    requiredBadge: { fontSize: 9, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 16, height: 56, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
    inputIcon: { marginLeft: 16, opacity: 0.6 },
    input: { flex: 1, height: '100%', paddingLeft: 12, paddingRight: 16, fontSize: 15, fontWeight: '600', color: '#1e293b' },
    eyeIcon: { paddingRight: 16, opacity: 0.6 },
    glowButton: { borderRadius: 20, overflow: 'hidden', height: 60, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    glowButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: Colors.light.primaryDark || '#6366f1', fontWeight: '900', fontSize: 16, letterSpacing: 0.5, textTransform: 'uppercase' },
    footerContainer: { marginTop: 32, alignItems: 'center', gap: 24 },
    loginLinkRow: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    loginLink: { fontSize: 14, color: '#6366f1', fontWeight: 'bold', marginLeft: 4 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, opacity: 0.5 },
    dividerLine: { height: 1, width: 32, backgroundColor: '#cbd5e1' },
    dividerText: { fontSize: 10, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 },
    bannerContainer: { width: '100%', height: 140, borderRadius: 24, overflow: 'hidden', position: 'relative', marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
    bannerImage: { width: '100%', height: '100%' },
    bannerOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%', justifyContent: 'flex-end', padding: 24 },
    bannerTagLine: { color: '#334155', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    bannerTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800', fontStyle: 'italic', letterSpacing: -0.5 },
    bottomBar: { width: 128, height: 4, backgroundColor: 'rgba(15, 23, 42, 0.1)', borderRadius: 2, alignSelf: 'center', marginTop: 40 },
});
