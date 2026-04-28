function getCartKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user?.email) return `bloomora_cart_${user.email}`
  } catch {}
  return "bloomora_cart_guest"
}

function broadcastCartUpdate() {
  window.dispatchEvent(new CustomEvent("bloomora:cart-updated"))
}

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(getCartKey())) || []
  } catch {
    return []
  }
}

export function clearCart() {
  localStorage.removeItem(getCartKey())
  broadcastCartUpdate()
}

export function setCart(items) {
  localStorage.setItem(getCartKey(), JSON.stringify(items))
  broadcastCartUpdate()
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.qty || 1), 0)
}

export function addToCart(item) {
  const cart = getCart()
  const existing = cart.find(i => i.id === item.id && i.group === item.group)
  if (existing) {
    existing.qty += item.qty || 1
  } else {
    cart.push({ ...item, checked: true, qty: item.qty || 1 })
  }
  setCart(cart)
  return getCartCount()
}

export function removeFromCart(id, group) {
  const cart = getCart().filter(i => !(i.id === id && i.group === group))
  setCart(cart)
  return getCartCount()
}

export function updateCartQty(id, group, delta) {
  const cart = getCart()
  const item = cart.find(i => i.id === id && i.group === group)
  if (item) {
    item.qty = Math.max(1, (item.qty || 1) + delta)
    setCart(cart)
  }
  return getCartCount()
}
