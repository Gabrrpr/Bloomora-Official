import { useState, useEffect, useRef } from "react"

const DG = "#0C573E"
const G  = "#2E8B34"

const ANNOUNCE_KEY        = "bloomora_announcements"        // current: array
const ANNOUNCE_KEY_LEGACY = "bloomora_announcement"          // old: single object
const ROTATE_MS = 5000

// Returns an array of active { emoji, text } messages.
function readAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        return arr
          .filter(a => a && a.active !== false && a.text && a.text.trim())
          .map(a => ({ emoji: a.emoji || "", text: a.text.trim() }))
      }
    }
    // Back-compat: old single-object announcement
    const legacy = localStorage.getItem(ANNOUNCE_KEY_LEGACY)
    if (legacy) {
      const a = JSON.parse(legacy)
      if (a && a.enabled && a.text && a.text.trim()) return [{ emoji: "", text: a.text.trim() }]
    }
  } catch { /* ignore */ }
  return []
}

/**
 * Storefront announcement bar. Reads what the admin set on the Promotions page.
 * Multiple active announcements rotate automatically (fade) every few seconds.
 * Drop it at the very top of your storefront layout, e.g. above <Navbar/>.
 */
export default function AnnouncementBanner() {
  const [messages, setMessages] = useState([])
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(true) // for fade transition
  const timerRef = useRef(null)

  // Load + subscribe to admin updates (same tab via custom event, other tabs via storage)
  useEffect(() => {
    const refresh = () => { setMessages(readAnnouncements()); setIdx(0) }
    refresh()
    const onStorage = (e) => { if (!e || e.key === ANNOUNCE_KEY || e.key === ANNOUNCE_KEY_LEGACY) refresh() }
    window.addEventListener("storage", onStorage)
    window.addEventListener("bloomora:announcement-updated", refresh)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("bloomora:announcement-updated", refresh)
    }
  }, [])

  // Rotate through messages when there's more than one
  useEffect(() => {
    clearInterval(timerRef.current)
    if (messages.length <= 1) return
    timerRef.current = setInterval(() => {
      setShow(false) // fade out
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length)
        setShow(true) // fade in
      }, 250)
    }, ROTATE_MS)
    return () => clearInterval(timerRef.current)
  }, [messages])

  if (messages.length === 0) return null
  const current = messages[Math.min(idx, messages.length - 1)]

  return (
    <div className="w-full text-white" style={{ background: `linear-gradient(90deg, ${DG}, ${G})` }}>
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-center"
        style={{ opacity: show ? 1 : 0, transition: "opacity 0.25s ease" }}>
        {current.emoji
          ? <span className="text-base leading-none flex-shrink-0">{current.emoji}</span>
          : <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>}
        <span>{current.text}</span>
      </div>
    </div>
  )
}