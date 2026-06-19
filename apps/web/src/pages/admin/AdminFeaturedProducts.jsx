import { useState, useEffect, useMemo } from "react"
import { useTheme } from "../../context/ThemeContext"
import { useBranch } from "../../context/branchContext"
import { api } from "../../services/api.js"

const G  = "#2E8B34"
const DG = "#0C573E"

const STORAGE_KEY = "bloomora:admin:featured"

// fixed id for the Choose Your Bloom carousel section (pinned, non-deletable)
const CAROUSEL_ID = "__carousel__"

const RIBBON_OPTIONS = [
  { value: "",            label: "(none)" },
  { value: "Best Seller", label: "Best Seller" },
  { value: "Top Pick",    label: "Top Pick" },
  { value: "New",         label: "New" },
  { value: "Popular",     label: "Popular" },
  { value: "Premium",     label: "Premium" },
  { value: "Rare Find",   label: "Rare Find" },
  { value: "Tribute",     label: "Tribute" },
  { value: "Classic",     label: "Classic" },
  { value: "Comfort",     label: "Comfort" },
  { value: "Sympathy",    label: "Sympathy" },
]

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34", "Top Pick": "#0C573E",
  "New": "#3b82f6", "Popular": "#f59e0b",
  "Premium": "#7c3aed", "Rare Find": "#ec4899",
  "Tribute": "#6b7280", "Classic": "#0C573E",
  "Comfort": "#9d174d", "Sympathy": "#1d4ed8",
}

// ─── Dynamic Section Generator ───────────────────────────────────────────────
const generateBlankSection = (label = "New Section") => ({
  tabLabel: label,
  banner: {
    eyebrow: "", heading: "", description: "", ctaLabel: "Shop All", ctaTarget: "shop",
  },
  categories: [
    { label: "", tag: "", productId: null, nav: "shop" },
    { label: "", tag: "", productId: null, nav: "shop" },
    { label: "", tag: "", productId: null, nav: "shop" },
  ],
  featured: [
    { productId: null, ribbonOverride: null }, { productId: null, ribbonOverride: null },
    { productId: null, ribbonOverride: null }, { productId: null, ribbonOverride: null },
  ],
  sectionHeading: label,
  sectionEyebrow: "Featured",
})

// ─── Carousel (Choose Your Bloom) section ────────────────────────────────────
const blankSlide = () => ({
  productId: null,
  name: "",
  tag: "",
  price: "",
})

const generateCarouselSection = () => ({
  __type: "carousel",
  tabLabel: "Bouquet Carousel",
  eyebrow: "Handcrafted Daily",
  heading: "Today's Fresh Picks",
  subheading: "Browse the bouquets we're arranging right now.",
  ctaLabel: "Shop all bouquets",
  ctaTarget: "shop",
  slides: [blankSlide(), blankSlide(), blankSlide()],
})

const DEFAULT_DATA = {
  [CAROUSEL_ID]: generateCarouselSection(),
  bouquets: generateBlankSection("Featured Bouquets"),
  nonFloral: generateBlankSection("Featured Non-Floral"),
  funeral: generateBlankSection("Featured Funeral"),
}

function mergeSection(saved, label) {
  const blank = generateBlankSection(label)
  if (!saved || typeof saved !== "object") return blank

  const padArray = (savedArr, blankArr) => {
    const out = blankArr.map((blankItem, i) => {
      const s = Array.isArray(savedArr) ? savedArr[i] : undefined
      return s && typeof s === "object" ? { ...blankItem, ...s } : { ...blankItem }
    })
    if (Array.isArray(savedArr) && savedArr.length > blankArr.length) {
      for (let i = blankArr.length; i < savedArr.length; i++) {
        if (savedArr[i] && typeof savedArr[i] === "object") out.push(savedArr[i])
      }
    }
    return out
  }

  return {
    ...blank,
    ...saved,
    banner:     { ...blank.banner, ...(saved.banner || {}) },
    categories: padArray(saved.categories, blank.categories),
    featured:   padArray(saved.featured, blank.featured),
    sectionHeading: saved.sectionHeading ?? blank.sectionHeading,
    sectionEyebrow: saved.sectionEyebrow ?? blank.sectionEyebrow,
  }
}

// ─── tokens ──────────────────────────────────────────────────────────────────
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
    placeholderBg: "#0b1410",
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
    placeholderBg: "#f5faf5",
  }
}

// ─── small reusable input ────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, t, type = "text", maxLength }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all"
        style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
        onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }}
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, t, rows = 3 }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm rounded-md outline-none transition-all resize-y"
        style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
        onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }}
      />
    </div>
  )
}

