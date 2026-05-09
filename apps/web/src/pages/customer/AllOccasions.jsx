import { useTheme } from "../../context/ThemeContext"
import pageBg5      from "../../assets/PageBG5.webp"
import Footer       from "../../components/Footer"

import birthdayImg    from "../../assets/Birthday.png"
import anniversaryImg from "../../assets/Anniversary.png"
import weddingImg     from "../../assets/Wedding.png"
import graduationImg  from "../../assets/Graduation.png"
import sympathyImg    from "../../assets/Sympathy.png"
import justBecauseImg from "../../assets/JustBecause.png"
import openingsImg    from "../../assets/Openings.png"

const G  = "#2E8B34"
const DG = "#0C573E"

const OCCASIONS = [
  { label:"Birthday",    img:birthdayImg,    desc:"Make their day unforgettable with bright, cheerful arrangements that bring the celebration to life." },
  { label:"Anniversary", img:anniversaryImg, desc:"Say it with flowers. Whether it's your first year together or your fiftieth, we'll help you mark the moment." },
  { label:"Graduation",  img:graduationImg,  desc:"All those late nights finally paid off. Celebrate their milestone with something as bright as their future." },
  { label:"Sympathy",    img:sympathyImg,    desc:"When words fall short, flowers offer quiet comfort. Let us help you show up for someone who needs it." },
  { label:"Openings",    img:openingsImg,    desc:"Welcome a new chapter with vibrant arrangements that set the perfect tone for what's ahead." },
  { label:"Just Because",img:justBecauseImg, desc:"You don't need a reason to make someone smile. Sometimes the best gift is the one no one saw coming." },
  { label:"Wedding",     img:weddingImg,     desc:"From bouquets to centerpieces, we bring your floral vision to life on your most important day." },
]

export default function AllOccasions({ onNavigate }) {
  const { isDark } = useTheme()

  const pageBg     = isDark ? "#111827" : "white"
  const accentG    = isDark ? "#4ade80" : G
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdrDef = isDark ? "#2d3748" : "#e5f0e6"
  const cardBdrHov = isDark ? "#4ade80" : G
  const imgBdr     = isDark ? "#4ade80" : G
  const imgShadow  = isDark ? "0 4px 16px rgba(74,222,128,0.15)" : "0 4px 16px rgba(46,139,52,0.13)"
  const labelC     = isDark ? "#e5e7eb" : "#111827"
  const descC      = isDark ? "#9ca3af" : "#6b7280"

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight:"280px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0"
          style={{ background:"linear-gradient(to right,rgba(12,87,62,0.92) 0%,rgba(12,87,62,0.72) 55%,rgba(12,87,62,0.38) 100%)" }}/>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:"#86efac" }}>Shop by Occasion</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">All Occasions</h1>
          <p className="text-base max-w-xl" style={{ color:"rgba(255,255,255,0.78)" }}>
            Whatever the moment calls for, we have the right arrangement for it. Find flowers that say exactly what you feel.
          </p>
        </div>
      </div>

      {/* Occasions grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {OCCASIONS.map(occ => (
            <div
              key={occ.label}
              className="group flex flex-col items-center text-center rounded-2xl border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 overflow-hidden pb-6"
              style={{ backgroundColor: cardBg, borderColor: cardBdrDef }}
              onMouseEnter={e => e.currentTarget.style.borderColor = cardBdrHov}
              onMouseLeave={e => e.currentTarget.style.borderColor = cardBdrDef}
            >
              {/* Circular image */}
              <div className="mt-7 mb-4 flex-shrink-0">
                <div
                  className="overflow-hidden rounded-full transition-all duration-300 group-hover:scale-105"
                  style={{ width:"190px", height:"190px", border:`2px solid ${imgBdr}`, boxShadow: imgShadow }}
                >
                  <img src={occ.img} alt={occ.label} className="w-full h-full object-cover"/>
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col items-center gap-2 px-6">
                <p className="text-base font-bold" style={{ color: labelC }}>{occ.label}</p>
                <p className="text-sm leading-relaxed" style={{ color: descC }}>{occ.desc}</p>
              </div>

              {/* Shop Now */}
              <button
                onClick={() => onNavigate?.("shop")}
                className="mt-5 px-7 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ backgroundColor: G }}
              >
                Shop Now
              </button>
            </div>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>
    </div>
  )
}
