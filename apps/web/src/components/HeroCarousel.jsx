import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { api } from "../services/api.js"

import heroBg1 from "../assets/HeroBG1.png"
import heroBg2 from "../assets/HeroBG2.png"
import heroBg3 from "../assets/HeroBG3.png"
import heroBg4 from "../assets/HeroBG4.png"

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
    ctaSecondary: "View Occasions",
    ctaSecondaryNav: "occasions",
    accent: "#2E8B34",
    image: heroBg1,
  },
  {
    id: 2,
    tag: "Made a mistake?",
    headline: "Let flowers\ndo the talking",
    description: "Whether it's an apology, a misunderstanding, or just a way to say \"I care,\" sending flowers is sometimes the simplest way to fix things without saying too much.",
    cta: "Shop Flowers",
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
    ctaSecondary: "View Occasions",
    ctaSecondaryNav: "occasions",
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

  const hero     = heroes[current]
  const prevHero = prev !== null ? heroes[prev] : null

  // Slightly deeper overlay in dark mode so text pops against the dimmed image
  const overlayGradient = isDark
    ? "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)"
    : "linear-gradient(90deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.05) 100%)"

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(480px, 70vh, 720px)" }}
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

      {/* Prev arrow */}
      <button onClick={() => goTo((current - 1 + heroes.length) % heroes.length, "prev")}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center text-white border border-white/30 bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 hover:scale-110"
        aria-label="Previous slide">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow */}
      <button onClick={() => goTo((current + 1) % heroes.length, "next")}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center text-white border border-white/30 bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 hover:scale-110"
        aria-label="Next slide">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="w-full max-w-7xl mx-auto px-16 sm:px-20 lg:px-24">
          <div className="max-w-xl">
            {animating && prevHero && (
              <div key={`prev-${prev}`} className="absolute"
                style={{ animation: "slideOutLeft 0.55s cubic-bezier(0.4,0,0.2,1) forwards" }}>
                <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-4 text-white"
                  style={{ backgroundColor: prevHero.accent + "55", border: `1px solid ${prevHero.accent}99` }}>
                  {prevHero.tag}
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                  {prevHero.headline.split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
                </h1>
                <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8">{prevHero.description}</p>
              </div>
            )}

            <div key={`curr-${current}`}
              style={{ animation: animating ? "slideInRight 0.6s cubic-bezier(0.4,0,0.2,1) forwards" : "none", opacity: animating ? 0 : 1 }}>
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-5 text-white"
                style={{ backgroundColor: hero.accent + "55", border: `1px solid ${hero.accent}99` }}>
                {hero.tag}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                {hero.headline.split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
              </h1>
              <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-8 max-w-md">{hero.description}</p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <button
                  onClick={() => onNavigate && onNavigate("shop")}
                  className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl text-center"
                  style={{ backgroundColor: hero.accent }}>
                  {hero.cta}
                </button>
                <button
                  onClick={() => onNavigate && hero.ctaSecondaryNav && onNavigate(hero.ctaSecondaryNav)}
                  className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-white rounded-full border border-white/40 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 text-center">
                  {hero.ctaSecondary}
                </button>
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