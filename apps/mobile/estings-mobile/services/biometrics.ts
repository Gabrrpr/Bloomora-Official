import * as FileSystem from 'expo-file-system/legacy';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const localAuthenticationStorageKey = 'estings.local-authentication-enabled';
const localAuthenticationFileUri = `${FileSystem.documentDirectory}local-authentication-enabled.txt`;

export type BiometricsAvailability = {
  hasHardware: boolean;
  isAvailable: boolean;
  isEnrolled: boolean;
  label: string;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  unavailableReason?: string;
};

export type BiometricsResult = {
  error?: string;
  success: boolean;
};

export async function getLocalAuthenticationEnabled() {
  try {
    const storedValue = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(localAuthenticationStorageKey)
      : (await FileSystem.getInfoAsync(localAuthenticationFileUri)).exists
        ? await FileSystem.readAsStringAsync(localAuthenticationFileUri)
        : null;

    return storedValue === 'true';
  } catch {
    return false;
  }
}

export async function setLocalAuthenticationEnabled(enabled: boolean) {
  const storedValue = String(enabled);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(localAuthenticationStorageKey, storedValue);
    return;
  }

  await FileSystem.writeAsStringAsync(localAuthenticationFileUri, storedValue);
}

export async function getBiometricsAvailability(): Promise<BiometricsAvailability> {
  try {
    const [hasHardware, isBiometricEnrolled, supportedTypes, enrolledLevel] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);

    const hasDeviceAuthentication = enrolledLevel !== LocalAuthentication.SecurityLevel.NONE;
    const hasBiometricAuthentication = enrolledLevel >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;
    const isEnrolled = isBiometricEnrolled || hasDeviceAuthentication;
    const label = hasBiometricAuthentication && supportedTypes.length
      ? getBiometricsLabel(supportedTypes)
      : hasDeviceAuthentication
        ? 'Screen lock'
        : 'Device authentication';

    if (!hasDeviceAuthentication) {
      return {
        hasHardware,
        isAvailable: false,
        isEnrolled,
        label,
        supportedTypes,
        unavailableReason: 'Set up a fingerprint, face scan, PIN, or pattern in your device settings first.',
      };
    }

    return {
      hasHardware,
      isAvailable: true,
      isEnrolled,
      label,
      supportedTypes,
    };
  } catch {
    return {
      hasHardware: false,
      isAvailable: false,
      isEnrolled: false,
      label: 'Device authentication',
      supportedTypes: [],
      unavailableReason: 'Device authentication could not be checked.',
    };
  }
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<BiometricsResult> {
  const availability = await getBiometricsAvailability();

  if (!availability.isAvailable) {
    return {
      error: availability.unavailableReason ?? 'Device authentication is unavailable.',
      success: false,
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      biometricsSecurityLevel: 'weak',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use device passcode',
      promptMessage,
      requireConfirmation: true,
    });

    if (result.success) {
      return { success: true };
    }

    return {
      error: getAuthenticationErrorMessage(result.error),
      success: false,
    };
  } catch {
    return {
      error: 'Device confirmation could not be started. Please try again.',
      success: false,
    };
  }
}

function getAuthenticationErrorMessage(error?: string) {
  switch (error) {
    case 'app_cancel':
    case 'system_cancel':
      return 'Device confirmation was interrupted. Please try again.';
    case 'authentication_failed':
      return 'That did not match. Please try again.';
    case 'lockout':
      return 'Too many attempts. Unlock your device and try again.';
    case 'not_available':
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'Set up fingerprint or screen lock in device settings first.';
    case 'timeout':
      return 'Device confirmation timed out. Please try again.';
    case 'user_cancel':
    case 'user_fallback':
      return 'Device confirmation was cancelled.';
    default:
      return 'Device confirmation was not completed.';
  }
}

function getBiometricsLabel(types: LocalAuthentication.AuthenticationType[]) {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }

  return 'Biometrics';
}
