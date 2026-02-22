import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import GlassView from '../components/GlassView';
import { StatusBar } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useEffect, useState } from 'react';
import { getImageUrl } from '../constants/api';
import ScreenHeader from '../components/ScreenHeader';
import BottomNav from '../components/BottomNav';
import { launchImageLibrary } from 'react-native-image-picker';
import { tpinService } from '../services/tpinService';

export default function BusinessProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingCard, setUploadingCard] = useState(false);

    // Editable fields
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [address, setAddress] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [visitingCard, setVisitingCard] = useState<string | null>(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await userService.getProfile();
            const data = res.data;
            setUser(data);
            populateFields(data);
        } catch (error) {
            // Fallback to local storage
            try {
                const userData = await authService.getCurrentUser();
                if (userData) {
                    setUser(userData);
                    populateFields(userData);
                }
            } catch (e) {
                // silently fail
            }
        } finally {
            setLoading(false);
        }
    };

    const populateFields = (data: any) => {
        setFullName(data?.fullName || '');
        setCompanyName(data?.companyName || '');
        setPhone(data?.phone || '');
        setWhatsappNumber(data?.whatsappNumber || '');
        setAddress(data?.address || '');
        setPanNumber(data?.panNumber || '');
        setGstNumber(data?.gstNumber || '');
        setVisitingCard(data?.visitingCard || null);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleCancel = () => {
        populateFields(user);
        setEditing(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await userService.updateProfile({
                fullName,
                companyName,
                phone,
                whatsappNumber,
                address,
                panNumber,
                gstNumber,
                visitingCard,
            });
            if (res.success) {
                setUser(res.data);
                setEditing(false);
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePickVisitingCard = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
            });

            if (result.assets && result.assets[0]?.uri) {
                setUploadingCard(true);
                const uploadRes = await userService.uploadImage(result.assets[0].uri);
                if (uploadRes.success) {
                    setVisitingCard(uploadRes.data.url);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to upload visiting card');
        } finally {
            setUploadingCard(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            // ignore
        }
        navigation.reset({ index: 0, routes: [{ name: 'index' as any }] });
    };

    // T-PIN state
    const [hasTpin, setHasTpin] = useState(false);
    const [showTpinProfileModal, setShowTpinProfileModal] = useState(false);
    const [tpinProfileMode, setTpinProfileMode] = useState<'generate' | 'confirm' | 'change'>('generate');
    const [tpinInput, setTpinInput] = useState('');
    const [tpinConfirm, setTpinConfirm] = useState('');
    const [tpinCurrentInput, setTpinCurrentInput] = useState('');
    const [tpinError, setTpinError] = useState('');
    const [tpinLoading, setTpinLoading] = useState(false);

    useEffect(() => {
        tpinService.getStatus().then((res: any) => {
            setHasTpin(res.data.hasTpin);
        }).catch(() => { });
    }, []);

    const openTpinModal = (mode: 'generate' | 'change') => {
        setTpinProfileMode(mode);
        setTpinInput('');
        setTpinConfirm('');
        setTpinCurrentInput('');
        setTpinError('');
        setShowTpinProfileModal(true);
    };

    const handleTpinProfileAction = async () => {
        if (tpinProfileMode === 'generate') {
            if (tpinInput.length !== 4) { setTpinError('T-PIN must be 4 digits'); return; }
            setTpinProfileMode('confirm');
            setTpinConfirm('');
            setTpinError('');
            return;
        }
        if (tpinProfileMode === 'confirm') {
            if (tpinConfirm !== tpinInput) { setTpinError('T-PINs do not match'); return; }
            try {
                setTpinLoading(true);
                await tpinService.generate(tpinInput);
                setHasTpin(true);
                setShowTpinProfileModal(false);
                Alert.alert('Success', 'T-PIN created successfully!');
            } catch (error: any) {
                setTpinError(error.response?.data?.error || 'Failed to create T-PIN');
            } finally {
                setTpinLoading(false);
            }
            return;
        }
        // Change mode
        if (tpinCurrentInput.length !== 4) { setTpinError('Current T-PIN must be 4 digits'); return; }
        if (tpinInput.length !== 4) { setTpinError('New T-PIN must be 4 digits'); return; }
        try {
            setTpinLoading(true);
            await tpinService.update(tpinCurrentInput, tpinInput);
            setShowTpinProfileModal(false);
            Alert.alert('Success', 'T-PIN updated successfully!');
        } catch (error: any) {
            setTpinError(error.response?.data?.error || 'Failed to update T-PIN');
        } finally {
            setTpinLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={Colors.gradient} locations={Colors.locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.background} />
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={{ marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '600' }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient colors={Colors.gradient} locations={Colors.locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.background} />

            <ScreenHeader
                showBack
                title="Business Profile"
                rightElement={
                    editing ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                                <Text style={styles.cancelButtonText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>SAVE</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                            <Text style={styles.editButtonText}>EDIT</Text>
                        </TouchableOpacity>
                    )
                }
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={100}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Profile Card */}
                    <GlassView blurType="light" blurAmount={30} style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: user?.avatar ? getImageUrl(user.avatar) : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAztQxI6dZjq9gkax8G_83TLG_m17idiTnw_grLGi_iwmBZs7YdKjjCDiLUA17YhwSOJg1xTzvidEdy5PgN7fScuI_RUM9Ejy518PJDctQdGFdL4m12v8ViVnOAA-umOqoBGH7adXXCL-h0_uBTZioDTBvrWO4TkW6yzoPe1xDSPH6ArZrrkyeQhs_hCxjxfd_nP0sXO5Ko2LPB1whByxk6Ze74rWtGyOp9rLOaJiHZZw7R3E64JxtMXFNKHDb2Ar-Il3Jrrpjv8ro' }}
                                style={styles.avatar}
                            />
                            <View style={styles.verifiedBadge}>
                                {/* <MaterialIcons name="verified" size={12} color="white" /> */}
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.fullName || 'Partner Name'}</Text>
                            <Text style={styles.profileRole}>WHOLESALE PARTNER</Text>
                            <Text style={styles.profileCompany}>{user?.companyName || 'Valued Business'}</Text>
                        </View>
                    </GlassView>

                    {/* Personal Info */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            {/* <MaterialIcons name="person" size={20} color="#6366f1" /> */}
                            <Text style={styles.sectionTitle}>PERSONAL INFO</Text>
                        </View>

                        <View style={styles.detailsList}>
                            <FieldItem
                                label="FULL NAME"
                                value={fullName}
                                icon="badge"
                                editing={editing}
                                onChangeText={setFullName}
                            />
                            <FieldItem
                                label="COMPANY NAME"
                                value={companyName}
                                icon="apartment"
                                editing={editing}
                                onChangeText={setCompanyName}
                            />
                            <FieldItem
                                label="EMAIL"
                                value={user?.email || ''}
                                icon="email"
                                editing={false}
                                readOnly
                            />
                            <FieldItem
                                label="CONTACT NUMBER"
                                value={phone}
                                icon="phone"
                                editing={editing}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                            <FieldItem
                                label="WHATSAPP NUMBER"
                                value={whatsappNumber}
                                icon="chat"
                                editing={editing}
                                onChangeText={setWhatsappNumber}
                                keyboardType="phone-pad"
                                placeholder="e.g. +91 9876543210"
                            />
                        </View>
                    </View>

                    {/* Business Details */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            {/* <MaterialIcons name="business" size={20} color="#6366f1" /> */}
                            <Text style={styles.sectionTitle}>BUSINESS DETAILS</Text>
                        </View>

                        <View style={styles.detailsList}>
                            <FieldItem
                                label="ADDRESS"
                                value={address}
                                icon="location-on"
                                editing={editing}
                                onChangeText={setAddress}
                                multiline
                                placeholder="Enter your business address"
                            />
                            <FieldItem
                                label="TAX ID"
                                value={user?.taxId || 'N/A'}
                                icon="receipt"
                                editing={false}
                                readOnly
                            />
                            <FieldItem
                                label="PAN NUMBER"
                                value={panNumber}
                                icon="credit-card"
                                editing={editing}
                                onChangeText={setPanNumber}
                                placeholder="e.g. ABCDE1234F"
                                autoCapitalize="characters"
                            />
                            <FieldItem
                                label="GST NUMBER"
                                value={gstNumber}
                                icon="receipt-long"
                                editing={editing}
                                onChangeText={setGstNumber}
                                placeholder="e.g. 27AABCU9603R1ZM"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>

                    {/* Visiting Card */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            {/* <MaterialIcons name="contact-mail" size={20} color="#6366f1" /> */}
                            <Text style={styles.sectionTitle}>VISITING CARD</Text>
                        </View>

                        {visitingCard ? (
                            <GlassView blurType="light" blurAmount={20} style={styles.cardPreview}>
                                <Image
                                    source={{ uri: getImageUrl(visitingCard) }}
                                    style={styles.visitingCardImage}
                                    resizeMode="contain"
                                />
                                {editing && (
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity style={styles.changeCardBtn} onPress={handlePickVisitingCard} disabled={uploadingCard}>
                                            {uploadingCard ? (
                                                <ActivityIndicator size="small" color="#6366f1" />
                                            ) : (
                                                <>
                                                    {/* <MaterialIcons name="swap-horiz" size={16} color="#6366f1" /> */}
                                                    <Text style={styles.changeCardText}>CHANGE</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.removeCardBtn} onPress={() => setVisitingCard(null)}>
                                            {/* <MaterialIcons name="delete-outline" size={16} color="#f43f5e" /> */}
                                            <Text style={[styles.changeCardText, { color: '#f43f5e' }]}>REMOVE</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </GlassView>
                        ) : (
                            <TouchableOpacity
                                style={styles.uploadCard}
                                onPress={editing ? handlePickVisitingCard : undefined}
                                disabled={!editing || uploadingCard}
                                activeOpacity={editing ? 0.7 : 1}
                            >
                                {uploadingCard ? (
                                    <ActivityIndicator size="large" color="#6366f1" />
                                ) : (
                                    <>
                                        {/* <MaterialIcons name="add-a-photo" size={40} color={editing ? '#6366f1' : '#cbd5e1'} /> */}
                                        <Text style={[styles.uploadCardText, !editing && { color: '#cbd5e1' }]}>
                                            {editing ? 'TAP TO UPLOAD VISITING CARD' : 'NO VISITING CARD UPLOADED'}
                                        </Text>
                                        <Text style={styles.uploadCardHint}>JPEG, PNG • Max 5MB</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* T-PIN Security */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            {/* <MaterialIcons name="lock" size={20} color="#6366f1" /> */}
                            <Text style={styles.sectionTitle}>T-PIN SECURITY</Text>
                        </View>

                        <GlassView blurType="light" blurAmount={20} style={styles.detailItem}>
                            <View style={styles.detailTextContainer}>
                                <Text style={styles.detailLabel}>STATUS</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hasTpin ? '#22c55e' : '#ef4444' }} />
                                    <Text style={styles.detailValue}>{hasTpin ? 'Active' : 'Not Set'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.detailIconContainer, { backgroundColor: 'rgba(99,102,241,0.1)' }]}
                                onPress={() => openTpinModal(hasTpin ? 'change' : 'generate')}
                            >
                                {/* <MaterialIcons name={hasTpin ? 'edit' : 'add'} size={20} color="#6366f1" /> */}
                            </TouchableOpacity>
                        </GlassView>

                        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, paddingHorizontal: 4, lineHeight: 16 }}>
                            {hasTpin ? 'Your T-PIN is active. You can change it anytime.' : 'Set up a T-PIN to securely place orders.'}
                        </Text>
                    </View>

                    {/* Account Actions */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { marginLeft: 4, marginBottom: 12 }]}>ACCOUNT ACTIONS</Text>

                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('orders' as any)}>
                            <LinearGradient
                                colors={['#8E97FD', '#6366f1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <View style={styles.actionContent}>
                                {/* <MaterialIcons name="receipt-long" size={24} color="white" /> */}
                                <Text style={styles.actionText}>View Order History</Text>
                            </View>
                            {/* <MaterialIcons name="arrow-forward-ios" size={16} color="white" /> */}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.historyButton, { marginTop: 16 }]} onPress={handleLogout}>
                            <View style={styles.historyButtonContent}>
                                {/* <MaterialIcons name="logout" size={24} color="#f43f5e" /> */}
                                <Text style={[styles.historyButtonText, { color: '#f43f5e' }]}>Log Out</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.footerSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                        <Text style={styles.memberSince}>MEMBER SINCE {new Date(user?.memberSince || Date.now()).getFullYear()}</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <BottomNav activeTab="Account" />

            {/* T-PIN Profile Modal */}
            <Modal visible={showTpinProfileModal} transparent animationType="fade" onRequestClose={() => setShowTpinProfileModal(false)}>
                <View style={tpinProfileStyles.overlay}>
                    <GlassView blurType="dark" blurAmount={40} style={tpinProfileStyles.card}>
                        <TouchableOpacity style={tpinProfileStyles.closeBtn} onPress={() => setShowTpinProfileModal(false)}>
                            {/* <MaterialIcons name="close" size={24} color="#94a3b8" /> */}
                        </TouchableOpacity>

                        <View style={tpinProfileStyles.iconCircle}>
                            {/* <MaterialIcons name="vpn-key" size={32} color="#6366f1" /> */}
                        </View>

                        <Text style={tpinProfileStyles.title}>
                            {tpinProfileMode === 'change' ? 'Change T-PIN' : tpinProfileMode === 'confirm' ? 'Confirm T-PIN' : 'Create T-PIN'}
                        </Text>

                        {tpinProfileMode === 'change' && (
                            <View style={tpinProfileStyles.inputGroup}>
                                <Text style={tpinProfileStyles.inputLabel}>Current T-PIN</Text>
                                <TextInput
                                    style={tpinProfileStyles.input}
                                    value={tpinCurrentInput}
                                    onChangeText={(t) => { setTpinCurrentInput(t.replace(/[^0-9]/g, '').slice(0, 4)); setTpinError(''); }}
                                    placeholder="● ● ● ●"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry
                                    textAlign="center"
                                />
                            </View>
                        )}

                        {tpinProfileMode === 'confirm' ? (
                            <View style={tpinProfileStyles.inputGroup}>
                                <Text style={tpinProfileStyles.inputLabel}>Re-enter T-PIN</Text>
                                <TextInput
                                    style={tpinProfileStyles.input}
                                    value={tpinConfirm}
                                    onChangeText={(t) => { setTpinConfirm(t.replace(/[^0-9]/g, '').slice(0, 4)); setTpinError(''); }}
                                    placeholder="● ● ● ●"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry
                                    autoFocus
                                    textAlign="center"
                                />
                            </View>
                        ) : (
                            <View style={tpinProfileStyles.inputGroup}>
                                <Text style={tpinProfileStyles.inputLabel}>{tpinProfileMode === 'change' ? 'New T-PIN' : 'Enter 4-digit T-PIN'}</Text>
                                <TextInput
                                    style={tpinProfileStyles.input}
                                    value={tpinInput}
                                    onChangeText={(t) => { setTpinInput(t.replace(/[^0-9]/g, '').slice(0, 4)); setTpinError(''); }}
                                    placeholder="● ● ● ●"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    secureTextEntry
                                    autoFocus={tpinProfileMode !== 'change'}
                                    textAlign="center"
                                />
                            </View>
                        )}

                        {!!tpinError && (
                            <View style={tpinProfileStyles.errorRow}>
                                {/* <MaterialIcons name="error-outline" size={16} color="#ef4444" /> */}
                                <Text style={tpinProfileStyles.errorText}>{tpinError}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[tpinProfileStyles.actionBtn, tpinLoading && { opacity: 0.7 }]}
                            onPress={handleTpinProfileAction}
                            disabled={tpinLoading}
                        >
                            <LinearGradient
                                colors={['#8E97FD', '#6366f1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            {tpinLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={tpinProfileStyles.actionBtnText}>
                                    {tpinProfileMode === 'confirm' ? 'Create T-PIN' : tpinProfileMode === 'change' ? 'Update T-PIN' : 'Next'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </GlassView>
                </View>
            </Modal>
        </View>
    );
}

// Reusable field component
function FieldItem({
    label,
    value,
    icon,
    editing,
    onChangeText,
    readOnly,
    keyboardType,
    placeholder,
    multiline,
    autoCapitalize,
}: {
    label: string;
    value: string;
    icon: string;
    editing: boolean;
    onChangeText?: (text: string) => void;
    readOnly?: boolean;
    keyboardType?: any;
    placeholder?: string;
    multiline?: boolean;
    autoCapitalize?: any;
}) {
    return (
        <GlassView blurType="light" blurAmount={20} style={styles.detailItem}>
            <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{label}</Text>
                {editing && !readOnly ? (
                    <TextInput
                        style={[
                            styles.detailInput,
                            multiline && { minHeight: 60, textAlignVertical: 'top' },
                        ]}
                        value={value}
                        onChangeText={onChangeText}
                        keyboardType={keyboardType}
                        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                        placeholderTextColor="#94a3b8"
                        multiline={multiline}
                        autoCapitalize={autoCapitalize}
                    />
                ) : (
                    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
                )}
                {readOnly && editing && (
                    <Text style={styles.readOnlyHint}>Cannot be changed</Text>
                )}
            </View>
            <View style={styles.detailIconContainer}>
                {/* <MaterialIcons name={icon as any} size={20} color="#6366f1" /> */}
            </View>
        </GlassView>
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
    editButton: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#6366f1',
        letterSpacing: 0.5,
    },
    saveButton: {
        height: 36,
        paddingHorizontal: 16,
        backgroundColor: '#6366f1',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    saveButtonText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },
    cancelButton: {
        height: 36,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
        paddingTop: 16,
    },
    profileCard: {
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        marginBottom: 32,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
    },
    avatarContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'white',
        backgroundColor: '#e0e7ff',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6366f1',
        padding: 6,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        alignItems: 'center',
        gap: 4,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.5,
    },
    profileRole: {
        fontSize: 11,
        fontWeight: '900',
        color: '#6366f1',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    profileCompany: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    detailsList: {
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        overflow: 'hidden',
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9ca3af',
        letterSpacing: 1.5,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1f2937',
    },
    detailInput: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e7ff',
    },
    readOnlyHint: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
        marginTop: 2,
        fontStyle: 'italic',
    },
    detailIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    // Visiting Card
    cardPreview: {
        borderRadius: 24,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        overflow: 'hidden',
    },
    visitingCardImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
    },
    changeCardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    removeCardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.2)',
    },
    changeCardText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6366f1',
        letterSpacing: 0.5,
    },
    uploadCard: {
        borderRadius: 24,
        padding: 40,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderWidth: 2,
        borderColor: 'rgba(99, 102, 241, 0.15)',
        borderStyle: 'dashed',
        alignItems: 'center',
        gap: 12,
    },
    uploadCardText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6366f1',
        letterSpacing: 1,
    },
    uploadCardHint: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        zIndex: 1,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '900',
        color: 'white',
    },
    footerSection: {
        marginTop: 8,
    },
    historyButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        shadowColor: '#f43f5e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
    },
    historyButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    historyButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1f2937',
    },
    memberSince: {
        textAlign: 'center',
        marginTop: 32,
        fontSize: 10,
        fontWeight: '800',
        color: '#9ca3af',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

const tpinProfileStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(99,102,241,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 24,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: 12,
        paddingHorizontal: 20,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        marginTop: 4,
    },
    errorText: {
        fontSize: 13,
        color: '#ef4444',
        fontWeight: '600',
    },
    actionBtn: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
});
