import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const authSessionFileUri = `${FileSystem.documentDirectory}auth-session.json`;
const authSessionStorageKey = 'estings.auth-session';

export type AuthUser = {
  address?: string | null;
  email: string;
  first_name?: string | null;
  id: string;
  last_name?: string | null;
  middle_name?: string | null;
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

let writeQueue = Promise.resolve();

export async function saveAuthSession(session: AuthSession) {
  const serializedSession = JSON.stringify(session);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(authSessionStorageKey, serializedSession);
    return;
  }

  writeQueue = writeQueue.then(() => FileSystem.writeAsStringAsync(authSessionFileUri, serializedSession));
  await writeQueue;
}

export async function getAuthSession() {
  if (Platform.OS === 'web') {
    const storedSession = globalThis.localStorage?.getItem(authSessionStorageKey);

    return storedSession ? parseAuthSession(storedSession) : null;
  }

  const fileInfo = await FileSystem.getInfoAsync(authSessionFileUri);

  if (!fileInfo.exists) {
    return null;
  }

  return parseAuthSession(await FileSystem.readAsStringAsync(authSessionFileUri));
}

export async function clearAuthSession() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(authSessionStorageKey);
    return;
  }

  writeQueue = writeQueue.then(() => FileSystem.deleteAsync(authSessionFileUri, { idempotent: true }));
  await writeQueue;
}

function parseAuthSession(serializedSession: string) {
  const parsed = JSON.parse(serializedSession) as Partial<AuthSession>;

  if (!parsed.accessToken || !parsed.user?.id) {
    return null;
  }

  return parsed as AuthSession;
}
