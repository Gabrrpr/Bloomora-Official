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

function writeGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  broadcastCartUpdate(items)
  return items
}

function mapResponse(response) {
  return (response?.items || []).map((entry) => ({
    ...(entry.web_item || {}),
    cartItemId: entry.id,
    qty: entry.quantity || entry.web_item?.qty || 1,
  }))
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
  const items = mapResponse(await api.get("/cart/"))
  cartCache = items
  return items
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
  return nextItems
}

export function getCartCount(items = cartCache) {
  return items.reduce((sum, item) => sum + (item.qty || 1), 0)
}

export async function addToCart(item) {
  if (!isAuthenticated()) {
    const cart = readGuestCart()
    const existing = cart.find((entry) => entry.id === item.id && entry.group === item.group)
    if (existing) existing.qty += item.qty || 1
    else cart.push({ ...item, checked: true, qty: item.qty || 1 })
    writeGuestCart(cart)
    return cart
  }
  const nextItems = mapResponse(await api.post("/cart/items", { item }))
  broadcastCartUpdate(nextItems)
  return nextItems
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
