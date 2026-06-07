import { useEffect, useRef, useState, useCallback } from "react"
import { useTheme } from "../context/ThemeContext"
import testimonialsBG from "../assets/homepage/testimonialsBG.png"

const G   = "#2E8B34"
const DG  = "#0C573E"
const G_D = "#4ade80"

// Animated rotating gradient borders for the two social CTAs.
// Same "traveling beam" technique used on the hero / banner CTAs: a conic
// gradient whose angle is animated through a registered @property, masked down
// to a thin border via mask-composite. Browsers without @property support fall
// back to a static ring. Namespaced per brand so they never collide with the
// hero (hero-glow-border) or banner (bloom-glow-border) rings on the same page.
//   - FB:  faint blue ring with a bright white beam sweeping around (4s).
//   - IG:  the full Instagram gradient itself rotating as a ring (4s).
// The brand colors read well on both light and dark surfaces, so the rings are
// identical in both themes; only the button's ambient glow changes by mode.
const SOCIAL_GLOW_CSS = `
  @property --fb-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
  @property --ig-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
  @keyframes fbBorderSpin { to { --fb-angle: 360deg; } }
  @keyframes igBorderSpin { to { --ig-angle: 360deg; } }

  .fb-glow-border, .ig-glow-border { position: relative; z-index: 0; }

  .fb-glow-border::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(from var(--fb-angle),
      rgba(24,119,242,0.15) 0deg,
      rgba(24,119,242,0.15) 60deg,
      rgba(24,119,242,0.70) 95deg,
      #4293ff 120deg,
      #ffffff 135deg,
      #4293ff 150deg,
      rgba(24,119,242,0.70) 175deg,
      rgba(24,119,242,0.15) 210deg,
      rgba(24,119,242,0.15) 360deg
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
    animation: fbBorderSpin 4s linear infinite;
  }

  .ig-glow-border::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(from var(--ig-angle),
      #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #962fbf, #d62976, #fa7e1e, #feda75
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
    animation: igBorderSpin 4s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .fb-glow-border::before, .ig-glow-border::before { animation: none; }
  }
`

const REVIEWS = [
  { id:1, name:"Khaye Muñoz",              source:"Facebook", text:"They made very special flower always.", rating:5 },
  { id:2, name:"Dennis Rivera Logarta",    source:"Facebook", text:"True people and a perfect flower shop. Message from KANSAS USA.", rating:5 },
  { id:3, name:"Iris Canda-van de Kreeke", source:"Facebook", text:"Happy with the service and the outcome of the flowers when they delivered it to my mom's doorstep. And also it was right on time.", rating:5 },
  { id:4, name:"Dave Ramos",               source:"Facebook", text:"The best flower shop for all occasions!", rating:5 },
  { id:5, name:"Nikola Crnogorcevic",      source:"Google",   text:"Always fresh flowers and fast service. Price not high and there is a lot of choice also.", rating:4 },
  { id:6, name:"John Clark",               source:"Google",   text:"I have used this place a few times now and every time their flower arrangements are amazing. Very professional service.", rating:4 },
]

/* ── Social icons ──────────────────────────────────────────────── */
const FbIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
)
const IgIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1100)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])
  return w
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

