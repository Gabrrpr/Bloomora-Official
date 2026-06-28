import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const authSessionStorageKey = 'estings.rider.auth-session';
const rememberedRiderStorageKey = 'estings.rider.remembered-account';

export type AuthUser = {
  branch?: string | null;
  email: string;
  first_name?: string | null;
  id: string;
  last_name?: string | null;
  phone_number?: string | null;
  profile_picture_url?: string | null;
  role?: string | null;
  username?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  user: AuthUser;
};

export type RememberedRider = {
  biometricEnabled: boolean;
  email: string;
  firstName?: string | null;
  id: string;
  lastLoginAt: string;
  lastName?: string | null;
  username?: string | null;
};

let memorySession: AuthSession | null = null;
let memoryRememberedRider: RememberedRider | null = null;

export async function saveAuthSession(session: AuthSession) {
  memorySession = session;
  const serializedSession = JSON.stringify(session);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(authSessionStorageKey, serializedSession);
    return;
  }

  await SecureStore.setItemAsync(authSessionStorageKey, serializedSession);
}

export async function getAuthSession() {
  if (memorySession) {
    return memorySession;
  }

  if (Platform.OS !== 'web') {
    const storedSession = await SecureStore.getItemAsync(authSessionStorageKey);

    return storedSession ? parseAuthSession(storedSession) : null;
  }

  const storedSession = globalThis.localStorage?.getItem(authSessionStorageKey);
  if (!storedSession) {
    return null;
  }

  return parseAuthSession(storedSession);
}

export async function clearAuthSession() {
  memorySession = null;

  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(authSessionStorageKey);
    return;
  }

  await SecureStore.deleteItemAsync(authSessionStorageKey);
}

export async function saveRememberedRider(rider: RememberedRider) {
  memoryRememberedRider = rider;
  const serializedRider = JSON.stringify(rider);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(rememberedRiderStorageKey, serializedRider);
    return;
  }

  await SecureStore.setItemAsync(rememberedRiderStorageKey, serializedRider);
}

export async function getRememberedRider() {
  if (memoryRememberedRider) {
    return memoryRememberedRider;
  }

  const storedRider =
    Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(rememberedRiderStorageKey)
      : await SecureStore.getItemAsync(rememberedRiderStorageKey);

  if (!storedRider) {
    return null;
  }

  return parseRememberedRider(storedRider);
}

export async function clearRememberedRider() {
  memoryRememberedRider = null;

  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(rememberedRiderStorageKey);
    return;
  }

  await SecureStore.deleteItemAsync(rememberedRiderStorageKey);
}

export async function forgetDeviceAccount() {
  await clearAuthSession();
  await clearRememberedRider();
}

function parseAuthSession(serializedSession: string) {
  try {
    const parsed = JSON.parse(serializedSession) as Partial<AuthSession>;

    if (!parsed.accessToken || !parsed.user?.id) {
      return null;
    }

    memorySession = parsed as AuthSession;
    return memorySession;
  } catch {
    return null;
  }
}

function parseRememberedRider(serializedRider: string) {
  try {
    const parsed = JSON.parse(serializedRider) as Partial<RememberedRider>;

    if (!parsed.id || !parsed.email) {
      return null;
    }

    memoryRememberedRider = {
      biometricEnabled: Boolean(parsed.biometricEnabled),
      email: parsed.email,
      firstName: parsed.firstName ?? null,
      id: parsed.id,
      lastLoginAt: parsed.lastLoginAt ?? new Date().toISOString(),
      lastName: parsed.lastName ?? null,
      username: parsed.username ?? null,
    };

    return memoryRememberedRider;
  } catch {
    return null;
  }
}
