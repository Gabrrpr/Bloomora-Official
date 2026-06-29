import { useEffect, useRef, useState, useCallback } from "react"
import { useTheme } from "../context/ThemeContext"
import { useBranch } from "../context/BranchContext" 
import { api } from "../services/api"

const bloomImg = (file) => new URL(`../assets/blooms/${file}`, import.meta.url).href
const G  = "#2E8B34"
const DG = "#0C573E"
const CAROUSEL_ID = "__carousel__"

const FALLBACK_BLOOMS = [
  { file: "1_GreenCarnations.png",        name: "BQT 1002 – Sunset Melody",     tag: "Best Seller", price: "₱4,334.00" },
  { file: "2_PinkWrapperRoses.png",       name: "BQT 1013 – Harmony Bloom",     tag: "Best Seller", price: "₱5,291.00" },
  { file: "3_BlueRoses.png",              name: "BQT 1009 – Azure Enigma",      tag: "Best Seller", price: "₱1,815.00" },
  { file: "4_RedRosesWhiteWrappers.png",  name: "BQT 1000 – Scarlet Promise",   tag: "Best Seller", price: "₱6,765.00" },
  { file: "5_PinkWrapperCarnations.png",  name: "BQT 1017 – Sunlit Harmony",    tag: "Best Seller", price: "₱2,541.00" },
  { file: "6_RosesStargazer.png",         name: "BQT 1001 – Rosy Glow",         tag: "Best Seller", price: "₱7,491.00" },
  { file: "7_YellowRoses.png",            name: "BQT 1010 – Amber Flame",       tag: "Best Seller", price: "₱2,211.00" },
  { file: "9_CarnationsRoses.png",        name: "BQT 1020 – Scarlet Bloom",     tag: "Best Seller", price: "₱2,871.00" },
  { file: "10_CarnationsBrownWrapper.png",name: "BQT 1023 – Radiant Symphony",  tag: "Best Seller", price: "₱3,531.00" },
]

const FALLBACK_HEADER = {
  eyebrow: "Handcrafted Daily",
  heading: "Today's Fresh Picks",
  subheading: "Browse the bouquets we're arranging right now.",
  ctaLabel: "Shop all bouquets",
  ctaTarget: "shop",
}

const mod = (n, m) => ((n % m) + m) % m

