import type { CartItem, Product } from '@/constants/shop';
import { getAuthSession } from '@/services/auth-session';
import {
  addGuestCartItem,
  getGuestCartItems,
  removeGuestCartItem,
  setGuestCartItems,
  updateGuestCartItemQuantity,
} from '@/services/guest-cart';
import { userCartApi } from '@/services/user-cart-api';

type CartReadOptions = {
  forceRefresh?: boolean;
};

let signedInCartCache: { items: CartItem[]; userId: string } | null = null;

function isLocalOnlyItem(item: CartItem) {
  return (
    item.product.id.startsWith('ai-arr-') ||
    item.product.productType?.toLowerCase() === 'ai arrangement'
  );
}

function isCartableItem(item: CartItem) {
  return isLocalOnlyItem(item) || item.product.isVisible !== false;
}

export function clearCartItemsCache() {
  signedInCartCache = null;
}

export async function getCartItems(options: CartReadOptions = {}) {
  const session = await getAuthSession();
  if (!session) {
    return getGuestCartItems();
  }

  const userId = session.user.id;
  if (!options.forceRefresh && signedInCartCache?.userId === userId) {
    return signedInCartCache.items;
  }

  const guestItems = await getGuestCartItems();
  const localOnlyItems = guestItems.filter(isLocalOnlyItem);
  if (guestItems.length) {
    const syncedItems = await userCartApi.sync(
      guestItems.filter((item) => !isLocalOnlyItem(item) && isCartableItem(item)),
      session,
    );
    await setGuestCartItems(localOnlyItems);
    const items = [...syncedItems, ...localOnlyItems];
    signedInCartCache = { items, userId };
    return items;
  }

  const items = await userCartApi.get(session);
  signedInCartCache = { items, userId };
  return items;
}

export async function addCartItem(product: Product, quantity = 1, cardMessage?: string) {
  if (product.isVisible === false) {
    throw new Error('This product is not available for cart checkout.');
  }

  const session = await getAuthSession();
  if (session) {
    const items = await userCartApi.add(product, quantity, session, cardMessage);
    signedInCartCache = { items, userId: session.user.id };
    return items;
  }
  throw new Error('Please sign in to add items to your cart.');
}

export async function updateCartItemQuantity(productId: string, quantity: number) {
  const session = await getAuthSession();
  const guestItems = await getGuestCartItems();
  if (guestItems.some((item) => item.product.id === productId && isLocalOnlyItem(item))) {
    const localItems = await updateGuestCartItemQuantity(productId, quantity);
    if (!session) return localItems;
    const items = [...(await userCartApi.get(session)), ...localItems];
    signedInCartCache = { items, userId: session.user.id };
    return items;
  }
  if (!session) return updateGuestCartItemQuantity(productId, quantity);
  const items = await userCartApi.update(productId, quantity, session);
  signedInCartCache = { items, userId: session.user.id };
  return items;
}

export async function removeCartItem(productId: string) {
  const session = await getAuthSession();
  const guestItems = await getGuestCartItems();
  if (guestItems.some((item) => item.product.id === productId && isLocalOnlyItem(item))) {
    const localItems = await removeGuestCartItem(productId);
    if (!session) return localItems;
    const items = [...(await userCartApi.get(session)), ...localItems];
    signedInCartCache = { items, userId: session.user.id };
    return items;
  }
  if (!session) return removeGuestCartItem(productId);
  const items = await userCartApi.remove(productId, session);
  signedInCartCache = { items, userId: session.user.id };
  return items;
}

export async function setCartItems(items: CartItem[]) {
  const session = await getAuthSession();
  if (!session) {
    return setGuestCartItems(items);
  }

  const localOnlyItems = items.filter(isLocalOnlyItem);
  await setGuestCartItems(localOnlyItems);
  const databaseItems = items.filter((item) => !isLocalOnlyItem(item) && isCartableItem(item));
  const current = await userCartApi.get(session);
  const nextIds = new Set(databaseItems.map((item) => item.product.id));
  const removed = current.filter((item) => !nextIds.has(item.product.id));
  for (const item of removed) {
    await userCartApi.remove(item.product.id, session);
  }
  for (const item of databaseItems) {
    await userCartApi.update(item.product.id, item.quantity, session);
  }
  const nextItems = [...(await userCartApi.get(session)), ...localOnlyItems];
  signedInCartCache = { items: nextItems, userId: session.user.id };
  return nextItems;
}
