// src/utils/cardMessage.js
// Single source of truth for AI greeting-card message generation.
// Used by ProductPreviewModal's AIPanel and the standalone AICardComposer page.
import { api } from "../services/api.js"

export const RELATIONSHIP_OPTIONS = [
  "Best Friend", "Partner / Lover", "Spouse", "Mother", "Father", "Sibling",
  "Grandparent", "Child", "Colleague", "Boss", "Teacher", "Mentor",
  "Classmate", "Neighbor", "Acquaintance",
]

export const OCCASION_OPTIONS = [
  "Birthday", "Anniversary", "Valentine's Day", "Mother's Day", "Father's Day",
  "Graduation", "Get Well Soon", "Thank You", "Congratulations", "Just Because",
  "Sympathy", "Wedding", "New Baby", "Farewell",
]

export const TONE_OPTIONS = [
  { value: "warm",    label: "Warm & Heartfelt" },
  { value: "playful", label: "Playful & Fun" },
  { value: "elegant", label: "Elegant & Formal" },
  { value: "simple",  label: "Simple & Sweet" },
]

// Where a generated card message is stashed so the shop/checkout can pick it up.
export const PENDING_CARD_KEY = "bloomora_pending_card"

export function savePendingCard(message) {
  try {
    localStorage.setItem(PENDING_CARD_KEY, JSON.stringify({ message, savedAt: Date.now() }))
    return true
  } catch {
    return false
  }
}

export function getPendingCard() {
  try {
    const raw = localStorage.getItem(PENDING_CARD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.message ? parsed : null
  } catch {
    return null
  }
}

export function clearPendingCard() {
  try { localStorage.removeItem(PENDING_CARD_KEY) } catch { /* ignore */ }
}

// Generate a greeting-card message. Returns the text, or throws on failure.
//   { relationship, occasion, tone, extra }  ->  Promise<string>
export async function generateCardMessage({ relationship, occasion, tone = "warm", extra = "" }) {
  const data = await api.generateCardMessage({ relationship, occasion, tone, extra })
  const text = data?.message?.trim() || data?.data?.message?.trim() || ""
  if (!text) throw new Error("Empty response")
  return text
}
