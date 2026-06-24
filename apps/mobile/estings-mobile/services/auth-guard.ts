import { router } from 'expo-router';
import { Alert } from 'react-native';

import { getAuthSession, type AuthSession } from '@/services/auth-session';

export async function requireSignedIn(action = 'continue'): Promise<AuthSession | null> {
  const session = await getAuthSession();

  if (session) {
    return session;
  }

  Alert.alert('Sign in required', `Please sign in to ${action}.`, [
    { style: 'cancel', text: 'Not now' },
    { text: 'Sign in', onPress: () => router.push('/(auth)/login') },
  ]);

  return null;
}