// ─── Product Picker Modal ────────────────────────────────────────────────────
function ProductPicker({ open, onClose, onPick, products, loading, t, isDark, currentId }) {
  const [search, setSearch] = useState("")
  const [cat, setCat]       = useState("all")

  useEffect(() => { if (!open) setSearch("") }, [open])

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean))
    return ["all", ...Array.from(set).sort()]
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      if (cat !== "all" && p.category !== cat) return false
      if (q && !p.name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, search, cat])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
      onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
          <div>
            <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Select Product</p>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
              {loading ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
            style={{ color: t.textSecondary, backgroundColor: t.surfaceAlt }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = t.surfaceAlt}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* search + cat */}
        <div className="px-5 py-3 flex flex-col sm:flex-row gap-2" style={{ borderBottom: `1px solid ${t.cardBorder}`, backgroundColor: t.surfaceAlt }}>
          <div className="relative flex-1">
            <svg width="14" height="14" fill="none" stroke={t.textMuted} strokeWidth={2} viewBox="0 0 24 24"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name…"
              autoFocus
              className="w-full pl-8 pr-3 py-2 text-sm rounded-md outline-none transition-all"
              style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}
              onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.15)" }}
              onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }}
            />
          </div>
          <select
            value={cat}
            onChange={e => setCat(e.target.value)}
            className="px-3 py-2 text-sm rounded-md outline-none cursor-pointer transition-all"
            style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}>
            {categories.map(c => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="text-sm text-center py-12" style={{ color: t.textMuted }}>Loading products…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-semibold" style={{ color: t.textSecondary }}>No products found</p>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map(p => {
                const isCurrent = String(p.id) === String(currentId)
                return (
                  <button key={p.id}
                    onClick={() => { onPick(p); onClose() }}
                    className="text-left rounded-lg overflow-hidden transition-all"
                    style={{
                      backgroundColor: isCurrent ? (isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4") : t.surfaceAlt,
                      border: `1px solid ${isCurrent ? (isDark ? "rgba(74,222,128,0.45)" : "#86efac") : t.cardBorder}`,
                    }}
                    onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.borderColor = isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0" }}
                    onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.borderColor = t.cardBorder }}>
                    <div className="aspect-square overflow-hidden" style={{ backgroundColor: t.placeholderBg }}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="28" height="28" fill="none" stroke={t.textMuted} strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold line-clamp-1" style={{ color: t.textPrimary }}>{p.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold" style={{ color: isDark ? "#4ade80" : G }}>
                          ₱{Number(p.price || 0).toLocaleString()}
                        </span>
                        {p.category && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.badgeBg, color: t.textMuted }}>
                            {p.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Product Slot Card ───────────────────────────────────────────────────────
function SlotCard({ slot, idx, product, onPickClick, onClear, onRibbonChange, t, isDark }) {
  return (
    <div className="rounded-lg p-3"
      style={{ backgroundColor: t.surfaceAlt, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
          Slot {idx + 1}
        </p>
        {product && (
          <button onClick={onClear}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded transition-all"
            style={{ color: t.dangerColor }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.dangerBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            Clear
          </button>
        )}
      </div>

      {product ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0"
              style={{ backgroundColor: t.placeholderBg, border: `1px solid ${t.cardBorder}` }}>
              {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold line-clamp-1" style={{ color: t.textPrimary }}>{product.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: isDark ? "#4ade80" : G }}>
                ₱{Number(product.price || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
              Ribbon
            </label>
            <select
              value={slot.ribbonOverride ?? product.ribbon ?? ""}
              onChange={e => onRibbonChange(e.target.value || null)}
              className="w-full px-2 py-1.5 text-xs rounded-md outline-none cursor-pointer"
              style={{ backgroundColor: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}` }}>
              {RIBBON_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <button onClick={onPickClick}
            className="w-full text-xs font-semibold py-1.5 rounded-md transition-all"
            style={{ color: t.textSecondary, backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = t.cardBg}>
            Change Product
          </button>
        </div>
      ) : (
        <button onClick={onPickClick}
          className="w-full py-6 rounded-md flex flex-col items-center justify-center gap-1.5 transition-all"
          style={{ backgroundColor: t.cardBg, border: `1px dashed ${t.cardBorder}`, color: t.textMuted }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = isDark ? "rgba(74,222,128,0.4)" : "#86efac"
            e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.05)" : "#f0fdf4"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = t.cardBorder
            e.currentTarget.style.backgroundColor = t.cardBg
          }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
          </svg>
          <span className="text-xs font-semibold">Pick a product</span>
        </button>
      )}
    </div>
  )
}

// ─── Category Tile Editor ────────────────────────────────────────────────────
function CategoryEditor({ tile, idx, products, onUpdate, t, isDark, onPickClick }) {
  const linkedProduct = products.find(p => String(p.id) === String(tile.productId))
  return (
    <div className="rounded-lg p-3"
      style={{ backgroundColor: t.surfaceAlt, border: `1px solid ${t.cardBorder}` }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
        Tile {idx + 1}
      </p>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Label" value={tile.label}
            onChange={v => onUpdate({ ...tile, label: v })}
            placeholder="e.g. Sunflowers" t={t} maxLength={28} />
          <Field label="Tag" value={tile.tag}
            onChange={v => onUpdate({ ...tile, tag: v })}
            placeholder="e.g. Sunny" t={t} maxLength={16} />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
            Image From Product
          </label>
          {linkedProduct ? (
            <div className="flex items-center gap-2 p-1.5 rounded-md" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
              <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: t.placeholderBg }}>
                {linkedProduct.image && <img src={linkedProduct.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <p className="text-xs font-medium flex-1 min-w-0 line-clamp-1" style={{ color: t.textPrimary }}>{linkedProduct.name}</p>
              <div className="flex gap-1">
                <button onClick={onPickClick}
                  className="text-[10px] font-semibold px-2 py-1 rounded transition-all"
                  style={{ color: t.textSecondary, border: `1px solid ${t.cardBorder}` }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  Change
                </button>
                <button onClick={() => onUpdate({ ...tile, productId: null })}
                  className="text-[10px] font-semibold px-2 py-1 rounded transition-all"
                  style={{ color: t.dangerColor }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = t.dangerBg}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onPickClick}
              className="w-full py-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs font-semibold"
              style={{ backgroundColor: t.cardBg, border: `1px dashed ${t.cardBorder}`, color: t.textMuted }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = isDark ? "rgba(74,222,128,0.4)" : "#86efac"
                e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.05)" : "#f0fdf4"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = t.cardBorder
                e.currentTarget.style.backgroundColor = t.cardBg
              }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
              </svg>
              Pick product for image
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Carousel Slide Editor ───────────────────────────────────────────────────
function CarouselSlideEditor({ slide, idx, total, product, onUpdate, onPickClick, onClear, onMove, t, isDark }) {
  return (
    <div className="rounded-lg p-3"
      style={{ backgroundColor: t.surfaceAlt, border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: isDark ? "rgba(74,222,128,0.85)" : G, color: isDark ? "#0f172a" : "#fff" }}>
            {idx + 1}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Bloom Slide
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(idx, -1)} disabled={idx === 0}
            aria-label="Move slide up"
            className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: t.textSecondary, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => { if (idx !== 0) e.currentTarget.style.backgroundColor = t.hoverBg }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
            </svg>
          </button>
          <button onClick={() => onMove(idx, 1)} disabled={idx === total - 1}
            aria-label="Move slide down"
            className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: t.textSecondary, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => { if (idx !== total - 1) e.currentTarget.style.backgroundColor = t.hoverBg }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <button onClick={onClear}
            aria-label="Remove slide"
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: t.dangerColor }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.dangerBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        {/* image picker */}
        <div className="flex-shrink-0">
          {product ? (
            <button onClick={onPickClick}
              className="relative w-20 h-20 rounded-md overflow-hidden group"
              style={{ backgroundColor: t.placeholderBg, border: `1px solid ${t.cardBorder}` }}>
              {product.image
                ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <svg width="22" height="22" fill="none" stroke={t.textMuted} strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>}
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                Change
              </span>
            </button>
          ) : (
            <button onClick={onPickClick}
              className="w-20 h-20 rounded-md flex flex-col items-center justify-center gap-1 transition-all"
              style={{ backgroundColor: t.cardBg, border: `1px dashed ${t.cardBorder}`, color: t.textMuted }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = isDark ? "rgba(74,222,128,0.4)" : "#86efac"
                e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.05)" : "#f0fdf4"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = t.cardBorder
                e.currentTarget.style.backgroundColor = t.cardBg
              }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
              </svg>
              <span className="text-[9px] font-semibold text-center leading-tight">Pick image</span>
            </button>
          )}
        </div>

        {/* copy fields */}
        <div className="flex-1 min-w-0 space-y-2">
          <Field label="Name" value={slide.name}
            onChange={v => onUpdate({ ...slide, name: v })}
            placeholder={product?.name || "e.g. Pink Wrapper Roses"} t={t} maxLength={40} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Tag" value={slide.tag}
              onChange={v => onUpdate({ ...slide, tag: v })}
              placeholder="e.g. Best Seller" t={t} maxLength={20} />
            <Field label="Price" value={slide.price}
              onChange={v => onUpdate({ ...slide, price: v })}
              placeholder={product ? `₱${Number(product.price || 0).toLocaleString()}` : "e.g. ₱3,100"} t={t} maxLength={14} />
          </div>
        </div>
      </div>

      {product && (
        <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: t.textMuted }}>
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          Image linked to <span className="font-semibold" style={{ color: t.textSecondary }}>{product.name}</span>. Leave fields blank to use catalog values.
        </p>
      )}
    </div>
  )
}

// ─── Carousel Tab Editor ─────────────────────────────────────────────────────
function CarouselEditor({ data, onChange, products, loading, t, isDark }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIdx, setPickerIdx]   = useState(null)

  const slides = data.slides || []

  const openPicker = idx => { setPickerIdx(idx); setPickerOpen(true) }

  const handlePick = product => {
    if (pickerIdx == null) return
    onChange({
      ...data,
      slides: slides.map((s, i) => i === pickerIdx ? { ...s, productId: product.id } : s),
    })
    setPickerIdx(null)
  }

  const updateSlide = (idx, next) =>
    onChange({ ...data, slides: slides.map((s, i) => i === idx ? next : s) })

  const clearSlide = idx => {
    if (slides.length <= 1) {
      onChange({ ...data, slides: [blankSlide()] })
      return
    }
    onChange({ ...data, slides: slides.filter((_, i) => i !== idx) })
  }

  const addSlide = () =>
    onChange({ ...data, slides: [...slides, blankSlide()] })

  const moveSlide = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= slides.length) return
    const next = [...slides]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    onChange({ ...data, slides: next })
  }

  const currentPickId = pickerIdx != null ? slides[pickerIdx]?.productId : null

  return (
    <>
      <div className="space-y-4">
        {/* Header copy */}
        <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M5 12h14M3 16h4m10 0h4"/>
            </svg>
            <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Carousel Header</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Eyebrow Text" value={data.eyebrow}
              onChange={v => onChange({ ...data, eyebrow: v })}
              placeholder="e.g. Handcrafted Daily" t={t} maxLength={40} />
            <Field label="Heading" value={data.heading}
              onChange={v => onChange({ ...data, heading: v })}
              placeholder="e.g. Today's Fresh Picks" t={t} maxLength={50} />
          </div>
          <div className="mt-3">
            <Field label="Subheading" value={data.subheading}
              onChange={v => onChange({ ...data, subheading: v })}
              placeholder="e.g. Browse the bouquets we're arranging right now." t={t} maxLength={90} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Field label="Link Label" value={data.ctaLabel}
              onChange={v => onChange({ ...data, ctaLabel: v })}
              placeholder="e.g. Shop all bouquets" t={t} maxLength={28} />
            <Field label="Link Target Page" value={data.ctaTarget}
              onChange={v => onChange({ ...data, ctaTarget: v })}
              placeholder="e.g. shop, vases, addons" t={t} maxLength={32} />
          </div>
        </div>

        {/* Slides */}
        <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M8 9l3 3-3 3 M16 9l-3 3 3 3"/>
            </svg>
            <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Bloom Slides</p>
            <span className="text-[10px] ml-auto" style={{ color: t.textMuted }}>
              {slides.length} slide{slides.length === 1 ? "" : "s"} in rotation
            </span>
          </div>

          <div className="space-y-3">
            {slides.map((slide, i) => {
              const product = products.find(p => String(p.id) === String(slide.productId))
              return (
                <CarouselSlideEditor
                  key={i}
                  slide={slide}
                  idx={i}
                  total={slides.length}
                  product={product}
                  onUpdate={next => updateSlide(i, next)}
                  onPickClick={() => openPicker(i)}
                  onClear={() => clearSlide(i)}
                  onMove={moveSlide}
                  t={t}
                  isDark={isDark}
                />
              )
            })}
          </div>

          <button onClick={addSlide}
            className="w-full mt-3 py-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm font-semibold"
            style={{ backgroundColor: t.surfaceAlt, border: `1px dashed ${t.cardBorder}`, color: isDark ? "#4ade80" : G }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = isDark ? "rgba(74,222,128,0.4)" : "#86efac"
              e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.05)" : "#f0fdf4"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = t.cardBorder
              e.currentTarget.style.backgroundColor = t.surfaceAlt
            }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
            </svg>
            Add Bloom Slide
          </button>
        </div>
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
        products={products}
        loading={loading}
        currentId={currentPickId}
        t={t}
        isDark={isDark}
      />
    </>
  )
}

// ─── Carousel Live Preview ───────────────────────────────────────────────────
function CarouselPreview({ data, products, isDark }) {
  const slides = (data.slides || [])

  const accentG   = isDark ? "#4ade80" : G
  const sectionBg = isDark ? "#0f172a" : "#fcfcfb"
  const headingC  = isDark ? "#f3f4f6" : "#1f2937"
  const bodyC     = isDark ? "#9ca3af" : "#6b7280"
  const tagC      = isDark ? "#4ade80" : G
  const nameC     = isDark ? "#f3f4f6" : "#1f2937"
  const priceC    = isDark ? "#9ca3af" : "#6b7280"
  const btnBg     = isDark ? "#4ade80" : DG
  const btnIcon   = isDark ? "#0f172a" : "#ffffff"
  const haloC     = isDark ? "rgba(74,222,128,0.10)" : "rgba(46,139,52,0.06)"
  const peekBg    = isDark ? "#0f1a14" : "#f4f8f4"

  const resolve = slide => {
    if (!slide) return null
    const product = products.find(p => String(p.id) === String(slide.productId))
    return {
      image: product?.image || null,
      name: slide.name || product?.name || "(unnamed bloom)",
      tag: slide.tag || "",
      price: slide.price || (product ? `₱${Number(product.price || 0).toLocaleString()}` : ""),
    }
  }

  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (idx > slides.length - 1) setIdx(Math.max(0, slides.length - 1))
  }, [slides.length, idx])

  const mod = (n, m) => m === 0 ? 0 : ((n % m) + m) % m
  const safeIdx = mod(idx, slides.length || 1)

  const center = resolve(slides[safeIdx])
  const left   = slides.length > 1 ? resolve(slides[mod(safeIdx - 1, slides.length)]) : null
  const right  = slides.length > 1 ? resolve(slides[mod(safeIdx + 1, slides.length)]) : null

  const PeekImg = ({ data: d }) => {
    if (!d) return null
    return d.image
      ? <img src={d.image} alt="" className="max-w-full max-h-full object-contain"
          style={{ opacity: isDark ? 0.42 : 0.58, filter: "saturate(0.85)" }} />
      : <div className="w-3/4 h-3/4 rounded-lg flex items-center justify-center" style={{ backgroundColor: peekBg }}>
          <svg width="22" height="22" fill="none" stroke={bodyC} strokeWidth={1.4} viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
  }

  if (slides.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden flex items-center justify-center py-16"
        style={{ border: `1px solid ${isDark ? "#2d3748" : "#e5e7eb"}`, backgroundColor: sectionBg }}>
        <p className="text-sm" style={{ color: bodyC }}>Add a slide to preview the carousel.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? "#2d3748" : "#e5e7eb"}` }}>
      <section className="relative overflow-hidden px-4 py-6" style={{ backgroundColor: sectionBg }}>
        {/* ambient halo */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 420, height: 420, background: `radial-gradient(circle, ${haloC} 0%, transparent 70%)` }} />

        {/* heading */}
        <div className="text-center mb-4 relative">
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: accentG }}>
            {data.eyebrow || "(eyebrow)"}
          </p>
          <h2 className="text-xl font-bold mb-1.5" style={{ color: headingC }}>
            {data.heading || "(heading)"}
          </h2>
          <p className="text-[11px] mb-2.5" style={{ color: bodyC }}>
            {data.subheading || "(subheading)"}
          </p>
          <div className="mx-auto rounded-full"
            style={{ width: 40, height: 3, backgroundColor: accentG, boxShadow: isDark ? "0 0 10px rgba(74,222,128,0.5)" : "none" }} />
        </div>

        {/* stage */}
        <div className="relative mx-auto" style={{ maxWidth: 460, height: 230 }}>
          <button onClick={() => setIdx(i => mod(i - 1, slides.length))}
            aria-label="Previous slide"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            style={{ width: 32, height: 32, backgroundColor: btnBg,
              boxShadow: isDark ? "0 0 12px rgba(74,222,128,0.45)" : "0 6px 16px -6px rgba(12,87,62,0.45)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={btnIcon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => setIdx(i => mod(i + 1, slides.length))}
            aria-label="Next slide"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            style={{ width: 32, height: 32, backgroundColor: btnBg,
              boxShadow: isDark ? "0 0 12px rgba(74,222,128,0.45)" : "0 6px 16px -6px rgba(12,87,62,0.45)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={btnIcon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {left && (
            <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: "3%", width: "30%", height: "78%" }}>
              <PeekImg data={left} />
            </div>
          )}
          {right && (
            <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center"
              style={{ right: "3%", width: "30%", height: "78%" }}>
              <PeekImg data={right} />
            </div>
          )}

          {/* center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[80%] sm:w-[58%]"
            style={{ height: "100%" }}>
            <div key={safeIdx} className="flex items-center justify-center w-full h-full"
              style={{ animation: "cybPreviewIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              {center?.image ? (
                <img src={center.image} alt={center.name} className="max-w-full max-h-full object-contain drop-shadow-xl" />
              ) : (
                <div className="w-4/5 h-4/5 rounded-xl flex flex-col items-center justify-center gap-1.5"
                  style={{ backgroundColor: peekBg, border: `1px dashed ${isDark ? "#1e3a28" : "#d4e4d4"}` }}>
                  <svg width="30" height="30" fill="none" stroke={bodyC} strokeWidth={1.4} viewBox="0 0 24 24" style={{ opacity: 0.55 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p className="text-[9px]" style={{ color: bodyC }}>No image</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* caption */}
        <div className="text-center mt-2 relative" key={`cap-${safeIdx}`} style={{ animation: "cybTextIn 0.45s ease 0.05s both" }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: tagC }}>
            {center?.tag || "\u00A0"}
          </p>
          <h3 className="text-base font-bold mb-0.5" style={{ color: nameC }}>
            {center?.name}
          </h3>
          <p className="text-xs font-medium" style={{ color: priceC }}>
            {center?.price || "\u00A0"}
          </p>
        </div>

        {/* dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap relative">
          {slides.map((_, i) => {
            const active = i === safeIdx
            return (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{ width: active ? 18 : 6, height: 6, backgroundColor: active ? accentG : (isDark ? "#374151" : "#d1d5db") }} />
            )
          })}
        </div>

        {/* see all */}
        <div className="text-center mt-3 relative">
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: accentG }}>
            {data.ctaLabel || "Shop all bouquets"}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>

        <style>{`
          @keyframes cybPreviewIn { from { opacity:0; transform: scale(0.94) } to { opacity:1; transform: scale(1) } }
          @keyframes cybTextIn { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform: translateY(0) } }
        `}</style>
      </section>
    </div>
  )
}

// ─── Live Preview (Featured sections) ────────────────────────────────────────
function FeaturedPreview({ data, products, isDark }) {
  const accentG  = isDark ? "#4ade80" : G
  const headingC = isDark ? "#f3f4f6" : "#1f2937"
  const subC     = isDark ? "#9ca3af" : "#6b7280"
  const bannerBg = isDark ? "#0b1410" : "#ffffff"
  const bannerBdr= isDark ? "#1a3323" : "#eef3ee"
  const tileBdr  = isDark ? "#1e3a28" : "#e6efe6"
  const tileBg   = isDark ? "#0f1a14" : "#f5faf5"
  const sectionBg= isDark ? "#111827" : "#ffffff"
  const secHdrC  = isDark ? "#f3f4f6" : "#1f2937"
  const placeBg  = isDark ? "#0f172a" : "#f4f8f4"

  const slotProducts = data.featured.map(slot => products.find(p => String(p.id) === String(slot.productId)))
  const tileProducts = data.categories.map(cat => products.find(p => String(p.id) === String(cat.productId)))

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? "#2d3748" : "#e5e7eb"}` }}>
      <section style={{ backgroundColor: bannerBg, borderBottom: `1px solid ${bannerBdr}` }}>
        <div className="px-4 py-5 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-4 items-center">
          <div className="text-center lg:text-left">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: accentG }}>
              {data.banner.eyebrow || "(eyebrow)"}
            </p>
            <h2 className="text-lg font-bold mb-2 leading-tight" style={{ color: headingC }}>
              {data.banner.heading || "(heading)"}
            </h2>
            <div className="w-10 h-[2px] rounded-sm mx-auto lg:mx-0 mb-2" style={{ backgroundColor: G }} />
            <p className="text-[11px] mb-3 leading-relaxed" style={{ color: subC }}>
              {data.banner.description || "(description)"}
            </p>
            <div className="flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: DG }}>
                {data.banner.ctaLabel || "Shop"}
                <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {data.categories.map((cat, i) => {
              const linked = tileProducts[i]
              return (
                <div key={i} className={i === 1 ? "lg:mt-4" : ""}>
                  <div className="relative aspect-square overflow-hidden rounded-lg"
                    style={{ border: `1px solid ${tileBdr}`, backgroundColor: tileBg }}>
                    {linked?.image ? (
                      <img src={linked.image} alt={cat.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="20" height="20" fill="none" stroke={subC} strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-end p-1.5"
                      style={{ background: "linear-gradient(to top, rgba(12,87,62,0.78) 0%, rgba(12,87,62,0.05) 55%, transparent 100%)" }}>
                      <p className="text-white text-[9px] font-semibold leading-tight w-full text-center">
                        {cat.label || "(label)"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: sectionBg }}>
        <div className="px-4 py-4">
          <div className="flex items-end justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-[2px] h-4 rounded-sm shrink-0" style={{ backgroundColor: G }} />
              <div>
                <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: accentG }}>
                  {data.sectionEyebrow || "Featured"}
                </p>
                <h3 className="text-sm font-bold" style={{ color: secHdrC }}>
                  {data.sectionHeading || "Featured Products"}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {slotProducts.map((p, i) => {
              const ribbon = data.featured[i].ribbonOverride ?? p?.ribbon
              const ribbonColor = RIBBON_COLORS[ribbon]
              return (
                <div key={i} className="rounded-md overflow-hidden"
                  style={{ backgroundColor: isDark ? "#1a2332" : "#fff", border: `1px solid ${isDark ? "#2d3748" : "#e8e8e8"}` }}>
                  <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: placeBg }}>
                    {p?.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <svg width="16" height="16" fill="none" stroke={subC} strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
                        </svg>
                        <p className="text-[8px]" style={{ color: subC }}>Slot {i + 1}</p>
                      </div>
                    )}
                    {ribbon && ribbonColor && (
                      <div className="absolute top-1.5 left-0">
                        <div className="text-[7px] font-bold text-white py-0.5 pr-2 pl-1.5"
                          style={{
                            backgroundColor: ribbonColor,
                            clipPath: "polygon(0 0,calc(100% - 4px) 0,100% 50%,calc(100% - 4px) 100%,0 100%)",
                          }}>
                          {ribbon}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-2">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: isDark ? "#4ade80" : G }}>
                      {p ? `₱${Number(p.price || 0).toLocaleString()}` : "—"}
                    </p>
                    <p className="text-[10px] font-semibold leading-tight line-clamp-1"
                      style={{ color: isDark ? "#e2e8f0" : "#374151" }}>
                      {p?.name || "(no product selected)"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Tab Editor ──────────────────────────────────────────────────────────────
function TabEditor({ data, onChange, products, loading, t, isDark }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null) 

  const handlePick = product => {
    if (!pickerTarget) return
    if (pickerTarget.type === "featured") {
      onChange({
        ...data,
        featured: data.featured.map((s, i) =>
          i === pickerTarget.idx ? { ...s, productId: product.id } : s
        ),
      })
    } else if (pickerTarget.type === "category") {
      onChange({
        ...data,
        categories: data.categories.map((c, i) =>
          i === pickerTarget.idx ? { ...c, productId: product.id } : c
        ),
      })
    }
    setPickerTarget(null)
  }

  const openPicker = (type, idx) => {
    setPickerTarget({ type, idx })
    setPickerOpen(true)
  }

  const currentTargetId = pickerTarget
    ? (pickerTarget.type === "featured"
        ? data.featured[pickerTarget.idx]?.productId
        : data.categories[pickerTarget.idx]?.productId)
    : null

  return (
    <>
      <div className="space-y-4">
        {/* Banner */}
        <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Banner</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Eyebrow Text" value={data.banner.eyebrow}
              onChange={v => onChange({ ...data, banner: { ...data.banner, eyebrow: v } })}
              placeholder="e.g. Fresh and Beautiful" t={t} maxLength={40} />
            <Field label="Heading" value={data.banner.heading}
              onChange={v => onChange({ ...data, banner: { ...data.banner, heading: v } })}
              placeholder="e.g. Fresh Flower Collections" t={t} maxLength={50} />
          </div>
          <div className="mt-3">
            <TextArea label="Description" value={data.banner.description}
              onChange={v => onChange({ ...data, banner: { ...data.banner, description: v } })}
              placeholder="Short description shown under the heading…" t={t} rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Field label="CTA Button Label" value={data.banner.ctaLabel}
              onChange={v => onChange({ ...data, banner: { ...data.banner, ctaLabel: v } })}
              placeholder="e.g. Shop All Flowers" t={t} maxLength={28} />
            <Field label="CTA Target Page" value={data.banner.ctaTarget}
              onChange={v => onChange({ ...data, banner: { ...data.banner, ctaTarget: v } })}
              placeholder="e.g. shop, vases, addons" t={t} maxLength={32} />
          </div>
        </div>

        {/* Category tiles */}
        <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Category Tiles</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.categories.map((cat, i) => (
              <CategoryEditor
                key={i}
                tile={cat}
                idx={i}
                products={products}
                onUpdate={next => onChange({
                  ...data,
                  categories: data.categories.map((c, j) => j === i ? next : c),
                })}
                onPickClick={() => openPicker("category", i)}
                t={t}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* Section header */}
        <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Section Header</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Section Eyebrow" value={data.sectionEyebrow}
              onChange={v => onChange({ ...data, sectionEyebrow: v })}
              placeholder="e.g. Our Top Picks" t={t} maxLength={40} />
            <Field label="Section Heading" value={data.sectionHeading}
              onChange={v => onChange({ ...data, sectionHeading: v })}
              placeholder="e.g. Featured Bouquets" t={t} maxLength={40} />
          </div>
        </div>

        {/* Featured slots */}
        <div className="rounded-xl p-4" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" fill="none" stroke={isDark ? "#4ade80" : G} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/>
            </svg>
            <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Featured Product Slots</p>
            <span className="text-[10px] ml-auto" style={{ color: t.textMuted }}>4 slots displayed on homepage</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.featured.map((slot, i) => {
              const product = products.find(p => String(p.id) === String(slot.productId))
              return (
                <SlotCard
                  key={i}
                  slot={slot}
                  idx={i}
                  product={product}
                  onPickClick={() => openPicker("featured", i)}
                  onClear={() => onChange({
                    ...data,
                    featured: data.featured.map((s, j) => j === i ? { productId: null, ribbonOverride: null } : s),
                  })}
                  onRibbonChange={ribbon => onChange({
                    ...data,
                    featured: data.featured.map((s, j) => j === i ? { ...s, ribbonOverride: ribbon } : s),
                  })}
                  t={t}
                  isDark={isDark}
                />
              )
            })}
          </div>
        </div>
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
        products={products}
        loading={loading}
        currentId={currentTargetId}
        t={t}
        isDark={isDark}
      />
    </>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function AdminFeaturedProducts() {
  const { isDark } = useTheme()
  const t = useTokens(isDark)

  // Branch context
  const { branch, setBranch } = useBranch()

  // Keep the saved layouts for both branches together
  const [allData, setAllData] = useState({
    Manila: DEFAULT_DATA,
    Pampanga: DEFAULT_DATA
  })

  // Current branch's data and its tab ids
  const data = allData[branch] || DEFAULT_DATA
  const tabIds = Object.keys(data)

  const [activeTab, setActiveTab] = useState(tabIds[0])
  
  // Re-sync activeTab when branch toggles or allData finishes loading
  useEffect(() => {
    if (tabIds.length > 0 && !tabIds.includes(activeTab)) {
      setActiveTab(tabIds[0])
    }
  }, [branch, tabIds, activeTab])
  
  const [products, setProds]= useState([])
  const [loading, setLoading]= useState(true)
  const [dirty, setDirty]   = useState(false)
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  // Drives the one-time entrance animation; removed after it plays so it never replays.
  const [entered, setEntered] = useState(false)

  // Modal State
  const [modal, setModal] = useState({ isOpen: false, type: null, input: '', error: '' })

  const isCarousel = id => id === CAROUSEL_ID || data[id]?.__type === "carousel"

  // Upgrade older saved data to the current format
  const formatSettings = (parsed) => {
    const upgradedData = {}
    const savedCarousel = parsed[CAROUSEL_ID] || Object.values(parsed).find(s => s?.__type === "carousel")
    upgradedData[CAROUSEL_ID] = { ...generateCarouselSection(), ...(savedCarousel || {}) }

    Object.keys(parsed).forEach(k => {
      if (k === CAROUSEL_ID || parsed[k]?.__type === "carousel") return
      const label = parsed[k].tabLabel || (k === 'bouquets' ? "Featured Bouquets" : (k === 'nonFloral' ? "Featured Non-Floral" : (k === 'funeral' ? "Featured Funeral" : k)))
      upgradedData[k] = { ...mergeSection(parsed[k], label), tabLabel: label }
    })
    return upgradedData;
  }

  useEffect(() => {
    api.get("/products/admin/settings/homepage")
      .then(parsed => {
        if (parsed && Object.keys(parsed).length > 0) {
          // Use the branch-aware format if the saved data already has it
          if (parsed.Manila || parsed.Pampanga) {
            setAllData({
              Manila: parsed.Manila ? formatSettings(parsed.Manila) : DEFAULT_DATA,
              Pampanga: parsed.Pampanga ? formatSettings(parsed.Pampanga) : DEFAULT_DATA
            });
          } else {
            // Legacy Migration (apply old data to Manila only)
            setAllData({
              Manila: formatSettings(parsed),
              Pampanga: DEFAULT_DATA
            });
          }
        }
      })
      .catch(err => console.error("Failed to load homepage settings from DB:", err))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.getAdminProducts()
      .then(rows => {
        if (cancelled) return
        const normalized = (Array.isArray(rows.data || rows) ? (rows.data || rows) : []).map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          image: p.image || p.image_url || null,
          category: p.category || null,
          ribbon: p.ribbon || null,
          branches: p.branches || [],
        }))
        setProds(normalized)
      })
      .catch(err => {
        console.warn("Products fetch failed, picker will be empty:", err?.message)
        if (!cancelled) setProds([])
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Play the entrance animation once on mount, then turn it off.
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 1300)
    return () => clearTimeout(timer)
  }, [])

  const currentData = data[activeTab] || generateBlankSection(activeTab || "New")
  
  // Update only the current branch's layout
  const setCurrentData = next => {
    setAllData(prev => ({
      ...prev,
      [branch]: {
        ...prev[branch],
        [activeTab]: next
      }
    }))
    setDirty(true)
    setSaved(false)
  }

  // ─── Modal Logic ──
  const openModal = (type) => {
    setModal({
      isOpen: true,
      type: type,
      input: type === 'rename' ? data[activeTab].tabLabel : '',
      error: ''
    })
  }

  const handleModalConfirm = () => {
    const trimmedInput = modal.input.trim()

    if (modal.type === 'add' || modal.type === 'rename') {
      if (!trimmedInput) {
        setModal({ ...modal, error: "Section name cannot be empty." })
        return
      }
    }

    if (modal.type === 'add') {
      const newId = `section_${Date.now()}`;
      setAllData(prev => ({
        ...prev,
        [branch]: {
          ...prev[branch],
          [newId]: generateBlankSection(trimmedInput)
        }
      }));
      setActiveTab(newId);
    } 
    else if (modal.type === 'rename') {
      setAllData(prev => ({
        ...prev,
        [branch]: {
          ...prev[branch],
          [activeTab]: {
            ...prev[branch][activeTab],
            tabLabel: trimmedInput
          }
        }
      }));
    } 
    else if (modal.type === 'delete') {
      setAllData(prev => {
        const branchData = { ...prev[branch] };
        delete branchData[activeTab];
        return { ...prev, [branch]: branchData };
      });
    }

    setDirty(true);
    setSaved(false);
    setModal({ isOpen: false, type: null, input: '', error: '' });
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save both branches' layouts to the database
      await api.post("/products/admin/settings/homepage", allData)
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert("Failed to save to database: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!activeTab && tabIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
         <p className="text-gray-500 mb-4">No sections exist in {branch}.</p>
         <button onClick={() => openModal('add')} className="px-4 py-2 bg-green-600 text-white rounded-md font-bold">Add First Section</button>

         {/* Render Modal even when empty if they are adding the first section */}
         {modal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal({isOpen:false})}>
              <div className="rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }} onClick={e => e.stopPropagation()}>
                 <h3 className="text-lg font-bold mb-4" style={{color: t.textPrimary}}>Add New Section</h3>
                 <div className="mb-6">
                   <input autoFocus value={modal.input} onChange={e => setModal({...modal, input: e.target.value, error: ''})} className="w-full px-3 py-2 text-sm rounded-md outline-none border" style={{ backgroundColor: t.inputBg, color: t.textPrimary, borderColor: t.inputBorder }} placeholder="e.g. Holiday Specials" />
                   {modal.error && <p className="text-red-500 text-xs mt-1">{modal.error}</p>}
                 </div>
                 <div className="flex justify-end gap-2">
                   <button onClick={() => setModal({isOpen:false})} className="px-4 py-2 text-sm font-semibold rounded-md" style={{ color: t.textSecondary }}>Cancel</button>
                   <button onClick={handleModalConfirm} className="px-4 py-2 text-sm font-semibold rounded-md text-white bg-green-600">Save</button>
                 </div>
              </div>
            </div>
         )}
      </div>
    )
  }

  const activeIsCarousel = isCarousel(activeTab)

  // Only show products that exist at the current branch
  const branchProducts = products.filter(p => p.branches?.includes(branch));

  return (
    <div className="space-y-5">
      {/* Gentle fade + rise so content eases in once loaded instead of flashing. */}
      <style>{`
        @keyframes featRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .feat-rise { animation: featRise 0.85s ease-out both; }
      `}</style>

      {/* header */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${entered ? "" : "feat-rise"}`}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.textPrimary }}>Featured Products</h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            Curate which products appear in the homepage Featured sections for each branch.
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">

          {/* Branch selector */}
          <div className="flex gap-2">
            {["Manila", "Pampanga"].map(b => (
              <button
                key={b}
                onClick={() => setBranch(b)}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md font-bold transition-all text-sm"
                style={{
                  backgroundColor: branch === b ? DG : "transparent",
                  color: branch === b ? "white" : t.textSecondary,
                  border: `1px solid ${branch === b ? DG : t.inputBorder}`
                }}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5"
                style={{ backgroundColor: isDark ? "rgba(74,222,128,0.15)" : "#f0fdf4", color: isDark ? "#4ade80" : "#16a34a" }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Saved!
              </span>
            )}
            <button onClick={handleSave} disabled={!dirty || saving}
              className="text-xs font-bold px-4 py-2 rounded-md text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
              {saving ? (
                 <svg width="13" height="13" fill="none" viewBox="0 0 24 24" style={{animation:"spin 1s linear infinite"}}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
              ) : (
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
              Publish to Homepage
            </button>
          </div>
        </div>
      </div>

      {/* internal tabs and section controls */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${entered ? "" : "feat-rise"}`} style={{ animationDelay: "0.12s" }}>
        <div className="flex flex-nowrap p-1 rounded-lg gap-1 overflow-x-auto max-w-full" style={{ backgroundColor: t.badgeBg, border: `1px solid ${t.cardBorder}` }}>
          {tabIds.map(id => {
            const on = activeTab === id
            const carousel = isCarousel(id)
            return (
              <button key={id}
                onClick={() => setActiveTab(id)}
                className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
                style={{
                  backgroundColor: on ? t.surfaceBg : "transparent",
                  color: on ? (isDark ? "#4ade80" : DG) : t.textSecondary,
                  boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}>
                {carousel && (
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3"/>
                  </svg>
                )}
                {data[id]?.tabLabel || id}
              </button>
            )
          })}
          <button onClick={() => openModal('add')}
            className="px-3 py-1.5 rounded-md text-xs font-bold text-white transition-all hover:opacity-90 flex-shrink-0 whitespace-nowrap"
            style={{ backgroundColor: G }}>
            + Add Section
          </button>
        </div>

        {/* Section Modifiers — hidden for the pinned carousel section */}
        {!activeIsCarousel && (
          <div className="flex items-center gap-2">
            <button onClick={() => openModal('rename')}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border transition-all"
              style={{ borderColor: t.cardBorder, color: t.textSecondary, backgroundColor: t.surfaceBg }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = t.surfaceBg}>
              Rename Tab
            </button>
            <button onClick={() => openModal('delete')}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
              style={{ color: t.dangerColor, backgroundColor: t.dangerBg }}
              onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
              onMouseLeave={e => e.currentTarget.style.opacity = 1}>
              Delete Section
            </button>
          </div>
        )}
        {activeIsCarousel && (
          <span className="text-[11px] font-medium px-3 py-1.5 rounded-md inline-flex items-center gap-1.5"
            style={{ backgroundColor: t.badgeBg, color: t.textMuted, border: `1px solid ${t.cardBorder}` }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Built-in section
          </span>
        )}
      </div>

      {/* split layout */}
      <div className={`grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5 ${entered ? "" : "feat-rise"}`} style={{ animationDelay: "0.24s" }}>
        {/* editor */}
        <div>
          {activeIsCarousel ? (
            <CarouselEditor
              data={currentData}
              onChange={setCurrentData}
              products={branchProducts}
              loading={loading}
              t={t}
              isDark={isDark}
            />
          ) : (
            <TabEditor
              data={currentData}
              onChange={setCurrentData}
              products={branchProducts}
              loading={loading}
              t={t}
              isDark={isDark}
            />
          )}
        </div>

        {/* preview */}
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <svg width="14" height="14" fill="none" stroke={t.textMuted} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Live Preview</p>
          </div>
          <div className="xl:sticky xl:top-4">
            {activeIsCarousel ? (
              <CarouselPreview data={currentData} products={branchProducts} isDark={isDark} />
            ) : (
              <FeaturedPreview data={currentData} products={branchProducts} isDark={isDark} />
            )}
          </div>
        </div>
      </div>

      {/* ── Action Modal ── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal({isOpen:false})}>
          <div className="rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }} onClick={e => e.stopPropagation()}>
             <h3 className="text-lg font-bold mb-2" style={{color: t.textPrimary}}>
                {modal.type === 'add' ? 'Add New Section' : modal.type === 'rename' ? 'Rename Section' : 'Delete Section'}
             </h3>
             
             {modal.type === 'delete' ? (
               <p className="text-sm mb-6 mt-2" style={{color: t.textSecondary}}>
                 Are you sure you want to completely delete the <span className="font-bold text-red-500">"{data[activeTab]?.tabLabel}"</span> section? This will remove it from the homepage.
               </p>
             ) : (
               <div className="mb-6 mt-4">
                 <input 
                    autoFocus 
                    value={modal.input} 
                    onChange={e => setModal({...modal, input: e.target.value, error: ''})} 
                    className="w-full px-3 py-2 text-sm rounded-md outline-none border transition-all" 
                    style={{ backgroundColor: t.inputBg, color: t.textPrimary, borderColor: t.inputBorder }} 
                    placeholder="e.g. Holiday Specials" 
                 />
                 {modal.error && <p className="text-red-500 text-xs mt-1.5 font-medium">{modal.error}</p>}
               </div>
             )}

             <div className="flex justify-end gap-2">
               <button onClick={() => setModal({isOpen:false})} className="px-4 py-2 text-sm font-semibold rounded-md transition-all" style={{ color: t.textSecondary }} onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>Cancel</button>
               <button onClick={handleModalConfirm} className={`px-4 py-2 text-sm font-semibold rounded-md text-white transition-opacity hover:opacity-90 ${modal.type === 'delete' ? 'bg-red-500' : 'bg-green-600'}`}>
                 {modal.type === 'delete' ? 'Delete Permanently' : 'Save Section'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}