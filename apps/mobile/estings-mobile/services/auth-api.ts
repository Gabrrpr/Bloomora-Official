import * as WebBrowser from 'expo-web-browser';

import { apiFetch, getApiBaseUrl, initializeApiBaseUrl } from '@/services/api-client';
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

type OAuthProvider = 'facebook' | 'google';

type OAuthExchangeResponse = {
  access_token: string;
  refresh_token?: string;
  role?: string;
  token_type: string;
};

type AuthMessageResponse = {
  message?: string;
  status?: string;
};

type RegisterResponse = AuthMessageResponse & {
  user_id?: string;
};

type ProfilePictureResponse = {
  success?: boolean;
  url?: string | null;
};

type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  username?: string;
};

type UpdateProfileResponse = AuthMessageResponse & {
  user: AuthUser;
};

const productionWebBaseUrl = 'https://blueviolet-otter-621683.hostingersite.com';
const defaultWebBaseUrl = process.env.EXPO_PUBLIC_WEB_URL ?? (__DEV__ ? 'http://localhost:5173' : productionWebBaseUrl);

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

  await ensureCustomerSession(session);
  await saveAuthSession(session);

  return session;
}

export async function loginWithOAuthProvider(provider: OAuthProvider) {
  await initializeApiBaseUrl();

  const apiBaseUrl = getApiBaseUrl().replace(/\/$/, '');
  const webCallbackUrl = `${defaultWebBaseUrl.replace(/\/$/, '')}/oauth/callback`;
  const authUrl = `${apiBaseUrl}/auth/${provider}`;
  const authResult = await WebBrowser.openAuthSessionAsync(authUrl, webCallbackUrl, {
    preferEphemeralSession: false,
  });

  if (authResult.type !== 'success') {
    throw new Error('Sign in was cancelled.');
  }

  const code = getOAuthCodeFromUrl(authResult.url);

  if (!code) {
    throw new Error('OAuth sign in did not return a valid code.');
  }

  const exchange = await apiFetch<OAuthExchangeResponse>(`/auth/oauth/exchange?code=${encodeURIComponent(code)}`, {
    skipAuthRefresh: true,
  });
  const user = await apiFetch<AuthUser>('/auth/me', {
    skipAuthRefresh: true,
    token: exchange.access_token,
  });
  const session: AuthSession = {
    accessToken: exchange.access_token,
    refreshToken: exchange.refresh_token,
    tokenType: exchange.token_type,
    user: {
      ...user,
      role: user.role ?? exchange.role,
    },
  };

  await ensureCustomerSession(session);
  await saveAuthSession(session);

  return session;
}

export async function sendSignUpOtp(email: string) {
  return apiFetch<AuthMessageResponse>('/auth/send-otp', {
    body: JSON.stringify({
      email: email.trim(),
    }),
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function verifySignUpOtp(email: string, otp: string) {
  return apiFetch<AuthMessageResponse>('/auth/verify-otp', {
    body: JSON.stringify({
      email: email.trim(),
      otp: otp.trim(),
    }),
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function registerWithPassword({
  address,
  email,
  firstName,
  lastName,
  password,
  phoneNumber,
}: {
  address?: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
}) {
  return apiFetch<RegisterResponse>('/auth/register', {
    body: JSON.stringify({
      address: address?.trim() || undefined,
      email: email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      password,
      phone_number: phoneNumber?.trim() || undefined,
    }),
    method: 'POST',
    skipAuthRefresh: true,
  });
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

export async function uploadProfilePicture(imageUri: string, session: AuthSession) {
  const extension = getImageExtension(imageUri);
  const form = new FormData();
  form.append('file', {
    name: `profile-${Date.now()}.${extension}`,
    type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    uri: imageUri,
  } as never);

  const response = await apiFetch<ProfilePictureResponse>('/users/profile/upload-picture', {
    body: form,
    method: 'POST',
    token: session.accessToken,
  });

  const nextSession: AuthSession = {
    ...session,
    user: {
      ...session.user,
      profile_picture_url: response.url ?? session.user.profile_picture_url ?? null,
    },
  };

  await saveAuthSession(nextSession);

  return nextSession;
}

export async function updateMyProfile(payload: UpdateProfilePayload, session: AuthSession) {
  const response = await apiFetch<UpdateProfileResponse>('/users/me', {
    body: JSON.stringify({
      first_name: payload.firstName?.trim(),
      last_name: payload.lastName?.trim(),
      middle_name: payload.middleName?.trim() || null,
      phone_number: payload.phoneNumber?.trim(),
      username: payload.username?.trim(),
    }),
    method: 'PATCH',
    token: session.accessToken,
  });

  const nextSession: AuthSession = {
    ...session,
    user: response.user,
  };

  await saveAuthSession(nextSession);

  return nextSession;
}

export async function deleteMyAccount(password: string, session: AuthSession) {
  const response = await apiFetch<AuthMessageResponse>('/users/me', {
    body: JSON.stringify({ password }),
    method: 'DELETE',
    token: session.accessToken,
  });

  await clearAuthSession();

  return response;
}

function getOAuthCodeFromUrl(url: string) {
  try {
    return new URL(url).searchParams.get('code');
  } catch {
    const match = /[?&]code=([^&]+)/.exec(url);

    return match ? decodeURIComponent(match[1]) : null;
  }
}

async function ensureCustomerSession(session: AuthSession) {
  const role = session.user.role?.trim().toLowerCase();

  if (role && role !== 'customer') {
    await clearAuthSession();
    throw new Error('Only customer accounts can log in to Esting\'s Mobile.');
  }
}

function getImageExtension(uri: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const match = /\.(jpe?g|png|webp)$/i.exec(cleanUri);

  if (!match) {
    return 'jpg';
  }

  return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
}