export default function ChooseYourBloom({ branch: propBranch, onNavigate, onPreview }) {
  const { isDark } = useTheme()
  const branchContext = useBranch() || {}
  
  // 🚀 Accept branch from props OR context
  const branch = propBranch || branchContext.branch || "Manila"

  const [loading, setLoading] = useState(true)
  const [header, setHeader] = useState(FALLBACK_HEADER)
  const [blooms, setBlooms] = useState(() =>
    FALLBACK_BLOOMS.map(b => ({ src: bloomImg(b.file), name: b.name, tag: b.tag, price: b.price }))
  )

  useEffect(() => {
    let cancelled = false

    const loadCarousel = async () => {
      setLoading(true)
      try {
        const [settings, productRows] = await Promise.all([
          api.get("/products/admin/settings/homepage").catch(() => null),
          api.get("/products/").catch(() => []),
        ])
        if (cancelled) return

        const data = settings || {}
        
        const branchKey = branch.toLowerCase()
        const foundKey = Object.keys(data).find(k => k.toLowerCase() === branchKey)
        const branchData = foundKey ? data[foundKey] : data
        
        const carousel = branchData[CAROUSEL_ID] || Object.values(branchData || {}).find(s => s && s.__type === "carousel")

        if (!carousel || !Array.isArray(carousel.slides) || carousel.slides.length === 0) {
          setBlooms(FALLBACK_BLOOMS.map(b => ({ src: bloomImg(b.file), name: b.name, tag: b.tag, price: b.price })))
          setHeader(FALLBACK_HEADER)
          setLoading(false)
          return
        }

        const productRowsArr = Array.isArray(productRows) ? productRows : []

        const resolved = carousel.slides
          .map(slide => {
            const product = productRowsArr.find(p => String(p.id) === String(slide.productId)) || null
            const src = product?.image || product?.image_url || null
            const name = slide.name || product?.name || ""
            const tag = slide.tag || ""
            const price = slide.price || (product ? `₱${Number(product.price || 0).toLocaleString()}` : "")
            // Keep the full product so the center image can open its preview.
            return { src, name, tag, price, product }
          })
          .filter(b => b.src)

        if (resolved.length > 0 && !cancelled) {
          setBlooms(resolved)
          setHeader({
            eyebrow:    carousel.eyebrow    || FALLBACK_HEADER.eyebrow,
            heading:    carousel.heading    || FALLBACK_HEADER.heading,
            subheading: carousel.subheading || FALLBACK_HEADER.subheading,
            ctaLabel:   carousel.ctaLabel   || FALLBACK_HEADER.ctaLabel,
            ctaTarget:  carousel.ctaTarget  || FALLBACK_HEADER.ctaTarget,
          })
        } else if (!cancelled) {
          setBlooms(FALLBACK_BLOOMS.map(b => ({ src: bloomImg(b.file), name: b.name, tag: b.tag, price: b.price })))
          setHeader(FALLBACK_HEADER)
        }
      } catch (err) {
        console.error("Carousel Error:", err)
        if (!cancelled) {
            setBlooms(FALLBACK_BLOOMS.map(b => ({ src: bloomImg(b.file), name: b.name, tag: b.tag, price: b.price })))
            setHeader(FALLBACK_HEADER)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCarousel()
    return () => { cancelled = true }
  }, [branch])

  const [index, setIndex] = useState(0)
  const [dir, setDir]     = useState(1) 
  const [anim, setAnim]   = useState(false)
  const lockRef = useRef(false)

  useEffect(() => {
    setIndex(i => (blooms.length ? mod(i, blooms.length) : 0))
  }, [blooms.length])

  const go = useCallback((step) => {
    if (lockRef.current) return
    if (blooms.length <= 1) return
    lockRef.current = true
    setDir(step)
    setAnim(true)
    setIndex((i) => mod(i + step, blooms.length))
    setTimeout(() => { setAnim(false); lockRef.current = false }, 480)
  }, [blooms.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  // Style constants
  const accentG   = isDark ? "#4ade80" : G
  const sectionBg = isDark ? "#0f172a" : "#fcfcfb"
  const borderC   = isDark ? "#2d3748" : "#f3f4f6"
  const eyebrowC  = isDark ? "#4ade80" : G
  const headingC  = isDark ? "#f3f4f6" : "#1f2937"
  const bodyC     = isDark ? "#9ca3af" : "#6b7280"
  const tagC      = isDark ? "#4ade80" : G
  const nameC     = isDark ? "#f3f4f6" : "#1f2937"
  const priceC    = isDark ? "#9ca3af" : "#6b7280"
  const btnBg     = isDark ? "#4ade80" : DG
  const btnIcon   = isDark ? "#0f172a" : "#ffffff"
  const haloC     = isDark ? "rgba(74,222,128,0.10)" : "rgba(46,139,52,0.06)"

  if (loading) {
    return (
      <section className="py-20 text-center transition-all duration-300" style={{ backgroundColor: sectionBg, borderColor: borderC }}>
         <p style={{ color: bodyC }} className="font-bold animate-pulse">Loading {branch} collections...</p>
      </section>
    )
  }

  // 🚀 Final Failsafe
  if (!blooms || blooms.length === 0) return (
     <section className="py-20 text-center" style={{ backgroundColor: sectionBg, borderColor: borderC }}>
         <p style={{ color: bodyC }}>No featured items yet for the {branch} branch.</p>
     </section>
  )

  const center = blooms[index]
  const left   = blooms[mod(index - 1, blooms.length)]
  const right  = blooms[mod(index + 1, blooms.length)]
  const multi  = blooms.length > 1

  const animCss = `
    @keyframes bloomInRight { from { opacity:0; transform: translateX(48px) scale(0.92) } to { opacity:1; transform: translateX(0) scale(1) } }
    @keyframes bloomInLeft  { from { opacity:0; transform: translateX(-48px) scale(0.92) } to { opacity:1; transform: translateX(0) scale(1) } }
    @keyframes bloomTextIn  { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
    @keyframes bloomSheen {
      0%   { background-position: -100% -100%; }
      70%  { background-position: 200% 200%; }
      100% { background-position: 200% 200%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .bloom-sheen { animation: none !important; }
    }
  `

  const centerAnim = anim ? `${dir === 1 ? "bloomInRight" : "bloomInLeft"} 0.46s cubic-bezier(0.22,1,0.36,1)` : "none"
  const textAnim = anim ? "bloomTextIn 0.5s ease 0.05s both" : "none"

  const ArrowBtn = ({ onClick, side, label }) => (
    <button onClick={onClick} aria-label={label}
      className="hidden sm:flex absolute top-1/2 -translate-y-1/2 z-30 rounded-full items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none"
      style={{ [side]: 0, width: 46, height: 46, backgroundColor: btnBg, boxShadow: isDark ? "0 0 16px rgba(74,222,128,0.45)" : "0 8px 20px -6px rgba(12,87,62,0.45)" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={btnIcon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {side === "left" ? <path d="M15 19l-7-7 7-7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )

  const MobileArrowBtn = ({ onClick, side, label }) => (
    <button onClick={onClick} aria-label={label}
      className="rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 focus:outline-none"
      style={{ width: 42, height: 42, backgroundColor: btnBg, boxShadow: isDark ? "0 0 14px rgba(74,222,128,0.4)" : "0 6px 16px -6px rgba(12,87,62,0.45)" }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={btnIcon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {side === "left" ? <path d="M15 19l-7-7 7-7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-b relative overflow-hidden transition-all duration-300" style={{ backgroundColor: sectionBg, borderColor: borderC }}>
      <style>{animCss}</style>
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 680, height: 680, background: `radial-gradient(circle, ${haloC} 0%, transparent 70%)` }} />

      <div className="max-w-6xl mx-auto relative">
        {/* 🚀 Removed opacity: 0 and useReveal dependencies! */}
        <div className="text-center mb-5">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: eyebrowC }}>{header.eyebrow}</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: headingC, fontFamily: "inherit" }}>{header.heading}</h2>
          <p className="text-sm mb-4" style={{ color: bodyC }}>{header.subheading}</p>
          <div className="mx-auto rounded-full" style={{ width: "48px", height: "3px", backgroundColor: accentG, boxShadow: isDark ? "0 0 10px rgba(74,222,128,0.5)" : "none" }} />
        </div>

        <div className="relative">
          <div className="relative mx-auto stage-track" style={{ maxWidth: 1180 }}>
            <style>{`.stage-track { height: clamp(320px, 90vw, 380px); } @media (min-width: 640px) { .stage-track { height: 500px; } }`}</style>

            {multi && <ArrowBtn onClick={() => go(-1)} side="left"  label="Previous bloom" />}
            {multi && <ArrowBtn onClick={() => go(1)}  side="right" label="Next bloom" />}

            {multi && (
              <button onClick={() => go(-1)} tabIndex={-1} className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ left: "3%", width: "30%", height: "80%" }}>
                <img src={left.src} alt="" className="max-w-full max-h-full object-contain transition-all duration-500" style={{ opacity: isDark ? 0.42 : 0.58, filter: "saturate(0.85)" }} />
              </button>
            )}

            {multi && (
              <button onClick={() => go(1)} tabIndex={-1} className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ right: "3%", width: "30%", height: "80%" }}>
                <img src={right.src} alt="" className="max-w-full max-h-full object-contain transition-all duration-500" style={{ opacity: isDark ? 0.42 : 0.58, filter: "saturate(0.85)" }} />
              </button>
            )}

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[88%] sm:w-[62%]" style={{ maxWidth: 640, height: "100%" }}>
              <div key={index} className="flex items-center justify-center w-full h-full" style={{ animation: centerAnim }}>
                <div
                  className={`group relative inline-flex max-w-full max-h-full ${center.product ? "cursor-pointer" : ""}`}
                  onClick={() => { if (center.product && onPreview) onPreview(center.product) }}
                  role={center.product ? "button" : undefined}
                  title={center.product ? "View details" : undefined}
                >
                  <img src={center.src} alt={center.name} className="max-w-full max-h-full object-contain drop-shadow-xl block transition-transform duration-300 group-hover:scale-[1.03]" />
                  <div className="bloom-sheen pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: "linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.0) 42%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.0) 58%, transparent 65%)",
                      backgroundSize: "250% 250%", backgroundRepeat: "no-repeat", WebkitMaskImage: `url(${center.src})`, maskImage: `url(${center.src})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", mixBlendMode: "screen", animation: "bloomSheen 7s ease-in-out infinite"
                    }} />
                  {center.product && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm sm:text-base font-bold text-white shadow-xl"
                        style={{ background: "linear-gradient(135deg,#0C573E,#2E8B34)" }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1 1 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        View Details
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {multi && (
            <div className="flex sm:hidden items-center justify-center gap-8 mt-4">
              <MobileArrowBtn onClick={() => go(-1)} side="left"  label="Previous bloom" />
              <MobileArrowBtn onClick={() => go(1)}  side="right" label="Next bloom" />
            </div>
          )}

          <div className="text-center mt-6 sm:mt-8" style={{ animation: textAnim }} key={`cap-${index}`}>
            {center.tag && <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: tagC }}>{center.tag}</p>}
            <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: nameC, fontFamily: "inherit" }}>{center.name}</h3>
            {center.price && <p className="text-sm font-medium" style={{ color: priceC }}>{center.price}</p>}
          </div>

          {multi && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {blooms.map((_, i) => (
                <button key={i} onClick={() => { if (i !== index) go(i > index ? 1 : -1) }} aria-label={`Go to bloom ${i + 1}`}
                  className="rounded-full transition-all duration-300 focus:outline-none"
                  style={{ width: i === index ? 22 : 7, height: 7, backgroundColor: i === index ? accentG : (isDark ? "#374151" : "#d1d5db") }} />
              ))}
            </div>
          )}

          <div className="text-center mt-5">
            <button onClick={() => onNavigate?.(header.ctaTarget || "shop")} className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: accentG }} onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#86efac" : "#15803d")} onMouseLeave={(e) => (e.currentTarget.style.color = accentG)}>
              {header.ctaLabel}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}