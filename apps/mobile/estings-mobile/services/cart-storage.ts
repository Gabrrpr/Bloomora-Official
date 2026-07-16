import type { AiArrangementCartInput, CartItem, Product } from '@/constants/shop';
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

function isAiArrangementProduct(product: Product) {
  return (
    product.id.startsWith('ai-arr-') ||
    product.productType?.toLowerCase() === 'ai arrangement' ||
    product.productType?.toLowerCase() === 'custom arrangement'
  );
}

function isLegacyLocalOnlyItem(item: CartItem) {
  return item.id.startsWith('guest-cart-') && isAiArrangementProduct(item.product);
}

function isCartableItem(item: CartItem) {
  return isLegacyLocalOnlyItem(item) || item.product.isVisible !== false;
}

function mergeRemoteAndLegacyItems(remoteItems: CartItem[], legacyItems: CartItem[]) {
  const remoteProductIds = new Set(remoteItems.map((item) => item.product.id));
  return [
    ...remoteItems,
    ...legacyItems.filter((item) => !remoteProductIds.has(item.product.id)),
  ];
}

async function getLegacyGeneratedItems() {
  return (await getGuestCartItems()).filter(isLegacyLocalOnlyItem);
}

function createAiArrangementCartItem(input: AiArrangementCartInput): CartItem {
  const productId = input.arrangementId || `ai-arr-${Date.now()}`;
  return {
    addOns: input.addOns,
    arrangementDetails: {
      ...input.arrangementDetails,
      arrangementId: input.arrangementDetails.arrangementId || input.arrangementId,
    },
    cardMessage: input.cardMessage?.trim() || undefined,
    id: `pending-ai-cart-${productId}`,
    product: {
      categoryId: 'cat-ai-arrangement',
      categoryName: 'Custom AI Arrangement',
      description: input.description,
      id: productId,
      imageUrl: input.imageUrl,
      isActive: true,
      isVisible: true,
      name: input.name,
      priceCents: input.priceCents,
      productGroup: 'Custom AI Arrangement',
      productType: 'AI Arrangement',
      stock: 1,
      tag: 'AI Generated',
    },
    quantity: 1,
  };
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
  const localOnlyItems = guestItems.filter(isLegacyLocalOnlyItem);
  if (guestItems.length) {
    let syncedItems = await userCartApi.sync(
      guestItems.filter((item) => !isLegacyLocalOnlyItem(item) && isCartableItem(item)),
      session,
    );
    try {
      for (const localItem of localOnlyItems) {
        syncedItems = await userCartApi.upsertCustom(localItem, session);
      }
      await setGuestCartItems([]);
    } catch (error) {
      await setGuestCartItems(localOnlyItems);
      console.warn('Generated cart items remain on this device because cloud sync failed.', error);
    }
    const items = mergeRemoteAndLegacyItems(syncedItems, await getLegacyGeneratedItems());
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
    const remoteItems = await userCartApi.add(product, quantity, session, cardMessage);
    const items = mergeRemoteAndLegacyItems(remoteItems, await getLegacyGeneratedItems());
    signedInCartCache = { items, userId: session.user.id };
    return items;
  }
  throw new Error('Please sign in to add items to your cart.');
}

export async function updateCartItemQuantity(productId: string, quantity: number) {
  const session = await getAuthSession();
  const guestItems = await getGuestCartItems();
  if (guestItems.some((item) => item.product.id === productId && isLegacyLocalOnlyItem(item))) {
    const localItems = await updateGuestCartItemQuantity(productId, quantity);
    if (!session) return localItems;
    const items = [...(await userCartApi.get(session)), ...localItems];
    signedInCartCache = { items, userId: session.user.id };
    return items;
  }
  if (!session) return updateGuestCartItemQuantity(productId, quantity);
  const remoteItems = await userCartApi.update(productId, quantity, session);
  const items = mergeRemoteAndLegacyItems(remoteItems, guestItems.filter(isLegacyLocalOnlyItem));
  signedInCartCache = { items, userId: session.user.id };
  return items;
}

export async function removeCartItem(productId: string) {
  const session = await getAuthSession();
  const guestItems = await getGuestCartItems();
  if (guestItems.some((item) => item.product.id === productId && isLegacyLocalOnlyItem(item))) {
    const localItems = await removeGuestCartItem(productId);
    if (!session) return localItems;
    const items = [...(await userCartApi.get(session)), ...localItems];
    signedInCartCache = { items, userId: session.user.id };
    return items;
  }
  if (!session) return removeGuestCartItem(productId);
  const remoteItems = await userCartApi.remove(productId, session);
  const items = mergeRemoteAndLegacyItems(remoteItems, guestItems.filter(isLegacyLocalOnlyItem));
  signedInCartCache = { items, userId: session.user.id };
  return items;
}

export async function setCartItems(items: CartItem[]) {
  const session = await getAuthSession();
  if (!session) {
    return setGuestCartItems(items);
  }

  const localOnlyItems = items.filter(isLegacyLocalOnlyItem);
  await setGuestCartItems(localOnlyItems);
  const databaseItems = items.filter((item) => !isLegacyLocalOnlyItem(item) && isCartableItem(item));
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

export async function addAiArrangementToCart(input: AiArrangementCartInput) {
  const session = await getAuthSession();
  if (!session) {
    throw new Error('Please sign in to add this arrangement to your cart.');
  }

  const remoteItems = await userCartApi.upsertCustom(createAiArrangementCartItem(input), session);
  const items = mergeRemoteAndLegacyItems(remoteItems, await getLegacyGeneratedItems());
  signedInCartCache = { items, userId: session.user.id };
  return items;
}
