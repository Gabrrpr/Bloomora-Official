import * as LocalAuthentication from 'expo-local-authentication';

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

export async function getBiometricsAvailability(): Promise<BiometricsAvailability> {
  try {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const label = getBiometricsLabel(supportedTypes);

    if (!hasHardware) {
      return {
        hasHardware,
        isAvailable: false,
        isEnrolled,
        label,
        supportedTypes,
        unavailableReason: 'Biometrics are not available on this device.',
      };
    }

    if (!isEnrolled) {
      return {
        hasHardware,
        isAvailable: false,
        isEnrolled,
        label,
        supportedTypes,
        unavailableReason: 'Set up biometrics in your device settings first.',
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
      label: 'Biometrics',
      supportedTypes: [],
      unavailableReason: 'Biometric status could not be checked.',
    };
  }
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<BiometricsResult> {
  const availability = await getBiometricsAvailability();

  if (!availability.isAvailable) {
    return {
      error: availability.unavailableReason ?? 'Biometrics are unavailable.',
      success: false,
    };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      biometricsSecurityLevel: 'strong',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
      fallbackLabel: '',
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
      error: 'Biometric confirmation could not be started. Please try again or skip this step.',
      success: false,
    };
  }
}

function getAuthenticationErrorMessage(error?: string) {
  switch (error) {
    case 'app_cancel':
    case 'system_cancel':
      return 'Biometric confirmation was interrupted. Please try again.';
    case 'authentication_failed':
      return 'Fingerprint was not recognized. Please try again.';
    case 'lockout':
      return 'Too many attempts. Unlock your device and try again.';
    case 'not_available':
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'Set up fingerprint or screen lock in device settings first.';
    case 'timeout':
      return 'Biometric confirmation timed out. Please try again.';
    case 'user_cancel':
    case 'user_fallback':
      return 'Biometric confirmation was not completed.';
    default:
      return 'Biometric confirmation was not completed.';
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
