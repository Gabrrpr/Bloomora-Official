import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"

import MixAndMatchImg    from "../assets/MixAndMatchImg.webp"
import DescribeImg       from "../assets/DescribeImg.webp"
import CustomizeSectionBG from "../assets/homepage/CustomizeSectionBG.webp"

import customized1 from "../assets/customized/customized1.webp"
import customized2 from "../assets/customized/customized2.webp"
import customized3 from "../assets/customized/customized3.webp"
import customized4 from "../assets/customized/customized4.webp"
import customized5 from "../assets/customized/customized5.webp"
import customized6 from "../assets/customized/customized6.webp"

const G  = "#2E8B34"
const DG = "#0C573E"

const MNM_STEPS = [
  { n:1, label:"Pick a size"           },
  { n:2, label:"Choose a style"        },
  { n:3, label:"Select your flowers"   },
  { n:4, label:"Add finishing touches" },
]

const DESCRIBE_STEPS = [
  { label:"Write your description",
    icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg> },
  { label:"Our AI builds the concept",
    icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> },
  { label:"Review and refine",
    icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> },
  { label:"We handcraft and deliver",
    icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> },
]

const AI_IMAGES = [
  { src:customized1, tag:"Mix and Match"        },
  { src:customized2, tag:"Describe Arrangement" },
  { src:customized3, tag:"Mix and Match"        },
  { src:customized4, tag:"Describe Arrangement" },
  { src:customized5, tag:"Mix and Match"        },
  { src:customized6, tag:"Describe Arrangement" },
]

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])
  return w
}

function useScrollReveal(threshold = 0.06) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

