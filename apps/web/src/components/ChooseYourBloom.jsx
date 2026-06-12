import { useEffect, useRef, useState, useCallback } from "react"
import { useTheme } from "../context/ThemeContext"
import { api } from "../services/api"

// ── Image loading ───────────────────────────────────────────────────────────
// The 10 PNGs in  src/assets/blooms/  are the built-in fallback set. They show
// when the CMS has no carousel slides yet (fresh install, offline, or an API
// error). Once an admin publishes slides from Admin > Featured Products >
// Bouquet Carousel, those replace the fallback and images come from each
// linked product's image URL.
const bloomImg = (file) =>
  new URL(`../assets/blooms/${file}`, import.meta.url).href

const G  = "#2E8B34"   // site green
const DG = "#0C573E"   // dark green

const CAROUSEL_ID = "__carousel__"

// Built-in fallback content — identical to the original hard-coded set.
// label / price are placeholders. Prices in PHP.
const FALLBACK_BLOOMS = [
  { file: "1_GreenCarnations.png",        name: "Green Carnations",        tag: "Fresh Cut",   price: "₱2,400" },
  { file: "2_PinkWrapperRoses.png",       name: "Pink Wrapper Roses",      tag: "Best Seller", price: "₱3,100" },
  { file: "3_BlueRoses.png",              name: "Blue Roses",              tag: "Limited",     price: "₱3,500" },
  { file: "4_RedRosesWhiteWrappers.png",  name: "Red Roses",               tag: "Classic",     price: "₱2,900" },
  { file: "5_PinkWrapperCarnations.png",  name: "Pink Carnations",         tag: "In Season",   price: "₱2,250" },
  { file: "6_RosesStargazer.png",         name: "Roses & Stargazer",       tag: "Signature",   price: "₱3,700" },
  { file: "7_YellowRoses.png",            name: "Yellow Roses",            tag: "Cheerful",    price: "₱2,700" },
  { file: "8_CarnationsStargazer.png",    name: "Carnations & Stargazer",  tag: "New",         price: "₱2,800" },
  { file: "9_CarnationsRoses.png",        name: "Carnations & Roses",      tag: "Romantic",    price: "₱3,000" },
  { file: "10_CarnationsBrownWrapper.png",name: "Rustic Carnations",       tag: "Earthy",      price: "₱2,500" },
]

const FALLBACK_HEADER = {
  eyebrow: "Handcrafted Daily",
  heading: "Today's Fresh Picks",
  subheading: "Browse the bouquets we're arranging right now.",
  ctaLabel: "Shop all bouquets",
  ctaTarget: "shop",
}

// ── Scroll-reveal hook (same behaviour as OccasionsStrip) ────────────────────
function useReveal(ref, delay = 0) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
        }, delay)
        obs.disconnect()
      }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
}

const mod = (n, m) => ((n % m) + m) % m

