import { useState, useEffect, useMemo } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"

const G  = "#2E8B34"
const DG = "#0C573E"

const STORAGE_KEY = "bloomora:admin:featured"

const RIBBON_OPTIONS = [
  { value: "",            label: "(none)" },
  { value: "Best Seller", label: "Best Seller" },
  { value: "Top Pick",    label: "Top Pick" },
  { value: "New",         label: "New" },
  { value: "Popular",     label: "Popular" },
  { value: "Premium",     label: "Premium" },
  { value: "Rare Find",   label: "Rare Find" },
]
const RIBBON_COLORS = {
  "Best Seller": "#2E8B34", "Top Pick": "#0C573E",
  "New": "#3b82f6", "Popular": "#f59e0b",
  "Premium": "#7c3aed", "Rare Find": "#ec4899",
}

// ─── default seed shape ──────────────────────────────────────────────────────
const DEFAULT_DATA = {
  bouquets: {
    banner: {
      eyebrow: "",
      heading: "",
      description: "",
      ctaLabel: "Shop All",
      ctaTarget: "shop",
    },
    categories: [
      { label: "", tag: "", productId: null, nav: "shop" },
      { label: "", tag: "", productId: null, nav: "shop" },
      { label: "", tag: "", productId: null, nav: "shop" },
    ],
    featured: [
      { productId: null, ribbonOverride: null },
      { productId: null, ribbonOverride: null },
      { productId: null, ribbonOverride: null },
      { productId: null, ribbonOverride: null },
    ],
    sectionHeading: "",
    sectionEyebrow: "",
  },
  nonFloral: {
    banner: {
      eyebrow: "",
      heading: "",
      description: "",
      ctaLabel: "Shop All",
      ctaTarget: "shop",
    },
    categories: [
      { label: "", tag: "", productId: null, nav: "shop" },
      { label: "", tag: "", productId: null, nav: "shop" },
      { label: "", tag: "", productId: null, nav: "shop" },
    ],
    featured: [
      { productId: null, ribbonOverride: null },
      { productId: null, ribbonOverride: null },
      { productId: null, ribbonOverride: null },
      { productId: null, ribbonOverride: null },
    ],
    sectionHeading: "",
    sectionEyebrow: "",
  },
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

          {/* ribbon override */}
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

        {/* image-providing product */}
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

// ─── Live Preview ────────────────────────────────────────────────────────────
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
      {/* banner */}
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

      {/* featured grid */}
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
  const [pickerTarget, setPickerTarget] = useState(null) // { type:"featured"|"category", idx }

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

  const [tab, setTab]       = useState("bouquets") // "bouquets" | "nonFloral"
  const [data, setData]     = useState(DEFAULT_DATA)
  const [products, setProds]= useState([])
  const [loading, setLoading]= useState(true)
  const [dirty, setDirty]   = useState(false)
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── load saved layout from DATABASE ──
  useEffect(() => {
    // Make sure you add this method to your api.js file:
    // getHomepageSettings: () => request('/admin/settings/homepage'),
    api.get("products/admin/settings/homepage") // Adjust path based on your router
      .then(parsed => {
        // If the database has data, merge it. Otherwise use the blank defaults.
        if (parsed && parsed.bouquets && parsed.nonFloral) {
          setData(parsed);
        }
      })
      .catch(err => console.error("Failed to load homepage settings from DB:", err))
  }, [])

  // ─── fetch products for the picker ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get("/products/")
      .then(rows => {
        if (cancelled) return
        const normalized = (Array.isArray(rows) ? rows : []).map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          image: p.image || p.image_url || null,
          category: p.category || null,
          ribbon: p.ribbon || null,
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

  const currentData = data[tab]
  const setCurrentData = next => {
    setData(prev => ({ ...prev, [tab]: next }))
    setDirty(true)
    setSaved(false)
  }

  // ─── save layout to DATABASE ──
  const handleSave = async () => {
    setSaving(true)
    try {
      // Make sure you add this method to your api.js file:
      // saveHomepageSettings: (data) => request('/admin/settings/homepage', { method: 'POST', body: JSON.stringify(data) }),
      await api.post("/products/admin/settings/homepage", data) // Adjust path based on your router
      
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert("Failed to save to database: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!window.confirm(`Reset the "${tab === "bouquets" ? "Featured Bouquets" : "Featured Non-Floral"}" section to blank defaults?`)) return
    setData(prev => ({ ...prev, [tab]: DEFAULT_DATA[tab] }))
    setDirty(true)
    setSaved(false)
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.textPrimary }}>Featured Products</h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            Curate which products appear in the homepage Featured sections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{ backgroundColor: isDark ? "rgba(74,222,128,0.15)" : "#f0fdf4", color: isDark ? "#4ade80" : "#16a34a" }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Live
            </span>
          )}
          <button onClick={handleReset}
            className="text-xs font-semibold px-3 py-2 rounded-md border transition-all"
            style={{ borderColor: t.cardBorder, color: t.textSecondary, backgroundColor: t.surfaceBg }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = t.surfaceBg}>
            Clear Tab
          </button>
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

      {/* internal tabs */}
      <div className="inline-flex p-1 rounded-lg" style={{ backgroundColor: t.badgeBg, border: `1px solid ${t.cardBorder}` }}>
        {[
          { key: "bouquets",  label: "Featured Bouquets" },
          { key: "nonFloral", label: "Featured Non-Floral" },
        ].map(tt => {
          const on = tab === tt.key
          return (
            <button key={tt.key}
              onClick={() => setTab(tt.key)}
              className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                backgroundColor: on ? t.surfaceBg : "transparent",
                color: on ? (isDark ? "#4ade80" : DG) : t.textSecondary,
                boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              }}>
              {tt.label}
            </button>
          )
        })}
      </div>

      {/* split layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5">
        {/* editor */}
        <div>
          <TabEditor
            data={currentData}
            onChange={setCurrentData}
            products={products}
            loading={loading}
            t={t}
            isDark={isDark}
          />
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
            <FeaturedPreview data={currentData} products={products} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  )
}
