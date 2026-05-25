export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1';

let apiBaseUrl = DEFAULT_API_BASE_URL;

type ApiRequestOptions = RequestInit & {
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

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function setApiBaseUrl(nextBaseUrl: string) {
  const normalizedBaseUrl = nextBaseUrl.trim().replace(/\/$/, '');

  if (!normalizedBaseUrl) {
    apiBaseUrl = DEFAULT_API_BASE_URL;
    return apiBaseUrl;
  }

  apiBaseUrl = normalizedBaseUrl;
  return apiBaseUrl;
}

export function resetApiBaseUrl() {
  apiBaseUrl = DEFAULT_API_BASE_URL;
  return apiBaseUrl;
}

function buildUrl(path: string) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { headers, token, ...requestOptions } = options;

  const response = await fetch(buildUrl(path), {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') {
        message = body.detail;
      }
    } catch {
      // Keep the status-based fallback message.
    }

    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}
