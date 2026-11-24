/**
 * KeyboardAwareScreen
 *
 * A centralized keyboard-handling wrapper for the entire app.
 *
 * Why this approach?
 * ------------------
 * - On iOS, `KeyboardAvoidingView` with `behavior="padding"` shifts the entire
 *   view up by the keyboard height, preventing overlap.
 * - On Android, `windowSoftInputMode="adjustResize"` (set in AndroidManifest.xml)
 *   shrinks the window, but only when the root layout uses `flex: 1` correctly.
 *   We also add `behavior="height"` on Android as an extra safety net for nested
 *   layouts where the OS resize alone is insufficient (e.g., Modals, screens with
 *   position:absolute elements, or screens that use custom headers).
 * - `keyboardShouldPersistTaps="handled"` on ScrollView lets taps on buttons work
 *   while the keyboard is open, without accidentally dismissing it.
 * - `Keyboard.dismiss` on the outer wrapper lets users tap outside any input to
 *   hide the keyboard naturally.
 *
 * Usage:
 *   <KeyboardAwareScreen>
 *     ...your screen content...
 *   </KeyboardAwareScreen>
 *
 *   <KeyboardAwareScreen scrollable={false}>
 *     ...non-scrollable content (e.g., screens with a fixed layout)...
 *   </KeyboardAwareScreen>
 *
 *   <KeyboardAwareScreen
 *     stickyFooter={<MySubmitButton />}
 *     keyboardVerticalOffset={80}
 *   >
 *     ...form content...
 *   </KeyboardAwareScreen>
 */

import React from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    StyleSheet,
    View,
    ScrollViewProps,
    StyleProp,
    ViewStyle,
} from 'react-native';

interface KeyboardAwareScreenProps {
    /** Content to be rendered inside the scrollable area */
    children: React.ReactNode;

    /**
     * If true (default), wraps children in a ScrollView so the user can scroll
     * when the keyboard opens. Set to false for screens where you control the
     * scroll behaviour yourself (e.g., a screen that already contains a FlatList).
     */
    scrollable?: boolean;

    /**
     * Extra offset between the keyboard and the focused input.
     * Increase this value when your screen has a fixed header that overlaps the view.
     * Default: 0
     */
    keyboardVerticalOffset?: number;

    /**
     * Content to be rendered below the scroll area, pinned above the keyboard.
     * Useful for action buttons that must always stay visible.
     */
    stickyFooter?: React.ReactNode;

    /** Additional styles for the outermost KeyboardAvoidingView */
    style?: StyleProp<ViewStyle>;

    /** Additional styles for the ScrollView's contentContainerStyle */
    contentContainerStyle?: StyleProp<ViewStyle>;

    /** Forwarded to the inner ScrollView */
    scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;

    /**
     * If true, tapping anywhere outside a TextInput will dismiss the keyboard.
     * Default: true
     */
    dismissOnTap?: boolean;
}

export default function KeyboardAwareScreen({
    children,
    scrollable = true,
    keyboardVerticalOffset = 0,
    stickyFooter,
    style,
    contentContainerStyle,
    scrollViewProps,
    dismissOnTap = true,
}: KeyboardAwareScreenProps) {
    /**
     * Behaviour:
     *   - iOS  → 'padding' : pushes the whole view up by the keyboard height.
     *   - Android → 'height' : shrinks the KeyboardAvoidingView height; works in
     *     tandem with adjustResize from AndroidManifest.xml. Using 'height' is
     *     safer than 'padding' on Android because 'padding' can cause a
     *     double-offset when adjustResize is also active.
     */
    const behavior = Platform.OS === 'ios' ? 'padding' : 'height';

    const inner = scrollable ? (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            {...scrollViewProps}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.fill, contentContainerStyle]}>
            {children}
        </View>
    );

    const content = (
        <KeyboardAvoidingView
            style={[styles.fill, style]}
            behavior={behavior}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            {inner}
            {stickyFooter && (
                <View style={styles.stickyFooter}>
                    {stickyFooter}
                </View>
            )}
        </KeyboardAvoidingView>
    );

    if (!dismissOnTap || scrollable) {
        return content;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            {content}
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    fill: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    stickyFooter: {
        // The footer sits naturally at the bottom of the KeyboardAvoidingView,
        // so it automatically floats above the keyboard when it opens.
    },
});
