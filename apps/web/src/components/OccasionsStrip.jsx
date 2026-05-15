import { useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"
import birthdayImg    from "../assets/occasions/Birthday.png"
import anniversaryImg from "../assets/occasions/Anniversary.png"
import weddingImg     from "../assets/occasions/Wedding.png"
import graduationImg  from "../assets/occasions/Graduation.png"
import sympathyImg    from "../assets/occasions/Sympathy.png"
import justBecauseImg from "../assets/occasions/JustBecause.png"
import openingsImg    from "../assets/occasions/Openings.png"

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

function OccasionCard({ label, img, onNavigate, delay, isDark, labelColor, accentG }) {
  const ref = useRef(null)
  useReveal(ref, delay)

  return (
    <div ref={ref} style={{ opacity:0, transform:"translateY(28px)", transition:"opacity 0.55s ease, transform 0.55s ease" }}>
      <button
        onClick={() => onNavigate?.("occasions")}
        className="group flex flex-col items-center gap-3 w-full focus:outline-none"
      >
        <div
          className="w-full aspect-square rounded-full overflow-hidden border-[3px] transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
          style={{ borderColor:"transparent" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = accentG}
          onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
        >
          <img
            src={img}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-110"
            style={{ transition:"transform 0.4s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </div>
        <span
          className="text-sm font-semibold text-center leading-tight"
          style={{ color: labelColor, transition:"color 0.2s ease" }}
          onMouseEnter={e => e.currentTarget.style.color = accentG}
          onMouseLeave={e => e.currentTarget.style.color = labelColor}
        >
          {label}
        </span>
      </button>
    </div>
  )
}

export default function OccasionsStrip({ onNavigate }) {
  const { isDark } = useTheme()
  const headingRef  = useRef(null)
  useReveal(headingRef, 0)

  const accentG   = isDark ? "#4ade80" : G   // bright green for labels/text
  const sectionBg = isDark ? "#111827" : "white"
  const borderC   = isDark ? "#2d3748" : "#f3f4f6"
  const headingC  = isDark ? "#f3f4f6" : "#1f2937"
  const bodyC     = isDark ? "#9ca3af" : "#6b7280"
  const labelC    = isDark ? "#d1d5db" : "#374151"

  return (
    <section
      className="py-14 px-4 sm:px-6 lg:px-8 border-b"
      style={{ backgroundColor: sectionBg, borderColor: borderC }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div
          ref={headingRef}
          className="text-center mb-10"
          style={{ opacity:0, transform:"translateY(24px)", transition:"opacity 0.5s ease, transform 0.5s ease" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: accentG }}>
            Browse by Moment
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: headingC }}>
            What's the Occasion?
          </h2>
          <p className="text-sm mb-4" style={{ color: bodyC }}>
            Whatever it is, we've got flowers for it.
          </p>
          <div className="mx-auto rounded-full" style={{ width:"48px", height:"3px", backgroundColor: accentG }} />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-10 mb-8">
          {VISIBLE.map(({ label, img }, i) => (
            <OccasionCard
              key={label}
              label={label}
              img={img}
              onNavigate={onNavigate}
              delay={i * 80}
              isDark={isDark}
              labelColor={labelC}
              accentG={accentG}
            />
          ))}
        </div>

        {/* See all */}
        <div className="text-center">
          <button
            onClick={() => onNavigate?.("occasions")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: accentG }}
            onMouseEnter={e => e.currentTarget.style.color = isDark ? "#86efac" : "#15803d"}
            onMouseLeave={e => e.currentTarget.style.color = accentG}
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