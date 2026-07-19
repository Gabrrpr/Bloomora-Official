import { useState, useEffect, useRef, useMemo } from "react"
import { useTheme } from "../context/ThemeContext"
import { api } from "../services/api"
import { useCurrency } from "../context/CuurencyContext" 

const G  = "#2E8B34"
const DG = "#0C573E"

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34", "Top Pick": "#0C573E",
  "New": "#3b82f6", "Popular": "#f59e0b",
  "Premium": "#7c3aed", "Rare Find": "#ec4899",
  "Tribute": "#6b7280", "Classic": "#0C573E",
  "Comfort": "#9d174d", "Sympathy": "#1d4ed8",
}

const GLOW_BORDER_CSS = `
  @property --bloom-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
  @keyframes bloomBorderSpin { to { --bloom-angle: 360deg; } }
  .bloom-glow-border { position: relative; z-index: 0; }
  .bloom-glow-border::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(from var(--bloom-angle),
      rgba(74,222,128,0.12) 0deg,
      rgba(74,222,128,0.12) 55deg,
      rgba(46,139,52,0.60) 85deg,
      #2E8B34 105deg,
      #4ade80 125deg,
      #bbf7d0 135deg,
      #4ade80 145deg,
      #2E8B34 165deg,
      rgba(46,139,52,0.60) 185deg,
      rgba(74,222,128,0.12) 215deg,
      rgba(74,222,128,0.12) 360deg
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
            mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    pointer-events: none;
    animation: bloomBorderSpin 4s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .bloom-glow-border::before { animation: none; }
  }

  @keyframes dfspetalBloom {
    0%, 100% { opacity: 0.2; }
    50%       { opacity: 1;   }
  }
`

// ── Inline flower petal loader (namespaced: dfs) ────────────────────────────
function DFSLoader() {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <div className="w-full py-24 flex flex-col items-center justify-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {petals.map(({ angle, color }, i) => (
          <g key={i} transform={`rotate(${angle} 50 50)`}>
            <ellipse
              cx="50" cy="27" rx="9.5" ry="21"
              fill={color}
              style={{
                animation: `dfspetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`,
                animationFillMode: "both",
              }}
            />
          </g>
        ))}
        <circle cx="50" cy="50" r="12" fill="#2E8B34" />
        <circle cx="50" cy="50" r="7" fill="#f9c6d0" />
        <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
      </svg>
      <p className="text-sm font-medium tracking-wide" style={{ color: "#6b7280" }}>
        Loading featured collections...
      </p>
    </div>
  )
}

function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

