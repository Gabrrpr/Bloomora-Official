import { useState, useEffect, useRef } from "react"
import photo1 from "../assets/TagEstings1.png"
import photo2 from "../assets/TagEstings2.png"
import photo3 from "../assets/TagEstings3.png"

const G = "#2E8B34"

const PHOTOS = [
  { id: 1, src: photo1, caption: "@buthmitch1227 via Instagram" },
  { id: 2, src: photo2, caption: "@viveycious via Instagram" },
  { id: 3, src: photo3, caption: "@viveycious via Instagram" },
]

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
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
}

export default function SocialFeed() {
  const [current, setCurrent] = useState(0)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  useReveal(leftRef, 0)
  useReveal(rightRef, 150)

  const prev = () => setCurrent(i => (i - 1 + PHOTOS.length) % PHOTOS.length)
  const next = () => setCurrent(i => (i + 1) % PHOTOS.length)

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* LEFT: image carousel */}
          <div
            ref={leftRef}
            className="w-full lg:w-1/2 flex-shrink-0"
            style={{ opacity: 0, transform: "translateY(32px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: "1/1" }}>
              {PHOTOS.map((p, i) => (
                <img
                  key={p.id}
                  src={p.src}
                  alt={p.caption}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                  style={{ opacity: i === current ? 1 : 0 }}
                />
              ))}

              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" }}>
                <p className="text-white text-sm font-medium">{PHOTOS[current].caption}</p>
              </div>

              {/* Arrows */}
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all" aria-label="Previous">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all" aria-label="Next">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              {/* Dots */}
              <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-2">
                {PHOTOS.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ backgroundColor: i === current ? "white" : "rgba(255,255,255,0.45)" }} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: text + buttons */}
          <div
            ref={rightRef}
            className="w-full lg:w-1/2"
            style={{ opacity: 0, transform: "translateY(32px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
          >
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: G }}>Moments We Love</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 leading-tight">
              Caught on Camera
            </h2>
            <div className="rounded-full mb-5" style={{ width: "48px", height: "3px", backgroundColor: G }} />
            <p className="text-sm text-gray-500 leading-relaxed mb-3 max-w-sm">
              We love seeing our flowers out in the world. Share your moment and let us see it too.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-sm">
              Follow us and tag <span className="font-semibold text-gray-700">@estingsflowershop</span> for a chance to be featured here.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://www.facebook.com/profile.php?id=100063877087893" target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "#1877F2" }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                Follow on Facebook
              </a>
              <a href="https://www.instagram.com/estingsflowershop/" target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
                style={{ background: "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                Follow on Instagram
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-5">Use <span className="font-semibold">#EstingsFlowers</span> to be featured</p>
          </div>
        </div>
      </div>
    </section>
  )
}
