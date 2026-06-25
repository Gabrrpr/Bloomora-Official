import { apiFetch } from '@/services/api-client';
import { clearAuthSession, saveAuthSession, type AuthSession, type AuthUser } from '@/services/auth-session';

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
};

export async function loginWithPassword(identifier: string, password: string) {
  const response = await apiFetch<LoginResponse>('/auth/login', {
    body: JSON.stringify({
      email: identifier.trim(),
      password,
    }),
    method: 'POST',
  });

  if (response.user.role !== 'delivery') {
    await clearAuthSession();
    throw new Error('Use a delivery rider account to open this app.');
  }

  const session: AuthSession = {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    user: response.user,
  };

  await saveAuthSession(session);
  return session;
}

export async function logout() {
  await clearAuthSession();
}
