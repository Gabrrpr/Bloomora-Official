import { useState, useEffect, useRef, useMemo } from "react"
import { useTheme } from "../../context/ThemeContext"

const G  = "#2E8B34"
const DG = "#0C573E"

const STORAGE_KEY = "bloomora:admin:faq"

// ─── Default seed (matches HomeFAQ.jsx exactly) ──────────────────────────────
const DEFAULT_FAQS = [
  {
    id: "cat-general",
    category: "General",
    items: [
      { id: "q-1", q: "How long has Esting's Flowers been in business?", a: "Esting's Flowers International Inc. was established in 1959, making us one of the longest-running floral businesses in the Philippines." },
      { id: "q-2", q: "Where are your branches located?", a: "We have two main branches: one in Sampaloc, Manila, and another in San Fernando, Pampanga." },
      { id: "q-3", q: "Do you accept international orders?", a: "Yes. While we deliver exclusively within the Philippines, we accept orders from customers residing anywhere in the world." },
    ],
  },
  {
    id: "cat-ordering",
    category: "Ordering",
    items: [
      { id: "q-4", q: "How does the two-way customization work?", a: "We offer two ways to personalize your arrangement. Mix and Match lets you manually select the arrangement type (bouquet, vase, or box), flower types, colors, and wrappers. Describe Your Arrangement lets you provide a text description of your vision, and our Flux Generative AI Model creates a high-fidelity visual preview based on our actual stock." },
      { id: "q-5", q: "Why is the customization feature sometimes unavailable?", a: "The administrator reserves the right to disable customization features during peak seasons, such as Valentine's Day or Mother's Day, to prioritize the high volume of orders during those periods." },
      { id: "q-6", q: "Can I see what my custom arrangement will look like before I pay?", a: "Yes. The AI Concept Preview generates an image of your arrangement so you can visualize the final product and reduce the imagination gap before finalizing your purchase." },
      { id: "q-7", q: "Can I order in bulk?", a: "Yes. The platform includes a Quotation Feature specifically designed for handling bulk arrangement inquiries and pricing." },
      { id: "q-8", q: "How do I determine which branch to order from?", a: "Our system automatically checks whether your delivery address is within range of the branch you are ordering from. As a standard practice, please order from the branch closest to your delivery address to avoid any confusion." },
    ],
  },
  {
    id: "cat-payments",
    category: "Payments",
    items: [
      { id: "q-9",  q: "Do you offer Cash on Delivery (COD)?", a: "No. We follow a strict pay-as-you-order policy. All transactions must be completed and recorded online before we begin preparing your arrangement." },
      { id: "q-10", q: "What payment methods do you accept?", a: "We process secure payments via the PayMongo API, which supports GCash, Maya, and credit or debit cards." },
      { id: "q-11", q: "What is your refund policy?", a: "In accordance with our business policy, cancellations and refunds are not allowed once a product has been paid for. However, we do allow exchanges if the product arrives in poor condition." },
    ],
  },
  {
    id: "cat-delivery",
    category: "Delivery",
    items: [
      { id: "q-12", q: "What is the cutoff time for same-day delivery?", a: "Orders must be placed by 12:00 PM Philippine Standard Time to qualify for same-day delivery. Any orders received after this cutoff will be delivered the following day." },
      { id: "q-13", q: "What is the turnaround time for custom orders?", a: "If all required materials are available and the order was placed before the same-day delivery cutoff, it will be eligible for same-day delivery. Orders placed after the cutoff will arrive the following day. If materials are unavailable, turnaround time will vary." },
      { id: "q-14", q: "How is the delivery fee calculated?", a: "Delivery fees are distance-based and calculated in real time through our integration with the Lalamove API." },
      { id: "q-15", q: "How do I track my order?", a: "You can monitor your order in real time through the Order Tracking progress bar on our web and mobile platforms, which shows each stage from Order Placed to Delivered." },
      { id: "q-16", q: "I am ordering from abroad. How do I know if the shop is open?", a: "Purchases can only be made while the shop is open according to Philippine Standard Time. If the shop is closed, the system will automatically notify you before you attempt to make a purchase. To assist international customers, the system automatically checks your time zone against the shop's operational hours to determine if your order is eligible for same-day delivery." },
    ],
  },
]

