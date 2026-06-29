import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import ImageUploader from "../../components/ImageUploader"; // Adjust path as needed

import heroBg1 from "../../assets/hero/HeroBG1.webp"
import heroBg2 from "../../assets/hero/HeroBG2.webp"
import heroBg3 from "../../assets/hero/HeroBG3.webp"
import heroBg4 from "../../assets/hero/HeroBG4.webp"

const DG = "#0C573E"
const G  = "#2E8B34"

// Animated flower shown while the hero slides are still loading.
function FlowerLoader({ message = "Loading...", isDark = false }) {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <>
      <style>{`
        @keyframes adminPetalBloom {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1;   }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center rounded-xl"
        style={{ minHeight: "60vh", backgroundColor: isDark ? "#0f172a" : "transparent" }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
                style={{ animation: `adminPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7"  fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p className="mt-4 text-sm font-medium tracking-wide" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{message}</p>
      </div>
    </>
  )
}

const IMAGE_OPTIONS = [
  { label: "HeroBG1.png", value: "HeroBG1.png" },
  { label: "HeroBG2.png", value: "HeroBG2.png" },
  { label: "HeroBG3.png", value: "HeroBG3.png" },
  { label: "HeroBG4.png", value: "HeroBG4.png" },
]

const IMAGE_MAP = {
  "HeroBG1.png": heroBg1,
  "HeroBG2.png": heroBg2,
  "HeroBG3.png": heroBg3,
  "HeroBG4.png": heroBg4,
}

const DEFAULT_SLIDES = [
  { id:1, tag:"Esting's Flower International Inc.", headline:"Timeless Floristry,\nSince 1959", description:"Since 1959, we've been part of countless moments big and small. Every arrangement is made by hand with fresh flowers and genuine care.", cta:"Shop Flowers", ctaSecondary:"View Occasions", ctaNav:"shop", ctaSecondaryNav:"shop", accent:"#2E8B34", image:"HeroBG1.png" },
  { id:2, tag:"Made a mistake?", headline:"Let flowers\ndo the talking", description:'Whether it\'s an apology, a misunderstanding, or just a way to say "I care," sending flowers is sometimes the simplest way to fix things without saying too much.', cta:"Shop Flowers", ctaSecondary:"Explore Collection", ctaNav:"shop", ctaSecondaryNav:"shop", accent:"#e11d48", image:"HeroBG2.png" },
  { id:3, tag:"Make It Personal", headline:"Flowers,\nMade Your Way", description:'Use our "Make it Personal" feature to describe your ideal bouquet, or build your own arrangement through our Mix and Match option. We\'ll turn your idea into something fresh and beautifully made.', cta:"Try It Now", ctaSecondary:"See Examples", ctaNav:"make-it-personal", ctaSecondaryNav:"ai-gallery", accent:"#7c3aed", image:"HeroBG3.png" },
  { id:4, tag:"Fresh Flowers, For Any Moment", headline:"Simple Ways\nto Show You Care", description:"From everyday surprises to life's biggest moments, we create fresh arrangements that help you express what you feel in a simple and meaningful way.", cta:"Shop Flowers", ctaSecondary:"View Occasions", ctaNav:"shop", ctaSecondaryNav:"shop", accent:"#d97706", image:"HeroBG4.png" },
]

// Where a hero CTA button can take the visitor.
const HERO_LINKS = [
  { value: "shop", label: "Shop" },
  { value: "make-it-personal", label: "Make it Personal" },
  { value: "mix-and-match", label: "Mix & Match" },
  { value: "describe-arrangement", label: "Describe Your Arrangement" },
  { value: "ai-gallery", label: "AI Gallery" },
  { value: "contact", label: "Contact Us" },
  { value: "about", label: "About Us" },
  { value: "faq", label: "FAQ" },
  { value: "world-clock", label: "World Clock" },
  { value: "home", label: "Home" },
]

