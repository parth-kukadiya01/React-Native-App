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
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { authService } from '../services/authService';

export default function ForgotPasswordScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setLoading(false);

            Alert.alert(
                'Code Sent',
                `A 6-digit verification code has been sent to ${email}`,
                [
                    {
                        text: 'Enter Code',
                        onPress: () => navigation.navigate('reset-password' as any, { email })
                    }
                ]
            );
        } catch (error: any) {
            setLoading(false);
            const message = error.response?.data?.message || 'Failed to send reset code';
            Alert.alert('Error', message);
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
                    {/* <MaterialIcons name="arrow-back-ios" size={20} color="#475569" style={{ marginLeft: 6 }} /> */}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Forgot Password</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.contentContainer}>
                        <View style={styles.iconWrapper}>
                            {/* <MaterialIcons name="lock-reset" size={64} color="#6366f1" /> */}
                        </View>

                        <Text style={styles.title}>Reset Your Password</Text>
                        <Text style={styles.subtitle}>
                            Enter your email address below and we'll send you a 6-digit code to reset your password.
                        </Text>

                        <GlassView blurType="light" blurAmount={50} style={styles.glassPanel}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <View style={styles.inputContainer}>
                                    {/* <MaterialIcons name="email" size={20} color="#94a3b8" style={styles.inputIcon} /> */}
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#cbd5e1"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSendCode}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.sendButtonText}>SEND RESET CODE</Text>
                                )}
                            </TouchableOpacity>
                        </GlassView>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'index' }] })}
                        >
                            <Text style={styles.loginLinkText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>

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
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
    contentContainer: { alignItems: 'center', width: '100%', maxWidth: 400, alignSelf: 'center' },
    iconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: 14, fontWeight: '500', color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    glassPanel: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        backgroundColor: 'rgba(255,255,255,0.4)',
        gap: 20,
    },
    inputGroup: { gap: 8 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#475569', paddingHorizontal: 4, letterSpacing: 1 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 16, height: 56, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
    inputIcon: { marginLeft: 16, opacity: 0.6 },
    input: { flex: 1, height: '100%', paddingLeft: 12, paddingRight: 16, fontSize: 15, fontWeight: '600', color: '#1e293b' },
    sendButton: { height: 56, borderRadius: 16, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
    sendButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
    loginLink: { marginTop: 32, padding: 8 },
    loginLinkText: { fontSize: 14, fontWeight: '700', color: '#6366f1' },
});
