import { completeOAuthSignInFromUrl, getOAuthCallbackUrl } from '@/services/auth-api';
import { isOAuthReturnUrl } from '@/utils/oauth-redirect';

export async function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (!isOAuthReturnUrl(path, getOAuthCallbackUrl())) return path;
  try {
    await completeOAuthSignInFromUrl(path);
    return '/(tabs)';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete social sign-in. Please try again.';
    return `/login?oauthError=${encodeURIComponent(message)}`;
  }
}
