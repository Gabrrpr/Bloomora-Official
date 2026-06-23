import {
  type Category,
  getCartSummary,
  type Product,
  type ProductColor,
  sampleCategories,
  sampleCreateOptions,
  sampleNotifications,
  sampleOrders,
  samplePromoSlides,
  sampleProducts,
  samplePromos,
} from '@/constants/shop';
import { ApiError, apiFetch } from '@/services/api-client';
import { getCartItems } from '@/services/cart-storage';

export type BackendProduct = {
  branch?: string | null;
  branch_name?: string | null;
  branches?: string[] | null;
  category?: string | null;
  created_at?: string | null;
  description?: string | null;
  care_guide?: string | string[] | null;
  id: string;
  image_url?: string | null;
  is_available?: boolean | null;
  is_visible?: boolean | null;
  is_flash_sale?: boolean | null;
  is_promoted?: boolean | null;
  name: string;
  original?: number | null;
  original_price?: number | null;
  price: number;
  product_group?: string | null;
  product_type?: string | null;
  status?: string | null;
  stock?: number | null;
};

type BackendProductColor = {
  hex?: string | null;
  id: string;
  name?: string | null;
};

type BackendProductReview = {
  comment?: string | null;
  created_at?: string | null;
  id: string;
  image_url?: string | null;
  star_rating?: number | null;
  user_id?: string | null;
  user_name?: string | null;
};

type BackendProductRating = {
  average_rating?: number | null;
  review_count?: number | null;
};

export type ProductReview = {
  comment?: string;
  createdAt?: string;
  id: string;
  imageUrl?: string;
  rating: number;
  userName?: string;
};

export type ProductRatingSummary = {
  averageRating: number;
  reviewCount: number;
};

export type ShopHeroSlide = {
  accent?: string;
  cta?: string;
  ctaSecondary?: string;
  ctaSecondaryNav?: string;
  description: string;
  headline: string;
  id: number | string;
  image?: string | null;
  tag: string;
};

type CatalogRequestOptions = {
  branch?: 'all' | 'manila' | 'pampanga';
  forceRefresh?: boolean;
};

const productCacheDurationMs = 30_000;
let productCache: { products: Product[]; storedAt: number } | null = null;
let productRequest: Promise<Product[]> | null = null;

function toCategoryId(category?: string | null) {
  return `cat-${(category || 'flowers').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeImageUrl(imageUrl?: string | null) {
  const trimmedUrl = imageUrl?.trim();

  if (!trimmedUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return undefined;
}

function normalizeCareGuide(value?: string | string[] | null) {
  const entries = Array.isArray(value) ? value : value?.split(/\r?\n/);
  return entries?.map((entry) => entry.trim()).filter(Boolean) ?? [];
}

function normalizeBranch(branch?: string | null) {
  const normalizedBranch = branch?.trim().toLowerCase();

  if (!normalizedBranch) {
    return undefined;
  }

  if (normalizedBranch.includes('manila')) {
    return 'manila';
  }

  if (normalizedBranch.includes('pampanga')) {
    return 'pampanga';
  }

  if (normalizedBranch === 'all') {
    return 'all';
  }

  return normalizedBranch;
}

function normalizeHexColor(hex?: string | null) {
  const trimmedHex = hex?.trim();

  if (!trimmedHex) {
    return '#E5E7EB';
  }

  return trimmedHex.startsWith('#') ? trimmedHex : `#${trimmedHex}`;
}

function mapBackendProductColor(color: BackendProductColor): ProductColor {
  return {
    hex: normalizeHexColor(color.hex),
    id: color.id,
    name: color.name?.trim() || 'Color',
  };
}

function mapBackendProductReview(review: BackendProductReview): ProductReview {
  return {
    comment: review.comment?.trim() || undefined,
    createdAt: review.created_at || undefined,
    id: review.id,
    imageUrl: normalizeImageUrl(review.image_url),
    rating: Number(review.star_rating ?? 0),
    userName: review.user_name?.trim() || undefined,
  };
}

export function mapBackendProduct(product: BackendProduct): Product {
  const category = product.category || 'Flowers';
  const productGroup = product.product_group || undefined;
  const normalizedBranches = (product.branches ?? [])
    .map((value) => normalizeBranch(value))
    .filter((value): value is string => Boolean(value));
  const branch = normalizeBranch(product.branch_name ?? product.branch) ?? normalizedBranches[0];
  const originalPrice = Number(product.original_price ?? product.original ?? 0);
  const price = Number(product.price || 0);

  return {
    branch,
    branches: normalizedBranches,
    categoryId: toCategoryId(category),
    categoryName: toTitleCase(category),
    createdAt: product.created_at || undefined,
    description: product.description || undefined,
    careGuide: normalizeCareGuide(product.care_guide),
    id: product.id,
    imageUrl: normalizeImageUrl(product.image_url),
    isActive: product.is_available !== false,
    isFlashSale: product.is_flash_sale === true,
    isPromoted: product.is_promoted === true,
    name: product.name,
    originalPriceCents: originalPrice > price ? Math.round(originalPrice * 100) : undefined,
    priceCents: Math.round(price * 100),
    productGroup: productGroup ? toTitleCase(productGroup) : undefined,
    productType: product.product_type ? toTitleCase(product.product_type) : undefined,
    stock: Number(product.stock ?? 0),
    tag: toTitleCase(category),
  };
}

function isCustomerCatalogProduct(product: BackendProduct) {
  const category = product.category?.trim().toLowerCase();
  const status = product.status?.trim().toLowerCase();

  return (
    product.is_available !== false &&
    product.is_visible !== false &&
    category !== 'advertisement' &&
    status !== 'inactive'
  );
}

