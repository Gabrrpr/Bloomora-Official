import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { api } from "../services/api.js"

import heroBg1 from "../assets/hero/HeroBG1.webp"
import heroBg2 from "../assets/hero/HeroBG2.webp"
import heroBg3 from "../assets/hero/HeroBG3.webp"
import heroBg4 from "../assets/hero/HeroBG4.webp"

const IMAGE_MAP = {
  "HeroBG1.png": heroBg1,
  "HeroBG2.png": heroBg2,
  "HeroBG3.png": heroBg3,
  "HeroBG4.png": heroBg4,
}

const DEFAULT_HEROES = [
  {
    id: 1,
    tag: "Esting's Flower International Inc.",
    headline: "Fresh Blooms,\nSince 1959",
    description: "Since 1959, we've been part of countless moments big and small. Every arrangement is made by hand with fresh flowers and genuine care.",
    cta: "Shop Flowers",
    ctaNav: "shop",
    ctaSecondary: "View Occasions",
    ctaSecondaryNav: "shop",
    accent: "#2E8B34",
    image: heroBg1,
  },
  {
    id: 2,
    tag: "Made a mistake?",
    headline: "Let flowers\ndo the talking",
    description: "Whether it's an apology, a misunderstanding, or just a way to say \"I care,\" sending flowers is sometimes the simplest way to fix things without saying too much.",
    cta: "Shop Flowers",
    ctaNav: "shop",
    ctaSecondary: "Explore Collection",
    ctaSecondaryNav: "shop",
    accent: "#e11d48",
    image: heroBg2,
  },
  {
    id: 3,
    tag: "Make It Personal",
    headline: "Flowers,\nMade Your Way",
    description: "Use our \"Make it Personal\" feature to describe your ideal bouquet, or build your own arrangement through our Mix and Match option. We'll turn your idea into something fresh and beautifully made.",
    cta: "Try It Now",
    ctaNav: "make-it-personal",
    ctaSecondary: "See Examples",
    ctaSecondaryNav: "ai-gallery",
    accent: "#7c3aed",
    image: heroBg3,
  },
  {
    id: 4,
    tag: "Fresh Flowers, For Any Moment",
    headline: "Simple Ways\nto Show You Care",
    description: "From everyday surprises to life's biggest moments, we create fresh arrangements that help you express what you feel in a simple and meaningful way.",
    cta: "Shop Flowers",
    ctaNav: "shop",
    ctaSecondary: "View Occasions",
    ctaSecondaryNav: "shop",
    accent: "#d97706",
    image: heroBg4,
  },
]

const AUTO_PLAY_MS = 5000

function resolveImage(slide) {
  if (!slide.image) return heroBg1
  if (IMAGE_MAP[slide.image]) return IMAGE_MAP[slide.image]
  if (slide.image.startsWith("http")) return slide.image
  return heroBg1
}

