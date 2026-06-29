import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { getAuthSession } from '@/services/auth-session';
import { ApiError, apiFetch } from '@/services/api-client';

const fileUri = `${FileSystem.documentDirectory}feed-wishlist.json`;
const storageKey = 'estings.feed-wishlist';

async function readIds(): Promise<string[]> {
  try {
    const raw = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(storageKey)
      : (await FileSystem.getInfoAsync(fileUri)).exists
        ? await FileSystem.readAsStringAsync(fileUri)
        : null;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

async function writeIds(ids: string[]) {
  const raw = JSON.stringify([...new Set(ids)]);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(storageKey, raw);
  } else {
    await FileSystem.writeAsStringAsync(fileUri, raw);
  }
}

export async function getFeedWishlistIds() {
  const localIds = await readIds();
  const session = await getAuthSession();
  if (!session) {
    return new Set(localIds);
  }
  try {
    if (localIds.length) {
      const merged = await apiFetch<{ product_ids: string[] }>('/mobile-feed/wishlist/merge', {
        body: JSON.stringify({ product_ids: localIds }),
        method: 'POST',
        token: session.accessToken,
      });
      await writeIds([]);
      return new Set(merged.product_ids);
    }
    const remote = await apiFetch<{ product_ids: string[] }>('/mobile-feed/wishlist', {
      token: session.accessToken,
    });
    return new Set(remote.product_ids);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return new Set(localIds);
    }
    throw error;
  }
}

export async function setFeedWishlistId(productId: string, shouldSave: boolean) {
  const session = await getAuthSession();
  if (session) {
    try {
      await apiFetch(`/mobile-feed/wishlist/${encodeURIComponent(productId)}`, {
        method: shouldSave ? 'PUT' : 'DELETE',
        token: session.accessToken,
      });
      return;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }
    }
  }
  const ids = new Set(await readIds());
  if (shouldSave) {
    ids.add(productId);
  } else {
    ids.delete(productId);
  }
  await writeIds([...ids]);
}

export async function getSavedWishlistProducts<T extends { id: string }>(products: T[]) {
  const wishlistIds = await getFeedWishlistIds();
  return products.filter((product) => wishlistIds.has(product.id));
}
