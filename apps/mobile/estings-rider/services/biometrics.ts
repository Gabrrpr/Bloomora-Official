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
        unavailableReason: 'Screen lock is not available on this device.',
      };
    }

    if (!isEnrolled) {
      return {
        hasHardware,
        isAvailable: false,
        isEnrolled,
        label,
        supportedTypes,
        unavailableReason: 'Set up screen lock or fingerprint in device settings first.',
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
      label: 'Screen lock',
      supportedTypes: [],
      unavailableReason: 'Screen lock status could not be checked.',
    };
  }
}

export async function authenticateWithScreenLock(promptMessage: string): Promise<BiometricsResult> {
  const availability = await getBiometricsAvailability();

  if (!availability.isAvailable) {
    return {
      error: availability.unavailableReason ?? 'Screen lock is unavailable.',
      success: false,
    };
  }

  const result = await LocalAuthentication.authenticateAsync({
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use device passcode',
    promptMessage,
  });

  if (result.success) {
    return { success: true };
  }

  return {
    error: 'Screen lock was not completed.',
    success: false,
  };
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

  return 'Screen lock';
}
