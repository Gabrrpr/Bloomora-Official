import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { CartItem, Product } from '@/constants/shop';

const guestCartFileUri = `${FileSystem.documentDirectory}guest-cart.json`;
const guestCartStorageKey = 'estings.guest-cart';
const cartUpdatedEventName = 'estings:cart-updated';

type GuestCartPayload = {
  items: CartItem[];
  version: 1;
};

let writeQueue = Promise.resolve();

function createCartItem(product: Product, quantity: number): CartItem {
  return {
    id: `guest-cart-${product.id}`,
    product,
    quantity,
  };
}

function isLocalOnlyProduct(product: Product) {
  return (
    product.id.startsWith('ai-arr-') ||
    product.productType?.toLowerCase() === 'ai arrangement'
  );
}

function isCartableProduct(product: Product) {
  return isLocalOnlyProduct(product) || product.isVisible !== false;
}

function clampQuantity(quantity: number, stock?: number) {
  const maxQuantity = stock && stock > 0 ? stock : 99;

  return Math.min(Math.max(Math.round(quantity), 1), maxQuantity);
}

function sanitizeItems(items: CartItem[]) {
  return items.filter((item) => item.product?.id && item.quantity > 0 && isCartableProduct(item.product));
}

async function writeGuestCart(items: CartItem[]) {
  const payload: GuestCartPayload = {
    items: sanitizeItems(items),
    version: 1,
  };

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(guestCartStorageKey, JSON.stringify(payload));
    dispatchCartUpdated();
    return;
  }

  writeQueue = writeQueue.then(() => FileSystem.writeAsStringAsync(guestCartFileUri, JSON.stringify(payload)));
  await writeQueue;
  dispatchCartUpdated();
}

function dispatchCartUpdated() {
  globalThis.dispatchEvent?.(new Event(cartUpdatedEventName));
}

export function notifyCartUpdated() {
  dispatchCartUpdated();
}

export function addCartUpdatedListener(listener: () => void) {
  globalThis.addEventListener?.(cartUpdatedEventName, listener);

  return () => {
    globalThis.removeEventListener?.(cartUpdatedEventName, listener);
  };
}

export async function getGuestCartItems() {
  if (Platform.OS === 'web') {
    const storedCart = globalThis.localStorage?.getItem(guestCartStorageKey);

    if (!storedCart) {
      return [];
    }

    const parsed = JSON.parse(storedCart) as Partial<GuestCartPayload>;

    if (!Array.isArray(parsed.items)) {
      return [];
    }

    return sanitizeItems(parsed.items);
  }

  const fileInfo = await FileSystem.getInfoAsync(guestCartFileUri);

  if (!fileInfo.exists) {
    return [];
  }

  const fileContents = await FileSystem.readAsStringAsync(guestCartFileUri);
  const parsed = JSON.parse(fileContents) as Partial<GuestCartPayload>;

  if (!Array.isArray(parsed.items)) {
    return [];
  }

  return sanitizeItems(parsed.items);
}

export async function setGuestCartItems(items: CartItem[]) {
  await writeGuestCart(items);
  return sanitizeItems(items);
}

export async function addGuestCartItem(product: Product, quantity = 1) {
  if (!isCartableProduct(product)) {
    throw new Error('This product is not available for cart checkout.');
  }

  const items = await getGuestCartItems();
  const existingItem = items.find((item) => item.product.id === product.id);

  if (existingItem) {
    const nextItems = items.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: clampQuantity(item.quantity + quantity, item.product.stock) }
        : item,
    );

    await writeGuestCart(nextItems);
    return nextItems;
  }

  const nextItems = [...items, createCartItem(product, clampQuantity(quantity, product.stock))];
  await writeGuestCart(nextItems);
  return nextItems;
}

export async function updateGuestCartItemQuantity(productId: string, quantity: number) {
  const items = await getGuestCartItems();
  const nextItems = items
    .map((item) =>
      item.product.id === productId
        ? { ...item, quantity: clampQuantity(quantity, item.product.stock) }
        : item,
    )
    .filter((item) => item.quantity > 0);

  await writeGuestCart(nextItems);
  return nextItems;
}

export async function removeGuestCartItem(productId: string) {
  const items = await getGuestCartItems();
  const nextItems = items.filter((item) => item.product.id !== productId);

  await writeGuestCart(nextItems);
  return nextItems;
}

export type AiArrangementCartInput = {
  addOns?: Product[];
  arrangementId?: string;
  cardMessage?: string;
  description: string;
  imageUrl?: string;
  name: string;
  priceCents: number;
};

export async function addAiArrangementToCart(input: AiArrangementCartInput) {
  const productId = input.arrangementId || `ai-arr-${Date.now()}`;

  const syntheticProduct: Product = {
    categoryId: 'cat-ai-arrangement',
    categoryName: 'Custom AI Arrangement',
    description: input.description,
    id: productId,
    imageUrl: input.imageUrl,
    isActive: true,
    isVisible: true,
    name: input.name,
    priceCents: input.priceCents,
    productType: 'Ai Arrangement',
    stock: 1,
    tag: 'AI Generated',
  };

  const items = await getGuestCartItems();
  const nextItems = [
    ...items,
    {
      ...createCartItem(syntheticProduct, 1),
      addOns: input.addOns,
      cardMessage: input.cardMessage?.trim() || undefined,
    },
  ];

  await writeGuestCart(nextItems);
  return nextItems;
}
