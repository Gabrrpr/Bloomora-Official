import { useEffect, useRef, useState, useCallback } from "react"
import { useTheme } from "../context/ThemeContext"

// ── Image loading ───────────────────────────────────────────────────────────
// Drop the 10 PNGs into  src/assets/blooms/  with these exact names and they
// load automatically. Using new URL() (same dynamic pattern as the ad/gallery
// images) so Vite bundles them correctly without 10 static import lines.
const bloomImg = (file) =>
  new URL(`../assets/blooms/${file}`, import.meta.url).href

const G  = "#2E8B34"   // site green
const DG = "#0C573E"   // dark green

// label / price are placeholders — tweak freely. Prices in PHP.
const BLOOMS = [
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

  const headingRef = useRef(null)
  const stageRef   = useRef(null)
  useReveal(headingRef, 0)
  useReveal(stageRef, 120)

  const [index, setIndex] = useState(0)
  const [dir, setDir]     = useState(1)   // 1 = next, -1 = prev (drives slide direction)
  const [anim, setAnim]   = useState(false)
  const lockRef = useRef(false)

  const go = useCallback((step) => {
    if (lockRef.current) return
    lockRef.current = true
    setDir(step)
    setAnim(true)
    setIndex((i) => mod(i + step, BLOOMS.length))
    setTimeout(() => { setAnim(false); lockRef.current = false }, 480)
  }, [])

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  const center = BLOOMS[index]
  const left   = BLOOMS[mod(index - 1, BLOOMS.length)]
  const right  = BLOOMS[mod(index + 1, BLOOMS.length)]

  const animCss = `
    @keyframes bloomInRight { from { opacity:0; transform: translateX(48px) scale(0.92) } to { opacity:1; transform: translateX(0) scale(1) } }
    @keyframes bloomInLeft  { from { opacity:0; transform: translateX(-48px) scale(0.92) } to { opacity:1; transform: translateX(0) scale(1) } }
    @keyframes bloomTextIn  { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
  `

  const centerAnim = anim
    ? `${dir === 1 ? "bloomInRight" : "bloomInLeft"} 0.46s cubic-bezier(0.22,1,0.36,1)`
    : "none"
  const textAnim = anim ? "bloomTextIn 0.5s ease 0.05s both" : "none"

  const ArrowBtn = ({ onClick, side, label }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="absolute top-1/2 -translate-y-1/2 z-30 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none"
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
            Handcrafted Daily
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: headingC, fontFamily: "inherit" }}
          >
            Today's Fresh Picks
          </h2>
          <p className="text-sm mb-4" style={{ color: bodyC }}>
            Browse the bouquets we're arranging right now.
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
            One fixed-height relative track. Three slots are absolutely
            positioned: left + right are IDENTICAL size and mirrored to each
            edge; center is larger and pinned dead-center. */}
        <div
          ref={stageRef}
          className="relative"
          style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 0.55s ease, transform 0.55s ease" }}
        >
          <div
            className="relative mx-auto"
            style={{ maxWidth: 1180, height: "clamp(500px, 44vw, 500px)" }}
          >
            <ArrowBtn onClick={() => go(-1)} side="left"  label="Previous bloom" />
            <ArrowBtn onClick={() => go(1)}  side="right" label="Next bloom" />

            {/* LEFT peek */}
            <button
              onClick={() => go(-1)}
              aria-hidden="true"
              tabIndex={-1}
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ left: "3%", width: "30%", height: "80%" }}
            >
              <img
                src={bloomImg(left.file)}
                alt=""
                className="max-w-full max-h-full object-contain transition-all duration-500"
                style={{ opacity: isDark ? 0.42 : 0.58, filter: "saturate(0.85)" }}
                onError={(e) => { e.currentTarget.style.visibility = "hidden" }}
              />
            </button>

            {/* RIGHT peek — identical box to the left one */}
            <button
              onClick={() => go(1)}
              aria-hidden="true"
              tabIndex={-1}
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ right: "3%", width: "30%", height: "80%" }}
            >
              <img
                src={bloomImg(right.file)}
                alt=""
                className="max-w-full max-h-full object-contain transition-all duration-500"
                style={{ opacity: isDark ? 0.42 : 0.58, filter: "saturate(0.85)" }}
                onError={(e) => { e.currentTarget.style.visibility = "hidden" }}
              />
            </button>

            {/* CENTER piece */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[94%] sm:w-[62%]"
              style={{ maxWidth: 640, height: "100%" }}
            >
              <div
                key={index}
                className="flex items-center justify-center w-full h-full"
                style={{ animation: centerAnim }}
              >
                <img
                  src={bloomImg(center.file)}
                  alt={center.name}
                  className="max-w-full max-h-full object-contain drop-shadow-xl"
                  onError={(e) => { e.currentTarget.style.opacity = "0.15" }}
                />
              </div>
            </div>
          </div>

          {/* ── Caption ── */}
          <div className="text-center mt-2" style={{ animation: textAnim }} key={`cap-${index}`}>
            <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: tagC }}>
              {center.tag}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: nameC, fontFamily: "inherit" }}>
              {center.name}
            </h3>
            <p className="text-sm font-medium" style={{ color: priceC }}>
              {center.price}
            </p>
          </div>

          {/* ── Dots ── */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {BLOOMS.map((_, i) => {
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

          {/* ── See all ── */}
          <div className="text-center mt-5">
            <button
              onClick={() => onNavigate?.("shop")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: accentG }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#86efac" : "#15803d")}
              onMouseLeave={(e) => (e.currentTarget.style.color = accentG)}
            >
              Shop all bouquets
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