export default function ChooseYourBloom({ onNavigate }) {
  const { isDark } = useTheme()

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

  // ── CMS-driven state ──
  // header holds the eyebrow / heading / subheading / cta. blooms is the slide
  // list, each normalized to { src, name, tag, price } so the render code below
  // is identical whether the data came from the CMS or the fallback.
  const [header, setHeader] = useState(FALLBACK_HEADER)
  const [blooms, setBlooms] = useState(() =>
    FALLBACK_BLOOMS.map(b => ({ src: bloomImg(b.file), name: b.name, tag: b.tag, price: b.price }))
  )

  useEffect(() => {
    let cancelled = false

    const loadCarousel = async () => {
      try {
        const [settings, productRows] = await Promise.all([
          api.get("/products/admin/settings/homepage").catch(() => null),
          api.get("/products/").catch(() => []),
        ])
        if (cancelled) return

        // accept either the fixed key or any section flagged as a carousel
        const carousel = settings?.[CAROUSEL_ID]
          || (settings && Object.values(settings).find(s => s?.__type === "carousel"))

        if (!carousel || !Array.isArray(carousel.slides) || carousel.slides.length === 0) {
          return // nothing published — keep fallback content
        }

        const products = (Array.isArray(productRows) ? productRows : []).map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          image: p.image || p.image_url || null,
        }))

        const resolved = carousel.slides
          .map(slide => {
            const product = products.find(p => String(p.id) === String(slide.productId))
            const src = product?.image || null
            const name = slide.name || product?.name || ""
            const tag = slide.tag || ""
            const price = slide.price || (product ? `₱${Number(product.price || 0).toLocaleString()}` : "")
            return { src, name, tag, price }
          })
          // skip slides with no resolvable image so the centerpiece is never blank
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
        }
      } catch {
        // any failure — silently keep the fallback set
      }
    }

    loadCarousel()
    return () => { cancelled = true }
  }, [])

  const headingRef = useRef(null)
  const stageRef   = useRef(null)
  useReveal(headingRef, 0)
  useReveal(stageRef, 120)

  const [index, setIndex] = useState(0)
  const [dir, setDir]     = useState(1)   // 1 = next, -1 = prev (drives slide direction)
  const [anim, setAnim]   = useState(false)
  const lockRef = useRef(false)

  // keep the active index valid if the slide count changes after a CMS load
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

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  // safety: never render against an empty list
  if (blooms.length === 0) return null

  const center = blooms[index]
  const left   = blooms[mod(index - 1, blooms.length)]
  const right  = blooms[mod(index + 1, blooms.length)]
  const multi  = blooms.length > 1

  const animCss = `
    @keyframes bloomInRight { from { opacity:0; transform: translateX(48px) scale(0.92) } to { opacity:1; transform: translateX(0) scale(1) } }
    @keyframes bloomInLeft  { from { opacity:0; transform: translateX(-48px) scale(0.92) } to { opacity:1; transform: translateX(0) scale(1) } }
    @keyframes bloomTextIn  { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }

    /* Continuous diagonal sheen that enters from the TOP-LEFT and travels to
       the bottom-right. The masked layer holds a diagonal light band; we slide
       its background-position from above-left (-100% -100%) down through to
       below-right (200% 200%). A long idle tail after the pass makes the shine
       read as an occasional slow glint rather than a constant sweep. */
    @keyframes bloomSheen {
      0%   { background-position: -100% -100%; }
      70%  { background-position: 200% 200%; }
      100% { background-position: 200% 200%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .bloom-sheen { animation: none !important; }
    }
  `

  const centerAnim = anim
    ? `${dir === 1 ? "bloomInRight" : "bloomInLeft"} 0.46s cubic-bezier(0.22,1,0.36,1)`
    : "none"
  const textAnim = anim ? "bloomTextIn 0.5s ease 0.05s both" : "none"

  // Desktop arrows — pinned to the stage edges (over the side peeks, not the
  // center). Hidden on mobile where they would overlap the centerpiece; the
  // mobile arrows render as a separate row below the image instead.
  const ArrowBtn = ({ onClick, side, label }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="hidden sm:flex absolute top-1/2 -translate-y-1/2 z-30 rounded-full items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none"
      style={{
        [side]: 0,
        width: 46,
        height: 46,
        backgroundColor: btnBg,
        boxShadow: isDark
          ? "0 0 16px rgba(74,222,128,0.45)"
          : "0 8px 20px -6px rgba(12,87,62,0.45)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={btnIcon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {side === "left"
          ? <path d="M15 19l-7-7 7-7" />
          : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )

  // Mobile arrows — a compact row beneath the image so they never sit on top
  // of the centerpiece.
  const MobileArrowBtn = ({ onClick, side, label }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 focus:outline-none"
      style={{
        width: 42,
        height: 42,
        backgroundColor: btnBg,
        boxShadow: isDark
          ? "0 0 14px rgba(74,222,128,0.4)"
          : "0 6px 16px -6px rgba(12,87,62,0.45)",
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={btnIcon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {side === "left"
          ? <path d="M15 19l-7-7 7-7" />
          : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )

  return (
    <section
      className="py-14 px-4 sm:px-6 lg:px-8 border-b relative overflow-hidden"
      style={{ backgroundColor: sectionBg, borderColor: borderC }}
    >
      <style>{animCss}</style>

      {/* soft ambient halo behind the centerpiece */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 680, height: 680,
          background: `radial-gradient(circle, ${haloC} 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-6xl mx-auto relative">

        {/* ── Heading (same 3-row format as OccasionsStrip) ── */}
        <div
          ref={headingRef}
          className="text-center mb-5"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: eyebrowC }}>
            {header.eyebrow}
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: headingC, fontFamily: "inherit" }}
          >
            {header.heading}
          </h2>
          <p className="text-sm mb-4" style={{ color: bodyC }}>
            {header.subheading}
          </p>
          <div
            className="mx-auto rounded-full"
            style={{
              width: "48px",
              height: "3px",
              backgroundColor: accentG,
              boxShadow: isDark ? "0 0 10px rgba(74,222,128,0.5)" : "none",
            }}
          />
        </div>

        {/* ── Carousel stage ──
            One relative track. Three slots are absolutely positioned: left +
            right are IDENTICAL size and mirrored to each edge; center is larger
            and pinned dead-center. Height is responsive: shorter on mobile (the
            image is square and would otherwise leave large empty gaps) and the
            original 500px from sm and up. */}
        <div
          ref={stageRef}
          className="relative"
          style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 0.55s ease, transform 0.55s ease" }}
        >
          <div
            className="relative mx-auto stage-track"
            style={{ maxWidth: 1180 }}
          >
            <style>{`
              .stage-track { height: clamp(320px, 90vw, 380px); }
              @media (min-width: 640px) { .stage-track { height: 500px; } }
            `}</style>

            {multi && <ArrowBtn onClick={() => go(-1)} side="left"  label="Previous bloom" />}
            {multi && <ArrowBtn onClick={() => go(1)}  side="right" label="Next bloom" />}

            {/* LEFT peek */}
            {multi && (
              <button
                onClick={() => go(-1)}
                aria-hidden="true"
                tabIndex={-1}
                className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ left: "3%", width: "30%", height: "80%" }}
              >
                <img
                  src={left.src}
                  alt=""
                  className="max-w-full max-h-full object-contain transition-all duration-500"
                  style={{ opacity: isDark ? 0.42 : 0.58, filter: "saturate(0.85)" }}
                  onError={(e) => { e.currentTarget.style.visibility = "hidden" }}
                />
              </button>
            )}

            {/* RIGHT peek — identical box to the left one */}
            {multi && (
              <button
                onClick={() => go(1)}
                aria-hidden="true"
                tabIndex={-1}
                className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ right: "3%", width: "30%", height: "80%" }}
              >
                <img
                  src={right.src}
                  alt=""
                  className="max-w-full max-h-full object-contain transition-all duration-500"
                  style={{ opacity: isDark ? 0.42 : 0.58, filter: "saturate(0.85)" }}
                  onError={(e) => { e.currentTarget.style.visibility = "hidden" }}
                />
              </button>
            )}

            {/* CENTER piece */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[88%] sm:w-[62%]"
              style={{ maxWidth: 640, height: "100%" }}
            >
              <div
                key={index}
                className="flex items-center justify-center w-full h-full"
                style={{ animation: centerAnim }}
              >
                {/* relative wrapper sizes to the image; the sheen layer is
                    absolutely positioned over it and masked to the same PNG */}
                <div className="relative inline-flex max-w-full max-h-full">
                  <img
                    src={center.src}
                    alt={center.name}
                    className="max-w-full max-h-full object-contain drop-shadow-xl block"
                    onError={(e) => { e.currentTarget.style.opacity = "0.15" }}
                  />
                  {/* Diagonal shine — masked by the bloom image so it only
                      lights the flower. mix-blend screen so it adds light
                      rather than painting a flat white streak. */}
                  <div
                    className="bloom-sheen pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.0) 42%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.0) 58%, transparent 65%)",
                      backgroundSize: "250% 250%",
                      backgroundRepeat: "no-repeat",
                      WebkitMaskImage: `url(${center.src})`,
                      maskImage: `url(${center.src})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      mixBlendMode: "screen",
                      animation: "bloomSheen 7s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile arrow row — below the image, sm:hidden ── */}
          {multi && (
            <div className="flex sm:hidden items-center justify-center gap-8 mt-4">
              <MobileArrowBtn onClick={() => go(-1)} side="left"  label="Previous bloom" />
              <MobileArrowBtn onClick={() => go(1)}  side="right" label="Next bloom" />
            </div>
          )}

          {/* ── Caption ── */}
          <div className="text-center mt-6 sm:mt-8" style={{ animation: textAnim }} key={`cap-${index}`}>
            {center.tag && (
              <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: tagC }}>
                {center.tag}
              </p>
            )}
            <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: nameC, fontFamily: "inherit" }}>
              {center.name}
            </h3>
            {center.price && (
              <p className="text-sm font-medium" style={{ color: priceC }}>
                {center.price}
              </p>
            )}
          </div>

          {/* ── Dots ── */}
          {multi && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {blooms.map((_, i) => {
                const active = i === index
                return (
                  <button
                    key={i}
                    onClick={() => { if (i !== index) go(i > index ? 1 : -1) }}
                    aria-label={`Go to bloom ${i + 1}`}
                    className="rounded-full transition-all duration-300 focus:outline-none"
                    style={{
                      width: active ? 22 : 7,
                      height: 7,
                      backgroundColor: active ? accentG : (isDark ? "#374151" : "#d1d5db"),
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* ── See all ── */}
          <div className="text-center mt-5">
            <button
              onClick={() => onNavigate?.(header.ctaTarget || "shop")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: accentG }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#86efac" : "#15803d")}
              onMouseLeave={(e) => (e.currentTarget.style.color = accentG)}
            >
              {header.ctaLabel}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}