export default function HeroCarousel({ onNavigate }) {
  const { isDark } = useTheme()
  const [heroes, setHeroes] = useState(DEFAULT_HEROES)
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    api.getHeroSlides()
      .then((data) => {
        if (data?.slides && Array.isArray(data.slides) && data.slides.length > 0) {
          const mapped = data.slides.map((s) => ({ ...s, image: resolveImage(s) }))
          setHeroes(mapped)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      goTo((current + 1) % heroes.length, "next")
    }, AUTO_PLAY_MS)
    return () => clearInterval(interval)
  }, [current, paused, heroes.length])

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
    setPrev(current)
    setAnimating(true)
    setCurrent(index)
    setTimeout(() => { setPrev(null); setAnimating(false) }, 600)
  }

  // Resolve a slide's nav target with sensible fallbacks so older CMS payloads
  // (which may only carry ctaSecondaryNav) still route correctly.
  const primaryNav   = (h) => h.ctaNav || "shop"
  const secondaryNav = (h) => h.ctaSecondaryNav || "shop"

  const hero     = heroes[current]
  const prevHero = prev !== null ? heroes[prev] : null

  // Slightly deeper overlay in dark mode so text pops against the dimmed image
  const overlayGradient = isDark
    ? "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)"
    : "linear-gradient(90deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.05) 100%)"

  return (
    <div
      className="relative w-full max-w-[1600px] mx-auto overflow-hidden"
      style={{ height: "clamp(560px, 70vh, 720px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background images */}
      {heroes.map((h, i) => (
        <div key={h.id} className="absolute inset-0 transition-opacity duration-700"
          style={{ backgroundImage: `url(${h.image})`, backgroundSize: "cover", backgroundPosition: "center", opacity: i === current ? 1 : 0, zIndex: 0 }} />
      ))}

      {/* Overlay — deeper in dark mode */}
      <div className="absolute inset-0 z-10" style={{ background: overlayGradient }} />

      {/* Prev arrow — smaller and tucked tighter to the edge on mobile so it
          doesn't crowd the text column on narrow devices like iPhone SE */}
      <button onClick={() => goTo((current - 1 + heroes.length) % heroes.length, "prev")}
        className="absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white border border-white/30 bg-black/25 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 hover:scale-110"
        aria-label="Previous slide">
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow */}
      <button onClick={() => goTo((current + 1) % heroes.length, "next")}
        className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white border border-white/30 bg-black/25 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 hover:scale-110"
        aria-label="Next slide">
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Content — vertically centered; reduced side padding on mobile gives the
          text real room between the arrows. Bottom padding leaves space for dots. */}
      <div className="relative z-20 h-full flex items-center pt-12 pb-24 sm:pt-16 sm:pb-28">
        <div className="w-full max-w-7xl mx-auto px-12 sm:px-24 lg:px-28">
          <div className="relative w-full max-w-xl">
            {animating && prevHero && (
              <div key={`prev-${prev}`} className="absolute top-0 left-0 right-0"
                style={{ animation: "slideOutLeft 0.6s cubic-bezier(0.22,1,0.36,1) forwards" }}>
                <span className="inline-flex items-center self-start max-w-[calc(100vw-6rem)] sm:max-w-max text-[10px] sm:text-xs font-bold tracking-[0.08em] sm:tracking-[0.2em] uppercase px-2.5 sm:px-3 py-1 rounded-full mb-3 sm:mb-4 text-white truncate"
                  style={{ backgroundColor: prevHero.accent + "55", border: `1px solid ${prevHero.accent}99` }}>
                  {prevHero.tag}
                </span>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3 sm:mb-4" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                  {prevHero.headline.split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
                </h1>
                <p className="text-white/80 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">{prevHero.description}</p>
              </div>
            )}

            <div key={`curr-${current}`}
              style={{ animation: animating ? "slideInRight 0.6s cubic-bezier(0.22,1,0.36,1) forwards" : "none", opacity: animating ? 0 : 1 }}>
              <span className="inline-flex items-center self-start max-w-[calc(100vw-6rem)] sm:max-w-max text-[10px] sm:text-xs font-bold tracking-[0.08em] sm:tracking-[0.2em] uppercase px-2.5 sm:px-3 py-1 rounded-full mb-3 sm:mb-5 text-white truncate"
                style={{ backgroundColor: hero.accent + "55", border: `1px solid ${hero.accent}99` }}>
                {hero.tag}
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3 sm:mb-5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                {hero.headline.split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
              </h1>
              <p className="text-white/90 text-sm sm:text-lg leading-relaxed mb-5 sm:mb-8 max-w-md">{hero.description}</p>
              <div className="grid grid-cols-[max-content] justify-start gap-2.5 sm:gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  onClick={() => onNavigate && onNavigate(primaryNav(hero))}
                  className="hero-glow-border w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 text-sm font-bold text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl text-center whitespace-nowrap"
                  style={{ backgroundColor: hero.accent, "--hero-accent": hero.accent }}>
                  {hero.cta}
                </button>
                {hero.showSecondary !== false && hero.ctaSecondary && (
                  <button
                    onClick={() => onNavigate && onNavigate(secondaryNav(hero))}
                    className="hero-glow-border w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 text-sm font-semibold text-white rounded-full border border-white/40 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 text-center whitespace-nowrap"
                    style={{ backgroundColor: "transparent", "--hero-accent": hero.accent }}>
                    {hero.ctaSecondary}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2.5">
        {heroes.map((_, i) => (
          <button key={i} onClick={() => goTo(i, i > current ? "next" : "prev")}
            className="relative overflow-hidden rounded-full transition-all duration-300 flex-shrink-0"
            style={{ width: i === current ? "28px" : "8px", height: "8px", backgroundColor: i === current ? "white" : "rgba(255,255,255,0.40)" }}
            aria-label={`Go to slide ${i + 1}`}>
            {i === current && !paused && (
              <div className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: "#4ade80", width: `${progress}%`, transition: "width 0.1s linear" }} />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes slideOutLeft {
          0%   { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-44px); }
        }
        @keyframes slideInRight {
          0%   { opacity: 0; transform: translateX(44px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        /* Rotating gradient border for the hero CTAs. The beam color follows
           each slide via the inline --hero-accent custom property; a bright
           white beam sweeps around on a 4s loop. Namespaced so it can't clash
           with the featured-sections .bloom-glow-border. */
        @property --hero-glow-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @keyframes heroGlowSpin { to { --hero-glow-angle: 360deg; } }
        .hero-glow-border { position: relative; z-index: 0; }
        .hero-glow-border::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          border-radius: inherit;
          padding: 2px;
          background: conic-gradient(from var(--hero-glow-angle, 0deg),
            rgba(255,255,255,0.22) 0deg,
            rgba(255,255,255,0.22) 60deg,
            var(--hero-accent, #4ade80) 95deg,
            #ffffff 130deg,
            var(--hero-accent, #4ade80) 165deg,
            rgba(255,255,255,0.22) 200deg,
            rgba(255,255,255,0.22) 360deg
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
          animation: heroGlowSpin 4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-glow-border::before { animation: none; }
        }
      `}</style>
    </div>
  )
}