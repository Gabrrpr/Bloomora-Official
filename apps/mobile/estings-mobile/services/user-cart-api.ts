import type { CartItem, Product } from '@/constants/shop';
import { ApiError, apiFetch } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';
import { notifyCartUpdated } from '@/services/guest-cart';

type BackendProduct = {
  branches?: string[] | null;
  category?: string | null;
  description?: string | null;
  id: string;
  image_url?: string | null;
  is_available?: boolean | null;
  is_visible?: boolean | null;
  name: string;
  original_price?: number | null;
  price: number;
  product_group?: string | null;
  product_type?: string | null;
  stock?: number | null;
};

type BackendCartItem = {
  id: string;
  product: BackendProduct | null;
  product_id: string | null;
  quantity: number;
  web_item?: {
    card_message?: string;
    desc?: string;
    group?: string;
    id?: string;
    img?: string;
    name?: string;
    price?: number;
  };
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
    isVisible: product.is_visible === true,
    name: product.name,
    originalPriceCents:
      originalPrice > price ? Math.round(originalPrice * 100) : undefined,
    priceCents: Math.round(price * 100),
    productGroup: product.product_group ? toTitleCase(product.product_group) : undefined,
    productType: product.product_type ? toTitleCase(product.product_type) : undefined,
    stock: Number(product.stock ?? 0),
    branches: product.branches ?? [],
    tag: toTitleCase(category),
  };
}

function mapCartItems(response: CartResponse): CartItem[] {
  return response.items.map((item) => {
    if (item.product) {
      return {
        cardMessage: item.web_item?.card_message,
        id: item.id,
        product: mapProduct(item.product),
        quantity: item.quantity,
      };
    }
    const snapshot = item.web_item ?? {};
    const category = snapshot.group || 'Custom Arrangement';
    return {
      cardMessage: snapshot.card_message,
      id: item.id,
      product: {
        categoryId: `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        categoryName: category,
        description: snapshot.desc,
        id: snapshot.id || item.id,
        imageUrl: snapshot.img,
        isActive: true,
        name: snapshot.name || 'Custom Arrangement',
        priceCents: Math.round(Number(snapshot.price || 0) * 100),
        productGroup: category,
        productType: 'Custom Arrangement',
        stock: 99,
        tag: category,
      },
      quantity: item.quantity,
    };
  });
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
  async add(product: Product, quantity: number, session: AuthSession, cardMessage?: string) {
    return mutateCart('/cart/items', session, {
      body: JSON.stringify({ product_id: product.id, quantity, card_message: cardMessage }),
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
    const items = await this.get(session);
    const entry = items.find((item) => item.product.id === productId);
    if (!entry) return items;
    return mutateCart(`/cart/entries/${encodeURIComponent(entry.id)}`, session, {
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
          card_message: item.cardMessage,
        })),
      }),
      method: 'POST',
    });
  },

  async update(productId: string, quantity: number, session: AuthSession) {
    const items = await this.get(session);
    const entry = items.find((item) => item.product.id === productId);
    if (!entry) return items;

    try {
      return await mutateCart(`/cart/entries/${encodeURIComponent(entry.id)}`, session, {
        body: JSON.stringify({ quantity }),
        method: 'PATCH',
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 422) {
        throw error;
      }

      return mutateCart(`/cart/items/${encodeURIComponent(productId)}`, session, {
        body: JSON.stringify({ product_id: productId, quantity }),
        method: 'PATCH',
      });
    }
  },
};
