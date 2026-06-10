import { apiFetch } from '@/services/api-client';
import { clearAuthSession, getAuthSession, saveAuthSession, type AuthSession, type AuthUser } from '@/services/auth-session';

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export async function loginWithPassword(identifier: string, password: string) {
  const response = await apiFetch<LoginResponse>('/auth/login', {
    body: JSON.stringify({
      email: identifier.trim(),
      password,
    }),
    method: 'POST',
  });

  const session: AuthSession = {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    user: response.user,
  };

  await saveAuthSession(session);

  return session;
}

export async function refreshAuthSession() {
  const currentSession = await getAuthSession();

  if (!currentSession?.refreshToken) {
    await clearAuthSession();
    return null;
  }

  try {
    const response = await apiFetch<RefreshResponse>('/auth/refresh', {
      body: JSON.stringify({
        refresh_token: currentSession.refreshToken,
      }),
      method: 'POST',
      skipAuthRefresh: true,
    });
    const nextSession: AuthSession = {
      ...currentSession,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type,
    };

    await saveAuthSession(nextSession);

    return nextSession;
  } catch {
    await clearAuthSession();
    return null;
  }
}
