import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { Product } from '@/constants/shop';
import { ApiError, apiFetch } from '@/services/api-client';
import { getAuthSession } from '@/services/auth-session';

export type FeedTab = 'explore' | 'new' | 'for-you';
export type FeedBranch = 'all' | 'manila' | 'pampanga';

export type ProductFeedEntry = {
  id: string;
  score: number;
  type: 'product';
  product: {
    boost_level: 'none' | 'low' | 'medium' | 'high';
    category: string;
    description?: string | null;
    id: string;
    image_url?: string | null;
    is_new: boolean;
    is_wishlisted: boolean;
    name: string;
    original_price?: number | null;
    price: number;
    product_group?: string | null;
    product_type?: string | null;
    tags: string[];
    rating: number;
    review_count: number;
    stock: number;
  };
};

export type PromotionFeedEntry = {
  id: string;
  type: 'promotion';
  promotion: {
    badge?: string | null;
    can_add_to_cart: boolean;
    cta_destination?: string | null;
    cta_label?: string | null;
    description?: string | null;
    id: string;
    is_liked: boolean;
    like_count: number;
    linked_product_id?: string | null;
    media_type: 'image' | 'video';
    media_url: string;
    poster_url?: string | null;
    title: string;
    voucher_code?: string | null;
  };
};

export type MobileFeedEntry = ProductFeedEntry | PromotionFeedEntry;

type FeedResponse = {
  branch: FeedBranch;
  items: MobileFeedEntry[];
  next_cursor: string | null;
  schema_version: number;
  tab: FeedTab;
};

export type FeedAnalyticsEvent = {
  branch: FeedBranch;
  event_type: 'impression' | 'open' | 'cta' | 'share' | 'like' | 'add_to_cart' | 'voucher_copy';
  item_id: string;
  item_type: MobileFeedEntry['type'];
  metadata?: Record<string, unknown>;
  tab: FeedTab;
};

const installationFileUri = `${FileSystem.documentDirectory}feed-installation-id.txt`;
const installationStorageKey = 'estings.feed-installation-id';
const feedSchemaVersion = 1;
const feedCacheFileUri = `${FileSystem.documentDirectory}mobile-feed-cache-v${feedSchemaVersion}.json`;
const feedCacheStorageKey = `estings.mobile-feed-cache-v${feedSchemaVersion}`;
let installationIdPromise: Promise<string> | null = null;
let feedCacheWriteQueue = Promise.resolve();

type FeedCache = Record<string, { cached_at: string; response: FeedResponse }>;

function feedCacheKey(tab: FeedTab, branch: FeedBranch) {
  return `${tab}:${branch}`;
}

async function readFeedCache(): Promise<FeedCache> {
  try {
    if (Platform.OS === 'web') {
      return JSON.parse(globalThis.localStorage?.getItem(feedCacheStorageKey) ?? '{}') as FeedCache;
    }
    const info = await FileSystem.getInfoAsync(feedCacheFileUri);
    return info.exists
      ? JSON.parse(await FileSystem.readAsStringAsync(feedCacheFileUri)) as FeedCache
      : {};
  } catch {
    return {};
  }
}

async function writeFeedCache(tab: FeedTab, branch: FeedBranch, response: FeedResponse) {
  feedCacheWriteQueue = feedCacheWriteQueue.then(async () => {
    const cache = await readFeedCache();
    cache[feedCacheKey(tab, branch)] = { cached_at: new Date().toISOString(), response };
    const serialized = JSON.stringify(cache);
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(feedCacheStorageKey, serialized);
      return;
    }
    await FileSystem.writeAsStringAsync(feedCacheFileUri, serialized);
  });
  await feedCacheWriteQueue;
}

async function getCachedFeed(tab: FeedTab, branch: FeedBranch) {
  const cached = (await readFeedCache())[feedCacheKey(tab, branch)]?.response;
  return cached?.schema_version === feedSchemaVersion ? cached : null;
}

async function authOptions(method: string, body?: unknown) {
  const session = await getAuthSession();
  return {
    body: body === undefined ? undefined : JSON.stringify(body),
    method,
    token: session?.accessToken,
  };
}

