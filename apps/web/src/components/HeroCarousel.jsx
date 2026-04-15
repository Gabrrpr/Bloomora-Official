import { useState, useEffect } from "react"

const HEROES = [
  {
    id: 1,
    tag: "New Arrivals",
    headline: "Fresh Blooms,\nDelivered with Love",
    description: "Handpicked seasonal arrangements crafted by expert florists. Same-day delivery available across Metro Manila.",
    cta: "Shop Now",
    ctaSecondary: "Explore Collection",
    accent: "#2E8B34",
    bg: "from-emerald-950/60 to-emerald-900/30",
    image: null, // replace with: "/src/assets/hero1.jpg"
    placeholder: "linear-gradient(135deg, #0C573E 0%, #2E8B34 40%, #a8d5a2 100%)",
  },
  {
    id: 2,
    tag: "Valentine's Special",
    headline: "Say It With\nRoses This Season",
    description: "Premium red roses and romantic arrangements for the one you love. Order before 9AM for same-day surprise delivery.",
    cta: "Order Roses",
    ctaSecondary: "View Gift Sets",
    accent: "#e11d48",
    bg: "from-rose-950/60 to-rose-900/30",
    image: null,
    placeholder: "linear-gradient(135deg, #7f1d1d 0%, #e11d48 40%, #fda4af 100%)",
  },
  {
    id: 3,
    tag: "Make It Personal",
    headline: "Your Dream\nBouquet, Designed by AI",
    description: "Describe your perfect arrangement and watch our AI bring it to life — then our florists make it real for you.",
    cta: "Try It Now",
    ctaSecondary: "See Examples",
    accent: "#7c3aed",
    bg: "from-violet-950/60 to-violet-900/30",
    image: null,
    placeholder: "linear-gradient(135deg, #3b0764 0%, #7c3aed 40%, #c4b5fd 100%)",
  },
  {
    id: 4,
    tag: "Corporate & Events",
    headline: "Flowers for\nEvery Occasion",
    description: "Weddings, anniversaries, graduations, and corporate events — we create stunning floral experiences that last a lifetime.",
    cta: "Book a Florist",
    ctaSecondary: "View Occasions",
    accent: "#d97706",
    bg: "from-amber-950/60 to-amber-900/30",
    image: null,
    placeholder: "linear-gradient(135deg, #451a03 0%, #d97706 40%, #fcd34d 100%)",
  },
]

const AUTO_PLAY_MS = 5000

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState("next")
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  // Auto-advance
  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      goTo((current + 1) % HEROES.length, "next")
    }, AUTO_PLAY_MS)
    return () => clearInterval(interval)
  }, [current, paused])

  // Progress bar
  useEffect(() => {
    if (paused) return
    setProgress(0)
    const startTime = Date.now()
    const frame = () => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / AUTO_PLAY_MS) * 100, 100))
      if (elapsed < AUTO_PLAY_MS) requestAnimationFrame(frame)
    }
    const rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [current, paused])

  const goTo = (index, dir = "next") => {
    if (animating || index === current) return
    setDirection(dir)
    setPrev(current)
    setAnimating(true)
    setCurrent(index)
    setTimeout(() => {
      setPrev(null)
      setAnimating(false)
    }, 600)
  }

  const hero = HEROES[current]
  const prevHero = prev !== null ? HEROES[prev] : null

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(480px, 70vh, 720px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slides */}
      {HEROES.map((h, i) => (
        <div
          key={h.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: h.image ? `url(${h.image}) center/cover no-repeat` : h.placeholder,
            opacity: i === current ? 1 : 0,
            zIndex: 0,
          }}
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)" }} />

      {/* No image placeholder text */}
      {!hero.image && (
        <div className="absolute inset-0 z-10 flex items-center justify-end pr-16 pointer-events-none">
          <div className="text-right opacity-20">
            <div className="text-white text-8xl">🌸</div>
            <p className="text-white/60 text-xs mt-2 tracking-widest uppercase">Photo coming soon</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="max-w-xl">

            {/* Exiting content */}
            {animating && prevHero && (
              <div
                key={`prev-${prev}`}
                className="absolute"
                style={{
                  animation: `slideOutLeft 0.55s cubic-bezier(0.4,0,0.2,1) forwards`,
                }}
              >
                <span
                  className="inline-block text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-4 text-white"
                  style={{ backgroundColor: prevHero.accent + "55", border: `1px solid ${prevHero.accent}99` }}
                >
                  {prevHero.tag}
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                  {prevHero.headline.split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
                </h1>
                <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8">{prevHero.description}</p>
              </div>
            )}

            {/* Entering content */}
            <div
              key={`curr-${current}`}
              style={{
                animation: animating
                  ? `slideInRight 0.6s cubic-bezier(0.4,0,0.2,1) forwards`
                  : "none",
                opacity: animating ? 0 : 1,
              }}
            >
              <span
                className="inline-block text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-5 text-white"
                style={{ backgroundColor: hero.accent + "55", border: `1px solid ${hero.accent}99` }}
              >
                {hero.tag}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                {hero.headline.split("\n").map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </h1>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
                {hero.description}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  className="px-7 py-3.5 text-sm font-bold text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  style={{ backgroundColor: hero.accent }}
                >
                  {hero.cta}
                </button>
                <button className="px-7 py-3.5 text-sm font-semibold text-white rounded-full border border-white/40 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                  {hero.ctaSecondary}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-6 left-0 right-0 z-20 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Slide indicators */}
          <div className="flex items-center gap-3">
            {HEROES.map((h, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > current ? "next" : "prev")}
                className="relative overflow-hidden rounded-full transition-all duration-300 flex-shrink-0"
                style={{
                  width: i === current ? "32px" : "8px",
                  height: "8px",
                  backgroundColor: i === current ? "white" : "rgba(255,255,255,0.35)",
                }}
              >
                {/* Progress fill on active dot */}
                {i === current && !paused && (
                  <div
                    className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
                    style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Prev / Next arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo((current - 1 + HEROES.length) % HEROES.length, "prev")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goTo((current + 1) % HEROES.length, "next")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes slideOutLeft {
          0%   { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(-80px) scale(0.97); }
        }
        @keyframes slideInRight {
          0%   { opacity: 0; transform: translateX(60px) scale(0.97); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
