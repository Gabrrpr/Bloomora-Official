import { sampleProducts, type Product } from '@/constants/shop';
import { ApiError, apiFetch } from '@/services/api-client';
import { getAuthSession } from '@/services/auth-session';
import { getFeedWishlistIds } from '@/services/feed-wishlist';
import { shopApi } from '@/services/shop-api';

export type FeedTab = 'explore' | 'new' | 'for-you';
export type FeedBranch = 'all' | 'manila' | 'pampanga';

export type ContentAction =
  | { type: 'none' }
  | { label: string; targetId: string; type: 'product' }
  | { code: string; label: string; targetId: string; type: 'voucher' }
  | { label: string; route: string; targetId: string; type: 'feature' };

export type MediaAsset = {
  durationSeconds?: number | null;
  height: number;
  id: string;
  kind: 'image' | 'video';
  mimeType: string;
  posterUrl?: string | null;
  posterStoragePath?: string | null;
  sizeBytes?: number;
  storagePath?: string | null;
  url: string;
  width: number;
};

export type FeedPost = {
  action: ContentAction;
  badge?: string | null;
  branch: FeedBranch;
  caption?: string | null;
  expiresAt?: string | null;
  id: string;
  internalTitle: string;
  isLiked?: boolean;
  likeCount: number;
  media: MediaAsset;
  scheduledAt?: string | null;
  sortOrder: number;
  status: 'draft' | 'published';
  tab: FeedTab;
  title: string;
};

export type CategoryBanner = {
  accessibleLabel: string;
  action: ContentAction;
  branch: FeedBranch;
  expiresAt?: string | null;
  id: string;
  internalTitle: string;
  media: MediaAsset;
  scheduledAt?: string | null;
  sortOrder: number;
  status: 'draft' | 'published';
};

type LegacyMobileBannerResponse = {
  banner?: {
    campaign_id: string;
    cta_destination?: string | null;
    cta_label?: string | null;
    image_url: string;
    title: string;
  } | null;
};

export type MockProductFeedEntry = {
  id: string;
  score: number;
  type: 'product';
  product: {
    boost_level: 'none';
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
    rating: number;
    review_count: number;
    stock: number;
    tags: string[];
  };
};

export type MockPromotionFeedEntry = {
  id: string;
  type: 'promotion';
  promotion: {
    action: ContentAction;
    badge?: string | null;
    description?: string | null;
    id: string;
    is_liked: boolean;
    like_count: number;
    media_type: 'image' | 'video';
    media_url: string;
    poster_url?: string | null;
    title: string;
  };
};

export type MockMobileFeedEntry = MockProductFeedEntry | MockPromotionFeedEntry;

type ProductMetadata = Product & {
  averageRating?: number;
  occasions?: string[] | null;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  sold_count?: number;
  tags?: string[] | string | null;
  totalSold?: number;
};

const mockFeedPosts: FeedPost[] = [];
const mockCategoryBanners: CategoryBanner[] = [];

const mockMode = process.env.EXPO_PUBLIC_MOBILE_CONTENT_MODE === 'mock';
let refreshNonce = 0;
const forYouSensitiveTerms = [
  'buffet',
  'ceramic vase',
  'condolence',
  'congratulation stand',
  'event',
  'funeral',
  'funerary',
  'inaugural',
  'memorial',
  'opening',
  'pot',
  'reception',
  'standing arrangement',
  'sympathy',
  'tabletop arrangement',
  'urn',
  'vase',
  'vertical arrangement',
  'wreath',
  'wreath arrangement',
];
const forYouGiftTerms = ['accessory', 'add on', 'add-on', 'addon', 'chocolate', 'gift'];

function isActiveContent(item: FeedPost | CategoryBanner, branch: FeedBranch) {
  const now = Date.now();
  if (item.status !== 'published') return false;
  if (item.branch !== 'all' && item.branch !== branch) return false;
  if (item.scheduledAt && new Date(item.scheduledAt).getTime() > now) return false;
  if (item.expiresAt && new Date(item.expiresAt).getTime() < now) return false;
  return true;
}

function deterministicUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) % 10000) / 10000;
}

function productMetadata(product: Product) {
  return product as ProductMetadata;
}

function soldCount(product: Product) {
  const metadata = productMetadata(product);
  return Number(metadata.soldCount ?? metadata.sold_count ?? metadata.totalSold ?? 0);
}

function rating(product: Product) {
  const metadata = productMetadata(product);
  const value = Number(metadata.averageRating ?? metadata.rating ?? 0);
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 5) : 0;
}

