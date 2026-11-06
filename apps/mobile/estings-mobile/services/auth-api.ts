import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { apiFetch, getApiBaseUrl, initializeApiBaseUrl } from '@/services/api-client';
import { clearAuthSession, getAuthSession, saveAuthSession, type AuthSession, type AuthUser } from '@/services/auth-session';
import { OAUTH_NATIVE_CALLBACK_URL, OAUTH_WEB_BASE_URL, parseOAuthReturn } from '@/utils/oauth-redirect';

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
  delivery?: string;
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

export function getOAuthWebBaseUrl() {
  // Browser popups must return to their opener's origin. A native build's
  // website override must never send a web preview to a different application.
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return (process.env.EXPO_PUBLIC_WEB_URL ?? OAUTH_WEB_BASE_URL).replace(/\/$/, '');
}

export function getOAuthCallbackUrl() {
  return Platform.OS === 'web' ? `${getOAuthWebBaseUrl()}/oauth/callback` : OAUTH_NATIVE_CALLBACK_URL;
}

type OAuthAttempt = {
  webBaseUrl: string;
  expiresAt: number;
  appState?: string;
  verifier?: string;
  code?: string;
  completion?: Promise<AuthSession>;
};
let oauthAttempt: OAuthAttempt | null = null;

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
  const webBaseUrl = getOAuthWebBaseUrl();
  const callbackUrl = getOAuthCallbackUrl();
  const native = Platform.OS !== 'web';
  const hexNonce = () => Array.from(Crypto.getRandomBytes(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const verifier = native ? hexNonce() : undefined;
  const appState = native ? hexNonce() : undefined;
  const challenge = verifier ? (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : undefined;
  const attempt: OAuthAttempt = { webBaseUrl: native ? callbackUrl : webBaseUrl, appState, verifier, expiresAt: Date.now() + 5 * 60 * 1000 };
  oauthAttempt = attempt;
  const authQuery = native
    ? `client=mobile&code_challenge=${encodeURIComponent(challenge!)}&app_state=${appState}`
    : `frontend_url=${encodeURIComponent(webBaseUrl)}`;
  const authUrl = `${apiBaseUrl}/auth/${provider}?${authQuery}`;
  try {
    const authResult = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl, {
      preferEphemeralSession: false,
    });
    // App Links may deliver the callback through Expo Router before the browser
    // session resolves. Both paths share one exchange and session write.
    if (attempt.completion) return await attempt.completion;
    if (authResult.type !== 'success') {
      throw new Error(authResult.type === 'cancel'
        ? 'Sign in was cancelled.'
        : Platform.OS === 'web'
          ? 'The sign-in window closed before returning to this preview. Please try again.'
          : 'Sign-in did not return to the app. Please try again, or use email sign-in.');
    }
    return await completeOAuthSignInFromUrl(authResult.url);
  } finally {
    // Keep the completed attempt briefly so a late Router delivery of the same
    // App Link reuses it instead of sending a signed-in customer back to login.
    if (oauthAttempt === attempt && !attempt.completion) oauthAttempt = null;
  }
}

export function completeOAuthSignInFromUrl(url: string): Promise<AuthSession> {
  const attempt = oauthAttempt;
  if (!attempt || Date.now() > attempt.expiresAt) {
    return Promise.reject(new Error('Your sign-in session expired. Please start sign-in again in the app.'));
  }
  const code = parseOAuthReturn(url, attempt.webBaseUrl, attempt.appState);
  if (attempt.completion) {
    if (attempt.code !== code) return Promise.reject(new Error('A different sign-in is already completing. Please try again.'));
    return attempt.completion;
  }
  attempt.code = code;
  attempt.completion = exchangeOAuthSession(code, attempt);
  return attempt.completion;
}

async function exchangeOAuthSession(code: string, attempt: OAuthAttempt) {
  const exchange = await apiFetch<OAuthExchangeResponse>(attempt.verifier
    ? '/auth/oauth/exchange' : `/auth/oauth/exchange?code=${encodeURIComponent(code)}`, {
      skipAuthRefresh: true,
      ...(attempt.verifier ? {
        method: 'POST',
        body: JSON.stringify({ code, code_verifier: attempt.verifier }),
      } : {}),
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
  if (oauthAttempt !== attempt) throw new Error('Your sign-in session changed. Please try again.');
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
      otp: otp.trim(),
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
