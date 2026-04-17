import birthdayImg from "../assets/Birthday.png"
import anniversaryImg from "../assets/Anniversary.png"
import weddingImg from "../assets/Wedding.png"
import graduationImg from "../assets/Graduation.png"
import sympathyImg from "../assets/Sympathy.png"
import justBecauseImg from "../assets/JustBecause.png"
import openingsImg from "../assets/Openings.png"

const G = "#2E8B34"
const DG = "#0C573E"

const OCCASIONS = [
  { label: "Birthday",    img: birthdayImg,     desc: "Make their birthday bloom with a fresh, cheerful arrangement." },
  { label: "Anniversary", img: anniversaryImg,   desc: "Celebrate love and milestones with something truly special." },
  { label: "Wedding",     img: weddingImg,       desc: "From bouquets to centerpieces, we make your day unforgettable." },
  { label: "Graduation",  img: graduationImg,    desc: "Honor their achievement with a beautiful floral gift." },
  { label: "Sympathy",    img: sympathyImg,      desc: "Express your condolences with thoughtful, graceful blooms." },
  { label: "Just Because",img: justBecauseImg,   desc: "No reason needed — sometimes flowers say it all." },
  { label: "Openings",    img: openingsImg,      desc: "Congratulate a new chapter with a grand floral display." },
]

export default function AllOccasions({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero strip */}
      <div style={{ backgroundColor: DG }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-14">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.65)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </button>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#86efac" }}>Shop by Occasion</p>
          <h1 className="text-4xl font-bold text-white mb-3">All Occasions</h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.65)" }}>
            Find the perfect arrangement for every moment, big or small.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {OCCASIONS.map(({ label, img, desc }) => (
            <button
              key={label}
              onClick={() => onNavigate("home")}
              className="group flex flex-col items-center text-center gap-4 focus:outline-none p-4 rounded-2xl transition-all duration-200 hover:bg-gray-50"
            >
              {/* Circular image — bigger on this page */}
              <div
                className="w-44 h-44 rounded-full overflow-hidden border-[3px] border-transparent transition-all duration-200 group-hover:shadow-xl group-hover:scale-105"
                style={{}}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
              >
                <img
                  src={img}
                  alt={label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-1 transition-colors duration-200 group-hover:text-green-700">{label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
              <span className="text-xs font-semibold px-4 py-1.5 rounded-full border transition-all duration-200 group-hover:text-white" style={{ borderColor: G, color: G }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = G; e.currentTarget.style.color = "white"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = G; }}
              >
                Shop {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
