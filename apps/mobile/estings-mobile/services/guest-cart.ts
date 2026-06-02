import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { CartItem, Product } from '@/constants/shop';

const guestCartFileUri = `${FileSystem.documentDirectory}guest-cart.json`;
const guestCartStorageKey = 'estings.guest-cart';

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

function clampQuantity(quantity: number, stock?: number) {
  const maxQuantity = stock && stock > 0 ? stock : 99;

  return Math.min(Math.max(Math.round(quantity), 1), maxQuantity);
}

function sanitizeItems(items: CartItem[]) {
  return items.filter((item) => item.product?.id && item.quantity > 0);
}

async function writeGuestCart(items: CartItem[]) {
  const payload: GuestCartPayload = {
    items: sanitizeItems(items),
    version: 1,
  };

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(guestCartStorageKey, JSON.stringify(payload));
    return;
  }

  writeQueue = writeQueue.then(() => FileSystem.writeAsStringAsync(guestCartFileUri, JSON.stringify(payload)));
  await writeQueue;
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

export async function addGuestCartItem(product: Product, quantity = 1) {
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
