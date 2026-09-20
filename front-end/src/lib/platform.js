import { Capacitor } from '@capacitor/core';

/**
 * Utility functions to detect the current platform and native capabilities.
 * Useful for branching logic or UI rendering depending on Web vs Android vs iOS.
 */

// Returns true if running natively on an Android or iOS device
export const isNativePlatform = () => Capacitor.isNativePlatform();

// Returns the specific platform string: 'web', 'android', or 'ios'
export const getPlatform = () => Capacitor.getPlatform();

// Returns true specifically for Android
export const isAndroid = () => getPlatform() === 'android';

// Returns true specifically for iOS
export const isIOS = () => getPlatform() === 'ios';

// Returns true specifically for Web
export const isWeb = () => getPlatform() === 'web';