// ── Live Hero Preview ─────────────────────────────────────────────────────────
function HeroPreview({ slide, isDark }) {
  // Check if the image is a URL (Supabase) or base64 data. If yes, use it! Otherwise, fallback to local map.
  const isCustomImage = slide.image?.startsWith("http") || slide.image?.startsWith("data:");
  const bg = isCustomImage ? slide.image : (IMAGE_MAP[slide.image] || heroBg1)
  
  const overlay = isDark
    ? "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.54) 55%, rgba(0,0,0,0.22) 100%)"
    : "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.36) 50%, rgba(0,0,0,0.08) 100%)"

  const lines = (slide.headline || "").replace(/\\n/g, "\n").split("\n")

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        height: "540px",
        boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.5)" : "0 4px 24px rgba(0,0,0,0.15)",
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage:`url(${bg})`, backgroundSize:"cover", backgroundPosition:"center" }}
      />

      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: overlay }} />

      {/* Live badge */}
      <div
        className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)", border:"1px solid rgba(255,255,255,0.2)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Live Preview
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center pl-20 sm:pl-28 pr-10">
        <div className="max-w-lg">
          {/* Tag */}
          <span
            className="inline-block text-sm font-bold tracking-[0.16em] uppercase px-3.5 py-1.5 rounded-full mb-5 text-white"
            style={{ backgroundColor: (slide.accent||"#2E8B34")+"55", border:`1px solid ${(slide.accent||"#2E8B34")}99` }}
          >
            {slide.tag || "Tag / Badge"}
          </span>

          {/* Headline */}
          <h1
            className="font-bold text-white leading-tight mb-5"
            style={{ fontSize:"clamp(36px,4.5vw,56px)", textShadow:"0 2px 20px rgba(0,0,0,0.55)" }}
          >
            {lines.length > 0
              ? lines.map((line, i) => <span key={i} className="block">{line || "\u00A0"}</span>)
              : <span className="block opacity-40">Headline</span>
            }
          </h1>

          {/* Description */}
          <p
            className="leading-relaxed mb-7"
            style={{ fontSize:"clamp(15px,1.6vw,18px)", color:"rgba(255,255,255,0.90)", maxWidth:"420px" }}
          >
            {slide.description || <span className="opacity-40">Description text will appear here.</span>}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="px-7 py-3 text-base font-bold text-white rounded-full shadow-lg transition-all"
              style={{ backgroundColor: slide.accent||"#2E8B34" }}
            >
              {slide.cta || "Primary CTA"}
            </button>
            {slide.showSecondary !== false && (
              <button
                className="px-7 py-3 text-base font-semibold text-white rounded-full border transition-all"
                style={{ borderColor:"rgba(255,255,255,0.4)", backgroundColor:"rgba(255,255,255,0.08)", backdropFilter:"blur(4px)" }}
              >
                {slide.ctaSecondary || "Secondary CTA"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Field + Input + Select ────────────────────────────────────────────────────
function Field({ label, hint, children, isDark }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color:isDark?"#94a3b8":"#374151" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] mt-1 leading-snug" style={{ color:isDark?"#64748b":"#9ca3af" }}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type="text", rows, isDark, inputBg, inputBdr, inputTxt }) {
  const shared = "w-full px-3 py-2 text-sm border rounded-md outline-none transition-all"
  if (rows) {
    return (
      <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
        className={shared} style={{ borderColor:inputBdr, backgroundColor:inputBg, color:inputTxt }}
        onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow="none" }} />
    )
  }
  return (
    <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
      className={shared} style={{ borderColor:inputBdr, backgroundColor:inputBg, color:inputTxt }}
      onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(46,139,52,0.12)` }}
      onBlur={e => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow="none" }} />
  )
}

function Select({ value, onChange, options, isDark, inputBg, inputBdr, inputTxt }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full appearance-none px-3 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor:inputBdr, backgroundColor:inputBg, color:inputTxt }}
        onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow="none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color:isDark?"#64748b":"#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

// Centered "saved" confirmation popup, styled like the dark/light mode toast.
function SaveToast({ show, isDark, message = "Changes saved!", sub = "Your updates are now live." }) {
  if (!show) return null
  const cardBg     = isDark ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
  const cardBorder = isDark ? "rgba(74,222,128,0.35)" : "rgba(46,139,52,0.28)"
  const cardShadow = isDark ? "0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)" : "0 24px 70px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04)"
  const titleC = isDark ? "#f1f5f9" : "#1f2937"
  const subC   = isDark ? "#94a3b8" : "#6b7280"
  const iconBg = isDark ? "rgba(74,222,128,0.16)" : "rgba(46,139,52,0.12)"
  const iconC  = isDark ? "#4ade80" : G
  return createPortal(
    <>
      <style>{`
        @keyframes saveToastIn { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.92); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes saveCheckPop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
      `}</style>
      <div role="status" aria-live="polite"
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2147483647,
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "14px",
          width: "max-content", maxWidth: "calc(100vw - 48px)", padding: "30px 38px", borderRadius: "22px",
          background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, color: titleC,
          animation: "saveToastIn 0.28s cubic-bezier(0.22,1,0.36,1)", pointerEvents: "none",
        }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "62px", height: "62px", borderRadius: "9999px", flexShrink: 0, background: iconBg, color: iconC, animation: "saveCheckPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
        <div>
          <p style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>{message}</p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: subC }}>{sub}</p>
        </div>
      </div>
    </>,
    document.body
  )
}

function SaveBtn({ onClick, saved, label="Save Changes" }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
      style={{ background:saved?"#16a34a":`linear-gradient(135deg, ${DG}, ${G})` }}>
      {saved
        ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Saved!</>
        : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>{label}</>
      }
    </button>
  )
}

// ── Flower Icon (proper rose) ─────────────────────────────────────────────────
function FlowerIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95" transform="rotate(60 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#ec4899" opacity="0.90" transform="rotate(120 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95" transform="rotate(180 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#ec4899" opacity="0.90" transform="rotate(240 20 20)"/>
      <ellipse cx="20" cy="10" rx="4.5" ry="8" fill="#f472b6" opacity="0.95" transform="rotate(300 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80" transform="rotate(30 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80" transform="rotate(90 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80" transform="rotate(150 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80" transform="rotate(210 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80" transform="rotate(270 20 20)"/>
      <ellipse cx="20" cy="12" rx="3" ry="6" fill="#fda4c8" opacity="0.80" transform="rotate(330 20 20)"/>
      <circle cx="20" cy="20" r="5.5" fill="#fbbf24"/>
      <circle cx="20" cy="20" r="3.5" fill="#f59e0b"/>
      <circle cx="20" cy="18.5" r="0.8" fill="#92400e" opacity="0.6"/>
      <circle cx="21.3" cy="20.8" r="0.8" fill="#92400e" opacity="0.6"/>
      <circle cx="18.7" cy="20.8" r="0.8" fill="#92400e" opacity="0.6"/>
    </svg>
  )
}

// ── Top-bar promo strip CMS ───────────────────────────────────────────────────
const PROMO_PAGES = [
  { value: "shop", label: "Shop" },
  { value: "make-it-personal", label: "Make it Personal" },
  { value: "mix-and-match", label: "Mix & Match" },
  { value: "contact", label: "Contact Us" },
  { value: "about", label: "About Us" },
  { value: "faq", label: "FAQ" },
  { value: "home", label: "Home" },
]

function PromoStripEditor({ isDark }) {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [confirmRemove, setConfirmRemove] = useState(null) // index pending removal

  useEffect(() => {
    api.getNavPromos()
      .then(d => setPromos(Array.isArray(d?.promos) ? d.promos : []))
      .catch(() => setError("Couldn't load promo messages."))
      .finally(() => setLoading(false))
  }, [])

  const update = (i, field, val) => setPromos(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x))
  const add = () => setPromos(p => [...p, { short: "", text: "New promo message", highlight: "", cta: "SHOP NOW", page: "shop" }])
  const remove = (i) => setPromos(p => p.filter((_, j) => j !== i))
  const move = (i, dir) => setPromos(p => { const n = [...p]; const j = i + dir; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n })

  const save = async () => {
    setSaving(true); setError("")
    try {
      const clean = promos.filter(x => (x.text || "").trim())
      await api.updateNavPromos({ promos: clean })
      setPromos(clean)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setError(e.message || "Failed to save promo messages.") }
    finally { setSaving(false) }
  }

  const cardBg = isDark ? "#1e293b" : "white"
  const cardBdr = isDark ? "#334155" : "#e8edf2"
  const headerBg = isDark ? "#162032" : "#fafbfc"
  const headerBdr = isDark ? "#2d3f55" : "#f1f5f9"
  const bodyTxt = isDark ? "#f1f5f9" : "#111827"
  const subTxt = isDark ? "#94a3b8" : "#64748b"
  const inputBg = isDark ? "#0f172a" : "white"
  const inputBdr = isDark ? "#475569" : "#dde3ec"
  const inputTxt = isDark ? "#f1f5f9" : "#111827"
  const inputStyle = { backgroundColor: inputBg, border: `1px solid ${inputBdr}`, color: inputTxt }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}` }}>
      <SaveToast show={saved} isDark={isDark} message="Promos saved!" sub="Your top-bar messages are now live." />
      <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: `1px solid ${headerBdr}`, backgroundColor: headerBg }}>
        <div>
          <h2 className="text-base font-bold" style={{ color: bodyTxt }}>Top Bar Promo Messages</h2>
          <p className="text-xs mt-0.5" style={{ color: subTxt }}>The rotating announcements in the site's top navigation bar.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={add}
            className="px-3.5 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor: inputBdr, color: subTxt, backgroundColor: inputBg }}>
            + Add Message
          </button>
          <SaveBtn onClick={save} saved={saved} label={saving ? "Saving..." : "Save Promos"} />
        </div>
      </div>
      <div className="p-5 space-y-3">
        {error && <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{error}</p>}
        {loading ? (
          <p className="text-sm" style={{ color: subTxt }}>Loading promo messages…</p>
        ) : promos.length === 0 ? (
          <p className="text-sm" style={{ color: subTxt }}>No promo messages yet. Click “Add Message” to create one.</p>
        ) : promos.map((promo, i) => (
          <div key={i} className="rounded-lg p-3.5" style={{ border: `1px solid ${cardBdr}`, backgroundColor: isDark ? "#0f172a" : "#fcfdfe" }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: subTxt }}>Message {i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                  className="w-7 h-7 flex items-center justify-center rounded-md border transition-all disabled:opacity-30" style={{ borderColor: inputBdr, color: subTxt, backgroundColor: inputBg }}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === promos.length - 1} title="Move down"
                  className="w-7 h-7 flex items-center justify-center rounded-md border transition-all disabled:opacity-30" style={{ borderColor: inputBdr, color: subTxt, backgroundColor: inputBg }}>↓</button>
                <button onClick={() => setConfirmRemove(i)} title="Remove"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-white transition-all" style={{ backgroundColor: "#dc2626" }}>✕</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-4">
                <label className="block text-xs font-semibold mb-1" style={{ color: subTxt }}>Message (desktop)</label>
                <input value={promo.text || ""} onChange={e => update(i, "text", e.target.value)} placeholder="e.g. Now Open in Manila & Pampanga"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: subTxt }}>Short text (mobile)</label>
                <input value={promo.short || ""} onChange={e => update(i, "short", e.target.value)} placeholder="e.g. Manila & Pampanga"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: subTxt }}>Highlighted word</label>
                <input value={promo.highlight || ""} onChange={e => update(i, "highlight", e.target.value)} placeholder="e.g. Stores"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: subTxt }}>Button label</label>
                <input value={promo.cta || ""} onChange={e => update(i, "cta", e.target.value)} placeholder="e.g. VISIT US"
                  className="w-full px-3 py-2 text-sm rounded-md outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: subTxt }}>Button links to</label>
                <select value={promo.page || "shop"} onChange={e => update(i, "page", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md outline-none" style={inputStyle}>
                  {PROMO_PAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[11px] mt-2.5" style={{ color: subTxt }}>
              Preview: <span style={{ color: bodyTxt }}>{promo.text || promo.short} <strong>{promo.highlight}</strong> — {promo.cta}</span>
            </p>
          </div>
        ))}
      </div>

      {confirmRemove !== null && createPortal(
        <div onClick={() => setConfirmRemove(null)}
          style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 380, borderRadius: 18, overflow: "hidden", backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ padding: "26px 24px 10px", textAlign: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "9999px", marginBottom: 12, backgroundColor: isDark ? "rgba(248,113,113,0.16)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
              </span>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: bodyTxt }}>Remove promo message?</h3>
              <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: subTxt }}>This message will no longer appear in the top navigation bar. This can't be undone.</p>
            </div>
            <div className="flex gap-2 p-4">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
                style={{ border: `1px solid ${inputBdr}`, backgroundColor: inputBg, color: bodyTxt }}>
                Cancel
              </button>
              <button onClick={() => { remove(confirmRemove); setConfirmRemove(null) }}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: "#dc2626" }}>
                Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminHero() {
  const { isDark } = useTheme()
  const [slides,    setSlides]    = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading,   setLoading]   = useState(true)
  // One-time entrance animation; dropped once it plays so it never replays.
  const [entered,   setEntered]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState("")
  const [uploadingHero, setUploadingHero] = useState(false)

  const [rosesEnabled, setRosesEnabled] = useState(() =>
    localStorage.getItem("bloomora-falling-roses") !== "false"
  )

  const inputBg   = isDark ? "#0f172a" : "white"
  const inputBdr  = isDark ? "#475569" : "#dde3ec"
  const inputTxt  = isDark ? "#f1f5f9" : "#111827"
  const cardBg    = isDark ? "#1e293b" : "white"
  const cardBdr   = isDark ? "#334155" : "#e8edf2"
  const headerBg  = isDark ? "#162032" : "#fafbfc"
  const headerBdr = isDark ? "#2d3f55" : "#f1f5f9"
  const subTxt    = isDark ? "#94a3b8" : "#64748b"
  const bodyTxt   = isDark ? "#f1f5f9" : "#111827"
  const tabBg     = isDark ? "#1e293b" : "#f1f5f9"
  const tabBdr    = isDark ? "#334155" : "#e2e8f0"

  useEffect(() => {
    api.getHeroSlides()
      .then(data => {
        if (data?.slides && Array.isArray(data.slides) && data.slides.length > 0) {
          // Fill missing properties to ensure smooth editing
          const defaultTemplate = { tag: "", headline: "", description: "", cta: "", ctaSecondary: "", ctaNav: "shop", ctaSecondaryNav: "shop", showSecondary: true, accent: "#2E8B34", image: "HeroBG1.png" };
          setSlides(data.slides.map((s, idx) => ({ ...defaultTemplate, ...s, id: s.id || Date.now() + idx })));
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      })
      .catch(() => setSlides(DEFAULT_SLIDES))
      .finally(() => setLoading(false))
  }, [])

  // Play the entrance animation once the slides have loaded, then turn it off.
  useEffect(() => {
    if (loading) { setEntered(false); return }
    const t = setTimeout(() => setEntered(true), 1500)
    return () => clearTimeout(t)
  }, [loading])

  const updateSlide = (field, value) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? { ...s, [field]: value } : s))
  }

  const handleAddSlide = () => {
    const newSlide = {
      id: Date.now(),
      tag: "New Announcement",
      headline: "Your New\nHeadline Here",
      description: "Write an engaging description for your new slide.",
      cta: "Shop Now",
      ctaSecondary: "Learn More",
      ctaNav: "shop",
      ctaSecondaryNav: "shop",
      showSecondary: true,
      accent: "#2E8B34",
      image: "HeroBG1.png" // Defaults to first standard image
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveIdx(slides.length); // Switch view to the newly created slide
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      alert("You must have at least one hero slide.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this slide?")) {
      setSlides(prev => prev.filter((_, i) => i !== activeIdx));
      setActiveIdx(prev => Math.max(0, prev - 1));
    }
  };

  const handleSave = async () => {
    setSaving(true); setError("")
    try {
      await api.updateHeroSlides({ slides })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message || "Failed to save hero slides.")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (window.confirm("Reset all slides to factory defaults?")) {
      setSlides(DEFAULT_SLIDES);
      setActiveIdx(0);
    }
  }

  const toggleRoses = () => {
    const next = !rosesEnabled
    setRosesEnabled(next)
    localStorage.setItem("bloomora-falling-roses", next ? "true" : "false")
    window.dispatchEvent(new CustomEvent("bloomora:roses-toggle", { detail: { enabled: next } }))
  }

  const activeSlide = slides[activeIdx]

  if (loading || !activeSlide) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold" style={{ color: bodyTxt }}>Hero Section</h1>
        <FlowerLoader message="Loading hero slides..." isDark={isDark} />
      </div>
    )
  }

  // Check if current active slide's image is custom
