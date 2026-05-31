// src/utils/vouchers.js
// Single source of truth for promo codes + validation.
// The admin Promotions page WRITES codes here (localStorage); Cart & Checkout READ + validate.
//
//   type: "percent" (value = %)  |  "fixed" (value = ₱ off)
//   minSpend: ₱ subtotal required   expires: "YYYY-MM-DD"   active: bool
//
// NOTE: localStorage is per-browser (demo). Swap loadVouchers/saveVouchers for an
// API later and the rest of the app keeps working unchanged.

export const VOUCHERS_KEY = "bloomora_vouchers"

// Built-in starter codes — used only if the admin hasn't created any yet.
const DEFAULT_VOUCHERS = [
  { code: "BLOOM10",    type: "percent", value: 10,  minSpend: 0,    expires: "2026-12-31", active: true },
  { code: "FRESH50",    type: "fixed",   value: 50,  minSpend: 500,  expires: "2026-12-31", active: true },
  { code: "WELCOME100", type: "fixed",   value: 100, minSpend: 1000, expires: "2026-12-31", active: true },
]

// Read the current list (admin-created if present, else the defaults).
export function loadVouchers() {
  try {
    const raw = localStorage.getItem(VOUCHERS_KEY)
    if (!raw) return [...DEFAULT_VOUCHERS]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_VOUCHERS]
    return parsed
  } catch {
    return [...DEFAULT_VOUCHERS]
  }
}

// Persist the list (used by the admin page). Returns false if storage is full.
export function saveVouchers(list) {
  try {
    localStorage.setItem(VOUCHERS_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

// ₱ amount a voucher takes off, given the current subtotal.
export function computeDiscount(voucher, subtotal) {
  if (!voucher) return 0
  if (voucher.type === "percent") return Math.floor((subtotal * voucher.value) / 100)
  return Math.min(voucher.value, subtotal) // fixed amount, never more than the subtotal
}

// Validate a typed code against the current cart.
// Returns: { ok, type: "error" | "success", message, voucher?, discount? }
export function validateVoucher(rawCode, subtotal, hasItems) {
  if (!hasItems) {
    return { ok: false, type: "error", message: "Add some products to your cart before applying a voucher." }
  }
  const code = (rawCode || "").trim().toUpperCase()
  if (!code) {
    return { ok: false, type: "error", message: "Please enter a voucher code." }
  }
  const v = loadVouchers().find(x => (x.code || "").toUpperCase() === code)
  if (!v) {
    return { ok: false, type: "error", message: "This voucher code doesn't exist." }
  }
  if (v.active === false) {
    return { ok: false, type: "error", message: "This voucher is no longer active." }
  }
  const now = new Date(); now.setHours(0, 0, 0, 0)
  if (v.expires && new Date(v.expires) < now) {
    return { ok: false, type: "error", message: "This voucher has already expired." }
  }
  if (subtotal < (v.minSpend || 0)) {
    return { ok: false, type: "error", message: `Spend at least ₱${Number(v.minSpend).toLocaleString()} to use this voucher.` }
  }
  const discount = computeDiscount(v, subtotal)
  return {
    ok: true,
    type: "success",
    message: `Voucher applied — you saved ₱${discount.toLocaleString()}.`,
    voucher: v,
    discount,
  }
}