// ─── Tokens (matches AdminDashboard) ─────────────────────────────────────────
function useTokens(isDark) {
  if (isDark) return {
    pageBg: "#0f172a", surfaceBg: "#1e293b", surfaceAlt: "#162032",
    cardBg: "#1e293b", cardBorder: "#334155",
    cardShadow: "0 2px 8px rgba(0,0,0,0.4)",
    inputBg: "#0f172a", inputBorder: "#475569",
    divider: "#334155", hoverBg: "#2d3f55",
    textPrimary: "#f1f5f9", textSecondary: "#cbd5e1", textMuted: "#94a3b8",
    accentG: "#4ade80", badgeBg: "#1a2d42",
    dangerBg: "rgba(239,68,68,0.1)", dangerColor: "#f87171",
  }
  return {
    pageBg: "#f3f5f8", surfaceBg: "#ffffff", surfaceAlt: "#fafbfc",
    cardBg: "#ffffff", cardBorder: "#e8edf2",
    cardShadow: "0 1px 3px rgba(0,0,0,0.04)",
    inputBg: "#f7f9fc", inputBorder: "#dde3ec",
    divider: "#e8edf2", hoverBg: "#f8faf9",
    textPrimary: "#111827", textSecondary: "#6b7280", textMuted: "#9ca3af",
    accentG: G, badgeBg: "#f1f5f9",
    dangerBg: "#fef2f2", dangerColor: "#dc2626",
  }
}

