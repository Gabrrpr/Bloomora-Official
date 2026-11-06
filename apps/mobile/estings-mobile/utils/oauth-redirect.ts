export const OAUTH_WEB_BASE_URL = 'https://estings.shop';
export const OAUTH_NATIVE_CALLBACK_URL = 'bloomoramobile://oauth/callback';

const providerErrors: Record<string, string> = {
  google_auth_failed: 'Google sign-in could not be completed. Please try again.',
  facebook_auth_failed: 'Facebook sign-in could not be completed. Please try again.',
  facebook_email_required: 'Allow Facebook to share your email address, or sign in with email.',
};

export function getOAuthErrorMessage(error: string) {
  return providerErrors[error] ?? 'Social sign-in failed. Please try again.';
}

export function parseOAuthReturn(url: string, webBaseUrl: string, appState?: string) {
  const expected = new URL(webBaseUrl);
  const received = new URL(url);
  const native = expected.protocol === 'bloomoramobile:';
  if (native ? received.protocol !== expected.protocol || received.host !== expected.host || received.pathname !== expected.pathname
    : received.origin !== expected.origin) {
    throw new Error('Sign-in returned from an unexpected website. Please try again.');
  }

  if (native && (!appState || received.searchParams.get('state') !== appState)) {
    throw new Error('Sign-in did not match this login attempt. Please try again.');
  }

  if ((native || received.pathname === '/login') && received.searchParams.has('error')) {
    throw new Error(getOAuthErrorMessage(received.searchParams.get('error') ?? ''));
  }
  if (!native && received.pathname !== '/oauth/callback') {
    throw new Error('Sign-in did not return to the expected callback. Please try again.');
  }
  const code = received.searchParams.get('code');
  if (!code) throw new Error('Sign-in did not return a valid code. Please try again.');
  return code;
}

export function isOAuthReturnUrl(url: string, webBaseUrl: string) {
  try {
    const received = new URL(url);
    if (webBaseUrl === OAUTH_NATIVE_CALLBACK_URL) {
      return received.protocol === 'bloomoramobile:' && received.host === 'oauth' && received.pathname === '/callback';
    }
    return received.origin === new URL(webBaseUrl).origin && (
      received.pathname === '/oauth/callback'
      || (received.pathname === '/login' && received.searchParams.has('error'))
    );
  } catch {
    return false;
  }
}
