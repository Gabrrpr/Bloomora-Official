import { useTheme } from "../../context/ThemeContext"
import pageBg5      from "../../assets/PageBG5.webp"
import Footer       from "../../components/Footer"

import birthdayImg    from "../../assets/occasions/Birthday.webp"
import anniversaryImg from "../../assets/occasions/Anniversary.webp"
import weddingImg     from "../../assets/occasions/Wedding.webp"
import graduationImg  from "../../assets/occasions/Graduation.webp"
import sympathyImg    from "../../assets/occasions/Sympathy.webp"
import justBecauseImg from "../../assets/occasions/JustBecause.webp"
import openingsImg    from "../../assets/occasions/Openings.webp"
import getWellSoonImg from "../../assets/occasions/GetWellSoon.webp"

const G = "#2E8B34"
const DG = "#0C573E"

const OCCASIONS = [
  {
    label: "Birthday",
    img:   birthdayImg,
    desc:  "Make their day unforgettable with bright, cheerful arrangements that bring the celebration to life.",
  },
  {
    label: "Anniversary",
    img:   anniversaryImg,
    desc:  "Say it with flowers. Whether it's your first year together or your fiftieth, we'll help you mark the moment.",
  },
  {
    label: "Graduation",
    img:   graduationImg,
    desc:  "All those late nights finally paid off. Celebrate their milestone with something as bright as their future.",
  },
  {
    label: "Sympathy",
    img:   sympathyImg,
    desc:  "When words fall short, flowers offer quiet comfort. Let us help you show up for someone who needs it.",
  },
  {
    label: "Get Well Soon",
    img:   getWellSoonImg,
    desc:  "A little color goes a long way. Send something warm and cheerful to remind them they're loved and rooted for.",
  },
  {
    label: "Openings",
    img:   openingsImg,
    desc:  "Welcome a new chapter with vibrant arrangements that set the perfect tone for what's ahead.",
  },
  {
    label: "Just Because",
    img:   justBecauseImg,
    desc:  "You don't need a reason to make someone smile. Sometimes the best gift is the one no one saw coming.",
  },
  {
    label: "Wedding",
    img:   weddingImg,
    desc:  "From bouquets to centerpieces, we bring your floral vision to life on your most important day.",
  },
]

export default function AllOccasions({ onNavigate }) {
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-white"}`}>
      <style>{`@keyframes pageRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: "280px", animation:"pageRise 0.6s ease 0.05s both" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right,rgba(12,87,62,0.92) 0%,rgba(12,87,62,0.72) 55%,rgba(12,87,62,0.38) 100%)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-green-300">
            Shop by Occasion
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
            All Occasions
          </h1>
          <p className="text-base max-w-xl text-white/75">
            Whatever the moment calls for, we have the right arrangement for it. Find flowers that say exactly what you feel.
          </p>
        </div>
      </div>

      {/* Occasions grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {OCCASIONS.map((occ, i) => (
            <OccasionCard
              key={occ.label}
              occ={occ}
              isDark={isDark}
              onNavigate={onNavigate}
              idx={i}
            />
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}

function OccasionCard({ occ, isDark, onNavigate, idx = 0 }) {
  // 🚀 INTER-PAGE STATE DISPATCH ROUTER
  const handleOccasionClick = () => {
    localStorage.setItem("bloomora_active_occasion", occ.label);
    onNavigate?.("shop");
  };

  return (
    <div
      style={{ animation: `pageRise 0.5s ease ${0.16 + idx * 0.06}s both` }}
      className={`
        group flex flex-col items-center text-center rounded-2xl border
        transition-all duration-200 hover:shadow-xl hover:-translate-y-1
        overflow-hidden pb-6
        ${isDark
          ? "bg-[#1a2332] border-[#2d3748] hover:border-green-400"
          : "bg-white border-[#e5f0e6] hover:border-[#2E8B34]"}
      `}
    >
      {/* Circular image */}
      <div className="mt-7 mb-4 flex-shrink-0">
        <div
          className={`
            overflow-hidden rounded-full
            ${isDark
              ? "border-2 border-green-400 shadow-[0_4px_16px_rgba(74,222,128,0.15)]"
              : "border-2 border-[#2E8B34] shadow-[0_4px_16px_rgba(46,139,52,0.13)]"}
          `}
          style={{ width: "190px", height: "190px" }}
        >
          <img
            src={occ.img}
            alt={occ.label}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 px-6">
        <p className={`text-base font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
          {occ.label}
        </p>
        <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {occ.desc}
        </p>
      </div>

      {/* Shop Now */}
      <button
        onClick={handleOccasionClick}
        className="mt-5 px-7 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
      >
        Shop Now
      </button>
    </div>
  )
}