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
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { authService } from '../services/authService';

export default function ResetPasswordScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute();
    const { email } = (route.params as any) || {};

    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!otp || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (otp.length < 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit code');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword(otp, password);
            setLoading(false);

            Alert.alert(
                'Success',
                'Your password has been reset successfully. You are now logged in.',
                [
                    {
                        text: 'Go to Home',
                        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'home' }] })
                    }
                ]
            );
        } catch (error: any) {
            setLoading(false);
            const message = error.response?.data?.message || 'Failed to reset password. Check your code and try again.';
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
                <Text style={styles.headerTitle}>Reset Password</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.contentContainer}>
                        <View style={styles.iconWrapper}>
                            {/* <MaterialIcons name="security" size={64} color="#6366f1" /> */}
                        </View>

                        <Text style={styles.title}>Enter Verification Code</Text>
                        <Text style={styles.subtitle}>
                            Please enter the 6-digit code sent to {email} along with your new password.
                        </Text>

                        <GlassView blurType="light" blurAmount={50} style={styles.glassPanel}>

                            {/* OTP Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>VERIFICATION CODE</Text>
                                <View style={styles.inputContainer}>
                                    {/* <MaterialIcons name="vpn-key" size={20} color="#94a3b8" style={styles.inputIcon} /> */}
                                    <TextInput
                                        style={[styles.input, { letterSpacing: 4, fontSize: 18 }]}
                                        placeholder="123456"
                                        placeholderTextColor="#cbd5e1"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        value={otp}
                                        onChangeText={setOtp}
                                    />
                                </View>
                            </View>

                            {/* Password input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>NEW PASSWORD</Text>
                                <View style={styles.inputContainer}>
                                    {/* <MaterialIcons name="lock" size={20} color="#94a3b8" style={styles.inputIcon} /> */}
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Min 6 characters"
                                        placeholderTextColor="#cbd5e1"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        {/* <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#94a3b8" /> */}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                                <View style={styles.inputContainer}>
                                    {/* <MaterialIcons name="lock-outline" size={20} color="#94a3b8" style={styles.inputIcon} /> */}
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Re-enter password"
                                        placeholderTextColor="#cbd5e1"
                                        secureTextEntry={!showPassword}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={handleReset}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.resetButtonText}>RESET PASSWORD</Text>
                                )}
                            </TouchableOpacity>
                        </GlassView>

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
    eyeIcon: { paddingRight: 16, opacity: 0.6 },
    resetButton: { height: 56, borderRadius: 16, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginTop: 12 },
    resetButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});
