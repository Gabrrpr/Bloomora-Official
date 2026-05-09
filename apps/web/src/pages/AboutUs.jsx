import { useState } from "react"
import { useTheme } from "../context/ThemeContext"
import pageBg5    from "../assets/PageBG5.png"
import aboutImg1  from "../assets/AboutUsImg1.png"
import aboutImg2  from "../assets/AboutUsImg2.png"
import Footer     from "../components/Footer"

const G  = "#2E8B34"
const DG = "#0C573E"

const STATS = [
  { num:"67",     label:"Years in Business" },
  { num:"50K+",   label:"Happy Customers" },
  { num:"2",      label:"Branch Locations" },
  { num:"1,000+", label:"Arrangements / Month" },
]

const VALUES = [
  {
    title:"Freshness First",
    desc:"We work closely with local growers and trusted suppliers to make sure our flowers are fresh and long-lasting.",
    icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>,
  },
  {
    title:"Personal Touch",
    desc:"Every arrangement is made by hand by our florists, with care and attention to every detail, whether it's a small order or something grand.",
    icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>,
  },
  {
    title:"Made with Care",
    desc:"Each order is prepared thoughtfully by our team to ensure it meets our standards before it reaches you.",
    icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>,
  },
  {
    title:"Community Love",
    desc:"Proudly Filipino, we continue to support local growers and give back in our own way.",
    icon:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>,
  },
]

const STORY_SLIDES = [
  { img:aboutImg1, label:"Look closely and you'll spot Esting's, long before color." },
  { img:aboutImg2, label:"Old Railroad Crossing, Fields Avenue, early 70s, Balibago, Angeles City." },
]

export default function AboutUs({ onNavigate }) {
  const { isDark } = useTheme()
  const [slideIdx, setSlideIdx] = useState(0)

  const prevSlide = () => setSlideIdx(i => (i-1+STORY_SLIDES.length)%STORY_SLIDES.length)
  const nextSlide = () => setSlideIdx(i => (i+1)%STORY_SLIDES.length)

  // ── color tokens ──────────────────────────────────────────────────────────
  const pageBg       = isDark ? "#111827" : "white"
  const statsBdr     = isDark ? "#2d3748" : "#e5e7eb"
  const statsDivide  = isDark ? "#2d3748" : "#e5e7eb"
  const numColor     = isDark ? "#f3f4f6" : "#1f2937"
  const labelColor   = isDark ? "#9ca3af" : "#6b7280"
  const headingC     = isDark ? "#f3f4f6" : "#1f2937"
  const bodyC        = isDark ? "#9ca3af" : "#6b7280"
  const accentG      = isDark ? "#4ade80" : G
  const imgBdr       = isDark ? "#2d3748" : "#e5e7eb"
  const captionC     = isDark ? "#6b7280" : "#9ca3af"
  const valuesBg     = isDark ? "#0f172a" : "#F7F8FA"
  const cardBg       = isDark ? "#1a2332" : "white"
  const cardBdr      = isDark ? "#2d3748" : "#e5e7eb"
  const cardTitleC   = isDark ? "#e5e7eb" : "#1f2937"
  const cardBodyC    = isDark ? "#9ca3af" : "#6b7280"
  const iconBg       = isDark ? "rgba(74,222,128,0.1)" : "#F0F7F1"
  const iconColor    = isDark ? "#4ade80" : G

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>

      {/* Hero — image-based, always looks good */}
      <div className="relative overflow-hidden" style={{ minHeight:"320px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0" style={{ background:"linear-gradient(to right,rgba(12,87,62,0.88) 0%,rgba(12,87,62,0.65) 60%,rgba(12,87,62,0.3) 100%)" }}/>
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:"#86efac" }}>About Esting's</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
              Where every bloom<br/>tells a story
            </h1>
            <p className="text-lg leading-relaxed" style={{ color:"rgba(255,255,255,0.8)" }}>
              We create floral arrangements that help you say what words sometimes can't. Simple, thoughtful, and made with care.
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ borderBottom:`1px solid ${statsBdr}` }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ borderBottom:"none" }}>
            {STATS.map(({ num, label }, i) => (
              <div key={label} className="py-8 px-6 text-center"
                style={{ borderRight: i<STATS.length-1 ? `1px solid ${statsDivide}` : "none" }}>
                <p className="text-3xl font-bold mb-1" style={{ color: numColor }}>{num}</p>
                <p className="text-sm" style={{ color: labelColor }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story section */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">

          {/* Text */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: accentG }}>Our Story</p>
            <h2 className="text-2xl font-bold mb-6 leading-tight" style={{ color: headingC }}>
              From a small flower shop to a name people trust
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: bodyC }}>
              <p>Esting's Flower International Inc. started in 1959 in San Fernando, Pampanga, with a simple goal of bringing fresh, meaningful flowers to life's everyday moments.</p>
              <p>Over the years, we were able to serve as concessionaires at the US bases in Clark and Subic, which helped us grow and reach more people. As the business expanded, we also had branches in Angeles and Dolores, along with San Fernando and Manila, each one carrying the same care and dedication that started in our very first shop.</p>
              <p>Today, the business is being carried forward by the children of the original owners, continuing what was built with love and consistency through the years. Every arrangement is still made by our team with the same attention and care we've always had — fresh flowers, honest craftsmanship, and service people can rely on.</p>
            </div>
          </div>

          {/* Image carousel */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm"
              style={{ border:`1px solid ${imgBdr}` }}>
              <img src={STORY_SLIDES[slideIdx].img} alt={STORY_SLIDES[slideIdx].label}
                className="w-full h-full object-cover transition-opacity duration-500"/>
              <button onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {STORY_SLIDES.map((_,i) => (
                  <button key={i} onClick={() => setSlideIdx(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ backgroundColor: i===slideIdx?"white":"rgba(255,255,255,0.45)" }}/>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-center italic leading-snug px-2" style={{ color: captionC }}>
              {STORY_SLIDES[slideIdx].label}
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={{ backgroundColor: valuesBg }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentG }}>What we stand for</p>
          <h2 className="text-2xl font-bold mb-10" style={{ color: headingC }}>Our values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ title, desc, icon }) => (
              <div key={title} className="rounded-xl p-5"
                style={{ backgroundColor: cardBg, border:`1px solid ${cardBdr}` }}>
                <div className="w-9 h-9 rounded-lg mb-4 flex items-center justify-center"
                  style={{ backgroundColor: iconBg, color: iconColor }}>
                  {icon}
                </div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: cardTitleC }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: cardBodyC }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>
    </div>
  )
}