function getCategoriesFromProducts(products: Product[]): Category[] {
  const counts = new Map<string, { count: number; name: string; productGroup?: string; totalStock: number }>();

  for (const product of products) {
    const current = counts.get(product.categoryId);
    counts.set(product.categoryId, {
      count: (current?.count ?? 0) + 1,
      name: current?.name ?? product.categoryName ?? product.tag,
      productGroup: current?.productGroup ?? product.productGroup,
      totalStock: (current?.totalStock ?? 0) + (product.stock ?? 0),
    });
  }

  return Array.from(counts, ([id, value]) => ({
    id,
    itemCount: value.count,
    name: value.name,
    productGroup: value.productGroup,
    totalStock: value.totalStock,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

function buildCatalogPath(options: CatalogRequestOptions = {}) {
  const params = new URLSearchParams();

  if (options.branch && options.branch !== 'all') {
    params.set('branch', options.branch);
  }

  const query = params.toString();

  return query ? `/products/?${query}` : '/products/';
}

async function fetchBackendProducts(options: CatalogRequestOptions = {}) {
  const products = await apiFetch<BackendProduct[]>(buildCatalogPath(options));
  return products
    .filter(isCustomerCatalogProduct)
    .map(mapBackendProduct)
    .sort((first, second) => {
      const imagePriority = Number(Boolean(second.imageUrl)) - Number(Boolean(first.imageUrl));

      if (imagePriority !== 0) {
        return imagePriority;
      }

      return first.name.localeCompare(second.name);
    });
}

async function getBackendProducts(options: CatalogRequestOptions = {}) {
  const now = Date.now();
  const canUseCache = !options.forceRefresh && (!options.branch || options.branch === 'all');

  if (canUseCache && productCache && now - productCache.storedAt < productCacheDurationMs) {
    return productCache.products;
  }

  if (canUseCache && productRequest) {
    return productRequest;
  }

  const request = fetchBackendProducts(options)
    .then((products) => {
      if (!options.branch || options.branch === 'all') {
        productCache = {
          products,
          storedAt: Date.now(),
        };
      }

      return products;
    })
    .finally(() => {
      productRequest = null;
    });

  if (canUseCache) {
    productRequest = request;
  }

  return request;
}

function toCatalogError(error: unknown) {
  if (error instanceof ApiError && error.status === 0) {
    return error;
  }

  return new Error('Unable to reach catalog (E-CATALOG-001). Check your connection and try again.');
}

export const shopSnapshot = {
  cartItems: [],
  cartSummary: getCartSummary([]),
  categories: sampleCategories,
  createOptions: sampleCreateOptions,
  featuredProducts: sampleProducts,
  notifications: sampleNotifications,
  orders: sampleOrders,
  promoSlides: samplePromoSlides,
  promos: samplePromos,
};

export const shopApi = {
  async getProducts(options?: CatalogRequestOptions) {
    try {
      return await getBackendProducts(options);
    } catch (error) {
      console.warn('Failed to load catalog products.', error);
      throw toCatalogError(error);
    }
  },
  async getProductColors(productId: string) {
    try {
      const colors = await apiFetch<BackendProductColor[]>(`/products/${encodeURIComponent(productId)}/colors`);
      return colors.map(mapBackendProductColor);
    } catch {
      return [];
    }
  },
  async getAddOns(options?: CatalogRequestOptions) {
    const products = await getBackendProducts(options);
    return products.filter((product) => {
      const category = product.categoryName?.trim().toLowerCase();
      return category === 'add on' || category === 'add-on' || category === 'addon';
    });
  },
  async getProductRating(productId: string): Promise<ProductRatingSummary> {
    try {
      const rating = await apiFetch<BackendProductRating>(`/reviews/product/${encodeURIComponent(productId)}/rating`);
      return {
        averageRating: Number(rating.average_rating ?? 0),
        reviewCount: Number(rating.review_count ?? 0),
      };
    } catch {
      return { averageRating: 0, reviewCount: 0 };
    }
  },
  async getProductReviews(productId: string) {
    try {
      const reviews = await apiFetch<BackendProductReview[]>(`/reviews/product/${encodeURIComponent(productId)}`);
      return reviews.map(mapBackendProductReview);
    } catch {
      return [];
    }
  },
  async getFeaturedProducts(options?: CatalogRequestOptions) {
    try {
      return await getBackendProducts(options);
    } catch (error) {
      console.warn('Failed to load featured products.', error);
      throw toCatalogError(error);
    }
  },
  async getRecommendations(limit = 12) {
    const products = await apiFetch<BackendProduct[]>(`/recommendations/home?limit=${limit}`);
    return products.filter(isCustomerCatalogProduct).map(mapBackendProduct);
  },
  async getCategories(options?: CatalogRequestOptions) {
    try {
      const products = await getBackendProducts(options);
      return getCategoriesFromProducts(products);
    } catch (error) {
      console.warn('Failed to load catalog categories.', error);
      throw toCatalogError(error);
    }
  },
  async getCatalog(options?: CatalogRequestOptions) {
    try {
      const products = await getBackendProducts(options);

      return {
        categories: getCategoriesFromProducts(products),
        products,
      };
    } catch (error) {
      console.warn('Failed to load catalog.', error);
      throw toCatalogError(error);
    }
  },
  async getCart() {
    const items = await getCartItems();

    return {
      items,
      summary: getCartSummary(items),
    };
  },
  async getOrders() {
    return sampleOrders;
  },
  async getNotifications() {
    return sampleNotifications;
  },
  async getPromoSlides() {
    return samplePromoSlides;
  },
  async getCreateOptions() {
    return sampleCreateOptions;
  },
  async getHeroSlides() {
    return apiFetch<{ slides: ShopHeroSlide[] }>('/site-customization/hero');
  },
};
