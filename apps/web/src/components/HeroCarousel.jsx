import { useEffect, useState } from "react"
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
    headline: "Timeless Floristry,\nSince 1959",
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

const AUTO_PLAY_MS = 6500

function resolveImage(slide) {
  if (!slide.image) return heroBg1
  if (IMAGE_MAP[slide.image]) return IMAGE_MAP[slide.image]
  if (String(slide.image).startsWith("http")) return slide.image
  return heroBg1
}

function slideNumber(index) {
  return String(index + 1).padStart(2, "0")
}

function shortTitle(slide) {
  return String(slide.headline || slide.tag || "Our flowers").split("\n")[0]
}

export default function HeroCarousel({ onNavigate }) {
  const { isDark } = useTheme()
  const [heroes, setHeroes] = useState(DEFAULT_HEROES)
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const paused = interactionPaused || userPaused

  useEffect(() => {
    api.getHeroSlides()
      .then((data) => {
        if (data?.slides && Array.isArray(data.slides) && data.slides.length > 0) {
          setHeroes(data.slides.map((slide, index) => ({
            ...slide,
            id: slide.id || `hero-${index}`,
            accent: slide.accent || "#2E8B34",
            image: resolveImage(slide),
          })))
          setCurrent(0)
        }
      })
      .catch(() => {})
  }, [])

  const goTo = (index) => {
    if (animating || index === current || heroes.length < 2) return
    setAnimating(true)
    setCurrent((index + heroes.length) % heroes.length)
    window.setTimeout(() => setAnimating(false), 850)
  }

  useEffect(() => {
    if (paused || heroes.length < 2) return undefined
    const timer = window.setTimeout(() => goTo(current + 1), AUTO_PLAY_MS)
    return () => window.clearTimeout(timer)
  }, [current, paused, heroes.length])

  useEffect(() => {
    if (paused) return undefined
    setProgress(0)
    const startedAt = performance.now()
    let frameId
    const updateProgress = (now) => {
      const next = Math.min(((now - startedAt) / AUTO_PLAY_MS) * 100, 100)
      setProgress(next)
      if (next < 100) frameId = requestAnimationFrame(updateProgress)
    }
    frameId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(frameId)
  }, [current, paused])

  const hero = heroes[current] || DEFAULT_HEROES[0]
  const primaryNav = hero.ctaNav || "shop"
  const secondaryNav = hero.ctaSecondaryNav || "shop"
  const accent = hero.accent || "#2E8B34"

  const handleKeys = (event) => {
    if (event.key === "ArrowLeft") goTo(current - 1)
    if (event.key === "ArrowRight") goTo(current + 1)
  }

  return (
    <section
      className={`hero-story relative isolate w-full max-w-[1920px] mx-auto overflow-hidden ${isDark ? "hero-story--dark" : ""}`}
      style={{ "--slide-accent": accent }}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocus={() => setInteractionPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false)
      }}
      onKeyDown={handleKeys}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Featured floral stories"
    >
      <div className="absolute inset-0 bg-[#07120d]">
        {heroes.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-story__image absolute inset-0 ${index === current ? "is-current" : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
            role="img"
            aria-label={index === current ? slide.headline?.replace("\n", " ") : undefined}
          />
        ))}
      </div>

      <div className="hero-story__wash absolute inset-0 z-10" />
      <div className="hero-story__grain absolute inset-0 z-10 pointer-events-none" />

      <div className="relative z-20 flex min-h-[600px] h-[clamp(600px,calc(100svh-4rem),820px)] flex-col px-5 sm:px-8 lg:px-12 xl:px-16">
        <header className="hero-story__masthead flex items-center justify-between gap-5 border-b border-white/20 py-4 sm:py-5 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <span className="hero-story__mark" aria-hidden="true" />
            <span className="truncate text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.22em]">
              Esting's Flowers
            </span>
          </div>
          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
            Manila · Pampanga · Since 1959
          </span>
        </header>

        <div className="grid flex-1 grid-cols-12 items-end gap-6 pb-24 pt-8 sm:pb-28 sm:pt-10 lg:gap-10 lg:pb-32">
          <div className="col-span-12 lg:col-span-8 xl:col-span-7">
            <article key={hero.id} className={`hero-story__copy ${animating ? "is-entering" : ""}`} aria-live="polite">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <span className="text-[11px] font-black tracking-[0.24em] text-white/80">{slideNumber(current)}</span>
                <span className="h-px w-10 sm:w-16 bg-white/50" />
                <span className="max-w-[70vw] truncate text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-white">
                  {hero.tag}
                </span>
              </div>

              <h1 className="hero-story__headline mb-5 max-w-4xl text-white">
                {String(hero.headline || "Flowers for every story").split("\n").map((line, index) => (
                  <span key={`${line}-${index}`} className="block">{line}</span>
                ))}
              </h1>

              <div className="hero-story__detail border-l-2 pl-4 sm:pl-5" style={{ borderColor: accent }}>
                <p className="hero-story__description max-w-xl text-sm sm:text-base lg:text-[17px] leading-relaxed text-white/86">
                  {hero.description}
                </p>
              </div>

              <div className="mt-5 flex flex-nowrap items-center gap-3 sm:mt-8 sm:flex-wrap">
                <button
                  onClick={() => onNavigate?.(primaryNav)}
                  className="hero-story__primary group inline-flex min-h-12 shrink-0 items-center gap-5 whitespace-nowrap rounded-sm bg-[#f6f0e5] px-5 sm:px-6 text-sm font-black text-[#102319] shadow-[0_16px_40px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                >
                  <span>{hero.cta || "Shop Flowers"}</span>
                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                </button>

                {hero.showSecondary !== false && hero.ctaSecondary && (
                  <button
                    onClick={() => onNavigate?.(secondaryNav)}
                    className="hero-story__secondary inline-flex min-h-12 min-w-0 items-center overflow-hidden text-ellipsis whitespace-nowrap border-b border-white/60 px-2 text-sm font-extrabold text-white transition hover:border-white hover:text-white/75"
                  >
                    {hero.ctaSecondary}
                  </button>
                )}
              </div>
            </article>
          </div>

          <nav className="hero-story__chapters hidden lg:col-span-4 lg:block xl:col-span-3 xl:col-start-10" aria-label="Choose a floral story">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/55">In this collection</p>
            <div className="border-t border-white/25">
              {heroes.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goTo(index)}
                  className={`hero-story__chapter group grid w-full grid-cols-[2.25rem_1fr] items-center gap-3 border-b border-white/20 py-4 text-left transition ${index === current ? "is-current" : ""}`}
                  aria-current={index === current ? "true" : undefined}
                  aria-label={`Show slide ${index + 1}: ${shortTitle(slide)}`}
                >
                  <span className="text-[10px] font-black tracking-[0.2em] text-white/45 transition group-hover:text-white">{slideNumber(index)}</span>
                  <span className="truncate text-sm font-bold text-white/60 transition group-hover:text-white">{shortTitle(slide)}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        <footer className="hero-story__footer absolute bottom-4 left-5 right-5 z-30 flex items-center gap-4 border-t border-white/20 py-3 text-white sm:bottom-7 sm:left-8 sm:right-8 sm:gap-6 lg:bottom-10 lg:left-12 lg:right-12 xl:left-16 xl:right-16">
          <div className="flex items-center gap-2">
            <button onClick={() => goTo(current - 1)} className="hero-story__arrow" aria-label="Previous slide">←</button>
            <button onClick={() => goTo(current + 1)} className="hero-story__arrow" aria-label="Next slide">→</button>
          </div>

          <div className="h-px flex-1 overflow-hidden bg-white/25">
            <div className="h-full bg-white" style={{ width: `${progress}%` }} />
          </div>

          <button
            onClick={() => setUserPaused((value) => !value)}
            className="min-w-[4.75rem] text-right text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
            aria-label={userPaused ? "Resume slideshow" : "Pause slideshow"}
          >
            {userPaused ? "Play story" : "Pause"}
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            {heroes.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goTo(index)}
                className={`hero-story__dot ${index === current ? "is-current" : ""}`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === current ? "true" : undefined}
              />
            ))}
          </div>
        </footer>
      </div>

      <style>{`
        .hero-story { outline: none; background: #07120d; }
        .hero-story:focus-visible { box-shadow: inset 0 0 0 3px var(--slide-accent); }
        .hero-story__image {
          background-size: cover;
          background-position: center;
          opacity: 0;
          transform: scale(1.055);
          transition: opacity .9s ease, transform 7s cubic-bezier(.2,.65,.25,1);
        }
        .hero-story__image.is-current { opacity: 1; transform: scale(1); }
        .hero-story__wash {
          background:
            linear-gradient(90deg, rgba(4,16,10,.88) 0%, rgba(4,16,10,.67) 39%, rgba(4,16,10,.18) 72%, rgba(4,16,10,.32) 100%),
            linear-gradient(0deg, rgba(4,13,8,.8) 0%, transparent 42%, rgba(4,13,8,.18) 100%);
        }
        .hero-story__grain {
          opacity: .11;
          background-image: radial-gradient(rgba(255,255,255,.8) .55px, transparent .55px);
          background-size: 5px 5px;
          mix-blend-mode: soft-light;
        }
        .hero-story__masthead, .hero-story__footer { backdrop-filter: blur(2px); }
        .hero-story__mark {
          width: 11px;
          height: 11px;
          border-radius: 70% 0 70% 0;
          background: var(--slide-accent);
          transform: rotate(-35deg);
          box-shadow: 8px 5px 0 color-mix(in srgb, var(--slide-accent) 58%, white);
        }
        .hero-story__copy { text-shadow: 0 2px 24px rgba(0,0,0,.28); animation: heroStoryReveal .85s cubic-bezier(.2,.75,.2,1) both; }
        .hero-story__copy.is-entering { animation: heroStoryReveal .85s cubic-bezier(.2,.75,.2,1) both; }
        .hero-story__headline {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(3.25rem, 6.7vw, 7.4rem);
          font-weight: 500;
          letter-spacing: -.055em;
          line-height: .87;
          text-wrap: balance;
        }
        .hero-story__headline span:last-child { color: #f4ead9; font-style: italic; padding-left: clamp(0rem, 5vw, 4.5rem); }
        .hero-story__detail { max-width: 43rem; }
        .hero-story__chapter { position: relative; }
        .hero-story__chapter::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: -1px;
          width: 0;
          height: 2px;
          background: var(--slide-accent);
          transition: width .35s ease;
        }
        .hero-story__chapter.is-current::after { width: 100%; }
        .hero-story__chapter.is-current span { color: white; }
        .hero-story__arrow {
          display: grid;
          width: 2.5rem;
          height: 2.5rem;
          place-items: center;
          border: 1px solid rgba(255,255,255,.32);
          border-radius: 50%;
          color: white;
          font-size: 1.05rem;
          transition: transform .25s ease, background-color .25s ease;
        }
        .hero-story__arrow:hover { transform: translateY(-2px); background: rgba(255,255,255,.13); }
        .hero-story__dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.35); transition: width .3s ease, background-color .3s ease; }
        .hero-story__dot.is-current { width: 22px; border-radius: 99px; background: white; }
        @keyframes heroStoryReveal {
          from { opacity: 0; transform: translateY(24px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @media (max-width: 1023px) {
          .hero-story__wash {
            background:
              linear-gradient(90deg, rgba(4,16,10,.82) 0%, rgba(4,16,10,.47) 68%, rgba(4,16,10,.2) 100%),
              linear-gradient(0deg, rgba(4,13,8,.88) 0%, transparent 62%, rgba(4,13,8,.12) 100%);
          }
          .hero-story__headline { font-size: clamp(3.5rem, 10vw, 6.5rem); }
        }
        @media (max-width: 639px) {
          .hero-story__image { background-position: 60% center; }
          .hero-story__wash {
            background:
              linear-gradient(90deg, rgba(4,16,10,.75), rgba(4,16,10,.25)),
              linear-gradient(0deg, rgba(4,13,8,.94) 2%, rgba(4,13,8,.5) 60%, rgba(4,13,8,.15) 100%);
          }
          .hero-story__headline { font-size: clamp(3rem, 15vw, 4.75rem); line-height: .91; }
          .hero-story__headline span:last-child { padding-left: 0; }
          .hero-story__description {
            display: -webkit-box;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 4;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-story__image, .hero-story__copy, .hero-story__chapter::after { animation: none; transition: none; }
        }
      `}</style>
    </section>
  )
}