function reviewCount(product: Product) {
  return Number(productMetadata(product).reviewCount ?? 0);
}

function freshness(product: Product) {
  if (!product.createdAt) return 0;
  const ageDays = Math.max((Date.now() - new Date(product.createdAt).getTime()) / 86_400_000, 0);
  return Math.exp(-ageDays / 30);
}

function normalize(value: number, maximum: number) {
  return maximum > 0 ? value / maximum : 0;
}

function getProductTermList(product: Product) {
  const metadata = productMetadata(product);
  const rawTags = Array.isArray(metadata.tags)
    ? metadata.tags
    : typeof metadata.tags === 'string'
      ? metadata.tags.split(',')
      : [];
  const rawOccasions = Array.isArray(metadata.occasions) ? metadata.occasions : [];
  return [
    product.categoryName,
    product.categoryId,
    product.productGroup,
    product.productType,
    product.name,
    product.description,
    product.tag,
    ...rawTags,
    ...rawOccasions,
  ]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean);
}

function getForYouProductBucket(product: Product) {
  const terms = getProductTermList(product);
  const haystack = terms.join(' ');
  if (forYouSensitiveTerms.some((term) => haystack.includes(term))) return null;
  if (terms.includes('bouquet') || haystack.includes('bouquet')) return 0;
  if (forYouGiftTerms.some((term) => haystack.includes(term))) return 1;
  return null;
}

async function rankProducts(products: Product[], tab: FeedTab) {
  const eligible = products.filter((product) => {
    if (product.isActive === false || (product.stock ?? 0) <= 0) return false;
    return tab !== 'for-you' || getForYouProductBucket(product) !== null;
  });
  const maximumSold = Math.max(...eligible.map(soldCount), 0);
  const wishlistIds = await getFeedWishlistIds().catch(() => new Set<string>());
  const preferredCategories = new Set(
    eligible
      .filter((product) => wishlistIds.has(product.id))
      .map((product) => product.categoryName || product.categoryId)
      .filter(Boolean),
  );
  return eligible
    .map((product) => {
      const sales = normalize(soldCount(product), maximumSold);
      const ratingScore = rating(product) / 5;
      const recent = freshness(product);
      const category = product.categoryName || product.categoryId;
      const affinity = preferredCategories.has(category) ? 1 : 0;
      let score = sales * 0.48 + ratingScore * 0.32 + recent * 0.2;
      if (tab === 'new') score = recent * 0.65 + sales * 0.2 + ratingScore * 0.15;
      if (tab === 'for-you') {
        score = preferredCategories.size > 0
          ? affinity * 0.4 + sales * 0.28 + ratingScore * 0.22 + recent * 0.1
          : sales * 0.55 + ratingScore * 0.25 + recent * 0.2;
      }
      const rotation = deterministicUnit(`${new Date().toISOString().slice(0, 10)}:${refreshNonce}:${tab}:${product.id}`) * 0.01;
      return {
        bucket: tab === 'for-you' ? getForYouProductBucket(product) ?? 0 : 0,
        product,
        score: score + rotation,
        wishlisted: wishlistIds.has(product.id),
      };
    })
    .sort((first, second) => first.bucket - second.bucket || second.score - first.score);
}

function mapProduct(item: Awaited<ReturnType<typeof rankProducts>>[number]): MockProductFeedEntry {
  const metadata = productMetadata(item.product);
  const rawTags = Array.isArray(metadata.tags)
    ? metadata.tags
    : typeof metadata.tags === 'string'
      ? metadata.tags.split(',')
      : [];
  return {
    id: item.product.id,
    score: Number(item.score.toFixed(5)),
    type: 'product',
    product: {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.product.priceCents / 100,
      original_price: item.product.originalPriceCents ? item.product.originalPriceCents / 100 : null,
      category: item.product.categoryName || item.product.categoryId,
      product_group: item.product.productGroup,
      product_type: item.product.productType,
      tags: rawTags.map((tag) => tag.trim()).filter(Boolean),
      image_url: item.product.imageUrl,
      stock: item.product.stock ?? 0,
      rating: rating(item.product),
      review_count: reviewCount(item.product),
      is_new: freshness(item.product) >= Math.exp(-1),
      is_wishlisted: item.wishlisted,
      boost_level: 'none',
    },
  };
}