export default function CustomizeSection({ onNavigate }) {
  const { isDark } = useTheme()
  const w = useWidth()
  const [promoRef, promoVisible]     = useScrollReveal(0.04)
  const [galleryRef, galleryVisible] = useScrollReveal(0.04)

  const isDesk = w >= 900
  const isMid  = w >= 600

  const galleryCols = isDesk ? 6 : isMid ? 4 : 3

  // Card grid: images wider (0.75fr), cards narrower (1fr each)
  const cardCols = isDesk ? "0.75fr 1fr 1fr 0.75fr" : isMid ? "1fr 1fr" : "1fr"

  // Dynamic color tokens (depend on isDark JS var — must stay inline)
  const accentG    = isDark ? "#4ade80" : G
  const headingC   = isDark ? "#f0fdf4" : "#1f2937"
  const subC       = isDark ? "#94a3b8" : "#6b7280"
  const captionC   = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)"

  // Overlay — light veil on all sizes so the bg image stays clearly visible.
  const overlayColor = isDark ? "rgba(5,12,7,0.55)" : "rgba(255,255,255,0.5)"

  // Frosted card colors
  const cardBg     = isDark ? "rgba(15,25,18,0.88)" : "rgba(255,255,255,0.93)"
  const cardBdr    = isDark ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.8)"
  const cardShadow = isDark ? "0 0 0 1px rgba(74,222,128,0.12), 0 8px 32px rgba(0,0,0,0.5)" : "0 8px 40px rgba(0,0,0,0.12)"

  const stepRowBg  = isDark ? "rgba(74,222,128,0.06)" : "#f8f4ef"
  const stepRowBdr = isDark ? "rgba(74,222,128,0.12)" : "#ede5db"
  const iconBg     = isDark ? "rgba(74,222,128,0.14)" : "#e8f3e8"
  const iconBdr    = isDark ? "rgba(74,222,128,0.28)" : "#c6dfc6"
  const numBg      = isDark ? "rgba(74,222,128,0.2)"  : "#dff0df"
  const numColor   = isDark ? "#4ade80" : G
  const stepLabelC = isDark ? "#e2e8f0" : "#1f2937"
  const iconGlow   = isDark ? "0 0 14px rgba(74,222,128,0.2)" : "none"
  const numGlow    = isDark ? "0 0 8px rgba(74,222,128,0.2)"  : "none"
  const btnGlow    = isDark ? "0 0 18px rgba(74,222,128,0.2)" : "none"

  // Gallery (always clean — no BG image)
  const galleryBg   = isDark ? "#111827" : "#ffffff"
  const galleryHdrC = isDark ? "#f3f4f6" : "#1f2937"
  const gallerySubC = isDark ? "#9ca3af" : "#6b7280"
  const viewAllC    = isDark ? "#4ade80" : G
  const imgShadow   = isDark ? "0 3px 12px rgba(0,0,0,0.5)" : "0 3px 12px rgba(0,0,0,0.07)"
  const imgHovShdw  = isDark ? "0 8px 22px rgba(0,0,0,0.65)" : "0 8px 22px rgba(0,0,0,0.14)"

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — Two Ways to Build (BG image)
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* BG image */}
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage:`url(${CustomizeSectionBG})` }}/>
        {/* Overlay — user's values */}
        <div className="absolute inset-0 z-[1]" style={{ backgroundColor:overlayColor }}/>
        {/* Dark mode radial neon hint */}
        {isDark && (
          <div className="absolute inset-0 z-[1] pointer-events-none"
            style={{ background:"radial-gradient(ellipse at 50% 50%, rgba(74,222,128,0.03) 0%, transparent 65%)" }}/>
        )}

        <div
          ref={promoRef}
          className="relative z-[2] max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-7 transition-all duration-700"
          style={{
            paddingTop: isDesk?"64px":isMid?"48px":"36px",
            paddingBottom: isDesk?"56px":isMid?"40px":"28px",
            opacity:promoVisible?1:0, transform:promoVisible?"none":"translateY(22px)",
          }}
        >
          {/* Centered heading */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="h-px w-7" style={{ background:accentG, opacity:isDark?0.7:0.5 }}/>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color:accentG }}>Make It Personal</p>
              <div className="h-px w-7" style={{ background:accentG, opacity:isDark?0.7:0.5 }}/>
            </div>
            <h2 className="text-3xl font-bold mb-3" style={{ color:headingC }}>
              Two Ways to Build Your<br/>
              <span style={{ color:accentG }}>Perfect Arrangement</span>
            </h2>
            <p className="text-sm" style={{ color:subC }}>
              Create something beautiful, just the way you imagine it.
            </p>
          </div>

          {/* Main 4-col grid */}
          <div style={{ display:"grid", gridTemplateColumns:cardCols, gap:16, alignItems:"stretch" }}>

            {/* Left image — desktop only */}
            {isDesk && (
              <div className="rounded-2xl overflow-hidden transition-all duration-700"
                style={{ boxShadow:"0 8px 32px rgba(0,0,0,0.35)", opacity:promoVisible?1:0, transform:promoVisible?"none":"translateX(-14px)", transitionDelay:"0.1s" }}>
                <img src={MixAndMatchImg} alt="Mix and Match" className="w-full h-full object-cover block"/>
              </div>
            )}

            {/* Mix and Match card */}
            <div className="rounded-2xl flex flex-col transition-all duration-700"
              style={{ backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", backgroundColor:cardBg, border:`1px solid ${cardBdr}`, padding:isDesk?"28px 24px 24px":"22px 20px 24px", boxShadow:cardShadow, opacity:promoVisible?1:0, transform:promoVisible?"none":"translateY(14px)", transitionDelay:"0.18s" }}>

              {/* Top icon */}
              <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center mb-4 shrink-0"
                style={{ backgroundColor:iconBg, border:`1px solid ${iconBdr}`, color:numColor, boxShadow:iconGlow }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>

              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>Option 1</p>
              <h3 className="text-xl font-bold mb-2" style={{ color:headingC }}>Mix &amp; Match</h3>
              <p className="text-sm mb-5 leading-relaxed" style={{ color:subC }}>
                Pick every detail and create a bouquet that fits the moment perfectly.
              </p>

              {/* Steps — number + label, no icons */}
              <div className="flex flex-col gap-[7px] mb-5 flex-1">
                {MNM_STEPS.map(step => (
                  <div key={step.n} className="flex items-center gap-2.5 px-3 py-[10px] rounded-[9px]"
                    style={{ backgroundColor:stepRowBg, border:`1px solid ${stepRowBdr}` }}>
                    <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor:numBg, boxShadow:numGlow }}>
                      <span className="text-[11px] font-bold" style={{ color:numColor }}>{step.n}</span>
                    </div>
                    <p className="text-sm font-semibold m-0" style={{ color:stepLabelC }}>{step.label}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => onNavigate?.("mix-and-match")}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold text-[13px] py-[11px] rounded-[10px] border-none cursor-pointer transition-all duration-200"
                style={{ backgroundColor:DG, boxShadow:btnGlow }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor=G; e.currentTarget.style.boxShadow="0 5px 16px rgba(46,139,52,0.3)" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor=DG; e.currentTarget.style.boxShadow=btnGlow }}>
                Start Building
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </div>

            {/* Describe card */}
            <div className="rounded-2xl flex flex-col transition-all duration-700"
              style={{ backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", backgroundColor:cardBg, border:`1px solid ${cardBdr}`, padding:isDesk?"28px 24px 24px":"22px 20px 24px", boxShadow:cardShadow, opacity:promoVisible?1:0, transform:promoVisible?"none":"translateY(14px)", transitionDelay:"0.27s" }}>

              {/* Top icon */}
              <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center mb-4 shrink-0"
                style={{ backgroundColor:iconBg, border:`1px solid ${iconBdr}`, color:numColor, boxShadow:iconGlow }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </div>

              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>Option 2</p>
              <h3 className="text-xl font-bold mb-2" style={{ color:headingC }}>Describe Your Arrangement</h3>
              <p className="text-sm mb-5 leading-relaxed" style={{ color:subC }}>
                Have something in mind? Tell us and our AI will bring it to life.
              </p>

              <div className="flex flex-col gap-[7px] mb-5 flex-1">
                {DESCRIBE_STEPS.map((step,i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-[10px] rounded-[9px]"
                    style={{ backgroundColor:stepRowBg, border:`1px solid ${stepRowBdr}` }}>
                    <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor:iconBg, border:`1px solid ${iconBdr}`, color:numColor }}>
                      {step.icon}
                    </div>
                    <p className="text-sm font-semibold m-0" style={{ color:stepLabelC }}>{step.label}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => onNavigate?.("describe-arrangement")}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold text-[13px] py-[11px] rounded-[10px] border-none cursor-pointer transition-all duration-200"
                style={{ backgroundColor:DG, boxShadow:btnGlow }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor=G; e.currentTarget.style.boxShadow="0 5px 16px rgba(46,139,52,0.3)" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor=DG; e.currentTarget.style.boxShadow=btnGlow }}>
                Start Building
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </div>

            {/* Right image — desktop only */}
            {isDesk && (
              <div className="rounded-2xl overflow-hidden transition-all duration-700"
                style={{ boxShadow:"0 8px 32px rgba(0,0,0,0.35)", opacity:promoVisible?1:0, transform:promoVisible?"none":"translateX(14px)", transitionDelay:"0.35s" }}>
                <img src={DescribeImg} alt="Describe arrangement" className="w-full h-full object-cover block"/>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <svg width="13" height="13" fill="none" stroke={captionC} viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span className="text-xs" style={{ color:captionC }}>Made with care. Delivered with love.</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — AI Gallery (always white/dark-neutral)
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor:galleryBg }}>
        <div
          ref={galleryRef}
          className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-7 transition-all duration-700"
          style={{
            paddingTop: isDesk?"48px":"36px",
            paddingBottom: isDesk?"60px":"44px",
            opacity:galleryVisible?1:0, transform:galleryVisible?"none":"translateY(20px)",
          }}
        >
          {/* Header row */}
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-6 rounded-sm shrink-0" style={{ backgroundColor:G }}/>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color:isDark?"#4ade80":G }}>
                  Created by Our Customers
                </p>
                <h3 className="text-xl font-bold" style={{ color:galleryHdrC }}>See What Others Have Made</h3>
              </div>
            </div>
            <button className="text-xs font-semibold border-none cursor-pointer whitespace-nowrap bg-transparent"
              style={{ color:viewAllC }}
              onClick={() => onNavigate?.("ai-gallery")}
              onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
              View All &rarr;
            </button>
          </div>

          {/* Gallery grid */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${galleryCols},minmax(0,1fr))`, gap:10 }}>
            {AI_IMAGES.map((img,i) => (
              <div key={i} onClick={() => onNavigate?.("ai-gallery")}
                className="relative rounded-lg overflow-hidden cursor-pointer"
                style={{ aspectRatio:"1/1", boxShadow:imgShadow, opacity:galleryVisible?1:0, transform:galleryVisible?"none":"translateY(14px)", transition:`opacity 0.5s ease ${i*55}ms, transform 0.5s ease ${i*55}ms, box-shadow 0.22s` }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow=imgHovShdw; e.currentTarget.querySelector("img").style.transform="scale(1.08)"; e.currentTarget.querySelector(".tag-overlay").style.opacity="1" }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=imgShadow; e.currentTarget.querySelector("img").style.transform="scale(1)"; e.currentTarget.querySelector(".tag-overlay").style.opacity="0" }}>
                <img src={img.src} alt={`AI arrangement ${i+1}`} className="w-full h-full object-cover block" style={{ transition:"transform 0.55s ease" }}/>
                <div className="tag-overlay absolute inset-0 flex items-end p-[9px]"
                  style={{ backgroundColor:"rgba(10,31,13,0.52)", opacity:0, transition:"opacity 0.22s" }}>
                  <span className="text-[10px] font-bold text-white rounded-[5px] px-[7px] py-[2px]"
                    style={{ backgroundColor:"rgba(46,139,52,0.88)" }}>{img.tag}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mt-4" style={{ color:gallerySubC }}>
            Real arrangements built by our customers.{" "}
            <span className="font-semibold cursor-pointer" style={{ color:viewAllC }}
              onClick={() => onNavigate?.("ai-gallery")}>
              View the full gallery
            </span>
          </p>
        </div>
      </section>
    </>
  )
}