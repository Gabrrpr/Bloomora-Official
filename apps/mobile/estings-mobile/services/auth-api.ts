import { apiFetch } from '@/services/api-client';
import { saveAuthSession, type AuthSession, type AuthUser } from '@/services/auth-session';

type LoginResponse = {
  access_token: string;
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

  const session: AuthSession = {
    accessToken: response.access_token,
    tokenType: response.token_type,
    user: response.user,
  };

  await saveAuthSession(session);

  return session;
}
