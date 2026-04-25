const CART_KEY = "bloomora_cart"

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || []
  } catch {
    return []
  }
}

export function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
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
