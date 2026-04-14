import { useEffect, useRef, useState } from "react"

const REVIEWS = [
  { id: 1, name: "Khaye Muñoz", source: "Facebook", text: "They made very special flower always.", rating: 5, initials: "KM" },
  { id: 2, name: "Dennis Rivera Logarta", source: "Facebook", location: "Kansas, USA", text: "True people and a perfect flower shop. Message from KANSAS USA.", rating: 5, initials: "DL" },
  { id: 3, name: "Iris Canda-van de Kreeke", source: "Facebook", text: "Happy with the service and the outcome of the flowers when they delivered it to my mom's doorstep. And also it was right on time.", rating: 5, initials: "IK" },
  { id: 4, name: "Dave Ramos", source: "Facebook", text: "The best flower shop for all occasions!", rating: 5, initials: "DR" },
  { id: 5, name: "Nikola Crnogorcevic", source: "Google", text: "Always fresh flowers and fast service. Price not high and there is a lot of choice also.", rating: 4, initials: "NC" },
  { id: 6, name: "John Clark", source: "Google", text: "I have used this place a few times now and every time their flower arrangements are amazing. Very professional service.", rating: 4, initials: "JC" },
]

const AVATAR_COLORS = ["#2E8B34", "#0C573E", "#3b82f6", "#f59e0b", "#7c3aed", "#0891b2"]

const SOURCE_ICON = {
  Facebook: (
    <svg className="w-3.5 h-3.5" fill="#1877F2" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  Google: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
}

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
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className="w-3.5 h-3.5" fill={i <= count ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review, color }) {
  return (
    <div className="bg-white flex flex-col h-full" style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ height: "3px", backgroundColor: color }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Stars count={review.rating} />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
            {SOURCE_ICON[review.source]}
            <span className="text-[10px] text-gray-500 font-medium">{review.source}</span>
          </div>
        </div>

        {/* Quote mark — proper typographic open-quote, green, visible */}
        <div style={{ fontFamily: "Georgia, serif", fontSize: "40px", lineHeight: 1, color: "#2E8B34", opacity: 0.5, marginBottom: "-8px", userSelect: "none" }}>
          &ldquo;
        </div>

        <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>

        <div style={{ borderTop: "1px solid #f3f4f6" }} />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
            {review.initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 leading-tight">{review.name}</div>
            <div className="text-xs text-gray-400">{review.location ? review.location : `via ${review.source}`}</div>
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
  const total = REVIEWS.length

  const prev = () => setCurrent(c => (c - 1 + total) % total)
  const next = () => setCurrent(c => (c + 1) % total)
  const getVisible = () => [0, 1, 2].map(i => REVIEWS[(current + i) % total])

  return (
    <section className="py-16 px-8" style={{ backgroundColor: "#f7fbf7", borderTop: "1px solid #e5e7eb" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-10"
          style={{ transition: "opacity 0.6s ease, transform 0.6s ease", opacity: headerVisible ? 1 : 0, transform: headerVisible ? "translateY(0)" : "translateY(20px)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#2E8B34" }}>Customer Reviews</p>
          <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Georgia, serif" }}>What Our Customers Say</h2>
          <p className="text-gray-400 text-sm">Real feedback from real customers.</p>
          <div className="mt-4 w-12 h-0.5 mx-auto" style={{ backgroundColor: "#2E8B34" }} />
        </div>

        {/* Carousel */}
        <div
          ref={cardsRef}
          style={{ transition: "opacity 0.6s ease, transform 0.6s ease", opacity: cardsVisible ? 1 : 0, transform: cardsVisible ? "translateY(0)" : "translateY(24px)" }}
        >
          <div className="flex items-stretch gap-4">
            {/* Left arrow */}
            <button
              onClick={prev}
              className="flex-shrink-0 w-10 h-10 self-center bg-white flex items-center justify-center transition-all duration-200 hover:shadow-md"
              style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Cards */}
            <div className="grid grid-cols-3 gap-4 flex-1">
              {getVisible().map((review, i) => (
                <ReviewCard key={`${review.id}-${i}`} review={review} color={AVATAR_COLORS[REVIEWS.indexOf(review) % AVATAR_COLORS.length]} />
              ))}
            </div>

            {/* Right arrow */}
            <button
              onClick={next}
              className="flex-shrink-0 w-10 h-10 self-center bg-white flex items-center justify-center transition-all duration-200 hover:shadow-md"
              style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-5">
            {REVIEWS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className="w-2 h-2 rounded-full transition-all duration-200"
                style={{ backgroundColor: i === current ? "#2E8B34" : "#d1fae5" }} />
            ))}
          </div>
        </div>

        {/* Video section */}
        <div
          ref={videoRef}
          className="mt-12"
          style={{ transition: "opacity 0.7s ease, transform 0.7s ease", opacity: videoVisible ? 1 : 0, transform: videoVisible ? "translateY(0)" : "translateY(28px)" }}
        >
          <div className="bg-white p-6 flex flex-col md:flex-row gap-8 items-center" style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#2E8B34" }}>See It For Yourself</p>
              <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: "Georgia, serif" }}>A Tour of Our Pampanga Branch</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Watch how our team carefully crafts each arrangement with fresh flowers, dedication, and love — right from our Pampanga store.
              </p>
              <a
                href="https://www.facebook.com/watch/?v=612504224857086&rdid=mjiAAoOFQEC5qu4n"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 text-white transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: "#1877F2", borderRadius: "6px" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
                Watch on Facebook
              </a>
            </div>
            <div className="flex-1 w-full relative overflow-hidden" style={{ borderRadius: "8px", aspectRatio: "16/9", minWidth: 0 }}>
              <iframe
                src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D612504224857086&show_text=false&width=560"
                className="w-full h-full"
                style={{ border: "none", borderRadius: "8px" }}
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