async function readInstallationId() {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(installationStorageKey) ?? null;
  }
  const info = await FileSystem.getInfoAsync(installationFileUri);
  return info.exists ? FileSystem.readAsStringAsync(installationFileUri) : null;
}

async function writeInstallationId(value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(installationStorageKey, value);
  } else {
    await FileSystem.writeAsStringAsync(installationFileUri, value);
  }
}

export async function getFeedInstallationId() {
  installationIdPromise ??= (async () => {
    const stored = await readInstallationId();
    if (stored?.trim()) {
      return stored.trim();
    }
    const next = globalThis.crypto?.randomUUID?.() ?? `install-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await writeInstallationId(next);
    return next;
  })();
  return installationIdPromise;
}

export function mapFeedProduct(entry: ProductFeedEntry): Product {
  return {
    categoryId: `cat-${entry.product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    categoryName: entry.product.category,
    description: entry.product.description ?? undefined,
    id: entry.product.id,
    imageUrl: entry.product.image_url ?? undefined,
    isActive: entry.product.stock > 0,
    name: entry.product.name,
    originalPriceCents: entry.product.original_price
      ? Math.round(entry.product.original_price * 100)
      : undefined,
    priceCents: Math.round(entry.product.price * 100),
    productGroup: entry.product.product_group ?? undefined,
    productType: entry.product.product_type ?? undefined,
    stock: entry.product.stock,
    tag: entry.product.category,
  };
}

export const mobileFeedApi = {
  async getFeed(input: {
    branch: FeedBranch;
    cursor?: string | null;
    limit?: number;
    tab: FeedTab;
  }) {
    const params = new URLSearchParams({
      branch: input.branch,
      limit: String(input.limit ?? 10),
      tab: input.tab,
    });
    if (input.cursor) {
      params.set('cursor', input.cursor);
    }
    try {
      const response = await apiFetch<FeedResponse>(`/mobile-feed?${params.toString()}`, await authOptions('GET'));
      if (response.schema_version !== feedSchemaVersion) {
        throw new ApiError(426, 'Feed update required. Please update the app and try again.');
      }
      if (!input.cursor) {
        await writeFeedCache(input.tab, input.branch, response);
      }
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError(426, 'Feed update required. The server must be updated before Home Feed can load.');
      }
      if (
        !input.cursor
        && error instanceof ApiError
        && (error.status === 0 || error.status >= 500)
      ) {
        const cached = await getCachedFeed(input.tab, input.branch);
        if (cached) {
          return cached;
        }
      }
      throw error;
    }
  },

  async likeCampaign(campaignId: string) {
    const installationId = await getFeedInstallationId();
    return apiFetch<{ is_liked: boolean; like_count: number }>(
      `/mobile-feed/campaigns/${encodeURIComponent(campaignId)}/like`,
      await authOptions('PUT', { installation_id: installationId }),
    );
  },

  async unlikeCampaign(campaignId: string) {
    const installationId = await getFeedInstallationId();
    return apiFetch<{ is_liked: boolean; like_count: number }>(
      `/mobile-feed/campaigns/${encodeURIComponent(campaignId)}/like?installation_id=${encodeURIComponent(installationId)}`,
      await authOptions('DELETE'),
    );
  },

  async setWishlist(productId: string, shouldSave: boolean) {
    return apiFetch<{ is_wishlisted: boolean }>(
      `/mobile-feed/wishlist/${encodeURIComponent(productId)}`,
      await authOptions(shouldSave ? 'PUT' : 'DELETE'),
    );
  },

  async track(events: FeedAnalyticsEvent[]) {
    if (!events.length) {
      return;
    }
    const installationId = await getFeedInstallationId();
    const sessionId = `feed-${new Date().toISOString().slice(0, 10)}-${installationId}`;
    await apiFetch('/mobile-feed/analytics', await authOptions('POST', {
      events: events.map((event) => ({
        ...event,
        installation_id: installationId,
        metadata: event.metadata ?? {},
        session_id: sessionId,
      })),
    }));
  },
};
