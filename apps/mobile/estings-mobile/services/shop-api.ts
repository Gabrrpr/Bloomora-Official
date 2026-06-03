import {
  type Category,
  getCartSummary,
  type Product,
  sampleCategories,
  sampleCreateOptions,
  sampleNotifications,
  sampleOrders,
  samplePromoSlides,
  sampleProducts,
  samplePromos,
} from '@/constants/shop';
import { apiFetch } from '@/services/api-client';
import { getGuestCartItems } from '@/services/guest-cart';

type BackendProduct = {
  category?: string | null;
  description?: string | null;
  id: string;
  image_url?: string | null;
  is_available?: boolean | null;
  name: string;
  price: number;
  product_group?: string | null;
  product_type?: string | null;
  stock?: number | null;
};

type CatalogRequestOptions = {
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

function mapBackendProduct(product: BackendProduct): Product {
  const category = product.category || 'Flowers';
  const productGroup = product.product_group || undefined;

  return {
    categoryId: toCategoryId(category),
    categoryName: toTitleCase(category),
    description: product.description || undefined,
    id: product.id,
    imageUrl: normalizeImageUrl(product.image_url),
    name: product.name,
    priceCents: Math.round(Number(product.price || 0) * 100),
    productGroup: productGroup ? toTitleCase(productGroup) : undefined,
    productType: product.product_type ? toTitleCase(product.product_type) : undefined,
    stock: Number(product.stock ?? 0),
    tag: toTitleCase(category),
  };
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

async function fetchBackendProducts() {
  const products = await apiFetch<BackendProduct[]>('/products/');
  return products
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

  if (!options.forceRefresh && productCache && now - productCache.storedAt < productCacheDurationMs) {
    return productCache.products;
  }

  if (!options.forceRefresh && productRequest) {
    return productRequest;
  }

  productRequest = fetchBackendProducts()
    .then((products) => {
      productCache = {
        products,
        storedAt: Date.now(),
      };

      return products;
    })
    .finally(() => {
      productRequest = null;
    });

  return productRequest;
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
      console.warn('Failed to load backend products.', error);
      return [];
    }
  },
  async getFeaturedProducts(options?: CatalogRequestOptions) {
    try {
      return await getBackendProducts(options);
    } catch (error) {
      console.warn('Failed to load backend products.', error);
      return [];
    }
  },
  async getCategories(options?: CatalogRequestOptions) {
    try {
      const products = await getBackendProducts(options);
      return getCategoriesFromProducts(products);
    } catch (error) {
      console.warn('Failed to load backend categories.', error);
      return [];
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
      console.warn('Failed to load backend catalog.', error);

      return {
        categories: [],
        products: [],
      };
    }
  },
  async getCart() {
    const items = await getGuestCartItems();

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
};
