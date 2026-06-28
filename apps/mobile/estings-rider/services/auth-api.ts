import { apiFetch } from '@/services/api-client';
import {
  clearAuthSession,
  clearRememberedRider,
  getAuthSession,
  getRememberedRider,
  saveAuthSession,
  saveRememberedRider,
  type AuthSession,
  type AuthUser,
} from '@/services/auth-session';

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

type AuthMessageResponse = {
  message?: string;
  status?: string;
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
  const rememberedRider = await getRememberedRider();
  await saveRememberedRider({
    biometricEnabled: rememberedRider?.id === response.user.id ? rememberedRider.biometricEnabled : false,
    email: response.user.email,
    firstName: response.user.first_name ?? null,
    id: response.user.id,
    lastLoginAt: new Date().toISOString(),
    lastName: response.user.last_name ?? null,
    username: response.user.username ?? null,
  });

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

export async function sendForgotPasswordOtp(email: string) {
  return apiFetch<AuthMessageResponse>('/auth/forgot-password/send-otp', {
    body: JSON.stringify({
      email: email.trim(),
    }),
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function resetForgotPassword({
  email,
  newPassword,
  otp,
}: {
  email: string;
  newPassword: string;
  otp: string;
}) {
  return apiFetch<AuthMessageResponse>('/auth/forgot-password/reset', {
    body: JSON.stringify({
      email: email.trim(),
      new_password: newPassword,
      otp,
    }),
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function logout({ forgetAccount = false }: { forgetAccount?: boolean } = {}) {
  await clearAuthSession();

  if (forgetAccount) {
    await clearRememberedRider();
  }
}
