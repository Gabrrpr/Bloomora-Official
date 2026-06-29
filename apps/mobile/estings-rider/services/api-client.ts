import { getAuthSession } from '@/services/auth-session';

export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.estings.shop/api/v1';

type ApiRequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
  token?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { headers, skipAuthRefresh = false, token, ...requestOptions } = options;
  const normalizedBaseUrl = DEFAULT_API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${normalizedBaseUrl}${normalizedPath}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(requestOptions.body && !(requestOptions.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && token && !skipAuthRefresh) {
    const { refreshAuthSession } = await import('@/services/auth-api');
    const nextSession = await refreshAuthSession();

    if (nextSession?.accessToken && nextSession.accessToken !== token) {
      return apiFetch<T>(path, {
        ...options,
        skipAuthRefresh: true,
        token: nextSession.accessToken,
      });
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body?.detail)) {
        message = body.detail
          .map((item: { loc?: unknown[]; msg?: string }) => {
            const field = Array.isArray(item.loc) ? item.loc.filter(Boolean).join('.') : '';
            return [field, item.msg].filter(Boolean).join(': ');
          })
          .filter(Boolean)
          .join('\n') || message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export async function apiFetchWithSession<T>(path: string, options: RequestInit = {}) {
  const session = await getAuthSession();

  if (!session?.accessToken) {
    throw new ApiError(401, 'Log in to continue.');
  }

  return apiFetch<T>(path, {
    ...options,
    token: session.accessToken,
  });
}
