import { Platform } from 'react-native';

const authSessionStorageKey = 'estings.rider.auth-session';

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

let memorySession: AuthSession | null = null;

export async function saveAuthSession(session: AuthSession) {
  memorySession = session;

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(authSessionStorageKey, JSON.stringify(session));
  }
}

export async function getAuthSession() {
  if (memorySession) {
    return memorySession;
  }

  if (Platform.OS !== 'web') {
    return null;
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
  }
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
