import pageBg5 from "../assets/PageBG5.png"
import Footer from "../components/Footer"

import birthdayImg    from "../assets/Birthday.png"
import anniversaryImg from "../assets/Anniversary.png"
import weddingImg     from "../assets/Wedding.png"
import graduationImg  from "../assets/Graduation.png"
import sympathyImg    from "../assets/Sympathy.png"
import justBecauseImg from "../assets/JustBecause.png"
import openingsImg    from "../assets/Openings.png"

const G  = "#2E8B34"
const DG = "#0C573E"

const OCCASIONS = [
  {
    label: "Birthday",
    img: birthdayImg,
    desc: "Birthdays only come once a year — make sure they feel it. From bright sunflowers to lush mixed arrangements, we help you send a little extra joy on their special day.",
  },
  {
    label: "Anniversary",
    img: anniversaryImg,
    desc: "Whether it's your first year or your fiftieth, flowers have a way of saying what words sometimes can't. Celebrate the love you've built with something truly beautiful.",
  },
  {
    label: "Graduation",
    img: graduationImg,
    desc: "All those late nights finally paid off. Help them mark this milestone with flowers that are as bright and promising as the future ahead of them.",
  },
  {
    label: "Sympathy",
    img: sympathyImg,
    desc: "In moments of loss, a thoughtful arrangement can offer quiet comfort. Let us help you show up for someone who needs to know they're not alone.",
  },
  {
    label: "Openings",
    img: openingsImg,
    desc: "A new chapter deserves a grand welcome. Send something that sets the tone — fresh, vibrant arrangements that say congratulations and good luck all at once.",
  },
  {
    label: "Just Because",
    img: justBecauseImg,
    desc: "You don't need a reason to make someone smile. Sometimes the most meaningful gesture is the one that comes out of nowhere — just because you were thinking of them.",
  },
  {
    label: "Wedding",
    img: weddingImg,
    desc: "Every detail matters on your wedding day. From ceremony centerpieces to bridal bouquets, we work with you to bring your floral vision to life.",
  },
]

export default function AllOccasions({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {OCCASIONS.map((occ) => (
            <button
              key={occ.label}
              onClick={() => onNavigate?.("shop")}
              className="group flex flex-col text-left rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
              style={{ borderColor: "#e9f5ea", backgroundColor: "white" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e9f5ea"; }}
            >
              {/* Photo */}
              <div className="w-full overflow-hidden" style={{ height: "200px" }}>
                <img
                  src={occ.img}
                  alt={occ.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5 p-5">
                <p className="text-base font-bold text-gray-900">{occ.label}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{occ.desc}</p>
                <p className="text-xs font-semibold mt-2 transition-colors" style={{ color: G }}>
                  Shop {occ.label} Arrangements →
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}
