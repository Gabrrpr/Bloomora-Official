import {
  type Category,
  getCartSummary,
  type Product,
  sampleCartItems,
  sampleCategories,
  sampleCreateOptions,
  sampleNotifications,
  sampleOrders,
  samplePromoSlides,
  sampleProducts,
  samplePromos,
} from '@/constants/shop';
import { apiFetch } from '@/services/api-client';

type BackendProduct = {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
};

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

function mapBackendProduct(product: BackendProduct): Product {
  const category = product.category || 'Flowers';

  return {
    id: product.id,
    name: product.name,
    priceCents: Math.round(Number(product.price || 0) * 100),
    tag: toTitleCase(category),
    categoryId: toCategoryId(category),
    imageUrl: product.image_url || sampleProducts[0].imageUrl,
  };
}

function getCategoriesFromProducts(products: Product[]): Category[] {
  const counts = new Map<string, { name: string; count: number }>();

  for (const product of products) {
    const current = counts.get(product.categoryId);
    counts.set(product.categoryId, {
      name: current?.name ?? product.tag,
      count: (current?.count ?? 0) + 1,
    });
  }

  return Array.from(counts, ([id, value]) => ({
    id,
    name: value.name,
    itemCount: value.count,
  }));
}

async function getBackendProducts() {
  const products = await apiFetch<BackendProduct[]>('/products');
  return products.map(mapBackendProduct);
}

export const shopSnapshot = {
  cartItems: sampleCartItems,
  cartSummary: getCartSummary(sampleCartItems),
  categories: sampleCategories,
  createOptions: sampleCreateOptions,
  featuredProducts: sampleProducts,
  notifications: sampleNotifications,
  orders: sampleOrders,
  promoSlides: samplePromoSlides,
  promos: samplePromos,
};

export const shopApi = {
  async getFeaturedProducts() {
    try {
      return await getBackendProducts();
    } catch (error) {
      console.warn('Failed to load backend products. Falling back to samples.', error);
      return sampleProducts;
    }
  },
  async getCategories() {
    try {
      const products = await getBackendProducts();
      return getCategoriesFromProducts(products);
    } catch (error) {
      console.warn('Failed to load backend categories. Falling back to samples.', error);
      return sampleCategories;
    }
  },
  async getCart() {
    return {
      items: sampleCartItems,
      summary: getCartSummary(sampleCartItems),
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