function mapPost(post: FeedPost): MockPromotionFeedEntry {
  return {
    id: post.id,
    type: 'promotion',
    promotion: {
      id: post.id,
      title: post.title,
      description: post.caption,
      badge: post.badge,
      media_type: post.media.kind,
      media_url: post.media.url,
      poster_url: post.media.posterUrl,
      like_count: post.likeCount,
      is_liked: false,
      action: post.action,
    },
  };
}

function cursorOffset(cursor?: string | null) {
  if (!cursor) return 0;
  const parsed = Number(cursor.replace('mock-', ''));
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

export const mockMobileContentService = {
  mode: 'mock' as const,

  async getFeed({
    branch,
    cursor,
    forceRefresh,
    limit = 10,
    tab,
  }: {
    branch: FeedBranch;
    cursor?: string | null;
    forceRefresh?: boolean;
    limit?: number;
    tab: FeedTab;
  }) {
    if (forceRefresh) refreshNonce += 1;
    const catalog = await shopApi
      .getCatalog({ branch: branch === 'all' ? 'manila' : branch })
      .catch(() => ({
        products: sampleProducts.map((product, index) => ({
          ...product,
          categoryName: product.categoryName || product.categoryId.replace('cat-', ''),
          createdAt: new Date(Date.now() - index * 8 * 86_400_000).toISOString(),
          stock: 12 - index,
        })),
      }));
    const ranked = await rankProducts(catalog.products, tab);
    const posts = mockFeedPosts
      .filter((post) => post.tab === tab && isActiveContent(post, branch))
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map(mapPost);
    const allItems: MockMobileFeedEntry[] = [...posts, ...ranked.map(mapProduct)];
    const offset = cursorOffset(cursor);
    const items = allItems.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    return {
      branch,
      items,
      next_cursor: nextOffset < allItems.length ? `mock-${nextOffset}` : null,
      schema_version: 2,
      tab,
    };
  },

  async getCategoryBanners(branch: FeedBranch) {
    return mockCategoryBanners
      .filter((banner) => isActiveContent(banner, branch))
      .sort((first, second) => first.sortOrder - second.sortOrder);
  },
};

export const apiMobileContentService = {
  mode: 'api' as const,

  async getActiveFeedPosts(tab: FeedTab, branch: FeedBranch) {
    const session = await getAuthSession();
    return apiFetch<FeedPost[]>(
      `/mobile-content/feed-posts/active?tab=${encodeURIComponent(tab)}&branch=${encodeURIComponent(branch)}`,
      { token: session?.accessToken },
    );
  },

  async getCategoryBanners(branch: FeedBranch) {
    try {
      return await apiFetch<CategoryBanner[]>(
        `/mobile-content/banners/active?branch=${encodeURIComponent(branch)}`,
      );
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) {
        console.warn('Unable to load mobile category banners:', error);
      }

      return getLegacyCategoryBanners(branch);
    }
  },
};

async function getLegacyCategoryBanners(branch: FeedBranch): Promise<CategoryBanner[]> {
  const payload = await apiFetch<LegacyMobileBannerResponse>(
    `/mobile-feed/banner?branch=${encodeURIComponent(branch === 'all' ? 'manila' : branch)}`,
  ).catch((error) => {
    console.warn('Unable to load legacy mobile banner:', error);
    return null;
  });
  const banner = payload?.banner;

  if (!banner?.image_url) {
    return [];
  }

  return [
    {
      accessibleLabel: banner.title,
      action: legacyBannerAction(banner.cta_destination, banner.cta_label),
      branch,
      id: banner.campaign_id,
      internalTitle: banner.title,
      media: {
        height: 500,
        id: `legacy-banner-${banner.campaign_id}`,
        kind: 'image',
        mimeType: 'image/webp',
        url: banner.image_url,
        width: 1080,
      },
      sortOrder: 10,
      status: 'published',
    },
  ];
}

function legacyBannerAction(destination?: string | null, label?: string | null): ContentAction {
  if (!destination) {
    return { type: 'none' };
  }

  if (destination.startsWith('/product-details')) {
    const productId = destination.split('id=')[1]?.split('&')[0];

    if (productId) {
      return {
        label: label ?? 'View product',
        targetId: decodeURIComponent(productId),
        type: 'product',
      };
    }
  }

  return {
    label: label ?? 'Open',
    route: destination,
    targetId: destination,
    type: 'feature',
  };
}

export const mobileContentService = mockMode ? mockMobileContentService : apiMobileContentService;
export const isMockMobileContent = mobileContentService.mode === 'mock';
