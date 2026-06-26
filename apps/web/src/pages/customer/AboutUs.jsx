import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import pageBg5    from "../../assets/PageBG5.webp"
import aboutImg1  from "../../assets/AboutUsImg1.webp"
import aboutImg2  from "../../assets/AboutUsImg2.webp"
import Footer     from "../../components/Footer"

const G  = "#2E8B34"
const DG = "#0C573E"

const STATS = [
  { num:"67",     label:"Years in Business",
    icon:<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg> },
  { num:"50K+",   label:"Customers Served",
    icon:<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg> },
  { num:"2",      label:"Branch Locations",
    icon:<svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg> },
  { num:"1,000+", label:"Arrangements / Month",
    icon:<svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M18.7 12.4c-.28-.16-.57-.29-.86-.4.29-.11.58-.24.86-.4 1.92-1.11 2.99-3.12 3-5.19-1.79-1.03-4.07-1.11-5.99 0-.28.16-.54.35-.78.54.05-.31.08-.63.08-.95 0-2.22-1.21-4.15-3-5.19C10.21 1.85 9 3.78 9 6c0 .32.03.64.08.95-.24-.2-.49-.39-.78-.55-1.92-1.11-4.2-1.03-5.99 0 0 2.07 1.07 4.08 2.99 5.19.28.16.57.29.86.4-.29.11-.58.24-.86.4C3.39 13.9 2.32 15.91 2.31 17.98c1.79 1.03 4.07 1.11 5.99 0 .28-.16.54-.35.78-.54-.05.31-.08.63-.08.95 0 2.22 1.21 4.15 3 5.19 1.79-1.04 3-2.97 3-5.19 0-.32-.03-.64-.08-.95.24.2.49.39.78.55 1.92 1.11 4.2 1.03 5.99 0-.01-2.07-1.08-4.08-3-5.19zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg> },
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
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const prevSlide = () => setSlideIdx(i => (i-1+STORY_SLIDES.length)%STORY_SLIDES.length)
  const nextSlide = () => setSlideIdx(i => (i+1)%STORY_SLIDES.length)

  // Close the enlarged image with the Escape key.
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = e => { if (e.key === "Escape") setLightboxOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxOpen])

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
      <style>{`
        @keyframes pageRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes lbFade{from{opacity:0}to{opacity:1}}
        @keyframes lbZoom{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Hero - image-based, always looks good */}
      <div className="relative overflow-hidden max-w-[1600px] mx-auto" style={{ minHeight:"280px", animation:"pageRise 0.6s ease 0.05s both" }}>
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
      <div style={{ borderBottom:`1px solid ${statsBdr}`, animation:"pageRise 0.6s ease 0.16s both" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-10 py-8 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {STATS.map(({ num, label, icon }) => (
              <div key={label}
                className="rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center transition-all duration-200"
                style={{ backgroundColor: cardBg, border:`1px solid ${cardBdr}` }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow = isDark ? "0 14px 30px rgba(0,0,0,0.45)" : "0 14px 30px rgba(46,139,52,0.12)"; e.currentTarget.style.borderColor = accentG }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor = cardBdr }}>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-3 p-2.5"
                  style={{ backgroundColor: iconBg, color: iconColor }}>
                  {icon}
                </div>
                <p className="text-2xl sm:text-4xl font-extrabold leading-none mb-1.5" style={{ color: accentG }}>{num}</p>
                <p className="text-[11px] sm:text-sm font-medium leading-tight" style={{ color: labelColor }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story section */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-20" style={{ animation:"pageRise 0.6s ease 0.27s both" }}>
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
              <p>Today, the business is being carried forward by the children of the original owners, continuing what was built with love and consistency through the years. Every arrangement is still made by our team with the same attention and care we've always had: fresh flowers, honest craftsmanship, and service people can rely on.</p>
            </div>
          </div>

          {/* Image carousel */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm"
              style={{ border:`1px solid ${imgBdr}` }}>
              <img src={STORY_SLIDES[slideIdx].img} alt={STORY_SLIDES[slideIdx].label}
                onClick={() => setLightboxOpen(true)}
                title="Click to enlarge"
                className="w-full h-full object-cover transition-opacity duration-500 cursor-zoom-in"/>
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
      <div style={{ backgroundColor: valuesBg, animation:"pageRise 0.6s ease 0.38s both" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentG }}>What we stand for</p>
          <h2 className="text-2xl font-bold mb-10" style={{ color: headingC }}>Our values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ title, desc, icon }) => (
              <div key={title} className="rounded-xl p-5"
                style={{ backgroundColor: cardBg, border:`1px solid ${cardBdr}`, transition:"transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-6px)"; e.currentTarget.style.boxShadow = isDark ? "0 16px 34px rgba(0,0,0,0.5)" : "0 16px 34px rgba(46,139,52,0.16)"; e.currentTarget.style.borderColor = accentG }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor = cardBdr }}>
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

      {/* Enlarged image lightbox */}
      {lightboxOpen && (
        <div onClick={() => setLightboxOpen(false)}
          style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(16px,5vw,48px)", animation:"lbFade 0.25s ease" }}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxOpen(false) }} aria-label="Close"
            style={{ position:"absolute", top:"clamp(12px,3vw,24px)", right:"clamp(12px,3vw,24px)", width:"44px", height:"44px", borderRadius:"9999px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <figure onClick={e => e.stopPropagation()}
            style={{ margin:0, maxWidth:"min(900px,100%)", maxHeight:"100%", display:"flex", flexDirection:"column", alignItems:"center", animation:"lbZoom 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
            <img src={STORY_SLIDES[slideIdx].img} alt={STORY_SLIDES[slideIdx].label}
              style={{ maxWidth:"100%", maxHeight:"80vh", objectFit:"contain", borderRadius:"12px", boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}/>
            <figcaption style={{ marginTop:"14px", color:"rgba(255,255,255,0.85)", fontSize:"13px", fontStyle:"italic", textAlign:"center", maxWidth:"600px", lineHeight:1.5 }}>
              {STORY_SLIDES[slideIdx].label}
            </figcaption>
          </figure>
        </div>
      )}

      <Footer onNavigate={onNavigate}/>
    </div>
  )
}