// ─── tiny utilities ──────────────────────────────────────────────────────────
const newId = (prefix = "id") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// ─── Live Preview (compact version of HomeFAQ) ───────────────────────────────
function LivePreview({ faqs, activeCatIdx, openItemIdx, onCatChange, onItemToggle }) {
  const { isDark } = useTheme()
  const active = faqs[activeCatIdx] || faqs[0]
  if (!active) return null

  const accentG    = isDark ? "#4ade80" : G
  const sectionBg  = isDark ? "#0f1a14" : "#ffffff"
  const headingC   = isDark ? "#f0fdf4" : "#132015"
  const bodyC      = isDark ? "#9ca3af" : "#4A7C59"
  const tabTrayBg  = isDark ? "rgba(255,255,255,0.04)" : "#F2F7F3"
  const tabTrayBdr = isDark ? "rgba(74,222,128,0.15)" : "#dceadd"

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: sectionBg, border: `1px solid ${isDark ? "#2d3748" : "#f3f4f6"}` }}>
      <div className="px-5 py-6">
        <div className="text-center mb-6">
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: accentG }}>Got Questions?</p>
          <h2 className="text-lg font-bold mb-2" style={{ color: headingC }}>Frequently Asked Questions</h2>
          <div className="w-10 h-[2px] mx-auto rounded-full" style={{ backgroundColor: accentG }} />
        </div>

        {/* tabs */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex p-1 rounded-full flex-wrap gap-1 justify-center"
            style={{ backgroundColor: tabTrayBg, border: `1px solid ${tabTrayBdr}` }}>
            {faqs.map((c, i) => {
              const on = i === activeCatIdx
              return (
                <button key={c.id} onClick={() => onCatChange(i)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all border-none cursor-pointer"
                  style={{
                    backgroundColor: on ? (isDark ? "#4ade80" : DG) : "transparent",
                    color: on ? (isDark ? "#0a1f0d" : "#fff") : (isDark ? "#cbd5e1" : "#4A7C59"),
                  }}>
                  {c.category || "(empty)"}
                </button>
              )
            })}
          </div>
        </div>

        {/* items */}
        <div className="flex flex-col gap-2">
          {(active.items || []).length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: bodyC }}>No questions in this category yet.</p>
          ) : (
            active.items.map((item, i) => {
              const isOpen = openItemIdx === i
              return (
                <div key={item.id} className="rounded-xl overflow-hidden transition-all"
                  style={{
                    border: `1px solid ${isOpen ? (isDark ? "rgba(74,222,128,0.45)" : "rgba(46,139,52,0.55)") : (isDark ? "rgba(74,222,128,0.12)" : "#dceadd")}`,
                    background: isOpen ? (isDark ? "rgba(74,222,128,0.08)" : "#fff") : (isDark ? "rgba(255,255,255,0.03)" : "#F5FAF5"),
                  }}>
                  <button onClick={() => onItemToggle(isOpen ? -1 : i)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer">
                    <span className="text-xs font-medium leading-snug pr-2"
                      style={{ color: isDark ? (isOpen ? "#f0fdf4" : "#e2e8f0") : "#132015" }}>
                      {item.q || "(empty question)"}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke={isOpen ? (isDark ? "#4ade80" : DG) : (isDark ? "rgba(74,222,128,0.5)" : "rgba(12,87,62,0.45)")}
                      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                      className="shrink-0 transition-transform"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${isDark ? "rgba(74,222,128,0.12)" : "rgba(12,87,62,0.1)"}` }}>
                      <p className="text-[11px] leading-[1.6] m-0" style={{ color: isDark ? "#94a3b8" : "#4A7C59" }}>
                        {item.a || "(no answer yet)"}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Item Editor Row ─────────────────────────────────────────────────────────
function ItemRow({ item, idx, total, t, isDark, onUpdate, onDelete, onMove, dragHandlers }) {
  const inputStyle = {
    backgroundColor: t.inputBg, color: t.textPrimary,
    border: `1px solid ${t.inputBorder}`,
  }

  return (
    <div
      {...dragHandlers}
      className="rounded-lg p-3.5 transition-all"
      style={{
        backgroundColor: t.surfaceAlt,
        border: `1px solid ${t.cardBorder}`,
      }}>
      <div className="flex items-start gap-2 mb-2">
        {/* drag handle */}
        <div className="cursor-grab active:cursor-grabbing pt-1.5 select-none flex-shrink-0"
          style={{ color: t.textMuted }} title="Drag to reorder">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
            Question {idx + 1}
          </label>
          <input
            value={item.q}
            onChange={e => onUpdate({ ...item, q: e.target.value })}
            placeholder="Enter the question…"
            className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
            onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }}
          />
        </div>

        {/* actions */}
        <div className="flex flex-col gap-1 flex-shrink-0 pt-5">
          <button
            onClick={() => onMove(idx, idx - 1)}
            disabled={idx === 0}
            title="Move up"
            className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: t.textSecondary, backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => { if (idx !== 0) e.currentTarget.style.backgroundColor = t.hoverBg }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = t.cardBg}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7"/>
            </svg>
          </button>
          <button
            onClick={() => onMove(idx, idx + 1)}
            disabled={idx === total - 1}
            title="Move down"
            className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: t.textSecondary, backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => { if (idx !== total - 1) e.currentTarget.style.backgroundColor = t.hoverBg }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = t.cardBg}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7"/>
            </svg>
          </button>
          <button
            onClick={() => {
              if (window.confirm("Delete this question?")) onDelete()
            }}
            title="Delete"
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: t.dangerColor, backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.dangerBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = t.cardBg}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="pl-6">
        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
          Answer
        </label>
        <textarea
          value={item.a}
          onChange={e => onUpdate({ ...item, a: e.target.value })}
          placeholder="Enter the answer…"
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all resize-y"
          style={{ ...inputStyle, minHeight: "70px" }}
          onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
          onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }}
        />
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function AdminFAQ() {
  const { isDark } = useTheme()
  const t = useTokens(isDark)

  const [faqs, setFaqs]               = useState(DEFAULT_FAQS)
  const [activeCatIdx, setActiveCat]  = useState(0)
  const [previewOpenIdx, setPrevOpen] = useState(0)
  const [dirty, setDirty]             = useState(false)
  const [saved, setSaved]             = useState(false)
  const [editingCatName, setEditingCatName] = useState(false)
  // Drives the one-time entrance animation; removed after it plays so it never replays.
  const [entered, setEntered] = useState(false)

  // Load saved FAQs from local storage on first render.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) setFaqs(parsed)
      }
    } catch { /* ignore bad saved data */ }
  }, [])

  // Play the entrance animation once on mount, then turn it off.
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 1100)
    return () => clearTimeout(t)
  }, [])

  const activeCat = faqs[activeCatIdx]

  // ─── mutations ──
  const markDirty = () => { setDirty(true); setSaved(false) }

  const updateCategory = (idx, patch) => {
    setFaqs(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
    markDirty()
  }

  const addCategory = () => {
    const newCat = { id: newId("cat"), category: "New Category", items: [] }
    setFaqs(prev => [...prev, newCat])
    setActiveCat(faqs.length)
    setEditingCatName(true)
    markDirty()
  }

  const deleteCategory = idx => {
    if (faqs.length <= 1) {
      alert("You need at least one category.")
      return
    }
    if (!window.confirm(`Delete category "${faqs[idx].category}" and all its questions?`)) return
    setFaqs(prev => prev.filter((_, i) => i !== idx))
    setActiveCat(Math.max(0, idx - 1))
    markDirty()
  }

  const moveCategory = (from, to) => {
    if (to < 0 || to >= faqs.length) return
    setFaqs(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setActiveCat(to)
    markDirty()
  }

  const addItem = () => {
    setFaqs(prev => prev.map((c, i) =>
      i === activeCatIdx
        ? { ...c, items: [...c.items, { id: newId("q"), q: "", a: "" }] }
        : c
    ))
    markDirty()
  }

  const updateItem = (itemIdx, next) => {
    setFaqs(prev => prev.map((c, i) =>
      i === activeCatIdx
        ? { ...c, items: c.items.map((it, j) => j === itemIdx ? next : it) }
        : c
    ))
    markDirty()
  }

  const deleteItem = itemIdx => {
    setFaqs(prev => prev.map((c, i) =>
      i === activeCatIdx
        ? { ...c, items: c.items.filter((_, j) => j !== itemIdx) }
        : c
    ))
    markDirty()
  }

  const moveItem = (from, to) => {
    if (to < 0 || to >= (activeCat?.items.length || 0)) return
    setFaqs(prev => prev.map((c, i) => {
      if (i !== activeCatIdx) return c
      const items = [...c.items]
      const [moved] = items.splice(from, 1)
      items.splice(to, 0, moved)
      return { ...c, items }
    }))
    markDirty()
  }

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(faqs))
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert("Failed to save: " + err.message)
    }
  }

  const handleReset = () => {
    if (!window.confirm("Reset all FAQs to the defaults? This cannot be undone.")) return
    setFaqs(DEFAULT_FAQS)
    setActiveCat(0)
    markDirty()
  }

  return (
    <div className="space-y-5">
      {/* Gentle fade + rise so content eases in once loaded instead of flashing. */}
      <style>{`
        @keyframes faqRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .faq-rise { animation: faqRise 0.85s ease-out both; }
      `}</style>

      {/* header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${entered ? "" : "faq-rise"}`}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.textPrimary }}>FAQ Editor</h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            Manage the frequently asked questions shown on the customer homepage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{ backgroundColor: isDark ? "rgba(74,222,128,0.15)" : "#f0fdf4", color: isDark ? "#4ade80" : "#16a34a" }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Saved
            </span>
          )}
          <button onClick={handleReset}
            className="text-xs font-semibold px-3 py-2 rounded-md border transition-all"
            style={{ borderColor: t.cardBorder, color: t.textSecondary, backgroundColor: t.surfaceBg }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = t.surfaceBg}>
            Reset
          </button>
          <button onClick={handleSave} disabled={!dirty}
            className="text-xs font-bold px-4 py-2 rounded-md text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Save Changes
          </button>
        </div>
      </div>

      {/* main split */}
      <div className={`grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-5 ${entered ? "" : "faq-rise"}`} style={{ animationDelay: "0.18s" }}>

        {/* ── editor column ── */}
        <div className="space-y-4">
          {/* Categories panel */}
          <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Categories</p>
              <button onClick={addCategory}
                className="text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all"
                style={{ backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", color: isDark ? "#4ade80" : DG, border: `1px solid ${isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0"}` }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
                </svg>
                Add Category
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {faqs.map((c, i) => {
                const on = i === activeCatIdx
                return (
                  <div key={c.id} className="flex items-center gap-0.5 rounded-md overflow-hidden"
                    style={{
                      backgroundColor: on ? (isDark ? "rgba(74,222,128,0.15)" : "#f0fdf4") : t.surfaceAlt,
                      border: `1px solid ${on ? (isDark ? "rgba(74,222,128,0.45)" : "#86efac") : t.cardBorder}`,
                    }}>
                    <button onClick={() => { setActiveCat(i); setPrevOpen(0); setEditingCatName(false) }}
                      className="px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{ color: on ? (isDark ? "#4ade80" : DG) : t.textSecondary, whiteSpace: "nowrap" }}>
                      {c.category || "(empty)"}
                      <span className="ml-1.5 text-[10px] opacity-60">({c.items.length})</span>
                    </button>
                    {on && (
                      <>
                        <button onClick={() => moveCategory(i, i - 1)} disabled={i === 0}
                          className="px-1 py-1.5 transition-all disabled:opacity-30"
                          style={{ color: t.textMuted }} title="Move left">
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                        </button>
                        <button onClick={() => moveCategory(i, i + 1)} disabled={i === faqs.length - 1}
                          className="px-1 py-1.5 transition-all disabled:opacity-30"
                          style={{ color: t.textMuted }} title="Move right">
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                        <button onClick={() => deleteCategory(i)}
                          className="px-1.5 py-1.5 transition-all"
                          style={{ color: t.dangerColor }} title="Delete category">
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active category editor */}
          {activeCat && (
            <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
              {/* Cat name edit */}
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
                    Category Name
                  </label>
                  <input
                    value={activeCat.category}
                    onChange={e => updateCategory(activeCatIdx, { category: e.target.value })}
                    placeholder="Category name…"
                    className="w-full px-3 py-2 text-sm font-semibold rounded-md outline-none transition-all"
                    style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}
                    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
                    onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }}
                    autoFocus={editingCatName}
                  />
                </div>
              </div>

              {/* items */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  Questions ({activeCat.items.length})
                </p>
                <button onClick={addItem}
                  className="text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all"
                  style={{ backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", color: isDark ? "#4ade80" : DG, border: `1px solid ${isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0"}` }}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
                  </svg>
                  Add Question
                </button>
              </div>

              {activeCat.items.length === 0 ? (
                <div className="text-center py-10 rounded-lg" style={{ backgroundColor: t.surfaceAlt, border: `1px dashed ${t.cardBorder}` }}>
                  <p className="text-sm font-medium" style={{ color: t.textSecondary }}>No questions yet</p>
                  <p className="text-xs mt-1" style={{ color: t.textMuted }}>Click "Add Question" to create one.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activeCat.items.map((it, i) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      idx={i}
                      total={activeCat.items.length}
                      t={t}
                      isDark={isDark}
                      onUpdate={next => updateItem(i, next)}
                      onDelete={() => deleteItem(i)}
                      onMove={moveItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── preview column ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <svg width="14" height="14" fill="none" stroke={t.textMuted} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Live Preview</p>
          </div>
          <div className="xl:sticky xl:top-4">
            <LivePreview
              faqs={faqs}
              activeCatIdx={activeCatIdx}
              openItemIdx={previewOpenIdx}
              onCatChange={i => { setActiveCat(i); setPrevOpen(0) }}
              onItemToggle={setPrevOpen}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