const isCustomImageActive = activeSlide.image === "custom" || activeSlide.image?.startsWith("http") || activeSlide.image?.startsWith("data:");

  return (
    <div className="space-y-5">
      <SaveToast show={saved} isDark={isDark} message="Hero saved!" sub="Your hero slides are now live." />
      {/* Gentle fade + rise so content eases in once loaded instead of flashing. */}
      <style>{`
        @keyframes heroRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .hero-rise { animation: heroRise 0.85s ease-out both; }
      `}</style>

      {/* Page header */}
      <div className={`flex items-center justify-between flex-wrap gap-3 ${entered ? "" : "hero-rise"}`}>
        <div>
          <h1 className="text-xl font-bold" style={{ color:bodyTxt }}>Hero Section</h1>
          <p className="text-sm mt-0.5" style={{ color:subTxt }}>Edit and preview hero slides in real time</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="px-3.5 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:isDark?"#374151":"#dde3ec", color:isDark?"#94a3b8":"#6b7280", backgroundColor:isDark?"#1e293b":"white" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor=isDark?"#2d3f55":"#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor=isDark?"#1e293b":"white"}>
            Reset to Defaults
          </button>
          <SaveBtn onClick={handleSave} saved={saved} label={saving?"Saving...":"Save Changes"} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor:isDark?"rgba(239,68,68,0.1)":"#fef2f2", border:`1px solid ${isDark?"rgba(239,68,68,0.3)":"#fecaca"}`, color:isDark?"#f87171":"#dc2626" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Slide tabs */}
      <div className={`flex items-center gap-2 flex-wrap ${entered ? "" : "hero-rise"}`} style={{ animationDelay: "0.12s" }}>
        {slides.map((slide, idx) => {
          const isActive = idx === activeIdx
          return (
            <button key={slide.id} onClick={() => setActiveIdx(idx)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: isActive ? (isDark?"rgba(74,222,128,0.12)":"#f0fdf4") : tabBg,
                color: isActive ? (isDark?"#4ade80":DG) : subTxt,
                border: isActive ? `1.5px solid ${isDark?"rgba(74,222,128,0.4)":"#bbf7d0"}` : `1px solid ${tabBdr}`,
              }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background:`linear-gradient(135deg,${DG},${G})` }}>
                {idx+1}
              </span>
              <span className="hidden sm:block truncate" style={{ maxWidth:"120px" }}>
                {slide.tag || `Slide ${idx+1}`}
              </span>
            </button>
          )
        })}

        {/* 🚀 ADD SLIDE BUTTON */}
        <button onClick={handleAddSlide}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all border border-dashed hover:opacity-70"
          style={{ borderColor: tabBdr, color: subTxt, backgroundColor: "transparent" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Slide
        </button>
      </div>

      {/* Live preview */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "hero-rise"}`}
        style={{ border:`1px solid ${cardBdr}`, boxShadow:isDark?"none":"0 2px 12px rgba(0,0,0,0.08)", animationDelay: "0.24s" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom:`1px solid ${headerBdr}`, backgroundColor:headerBg }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-semibold" style={{ color:bodyTxt }}>
              Live Preview: Slide {activeIdx+1}
            </p>
          </div>
          <p className="text-xs" style={{ color:subTxt }}>Updates as you type</p>
        </div>
        <HeroPreview slide={activeSlide} isDark={isDark} />
      </div>

      {/* Falling Roses toggle */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "hero-rise"}`}
        style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, boxShadow:isDark?"none":"0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.36s" }}>

        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom:`1px solid ${headerBdr}`, backgroundColor:headerBg }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background:isDark?"rgba(244,114,182,0.1)":"linear-gradient(135deg,#fdf2f8,#fce7f3)", border:`1px solid ${isDark?"rgba(244,114,182,0.2)":"#fbcfe8"}` }}>
            <FlowerIcon />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color:bodyTxt }}>Falling Roses Effect</p>
            <p className="text-xs mt-0.5" style={{ color:subTxt }}>Controls the animated falling roses on the customer home page</p>
          </div>
        </div>

        <div className="px-5 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color:bodyTxt }}>Show falling roses on homepage</p>
            <p className="text-xs mt-1" style={{ color:subTxt }}>
              When off, the decorative rose animation will be hidden for all customers.
              {!rosesEnabled && (
                <span className="ml-1 font-semibold" style={{ color:"#f87171" }}>Currently hidden.</span>
              )}
              {rosesEnabled && (
                <span className="ml-1 font-semibold" style={{ color:isDark?"#4ade80":"#16a34a" }}>Currently visible.</span>
              )}
            </p>
          </div>
          <button
            onClick={toggleRoses}
            className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
            style={{ backgroundColor: rosesEnabled ? (isDark?"#f472b6":"#db2777") : (isDark?"#334155":"#d1d5db") }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
              style={{ left: rosesEnabled ? "26px" : "2px" }}
            />
          </button>
        </div>
      </div>

      {/* Edit form for active slide */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "hero-rise"}`}
        style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, boxShadow:isDark?"none":"0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.48s" }}>

        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom:`1px solid ${headerBdr}`, backgroundColor:headerBg }}>

          <div className="flex-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background:`linear-gradient(135deg,${DG},${G})` }}>
              {activeIdx+1}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color:bodyTxt }}>Editing Slide {activeIdx+1}</p>
              <p className="text-xs mt-0.5" style={{ color:subTxt }}>Changes reflect instantly in the preview above</p>
            </div>
          </div>

          {/* 🚀 DELETE SLIDE BUTTON */}
          <button onClick={handleDeleteSlide} title="Delete Slide"
            className="p-2 rounded-md transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tag / Badge" isDark={isDark}>
              <Input value={activeSlide.tag} onChange={v => updateSlide("tag", v)} placeholder="e.g. Fresh Flowers"
                isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
            </Field>
            <Field label="Headline" hint='Use \n for a line break' isDark={isDark}>
              <Input value={activeSlide.headline} onChange={v => updateSlide("headline", v)} placeholder="e.g. Fresh Blooms"
                isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
            </Field>
          </div>

          <Field label="Description" isDark={isDark}>
            <Input value={activeSlide.description} onChange={v => updateSlide("description", v)} rows={2} placeholder="Short description..."
              isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
          </Field>

          {/* How many buttons this slide shows */}
          <Field label="Buttons" isDark={isDark}>
            <div className="inline-flex rounded-md overflow-hidden" style={{ border: `1px solid ${inputBdr}` }}>
              {[{ n: "1 button", v: false }, { n: "2 buttons", v: true }].map(opt => {
                const on = (activeSlide.showSecondary !== false) === opt.v
                return (
                  <button key={opt.n} type="button" onClick={() => updateSlide("showSecondary", opt.v)}
                    className="px-4 py-1.5 text-sm font-semibold transition-colors"
                    style={{ backgroundColor: on ? G : inputBg, color: on ? "#ffffff" : inputTxt }}>
                    {opt.n}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className={`grid gap-3 ${activeSlide.showSecondary !== false ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}>
            <Field label="Primary CTA" isDark={isDark}>
              <Input value={activeSlide.cta} onChange={v => updateSlide("cta", v)} placeholder="e.g. Shop Flowers"
                isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
            </Field>
            <Field label="Primary links to" isDark={isDark}>
              <select value={activeSlide.ctaNav || "shop"} onChange={e => updateSlide("ctaNav", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md outline-none"
                style={{ backgroundColor: inputBg, border: `1px solid ${inputBdr}`, color: inputTxt }}>
                {HERO_LINKS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
            {activeSlide.showSecondary !== false && (
              <Field label="Secondary CTA" isDark={isDark}>
                <Input value={activeSlide.ctaSecondary} onChange={v => updateSlide("ctaSecondary", v)} placeholder="e.g. View Occasions"
                  isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
              </Field>
            )}
            {activeSlide.showSecondary !== false && (
              <Field label="Secondary links to" isDark={isDark}>
                <select value={activeSlide.ctaSecondaryNav || "shop"} onChange={e => updateSlide("ctaSecondaryNav", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBdr}`, color: inputTxt }}>
                  {HERO_LINKS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Field label="Accent Color" hint="Controls the tag background and primary button color" isDark={isDark}>
              <div className="flex items-center gap-2">
                <input type="color" value={activeSlide.accent || "#2E8B34"}
                  onChange={e => updateSlide("accent", e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer flex-shrink-0" />
                <Input value={activeSlide.accent || "#2E8B34"} onChange={v => updateSlide("accent", v)} placeholder="#2E8B34"
                  isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
              </div>
            </Field>

            <Field label="Background Image" hint="Select a default image or upload a new one" isDark={isDark}>
              <div className="space-y-3">
                <Select 
                  value={isCustomImageActive ? "custom" : activeSlide.image}
                  onChange={v => updateSlide("image", v)}
                  options={[...IMAGE_OPTIONS, { label: "Custom Upload...", value: "custom" }]}
                  isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}
                />

                {/* The upload button will now correctly appear when "Custom Upload..." is clicked! */}
                {isCustomImageActive && (
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:opacity-80"
                    style={{ borderColor: inputBdr, backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                    <svg className="w-5 h-5 mr-2" style={{ color: subTxt }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span className="text-sm font-semibold" style={{ color: subTxt }}>
                      {uploadingHero ? "Uploading to secure server..." : "Click to Upload Custom Hero"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingHero} 
                      onChange={async (e) => {
                        const file = e.target.files[0]; if (!file) return;
                        setUploadingHero(true);
                        try {
                          const fd = new FormData(); fd.append("file", file);
                          const res = await api.post("/products/admin/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" }});
                          const url = res.data?.url || res.url;
                          if (url) updateSlide("image", url); else throw new Error("No URL returned");
                        } catch (err) { 
                          alert("Upload failed: " + (err.message || "Unknown error")); 
                        } finally { 
                          setUploadingHero(false); 
                        }
                      }} 
                    />
                  </label>
                )}
              </div>
            </Field>
          </div>

          <div className="flex items-center justify-between pt-2" style={{ borderTop:`1px solid ${headerBdr}` }}>
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i-1))}
              disabled={activeIdx===0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor:isDark?"#334155":"#dde3ec", color:subTxt, backgroundColor:isDark?"#1e293b":"white" }}>
              Previous Slide
            </button>
            <span className="text-xs" style={{ color:subTxt }}>Slide {activeIdx+1} of {slides.length}</span>
            <button
              onClick={() => setActiveIdx(i => Math.min(slides.length-1, i+1))}
              disabled={activeIdx===slides.length-1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor:isDark?"#334155":"#dde3ec", color:subTxt, backgroundColor:isDark?"#1e293b":"white" }}>
              Next Slide
            </button>
          </div>
        </div>
      </div>

      {/* Top-bar promo messages CMS */}
      <div className={entered ? "" : "hero-rise"}>
        <PromoStripEditor isDark={isDark} />
      </div>
    </div>
  )
}