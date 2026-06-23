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

function isLocalOnlyItem(item: CartItem) {
  return (
    item.product.id.startsWith('ai-arr-') ||
    item.product.productType?.toLowerCase() === 'ai arrangement'
  );
}

export async function getCartItems() {
  const session = await getAuthSession();
  if (!session) {
    return getGuestCartItems();
  }

  const guestItems = await getGuestCartItems();
  const localOnlyItems = guestItems.filter(isLocalOnlyItem);
  if (guestItems.length) {
    const syncedItems = await userCartApi.sync(
      guestItems.filter((item) => !isLocalOnlyItem(item)),
      session,
    );
    await setGuestCartItems(localOnlyItems);
    return [...syncedItems, ...localOnlyItems];
  }

  return userCartApi.get(session);
}

export async function addCartItem(product: Product, quantity = 1, cardMessage?: string) {
  const session = await getAuthSession();
  if (session) {
    return userCartApi.add(product, quantity, session, cardMessage);
  }
  const items = await addGuestCartItem(product, quantity);
  if (cardMessage !== undefined) {
    const next = items.map((item) =>
      item.product.id === product.id ? { ...item, cardMessage: cardMessage.trim() || undefined } : item,
    );
    return setGuestCartItems(next);
  }
  return items;
}

export async function updateCartItemQuantity(productId: string, quantity: number) {
  const session = await getAuthSession();
  const guestItems = await getGuestCartItems();
  if (guestItems.some((item) => item.product.id === productId && isLocalOnlyItem(item))) {
    const localItems = await updateGuestCartItemQuantity(productId, quantity);
    return session ? [...(await userCartApi.get(session)), ...localItems] : localItems;
  }
  return session
    ? userCartApi.update(productId, quantity, session)
    : updateGuestCartItemQuantity(productId, quantity);
}

export async function removeCartItem(productId: string) {
  const session = await getAuthSession();
  const guestItems = await getGuestCartItems();
  if (guestItems.some((item) => item.product.id === productId && isLocalOnlyItem(item))) {
    const localItems = await removeGuestCartItem(productId);
    return session ? [...(await userCartApi.get(session)), ...localItems] : localItems;
  }
  return session
    ? userCartApi.remove(productId, session)
    : removeGuestCartItem(productId);
}

export async function setCartItems(items: CartItem[]) {
  const session = await getAuthSession();
  if (!session) {
    return setGuestCartItems(items);
  }

  const localOnlyItems = items.filter(isLocalOnlyItem);
  await setGuestCartItems(localOnlyItems);
  const databaseItems = items.filter((item) => !isLocalOnlyItem(item));
  const current = await userCartApi.get(session);
  const nextIds = new Set(databaseItems.map((item) => item.product.id));
  const removed = current.filter((item) => !nextIds.has(item.product.id));
  for (const item of removed) {
    await userCartApi.remove(item.product.id, session);
  }
  for (const item of databaseItems) {
    await userCartApi.update(item.product.id, item.quantity, session);
  }
  return [...(await userCartApi.get(session)), ...localOnlyItems];
}
