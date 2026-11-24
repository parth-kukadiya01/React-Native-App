import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from './Icon';
import { B2B } from '../constants/Colors';

const {
    GOLD, GOLD_LIGHT, GOLD_DARK,
    NAVY, NAVY_CARD, NAVY_BORDER,
    TEXT_PRIMARY, TEXT_MUTED
} = B2B;

type MessageModalProps = {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    buttonText?: string;
    secondaryAction?: {
        label: string;
        icon?: string;
        onPress: () => void;
    };
};

const MessageModal = ({
    visible,
    title,
    message,
    type = 'success',
    onClose,
    buttonText = 'OK',
    secondaryAction,
}: MessageModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Top Decorative Line */}
                    <View style={styles.topLine} />

                    {/* Icon Circle */}
                    <View style={styles.iconRing}>
                        <LinearGradient
                            colors={[GOLD_DARK, GOLD, GOLD_LIGHT]}
                            style={styles.iconGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Icon
                                name={type === 'success' ? 'check-circle' : type === 'error' ? 'error-outline' : 'info'}
                                size={28}
                                color={NAVY}
                            />
                        </LinearGradient>
                    </View>

                    {/* Content */}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        {secondaryAction && (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.secondaryButton}
                                onPress={secondaryAction.onPress}
                            >
                                {secondaryAction.icon && (
                                    <Icon name={secondaryAction.icon as any} size={16} color={TEXT_PRIMARY} style={{ marginRight: 6 }} />
                                )}
                                <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.buttonContainer, secondaryAction ? { flex: 1 } : { width: '100%' }]}
                            onPress={onClose}
                        >
                            <LinearGradient
                                colors={[GOLD_DARK, GOLD, GOLD_LIGHT]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.buttonText}>{buttonText}</Text>
                                <Icon name="arrow-forward" size={16} color={NAVY} style={{ marginLeft: 6 }} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(28, 27, 27, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: NAVY_CARD,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        shadowColor: '#1C1B1Bs',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
        overflow: 'hidden',
    },
    topLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: GOLD,
    },
    iconRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        padding: 4,
        backgroundColor: 'rgba(201, 168, 76, 0.15)',
        marginBottom: 16,
    },
    iconGradient: {
        flex: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: GOLD,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 13,
        color: TEXT_MUTED,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 24,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#49454F',
        borderWidth: 1,
        borderColor: NAVY_BORDER,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 13,
        fontWeight: '800',
        color: TEXT_PRIMARY,
        letterSpacing: 1,
    },
    buttonContainer: {
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default MessageModal;