// ─── 1. Your Beautiful Single Section Layout ─────────────────────────────────
function SectionBlock({ data, products, onNavigate, onPreview, isDark }) {
  const { formatPrice } = useCurrency() || { formatPrice: (price) => `₱${Number(price).toLocaleString()}` }

  if (!data) return null

  const accentG  = isDark ? "#4ade80" : G
  const headingC = isDark ? "#f3f4f6" : "#1f2937"
  const subC     = isDark ? "#9ca3af" : "#6b7280"
  const bannerBg = isDark ? "#0b1410" : "#ffffff"
  const bannerBdr= isDark ? "#1a3323" : "#eef3ee"
  const tileBdr  = isDark ? "#1e3a28" : "#e6efe6"
  const tileBg   = isDark ? "#0f1a14" : "#f5faf5"
  const sectionBg= isDark ? "#111827" : "#fafafa"
  const secHdrC  = isDark ? "#f3f4f6" : "#1f2937"

  const lineGlow = isDark ? "0 0 10px rgba(74,222,128,0.6)" : "none"

  const [bannerRef, bannerVisible] = useScrollReveal(0.08)
  const [gridRef, gridVisible]     = useScrollReveal(0.06)

  const banner     = data?.banner || {}
  const categories = Array.isArray(data?.categories) ? data.categories : []
  const featured   = Array.isArray(data?.featured) ? data.featured : []

  const slotProducts = featured.map(slot => products.find(p => String(p.id) === String(slot.productId)))
  const tileProducts = categories.map(cat => products.find(p => String(p.id) === String(cat.productId)))

  return (
    <div className="w-full">
      <section style={{ backgroundColor: bannerBg, borderBottom: `1px solid ${bannerBdr}` }}>
        <div
          ref={bannerRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 items-center transition-all duration-500"
          style={{ opacity: bannerVisible ? 1 : 0, transform: bannerVisible ? "none" : "translateY(24px)" }}
        >
          <div className="text-center lg:text-left">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentG }}>
              {banner?.eyebrow}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: headingC }}>
              {banner?.heading}
            </h2>
            <div className="w-16 h-[3px] rounded-sm mx-auto lg:mx-0 mb-5" style={{ backgroundColor: accentG, boxShadow: lineGlow }} />
            <p className="text-base mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0" style={{ color: subC }}>
              {banner?.description}
            </p>
            <div className="flex justify-center lg:justify-start">
              <button onClick={() => onNavigate(banner?.ctaTarget)}
                className="bloom-glow-border inline-flex items-center gap-2 text-white text-sm font-bold px-8 py-3.5 rounded-full hover:opacity-90 transition-all shadow-lg shadow-green-900/20"
                style={{ backgroundColor: DG }}>
                {banner?.ctaLabel}
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {categories.map((cat, i) => {
              const linked = tileProducts[i]
              return (
                <button key={i} onClick={() => onNavigate(cat.nav || "shop")}
                  className={`group relative aspect-square overflow-hidden rounded-2xl transition-transform hover:-translate-y-1 hover:shadow-xl ${i === 1 ? "lg:mt-8" : ""}`}
                  style={{ border: `1px solid ${tileBdr}`, backgroundColor: tileBg }}>
                  {linked?.image && (
                    <img src={linked.image} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4"
                    style={{ background: "linear-gradient(to top, rgba(12,87,62,0.85) 0%, rgba(12,87,62,0.1) 60%, transparent 100%)" }}>
                    <span className="text-[10px] sm:text-xs font-bold text-green-300 uppercase tracking-wider mb-0.5 transform translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {cat.tag}
                    </span>
                    <p className="text-white text-sm sm:text-base font-bold leading-tight w-full text-left">{cat.label}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: sectionBg }} className="py-12 lg:py-16">
        <div
          ref={gridRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500"
          style={{ opacity: gridVisible ? 1 : 0, transform: gridVisible ? "none" : "translateY(24px)" }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-[3px] h-12 rounded-sm shrink-0" style={{ backgroundColor: accentG, boxShadow: lineGlow }} />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: accentG }}>{data?.sectionEyebrow}</p>
              <h3 className="text-2xl md:text-3xl font-bold" style={{ color: secHdrC }}>{data?.sectionHeading}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {slotProducts.map((p, i) => {
              if (!p) return null // 🚀 Safely ignores if product doesn't exist in this branch!
              const ribbon = featured[i]?.ribbonOverride ?? p.ribbon
              const ribbonColor = RIBBON_COLORS[ribbon]
              return (
                <button key={i} onClick={() => onPreview(p)}
                  className="group flex flex-col text-left rounded-xl overflow-hidden transition-all hover:shadow-xl"
                  style={{ backgroundColor: isDark ? "#1a2332" : "#ffffff", border: `1px solid ${isDark ? "#2d3748" : "#f3f4f6"}` }}>
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="feat-sheen" />
                    {ribbon && ribbonColor && (
                      <div className="absolute top-3 left-0 z-10 shadow-sm">
                        <div className="text-[10px] font-bold text-white py-1 pr-3 pl-2.5" style={{ backgroundColor: ribbonColor, clipPath: "polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)" }}>{ribbon}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: subC }}>{p.category}</p>
                    <p className="text-sm md:text-base font-bold leading-tight mb-2 line-clamp-2" style={{ color: headingC }}>{p.name}</p>
                    <p className="text-sm md:text-base font-extrabold mt-auto" style={{ color: accentG }}>
                      {formatPrice(p.price || 0)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

// 🚀 2. Inject `branch` as a prop directly from Home.jsx
export default function DynamicFeaturedSections({ branch, onNavigate, onPreview }) {

  console.log("⚙️ DynamicFeaturedSections receiving branch:", branch);

  const { isDark } = useTheme()

  // Normalize branch once to match API keys (Manila/Pampanga)
  const normalizedBranch = useMemo(() => {
    const b = (branch ?? "").toString().trim();
    if (!b) return "";
    return b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
  }, [branch]);

  const [rawSettingsData, setRawSettingsData] = useState(null)
  const [rawProductsData, setRawProductsData] = useState([])
  const [loading, setLoading] = useState(true)


  // 🚀 Fetch the database payload whenever the selected branch changes
  useEffect(() => {
    let isMounted = true

    const fetchMasterData = async () => {
      try {
        // Force a UI update during branch switching
        setLoading(true)
        setRawSettingsData(null)

        const [settingsData, productsData] = await Promise.all([
          api.get("/products/admin/settings/homepage").catch(() => null),
          api.get(`/products/?branch=${encodeURIComponent(normalizedBranch)}`).catch(() => [])
        ])

        if (!isMounted) return

        setRawSettingsData(settingsData)
        setRawProductsData(
          Array.isArray(productsData)
            ? productsData
            : (productsData?.products || productsData?.items || productsData?.data || [])
        )
      } catch (err) {
        console.error("Failed to load master layout data.", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMasterData()
    return () => {
      isMounted = false
    }
  }, [normalizedBranch])

  // 🚀 INSTANT LAYOUT SWAP: Extract the sections for the selected branch without re-fetching
  const activeSections = useMemo(() => {
    if (!rawSettingsData) return []

    // Check if the database has our new multi-branch structure.
    // Store settings may use Manila/Pampanga, manila/pampanga, or mixed casing.
    const branchKey = Object.keys(rawSettingsData || {}).find(
      key => key.toLowerCase() === normalizedBranch.toLowerCase()
    )
    const isMultiBranchFormat = Object.keys(rawSettingsData || {}).some(
      key => ["manila", "pampanga"].includes(key.toLowerCase())
    )
    const targetBranchData = isMultiBranchFormat
      ? (rawSettingsData[branchKey] || {})
      : rawSettingsData;

    return Object.keys(targetBranchData)
      .filter(key => key !== "__carousel__")
      .map(key => ({ id: key, ...targetBranchData[key] }))
      .filter(section => {
        // Some CMS rows use productId as `""`/`undefined` instead of null.
        const hasFeatured = Array.isArray(section.featured)
          ? section.featured.some(f => f?.productId !== null && f?.productId !== undefined && String(f?.productId).trim() !== "")
          : false;

        const hasCategories = Array.isArray(section.categories)
          ? section.categories.some(c => c?.productId !== null && c?.productId !== undefined && String(c?.productId).trim() !== "")
          : false;

        return hasFeatured || hasCategories;
      });
  }, [rawSettingsData, normalizedBranch])

  // 🚀 INSTANT PRODUCT FILTER: Filter inventory by physical branch availability
  const activeBranchProducts = useMemo(() => {
    const branchNorm = (branch || "").toString().trim().toLowerCase()
    return rawProductsData
      .map(p => ({
        ...p,
        id: p.id,
        name: p.name || "Unnamed",
        price: Number(p.price) || 0,
        image: p.image || p.image_url || null,
        branches: Array.isArray(p.branches) ? p.branches : [] // Ensure branches are recognized
      }))
      .filter(p => {
        const productBranches = p.branches.map(b => String(b || "").trim().toLowerCase()).filter(Boolean)
        return productBranches.length === 0 || productBranches.includes(branchNorm)
      })
  }, [rawProductsData, branch])

  return (
    <>
      <style>{GLOW_BORDER_CSS}</style>

      {loading ? (
        <DFSLoader />
      ) : activeSections.length > 0 ? (
        activeSections.map((section) => (
          <SectionBlock
            key={`${section.id}-${branch}`}
            data={section}
            products={activeBranchProducts} // Pass the strictly filtered products down
            isDark={isDark}
            onNavigate={onNavigate}
            onPreview={onPreview}
          />
        ))
      ) : (
        // What to show if a branch genuinely has no layout sections built yet
        <div className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 flex justify-center">
          <style>{`
            @keyframes dfsBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes dfsPetal { 0%,100% { opacity: 0.85; } 50% { opacity: 1; } }
            @media (prefers-reduced-motion: reduce) {
              .dfs-bob, .dfs-petal { animation: none !important; }
            }
          `}</style>
          <div
            className="relative w-full max-w-[20rem] sm:max-w-md text-center rounded-2xl sm:rounded-3xl px-5 py-9 sm:px-8 sm:py-12 overflow-hidden"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(46,139,52,0.045)",
              border: `1px dashed ${isDark ? "rgba(134,239,172,0.18)" : "rgba(46,139,52,0.28)"}`,
              boxShadow: isDark ? "0 20px 50px -30px rgba(0,0,0,0.6)" : "0 20px 50px -30px rgba(46,139,52,0.35)",
            }}
          >
            {/* soft glow behind the icon */}
            <div aria-hidden className="pointer-events-none absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 w-44 h-44 sm:w-56 sm:h-56 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(46,139,52,0.20), transparent 70%)" }} />

            {/* branded flower icon */}
            <div className="dfs-bob relative mx-auto mb-6 sm:mb-7 flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full"
              style={{ backgroundColor: isDark ? "rgba(46,139,52,0.16)" : "rgba(46,139,52,0.10)", animation: "dfsBob 3.2s ease-in-out infinite" }}>
              <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 100 100" aria-hidden>
                <defs>
                  <linearGradient id="dfsPetalGrad" x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0%"   stopColor={isDark ? "#fbcfe8" : "#fbcfe8"} />
                    <stop offset="55%"  stopColor={isDark ? "#f0abcd" : "#f472b6"} />
                    <stop offset="100%" stopColor={isDark ? "#db7bb0" : "#db2777"} />
                  </linearGradient>
                  <radialGradient id="dfsCenterGrad" cx="0.5" cy="0.4" r="0.6">
                    <stop offset="0%"   stopColor="#fde68a" />
                    <stop offset="60%"  stopColor="#34d399" />
                    <stop offset="100%" stopColor="#2E8B34" />
                  </radialGradient>
                </defs>
                {[0, 72, 144, 216, 288].map((a, i) => (
                  <path key={a} className="dfs-petal" transform={`rotate(${a} 50 50)`}
                    d="M50 52 C38 44 38 24 47 16 L50 20 L53 16 C62 24 62 44 50 52 Z"
                    fill="url(#dfsPetalGrad)"
                    style={{ animation: `dfsPetal 1.8s ease-in-out ${(i * 0.15).toFixed(2)}s infinite` }} />
                ))}
                <circle cx="50" cy="50" r="10" fill="url(#dfsCenterGrad)" />
              </svg>
            </div>

            <h3 className="text-base sm:text-xl font-bold mb-2 tracking-tight inline-block"
              style={{
                backgroundImage: isDark
                  ? "linear-gradient(90deg, #86efac, #34d399, #f0abcd)"
                  : "linear-gradient(90deg, #0C573E, #2E8B34, #e0529c)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}>
              Featured collections coming soon
            </h3>
            <p className="text-[13px] sm:text-sm leading-relaxed mx-auto max-w-[16rem] sm:max-w-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
              We're currently curating our featured collections for the{" "}
              <span style={{ fontWeight: 600, color: isDark ? "#86efac" : "#2E8B34" }}>{branch}</span> branch. Check back soon!
            </p>
          </div>
        </div>
      )}
    </>
  )
}
