// src/utils/cardMessage.js
// Single source of truth for AI greeting-card message generation.
// Used by ProductPreviewModal's AIPanel and the standalone AICardComposer page.

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
  const toneLabel = TONE_OPTIONS.find(t => t.value === tone)?.label || "Warm & Heartfelt"
  const prompt = `Write a short, genuine greeting card message for someone's ${occasion}. The sender's relationship to the recipient is: ${relationship}. Tone: ${toneLabel}.${extra ? ` Extra context: ${extra}.` : ""} Keep it 2-4 sentences, personal, and sincere. Write only the message itself.`

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: "You write short, heartfelt greeting card messages. Respond with only the message text.",
      messages: [{ role: "user", content: prompt }],
    }),
  })
  const data = await res.json()
  const text = data?.content?.[0]?.text?.trim() || ""
  if (!text) throw new Error("Empty response")
  return text
}
