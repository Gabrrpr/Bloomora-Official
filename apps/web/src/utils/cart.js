import { api } from "../services/api.js"

const GUEST_CART_KEY = "bloomora_cart_guest"
let cartCache = []

function isAuthenticated() {
  const token = localStorage.getItem("access_token")
  return Boolean(token && token !== "null" && token !== "undefined")
}

function broadcastCartUpdate(items = cartCache) {
  cartCache = items
  window.dispatchEvent(new CustomEvent("bloomora:cart-updated", { detail: { items } }))
}

function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || []
  } catch {
    return []
  }
}

function getLegacyAccountCartKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    return user?.email ? `bloomora_cart_${user.email}` : null
  } catch {
    return null
  }
}

function getAccountCartBackupKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    const key = user?.id || user?.email
    return key ? `bloomora_cart_account_${key}` : null
  } catch {
    return null
  }
}

function readAccountCartBackup() {
  const key = getAccountCartBackupKey()
  if (!key) return []
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function writeAccountCartBackup(items) {
  const key = getAccountCartBackupKey()
  if (key) localStorage.setItem(key, JSON.stringify(items))
}

function writeGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  broadcastCartUpdate(items)
  return items
}

function normalizeCartItem(entry) {
  const product = entry?.product || {}
  const webItem = entry?.web_item || {}
  const id = webItem.id || product.id || entry?.product_id || entry?.id
  const qty = Number(entry?.quantity || webItem.qty || 1)

  return {
    ...webItem,
    id,
    cartItemId: webItem.cartItemId || entry?.id,
    group: webItem.group || product.product_group || product.category || "Catalog",
    name: webItem.name || product.name || "Cart item",
    desc: webItem.desc || product.description || product.category || "",
    price: Number(webItem.price ?? product.price ?? 0),
    img: webItem.img || webItem.image || webItem.image_url || product.image_url || "",
    checked: webItem.checked === true,
    qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
  }
}

function mapResponse(response) {
  return (response?.items || []).map(normalizeCartItem).filter(item => item.id)
}

export function getCachedCart() {
  return cartCache
}

export async function getCart() {
  if (!isAuthenticated()) {
    const items = readGuestCart()
    cartCache = items
    return items
  }
  try {
    const items = mapResponse(await api.get("/cart/"))
    cartCache = items
    writeAccountCartBackup(items)
    return items
  } catch (error) {
    const backup = readAccountCartBackup()
    cartCache = backup
    if (backup.length) {
      broadcastCartUpdate(backup)
      return backup
    }
    throw error
  }
}

export async function clearCart() {
  return setCart([])
}

export async function setCart(items) {
  if (!isAuthenticated()) {
    return writeGuestCart(items)
  }
  const nextItems = mapResponse(await api.put("/cart/web", { items }))

  broadcastCartUpdate(nextItems)
  writeAccountCartBackup(nextItems)
  return nextItems
}

export function getCartCount(items = cartCache) {
  return items.reduce((sum, item) => sum + (item.qty || 1), 0)
}

export async function addToCart(item) {
  if (!isAuthenticated()) {
    const cart = readGuestCart()
    const existing = cart.find((entry) => entry.id === item.id && entry.group === item.group)
    if (existing) Object.assign(existing, item, { qty: (existing.qty || 1) + (item.qty || 1), checked: item.checked === true })
    else cart.push({ ...item, checked: item.checked === true, qty: item.qty || 1 })
    writeGuestCart(cart)
    return cart
  }

  try {
    // 🚀 CRITICAL FIX: Use /cart/web/items and send { item } as the payload
    // This allows the backend WebCartItemPayload to accept custom "arr-..." IDs!
    const response = await api.post("/cart/web/items", { item: { ...item, checked: item.checked === true } });
    
    const nextItems = mapResponse(response);
    broadcastCartUpdate(nextItems);
    writeAccountCartBackup(nextItems);
    return nextItems;
    
  } catch (error) {
    console.error("addToCart failed:", error);
    throw error; // Passes the error to DescribeArrangement.jsx so the alert works
  }
}

export async function removeFromCart(id, group) {
  const cart = (await getCart()).filter((item) => !(item.id === id && item.group === group))
  return setCart(cart)
}

export async function updateCartQty(id, group, delta) {
  const cart = await getCart()
  const item = cart.find((entry) => entry.id === id && entry.group === group)
  if (item) item.qty = Math.max(1, (item.qty || 1) + delta)
  return setCart(cart)
}

export async function syncGuestCartToAccount() {
  if (!isAuthenticated()) return readGuestCart()
  const legacyKey = getLegacyAccountCartKey()
  let legacyItems = []
  if (legacyKey) {
    try {
      legacyItems = JSON.parse(localStorage.getItem(legacyKey)) || []
    } catch {
      legacyItems = []
    }
  }
  const guestItems = [...readGuestCart(), ...legacyItems]
  const accountItems = await getCart()
  if (!guestItems.length) return accountItems

  const merged = [...accountItems]
  for (const guestItem of guestItems) {
    const existing = merged.find((item) => item.id === guestItem.id && item.group === guestItem.group)
    if (existing) existing.qty = Math.min(99, (existing.qty || 1) + (guestItem.qty || 1))
    else merged.push(guestItem)
  }
  const synced = await setCart(merged)
  localStorage.removeItem(GUEST_CART_KEY)
  if (legacyKey) localStorage.removeItem(legacyKey)
  return synced
}
