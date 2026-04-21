import pageBg5 from "../assets/PageBG5.png"
import Footer from "../components/Footer"

const G  = "#2E8B34"
const DG = "#0C573E"

const OCCASIONS = [
  { icon: "🎂", label: "Birthdays",     desc: "Make their day unforgettable" },
  { icon: "💍", label: "Anniversaries", desc: "Celebrate love in full bloom" },
  { icon: "💒", label: "Weddings",      desc: "Flowers for your forever" },
  { icon: "🎓", label: "Graduations",   desc: "Congratulate in style" },
  { icon: "🕊️", label: "Sympathy",     desc: "Express care with flowers" },
  { icon: "🌸", label: "Just Because",  desc: "No reason needed" },
  { icon: "🏆", label: "Openings",      desc: "Grand entrances deserve grand blooms" },
  { icon: "💝", label: "Valentine's",   desc: "Say it with flowers" },
  { icon: "👩", label: "Mother's Day",  desc: "Honor the women who matter most" },
]

export default function AllOccasions({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero — same style as ContactUs / AboutUs */}
      <div className="relative overflow-hidden" style={{ minHeight: "280px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(12,87,62,0.92) 0%, rgba(12,87,62,0.72) 55%, rgba(12,87,62,0.38) 100%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#86efac" }}>Shop by Occasion</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">All Occasions</h1>
          <p className="text-base max-w-xl" style={{ color: "rgba(255,255,255,0.78)" }}>
            Whatever the moment calls for, we have the perfect arrangement. Browse by occasion and find flowers that say exactly what you feel.
          </p>
        </div>
      </div>

      {/* Occasions grid */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
          {OCCASIONS.map((occ) => (
            <button
              key={occ.label}
              onClick={() => onNavigate?.("shop")}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              style={{ borderColor: "#e9f5ea", backgroundColor: "white" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.backgroundColor = "#f8fffe"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e9f5ea"; e.currentTarget.style.backgroundColor = "white"; }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                style={{ backgroundColor: "#e6f4ea" }}>
                <span className="text-3xl">{occ.icon}</span>
              </div>
              <p className="text-base font-bold text-gray-800 mb-1">{occ.label}</p>
              <p className="text-sm text-gray-400">{occ.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}
