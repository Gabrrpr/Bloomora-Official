import { useEffect, useRef } from "react"
import birthdayImg from "../assets/Birthday.png"
import anniversaryImg from "../assets/Anniversary.png"
import weddingImg from "../assets/Wedding.png"
import graduationImg from "../assets/Graduation.png"
import sympathyImg from "../assets/Sympathy.png"
import justBecauseImg from "../assets/JustBecause.png"
import openingsImg from "../assets/Openings.png"

const G = "#2E8B34"

const ALL_OCCASIONS = [
  { label: "Birthday",    img: birthdayImg },
  { label: "Anniversary", img: anniversaryImg },
  { label: "Graduation",  img: graduationImg },
  { label: "Sympathy",    img: sympathyImg },
  { label: "Openings",    img: openingsImg },
  { label: "Wedding",     img: weddingImg,     hidden: true },
  { label: "Just Because",img: justBecauseImg, hidden: true },
]

const VISIBLE = ALL_OCCASIONS.filter(o => !o.hidden)

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

function OccasionCard({ label, img, onNavigate, delay }) {
  const ref = useRef(null)
  useReveal(ref, delay)
  return (
    <div ref={ref} style={{ opacity: 0, transform: "translateY(28px)", transition: "opacity 0.55s ease, transform 0.55s ease" }}>
      <button onClick={() => onNavigate?.("occasions")} className="group flex flex-col items-center gap-3 w-full focus:outline-none">
        <div
          className="w-full aspect-square rounded-full overflow-hidden border-[3px] transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
          style={{ borderColor: "transparent" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = G}
          onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
        >
          <img src={img} alt={label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        </div>
        <span className="text-sm font-semibold text-center leading-tight transition-colors duration-200 group-hover:text-green-700" style={{ color: "#374151" }}>
          {label}
        </span>
      </button>
    </div>
  )
}

export default function OccasionsStrip({ onNavigate }) {
  const headingRef = useRef(null)
  useReveal(headingRef, 0)

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto">

        {/* Centered heading — matches FeaturedProducts format */}
        <div
          ref={headingRef}
          className="text-center mb-10"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: G }}>Browse by Moment</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">What’s the Occasion?</h2>
          <p className="text-sm text-gray-500 mb-4">Whatever it is, we’ve got flowers for it.</p>
          <div className="mx-auto rounded-full" style={{ width: "48px", height: "3px", backgroundColor: G }} />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-10 mb-8">
          {VISIBLE.map(({ label, img }, i) => (
            <OccasionCard key={label} label={label} img={img} onNavigate={onNavigate} delay={i * 80} />
          ))}
        </div>

        {/* See all — centered */}
        <div className="text-center">
          <button
            onClick={() => onNavigate?.("occasions")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-green-800"
            style={{ color: G }}
          >
            See all occasions
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
