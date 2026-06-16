import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://bloomora-api.onrender.com/api/v1';

const apiBaseUrlFileUri = `${FileSystem.documentDirectory}api-base-url.json`;
const apiBaseUrlStorageKey = 'estings.api-base-url';
const serviceUnavailableMessage = 'Unable to reach service (E-NETWORK-002). Please try again.';

let apiBaseUrl = DEFAULT_API_BASE_URL;
let hasLoadedStoredApiBaseUrl = false;
let writeQueue = Promise.resolve();

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

export async function assertNetworkConnection() {
  try {
    const networkState = await Network.getNetworkStateAsync();

    if (networkState.isConnected === false || networkState.isInternetReachable === false) {
      throw new ApiError(0, 'Connect to a network and try again (E-NETWORK-001).');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
  }
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export async function initializeApiBaseUrl() {
  if (hasLoadedStoredApiBaseUrl) {
    return apiBaseUrl;
  }

  hasLoadedStoredApiBaseUrl = true;

  try {
    const storedBaseUrl = await readStoredApiBaseUrl();

    if (storedBaseUrl) {
      apiBaseUrl = storedBaseUrl;
    }
  } catch {
    apiBaseUrl = DEFAULT_API_BASE_URL;
  }

  return apiBaseUrl;
}

export async function setApiBaseUrl(nextBaseUrl: string) {
  const normalizedBaseUrl = nextBaseUrl.trim().replace(/\/$/, '');

  if (!normalizedBaseUrl) {
    return resetApiBaseUrl();
  }

  apiBaseUrl = normalizedBaseUrl;
  hasLoadedStoredApiBaseUrl = true;
  await writeStoredApiBaseUrl(normalizedBaseUrl);

  return apiBaseUrl;
}

export async function resetApiBaseUrl() {
  apiBaseUrl = DEFAULT_API_BASE_URL;
  hasLoadedStoredApiBaseUrl = true;
  await clearStoredApiBaseUrl();

  return apiBaseUrl;
}

function buildUrl(path: string, baseUrl = getApiBaseUrl()) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { headers, skipAuthRefresh = false, token, ...requestOptions } = options;

  await initializeApiBaseUrl();
  await assertNetworkConnection();

  let response: Response;

  try {
    response = await fetchWithRecovery(path, requestOptions, headers, token);
  } catch (error) {
    await assertNetworkConnection();
    throw error instanceof ApiError ? error : new ApiError(0, serviceUnavailableMessage);
  }

  if (response.status === 401 && token && !skipAuthRefresh) {
    const { refreshAuthSession } = await import('@/services/auth-api');
    const nextSession = await refreshAuthSession();

    if (nextSession?.accessToken) {
      try {
        response = await fetchWithRecovery(path, requestOptions, headers, nextSession.accessToken);
      } catch (error) {
        await assertNetworkConnection();
        throw error instanceof ApiError ? error : new ApiError(0, serviceUnavailableMessage);
      }
    }
  }

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

async function fetchWithRecovery(
  path: string,
  requestOptions: RequestInit,
  headers: HeadersInit | undefined,
  token: string | undefined,
) {
  const currentBaseUrl = getApiBaseUrl();

  try {
    return await fetchFromBaseUrl(path, currentBaseUrl, requestOptions, headers, token);
  } catch {
    await assertNetworkConnection();
  }

  await sleep(700);

  try {
    return await fetchFromBaseUrl(path, currentBaseUrl, requestOptions, headers, token);
  } catch {
    await assertNetworkConnection();
  }

  if (normalizeBaseUrl(currentBaseUrl) !== normalizeBaseUrl(DEFAULT_API_BASE_URL)) {
    apiBaseUrl = DEFAULT_API_BASE_URL;
    hasLoadedStoredApiBaseUrl = true;
    await clearStoredApiBaseUrl();

    try {
      return await fetchFromBaseUrl(path, DEFAULT_API_BASE_URL, requestOptions, headers, token);
    } catch {
      await assertNetworkConnection();
    }
  }

  throw new ApiError(0, serviceUnavailableMessage);
}

function fetchFromBaseUrl(
  path: string,
  baseUrl: string,
  requestOptions: RequestInit,
  headers: HeadersInit | undefined,
  token: string | undefined,
) {
  return fetch(buildUrl(path, baseUrl), {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/$/, '').toLowerCase();
}

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function readStoredApiBaseUrl() {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(apiBaseUrlStorageKey) ?? null;
  }

  const fileInfo = await FileSystem.getInfoAsync(apiBaseUrlFileUri);

  if (!fileInfo.exists) {
    return null;
  }

  const storedPayload = JSON.parse(await FileSystem.readAsStringAsync(apiBaseUrlFileUri)) as Partial<{
    baseUrl: string;
  }>;

  return typeof storedPayload.baseUrl === 'string' && storedPayload.baseUrl.trim()
    ? storedPayload.baseUrl.trim().replace(/\/$/, '')
    : null;
}

async function writeStoredApiBaseUrl(baseUrl: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(apiBaseUrlStorageKey, baseUrl);
    return;
  }

  writeQueue = writeQueue.then(() => FileSystem.writeAsStringAsync(apiBaseUrlFileUri, JSON.stringify({ baseUrl })));
  await writeQueue;
}

async function clearStoredApiBaseUrl() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(apiBaseUrlStorageKey);
    return;
  }

  writeQueue = writeQueue.then(() => FileSystem.deleteAsync(apiBaseUrlFileUri, { idempotent: true }));
  await writeQueue;
}
