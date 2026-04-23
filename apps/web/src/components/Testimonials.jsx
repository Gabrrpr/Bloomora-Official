import { useEffect, useRef, useState } from "react"

const G = "#2E8B34"
const DG = "#0C573E"

const REVIEWS = [
  { id: 1, name: "Khaye Muñoz", source: "Facebook", text: "They made very special flower always.", rating: 5 },
  { id: 2, name: "Dennis Rivera Logarta", source: "Facebook", text: "True people and a perfect flower shop. Message from KANSAS USA.", rating: 5 },
  { id: 3, name: "Iris Canda-van de Kreeke", source: "Facebook", text: "Happy with the service and the outcome of the flowers when they delivered it to my mom's doorstep. And also it was right on time.", rating: 5 },
  { id: 4, name: "Dave Ramos", source: "Facebook", text: "The best flower shop for all occasions!", rating: 5 },
  { id: 5, name: "Nikola Crnogorcevic", source: "Google", text: "Always fresh flowers and fast service. Price not high and there is a lot of choice also.", rating: 4 },
  { id: 6, name: "John Clark", source: "Google", text: "I have used this place a few times now and every time their flower arrangements are amazing. Very professional service.", rating: 4 },
]

function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Stars({ count = 5 }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className="w-4 h-4" fill={i <= count ? "#fbbf24" : "rgba(255,255,255,0.2)"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function AvatarIcon() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="44" cy="44" r="44" fill={DG} />
      <circle cx="41" cy="30" r="16" fill="rgba(255,255,255,0.9)" />
      <ellipse cx="40" cy="72" rx="26" ry="18" fill="rgba(255,255,255,0.9)" />
    </svg>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="flex flex-col h-full" style={{ paddingTop: "52px" }}>
      <div
        className="relative flex flex-col flex-1 rounded-2xl text-center"
        style={{
          background: "linear-gradient(160deg, #1a5e2a 0%, #398b46 60%, #1e6b30 100%)",
          boxShadow: "0 8px 32px rgba(12,87,62,0.25)",
        }}
      >
        {/* Avatar — centered, overlapping top */}
        <div
          className="absolute left-1/2 rounded-full border-4 border-white shadow-xl overflow-hidden"
          style={{ top: "-44px", transform: "translateX(-50%)", width: "88px", height: "88px" }}
        >
          <AvatarIcon />
        </div>

        <div className="flex flex-col flex-1 px-6 pt-6 pb-6">

          {/* Big quote mark — no circle, just the character */}
          <div className="mb-0" style={{
            fontSize: "72px",
            lineHeight: 1,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "Georgia, serif",
            marginTop: "40px",
          }}>
            &ldquo;
          </div>

          {/* Review text */}
          <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.92)" }}>
            {review.text}
          </p>

          {/* Footer — always "via Source", no location */}
          <div className="mt-6">
            <div className="w-10 mx-auto mb-4" style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
            <p className="font-bold text-base text-white leading-tight">{review.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>via {review.source}</p>
            <div className="flex justify-center mt-3">
              <Stars count={review.rating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const [headerRef, headerVisible] = useScrollReveal(0.2)
  const [cardsRef, cardsVisible] = useScrollReveal(0.1)
  const [videoRef, videoVisible] = useScrollReveal(0.1)
  const [current, setCurrent] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const total = REVIEWS.length

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) setVisibleCount(1)
      else if (window.innerWidth < 1024) setVisibleCount(2)
      else setVisibleCount(3)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const prev = () => setCurrent(c => (c - 1 + total) % total)
  const next = () => setCurrent(c => (c + 1) % total)
  const getVisible = () => Array.from({ length: visibleCount }, (_, i) => REVIEWS[(current + i) % total])

  return (
    <section className="py-16 px-4 sm:px-8" style={{ backgroundColor: "#f2f8f3" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div ref={headerRef} className="text-center mb-10"
          style={{ transition: "opacity 0.6s ease, transform 0.6s ease", opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(20px)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: G }}>Customer Reviews</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">What Our Customers Say</h2>
          <div className="w-12 h-0.5 mx-auto mb-2" style={{ backgroundColor: G }} />
          <p className="text-gray-400 text-sm">Real feedback from real customers.</p>
        </div>

        {/* Carousel */}
        <div ref={cardsRef}
          style={{ transition: "opacity 0.6s ease, transform 0.6s ease", opacity: cardsVisible ? 1 : 0, transform: cardsVisible ? "translateY(0)" : "translateY(24px)" }}>
          <div className="flex items-stretch gap-3 sm:gap-4">
            <button onClick={prev}
              className="flex-shrink-0 w-11 h-11 self-center rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "white", border: `2px solid ${G}`, color: G }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 grid gap-4 items-stretch"
              style={{ gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))` }}>
              {getVisible().map((review, i) => (
                <ReviewCard key={`${review.id}-${i}`} review={review} />
              ))}
            </div>

            <button onClick={next}
              className="flex-shrink-0 w-11 h-11 self-center rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "white", border: `2px solid ${G}`, color: G }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {REVIEWS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className="rounded-full transition-all duration-200"
                style={{ width: i === current ? "24px" : "8px", height: "8px", backgroundColor: i === current ? G : "#c6e6cb" }} />
            ))}
          </div>
        </div>

        {/* Facebook vlog */}
        <div ref={videoRef} className="mt-14"
          style={{ transition: "opacity 0.7s ease, transform 0.7s ease", opacity: videoVisible ? 1 : 0, transform: videoVisible ? "translateY(0)" : "translateY(28px)" }}>
          <div className="rounded-3xl overflow-hidden shadow-xl" style={{ border: "1px solid #dceee0", backgroundColor: "white" }}>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 p-8 sm:p-10 pb-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full mb-4 w-fit" style={{ backgroundColor: "#e6f4ea" }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: G }}>See It For Yourself</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 leading-tight">
                  A Tour of Our Pampanga Branch
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Watch our team carefully craft each arrangement using the freshest flowers, right from our Pampanga store.
                </p>
              </div>
              <div className="flex-shrink-0 self-start sm:self-center">
                <a href="https://www.facebook.com/watch/?v=612504224857086&rdid=mjiAAoOFQEC5qu4n"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: "#1877F2" }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                  Watch on Facebook
                </a>
              </div>
            </div>

            <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", overflow: "hidden" }}>
              <iframe
                src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D612504224857086&show_text=false&width=1280&height=720"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", display: "block" }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