/* ── Stars ─────────────────────────────────────────────────────── */
function Stars({ count = 5, isDark }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="16" height="16"
          fill={i <= count ? "#f59e0b" : (isDark ? "#2d3748" : "#e5e7eb")}
          viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

/* ── Source badge ──────────────────────────────────────────────── */
function SourceBadge({ source, isDark }) {
  const isFB  = source === "Facebook"
  const bg    = isFB ? (isDark ? "rgba(24,119,242,0.15)" : "#eef3fd") : (isDark ? "rgba(66,133,244,0.14)" : "#f0f4ff")
  const bdr   = isFB ? (isDark ? "rgba(24,119,242,0.35)" : "#c8d8f8") : (isDark ? "rgba(66,133,244,0.32)" : "#ccd8f6")
  const color = isFB ? "#1877F2" : "#4285F4"
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
      style={{ backgroundColor:bg, border:`1px solid ${bdr}`, color, letterSpacing:"0.02em" }}>
      {isFB ? (
        <svg width="10" height="10" fill="#1877F2" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      via {source}
    </span>
  )
}

/* ── Outline avatar ────────────────────────────────────────────── */
function OutlineAvatar({ isDark }) {
  const borderC = isDark ? "#4ade80" : "#b8ddb8"
  const bgC     = isDark ? "rgba(74,222,128,0.07)" : "rgba(46,139,52,0.04)"
  const stroke  = isDark ? G_D : DG
  return (
    <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0"
      style={{ border:`1.5px solid ${borderC}`, backgroundColor:bgC }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8.5" r="3.5" stroke={stroke} strokeWidth="1.6"/>
        <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

/* ── Quote mark ────────────────────────────────────────────────── */
/*
  With lineHeight:0, the span has 0 layout height.
  Flexbox places it at the circle's vertical midpoint.
  The Georgia " glyph renders above the baseline.
  translateY(20px) nudges the 0-height box just enough below centre
  so the glyph ink sits visually centred in the circle.
*/
function QuoteMark({ isDark }) {
  const bg    = isDark ? "#16352a" : "rgba(12,87,62,0.08)"
  const color = isDark ? G_D : DG
  const glow  = "none"
  return (
    <div className="w-[82px] h-[82px] rounded-full flex items-center justify-center mx-auto mb-[18px] shrink-0 overflow-hidden"
      style={{ backgroundColor:bg, boxShadow:glow }}>
      <span style={{
        fontFamily: "Georgia, 'Times New Roman', Times, serif",
        fontSize: 88,
        lineHeight: 0,
        color,
        opacity: isDark ? 1 : 0.65,
        userSelect: "none",
        display: "block",
        transform: "translateY(20px)",
      }}>
        &ldquo;
      </span>
    </div>
  )
}

/* ── Verified badge ────────────────────────────────────────────── */
function VerifiedBadge({ isDark }) {
  const glow = "none"
  return (
    <div className="absolute top-[-1px] left-5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-white px-[11px] py-1 rounded-b-lg"
      style={{ backgroundColor:DG, boxShadow:glow }}>
      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"/>
      </svg>
      Verified Customer
    </div>
  )
}

/* ── Review card ───────────────────────────────────────────────── */
function ReviewCard({ review, isDark }) {
  // Dark mode: solid panel — fully opaque green-tinted dark bg, no backdrop
  // blur, so cards read as solid elements rather than frosted glass.
  const cardBg      = isDark ? "#0f1f17" : "rgba(255,255,255,0.93)"
  const cardBdr     = isDark ? "#4ade80" : "#b8d8b8"
  const cardShdw    = isDark ? "0 0 0 1px rgba(74,222,128,0.2), 0 8px 32px rgba(0,0,0,0.5)" : "0 4px 24px rgba(12,87,62,0.1)"
  const cardHovShdw = isDark ? "0 0 0 1px rgba(74,222,128,0.4), 0 16px 48px rgba(74,222,128,0.12)" : "0 12px 40px rgba(12,87,62,0.18)"
  const textC  = isDark ? "#cbd5e1" : "#6b7280"
  const nameC  = isDark ? "#f0fdf4" : "#111827"
  const divC   = isDark ? "rgba(74,222,128,0.15)" : "#f0f0f0"

  // Only apply the frosted-glass blur in light mode.
  const blur = isDark ? "none" : "blur(12px)"

  return (
    <div
      className="relative flex flex-col items-center text-center rounded-[18px] p-9 pt-9 h-full box-border"
      style={{
        backdropFilter:blur, WebkitBackdropFilter:blur,
        backgroundColor:cardBg, border:`1.5px solid ${cardBdr}`,
        boxShadow:cardShdw,
        transition:"box-shadow 0.25s ease, transform 0.25s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow=cardHovShdw; e.currentTarget.style.transform="translateY(-5px)" }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow=cardShdw; e.currentTarget.style.transform="translateY(0)" }}
    >
      <VerifiedBadge isDark={isDark}/>
      <QuoteMark isDark={isDark}/>
      <Stars count={review.rating} isDark={isDark}/>
      <p className="text-[15px] leading-[1.85] flex-1 mt-[18px] mb-[22px]" style={{ color:textC }}>{review.text}</p>
      <div className="w-full h-px mb-5" style={{ backgroundColor:divC }}/>
      <div className="flex items-center gap-3.5 w-full text-left">
        <OutlineAvatar isDark={isDark}/>
        <div>
          <p className="text-[15px] font-bold mb-[5px] leading-tight" style={{ color:nameC }}>{review.name}</p>
          <SourceBadge source={review.source} isDark={isDark}/>
        </div>
      </div>
    </div>
  )
}

/* ── Arrow button ──────────────────────────────────────────────── */
function ArrowBtn({ dir, onClick, isDark }) {
  const accentG = isDark ? G_D : G
  return (
    <button onClick={onClick} aria-label={dir==="left"?"Previous":"Next"}
      className="shrink-0 w-[46px] h-[46px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
      style={{ border:`1.5px solid ${isDark?"rgba(74,222,128,0.3)":"#d1d5db"}`, backgroundColor:isDark?"rgba(22,34,46,0.85)":"rgba(255,255,255,0.85)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", color:isDark?"#6b7280":"#9ca3af" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=accentG; e.currentTarget.style.color=accentG; e.currentTarget.style.boxShadow=isDark?"0 0 14px rgba(74,222,128,0.35)":"none" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=isDark?"rgba(74,222,128,0.3)":"#d1d5db"; e.currentTarget.style.color=isDark?"#6b7280":"#9ca3af"; e.currentTarget.style.boxShadow="none" }}>
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d={dir==="left"?"M15 19l-7-7 7-7":"M9 5l7 7-7 7"}/>
      </svg>
    </button>
  )
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function Testimonials() {
  const { isDark } = useTheme()
  const w = useWidth()
  const [headerRef, headerVisible] = useScrollReveal(0.08)
  const [cardsRef,  cardsVisible]  = useScrollReveal(0.06)
  const [socialRef, socialVisible] = useScrollReveal(0.1)
  const [current, setCurrent]      = useState(0)
  const total = REVIEWS.length

  const isDesk      = w >= 1024
  const isMid       = w >= 640
  const isLandscape = typeof window !== "undefined" && window.innerHeight < 520 && w >= 600
  const visibleCount = (w < 640 || isLandscape) ? 1 : !isDesk ? 2 : 3

  const touchStart = useRef(null)
  const onTouchStart = e => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchStart.current = null
  }
  const prev = useCallback(() => setCurrent(c => (c-1+total)%total), [total])
  const next = useCallback(() => setCurrent(c => (c+1)%total), [total])
  const getVisible = () => Array.from({length:visibleCount}, (_,i) => REVIEWS[(current+i)%total])

  // Dynamic color tokens (can't be Tailwind — depend on isDark JS var)
  const accentG    = isDark ? G_D : G
  const accentDG   = isDark ? G_D : DG
  const headingC   = isDark ? "#f0fdf4" : "#1f2937"
  const bodyC      = isDark ? "#cbd5e1" : "#6b7280"
  const dotInact   = isDark ? "rgba(74,222,128,0.25)" : "#d1d5db"

  // Social CTA tokens — real brand colors, kept identical in both themes so the
  // buttons stay instantly recognizable (white text reads on both the FB blue
  // and the IG gradient, and pops on the dark overlay). Only the ambient glow
  // strength changes by mode: a soft halo in light, a brighter one in dark.
  const fbGlow    = isDark ? "0 0 22px rgba(24,119,242,0.55)" : "0 8px 20px -6px rgba(24,119,242,0.45)"
  const fbGlowHov = isDark ? "0 0 30px rgba(24,119,242,0.78)" : "0 10px 26px -7px rgba(24,119,242,0.62)"
  const igGlow    = isDark ? "0 0 22px rgba(214,41,118,0.52)" : "0 8px 20px -6px rgba(214,41,118,0.45)"
  const igGlowHov = isDark ? "0 0 30px rgba(214,41,118,0.72)" : "0 10px 26px -7px rgba(214,41,118,0.62)"
  const igGradient = "linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)"

  return (
    <section className="relative overflow-hidden py-[clamp(56px,7vw,100px)]">
      {/* Animated social-button border styles (scoped class names) */}
      <style>{SOCIAL_GLOW_CSS}</style>

      {/* Background image */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage:`url(${testimonialsBG})` }}/>
      {/* Overlay — light veil on all sizes so the bg image stays clearly visible */}
      <div className="absolute inset-0 z-[1]"
        style={{ backgroundColor: isDark ? "rgba(8,15,10,0.7)" : "rgba(255,255,255,0.45)" }}/>
      {/* Dark mode neon radial hint */}
      {isDark && (
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background:"radial-gradient(ellipse at 50% 50%, rgba(74,222,128,0.04) 0%, transparent 70%)" }}/>
      )}

      <div className="relative z-[2] max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-[52px]">

        {/* Header — OccasionsStrip pattern */}
        <div ref={headerRef} className="text-center mb-12 transition-all duration-500"
          style={{ opacity:headerVisible?1:0, transform:headerVisible?"none":"translateY(24px)" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>
            Customer Reviews
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color:headingC }}>
            What Our Customers Say
          </h2>
          <p className="text-sm mb-4" style={{ color:bodyC }}>
            Real feedback from real customers who love our flowers and gifts.
          </p>
          <div className="w-12 h-[3px] mx-auto rounded-full"
            style={{ backgroundColor:accentG, boxShadow:isDark?"0 0 10px rgba(74,222,128,0.5)":"none" }}/>
        </div>

        {/* Carousel */}
        <div ref={cardsRef} className="transition-all duration-500"
          style={{ opacity:cardsVisible?1:0, transform:cardsVisible?"none":"translateY(20px)" }}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

          <div className="flex items-center gap-3.5">
            <ArrowBtn dir="left" onClick={prev} isDark={isDark}/>
            <div className={`flex-1 grid gap-4 items-stretch`}
              style={{ gridTemplateColumns:`repeat(${visibleCount},minmax(0,1fr))`, gap: isDesk?"24px":isMid?"16px":"12px" }}>
              {getVisible().map((review,i) => (
                <ReviewCard key={`${review.id}-${i}-${current}`} review={review} isDark={isDark}/>
              ))}
            </div>
            <ArrowBtn dir="right" onClick={next} isDark={isDark}/>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-8">
            {REVIEWS.map((_,i) => (
              <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to review ${i+1}`}
                className="p-0 border-none cursor-pointer rounded-full transition-all duration-300"
                style={{ width:i===current?22:8, height:8, backgroundColor:i===current?accentDG:dotInact, boxShadow:i===current&&isDark?"0 0 8px rgba(74,222,128,0.5)":"none" }}/>
            ))}
          </div>
        </div>

        {/* ── Tag Us / Social CTA ── */}
        <div ref={socialRef}
          className="max-w-2xl mx-auto text-center mt-[clamp(48px,7vw,72px)] transition-all duration-500"
          style={{ opacity:socialVisible?1:0, transform:socialVisible?"none":"translateY(24px)" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>
            Share the Joy
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color:headingC, fontFamily:"inherit" }}>
            Tag Us When Your Bouquet Arrives
          </h2>
          <p className="text-sm sm:text-[15px] leading-relaxed mb-4" style={{ color:bodyC }}>
            We love seeing your blooms in their new home. Share a photo on Facebook or
            Instagram, tag us, and we'll feature our favorites every week.
          </p>
          <div className="w-12 h-[3px] mx-auto rounded-full mb-9"
            style={{ backgroundColor:accentG, boxShadow:isDark?"0 0 10px rgba(74,222,128,0.5)":"none" }}/>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <a href="https://www.facebook.com/profile.php?id=100063877087893" target="_blank" rel="noopener noreferrer"
              className="fb-glow-border inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.04] active:scale-95"
              style={{ minWidth:160, backgroundColor:"#1877F2", color:"#ffffff", boxShadow:fbGlow }}
              onMouseEnter={e => e.currentTarget.style.boxShadow=fbGlowHov}
              onMouseLeave={e => e.currentTarget.style.boxShadow=fbGlow}>
              <FbIcon className="w-[18px] h-[18px]"/>
              Facebook
            </a>
            <a href="https://www.instagram.com/estingsflowershop/" target="_blank" rel="noopener noreferrer"
              className="ig-glow-border inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.04] active:scale-95"
              style={{ minWidth:160, background:igGradient, color:"#ffffff", boxShadow:igGlow }}
              onMouseEnter={e => e.currentTarget.style.boxShadow=igGlowHov}
              onMouseLeave={e => e.currentTarget.style.boxShadow=igGlow}>
              <IgIcon className="w-[18px] h-[18px]"/>
              Instagram
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}