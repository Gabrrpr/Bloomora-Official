import type { CartItem, Product } from '@/constants/shop';
import { apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';
import { notifyCartUpdated } from '@/services/guest-cart';

type BackendProduct = {
  category?: string | null;
  description?: string | null;
  id: string;
  image_url?: string | null;
  is_available?: boolean | null;
  name: string;
  original_price?: number | null;
  price: number;
  product_group?: string | null;
  product_type?: string | null;
  stock?: number | null;
};

type BackendCartItem = {
  id: string;
  product: BackendProduct;
  product_id: string;
  quantity: number;
};

type CartResponse = {
  items: BackendCartItem[];
};

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapProduct(product: BackendProduct): Product {
  const category = product.category || 'Flowers';
  const price = Number(product.price || 0);
  const originalPrice = Number(product.original_price || 0);

  return {
    categoryId: `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    categoryName: toTitleCase(category),
    description: product.description || undefined,
    id: product.id,
    imageUrl: /^https?:\/\//i.test(product.image_url?.trim() || '')
      ? product.image_url?.trim()
      : undefined,
    isActive: product.is_available !== false,
    name: product.name,
    originalPriceCents:
      originalPrice > price ? Math.round(originalPrice * 100) : undefined,
    priceCents: Math.round(price * 100),
    productGroup: product.product_group ? toTitleCase(product.product_group) : undefined,
    productType: product.product_type ? toTitleCase(product.product_type) : undefined,
    stock: Number(product.stock ?? 0),
    tag: toTitleCase(category),
  };
}

function mapCartItems(response: CartResponse): CartItem[] {
  return response.items.map((item) => ({
    id: item.id,
    product: mapProduct(item.product),
    quantity: item.quantity,
  }));
}

async function mutateCart(
  path: string,
  session: AuthSession,
  options: RequestInit,
) {
  const response = await apiFetch<CartResponse>(path, {
    ...options,
    token: session.accessToken,
  });
  notifyCartUpdated();
  return mapCartItems(response);
}

export const userCartApi = {
  async add(product: Product, quantity: number, session: AuthSession) {
    return mutateCart('/cart/items', session, {
      body: JSON.stringify({ product_id: product.id, quantity }),
      method: 'POST',
    });
  },

  async get(session: AuthSession) {
    const response = await apiFetch<CartResponse>('/cart/', {
      token: session.accessToken,
    });
    return mapCartItems(response);
  },

  async remove(productId: string, session: AuthSession) {
    return mutateCart(`/cart/items/${encodeURIComponent(productId)}`, session, {
      method: 'DELETE',
    });
  },

  async sync(items: CartItem[], session: AuthSession) {
    if (!items.length) {
      const response = await apiFetch<CartResponse>('/cart/', {
        token: session.accessToken,
      });
      return mapCartItems(response);
    }

    return mutateCart('/cart/sync', session, {
      body: JSON.stringify({
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      }),
      method: 'POST',
    });
  },

  async update(productId: string, quantity: number, session: AuthSession) {
    return mutateCart(`/cart/items/${encodeURIComponent(productId)}`, session, {
      body: JSON.stringify({ product_id: productId, quantity }),
      method: 'PATCH',
    });
  },
};
