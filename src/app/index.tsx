import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
    useColorScheme,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import Icon from '../components/Icon';
import { Colors } from '../constants/Colors';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearAuthError } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function LoginScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const dispatch = useAppDispatch();
    const { isAuthenticating, error } = useAppSelector((state) => state.auth);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = isDark ? Colors.dark : Colors.light;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberSession, setRememberSession] = useState(false);

    // Show any Redux error as an Alert then clear it
    React.useEffect(() => {
        if (error) {
            Alert.alert('Login Failed', error);
            dispatch(clearAuthError());
        }
    }, [error]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both ID/Mobile and Password');
            return;
        }
        dispatch(loginUser({ email, password }));
        // Routing is handled automatically by MainNavigator watching auth.token
    };


    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0f0a0f' : '#fff' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Background Gradient */}
            <LinearGradient
                colors={isDark ? ['#0f0a0f', '#1a101a'] : Colors.gradient}
                locations={isDark ? undefined : Colors.locations}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    <View style={styles.contentContainer}>
                        {/* Glass Panel */}
                        <View style={[styles.glassPanel, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.85)' }]}>
                            {/* BlurView as absolute background - works on both iOS and Android */}
                            {Platform.OS === 'ios' && (
                                <GlassView
                                    blurType={isDark ? 'dark' : 'light'}
                                    blurAmount={isDark ? 40 : 80}
                                    style={StyleSheet.absoluteFill}
                                />
                            )}

                            {/* Badge */}
                            <View style={styles.badgeContainer}>
                                <View
                                    style={[
                                        styles.badge,
                                        {
                                            backgroundColor: isDark
                                                ? 'rgba(0,0,0,0.4)'
                                                : 'rgba(255,255,255,0.8)',
                                            borderColor: theme.border,
                                        },
                                    ]}
                                >
                                    <Icon name="verified-user" size={18} color={Colors.light.primaryDark} />
                                    <Text style={[styles.badgeText, { color: isDark ? Colors.light.primary : '#334155' }]}>SV GOLD WHOLESALE</Text>
                                </View>
                            </View>

                            {/* Header */}
                            <View style={styles.headerContainer}>
                                <Text style={[styles.title, { color: theme.text }]}>
                                    SV GOLD
                                </Text>
                                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                                    Wholesale Partner Login
                                </Text>
                            </View>

                            {/* Form */}
                            <View style={styles.formContainer}>

                                {/* ID/Mobile Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                                        ADMIN ID OR MOBILE
                                    </Text>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconContainer}>
                                            <Icon name="badge" size={24} color="#9ca3af" />
                                        </View>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: theme.inputBg,
                                                    borderColor: theme.border,
                                                    color: theme.text,
                                                    paddingLeft: 46,
                                                    paddingRight: 16,
                                                },
                                            ]}
                                            placeholder="Enter Email, Phone, or User ID"
                                            placeholderTextColor="#9ca3af"
                                            value={email}
                                            onChangeText={setEmail}
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                                        PASSWORD
                                    </Text>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.iconContainer}>
                                            <Icon name="lock" size={24} color="#9ca3af" />
                                        </View>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: theme.inputBg,
                                                    borderColor: theme.border,
                                                    color: theme.text,
                                                    paddingLeft: 46,
                                                    paddingRight: 46,
                                                },
                                            ]}
                                            placeholder="Min 6 characters"
                                            placeholderTextColor="#9ca3af"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeIcon}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <Icon name={showPassword ? "visibility" : "visibility-off"} size={24} color="#9ca3af" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Options Row */}
                                <View style={styles.optionsRow}>
                                    <TouchableOpacity
                                        style={styles.checkboxContainer}
                                        onPress={() => setRememberSession(!rememberSession)}
                                    >
                                        <View
                                            style={[
                                                styles.checkbox,
                                                {
                                                    borderColor: rememberSession
                                                        ? Colors.light.primaryDark
                                                        : '#cbd5e1',
                                                    backgroundColor: rememberSession
                                                        ? Colors.light.primaryDark
                                                        : 'transparent',
                                                },
                                            ]}
                                        >
                                            {/* {rememberSession && <Icon name="check" size={12} color="white" />} */}
                                        </View>
                                        <Text
                                            style={[
                                                styles.checkboxLabel,
                                                { color: isDark ? '#94a3b8' : '#475569' },
                                            ]}
                                        >
                                            Remember session
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation.navigate('forgot-password' as any)
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.forgotPassword,
                                                { color: Colors.light.primaryDark },
                                            ]}
                                        >
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Login Button */}
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.loginButton,
                                            { backgroundColor: Colors.light.primary },
                                        ]}
                                        onPress={handleLogin}
                                        disabled={isAuthenticating}
                                    >
                                        {isAuthenticating ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <Text style={styles.loginButtonText}>
                                                    Login to Dashboard
                                                </Text>
                                                <Icon name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>

                            </View>

                            {/* Footer Link */}
                            <View style={styles.footerLinkContainer}>
                                <Text style={[styles.footerText, { color: theme.textMuted }]}>
                                    New wholesale partner?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('register' as any)}
                                >
                                    <Text
                                        style={[
                                            styles.requestAccess,
                                            { color: Colors.light.primaryDark },
                                        ]}
                                    >
                                        Request Access
                                    </Text>
                                </TouchableOpacity>
                            </View>

                        </View>

                        {/* Bottom Info */}
                        <View style={styles.bottomInfoContainer}>
                            <Text
                                style={[
                                    styles.versionText,
                                    { color: isDark ? '#64748b' : '#94a3b8' },
                                ]}
                            >
                                SV GOLD V1.0.0
                            </Text>
                            <View style={styles.linksContainer}>
                                <TouchableOpacity>
                                    <Text
                                        style={[
                                            styles.linkText,
                                            { color: isDark ? '#64748b' : '#94a3b8' },
                                        ]}
                                    >
                                        Privacy Policy
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.dot} />
                                <TouchableOpacity>
                                    <Text
                                        style={[
                                            styles.linkText,
                                            { color: isDark ? '#64748b' : '#94a3b8' },
                                        ]}
                                    >
                                        Terms of Use
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
    },
    glassPanel: {
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 32,
        borderWidth: 1,
        overflow: 'hidden',
    },
    badgeContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 50,
        borderWidth: 1,
        gap: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    formContainer: {
        gap: 18,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginLeft: 2,
    },
    inputWrapper: {
        position: 'relative',
        height: 48,
    },
    iconContainer: {
        position: 'absolute',
        left: 14,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 1,
    },
    input: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    eyeIcon: {
        position: 'absolute',
        right: 14,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 2,
        marginTop: 8,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    forgotPassword: {
        fontSize: 13,
        fontWeight: '700',
    },
    buttonContainer: {
        paddingTop: 8,
    },
    loginButton: {
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    buttonIcon: {
        marginLeft: 8,
    },
    footerLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 26,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '500',
    },
    requestAccess: {
        fontSize: 13,
        fontWeight: '700',
        textDecorationLine: 'underline',
        marginLeft: 2,
    },
    bottomInfoContainer: {
        alignItems: 'center',
        gap: 12,
        marginTop: 32,
        opacity: 0.6,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    linksContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    linkText: {
        fontSize: 11,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#94a3b8',
    },
});
