import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"

import MixAndMatchImg from "../assets/MixAndMatchImg.png"
import DescribeImg    from "../assets/DescribeImg.png"

import customized1 from "../assets/customized/customized1.webp"
import customized2 from "../assets/customized/customized2.webp"
import customized3 from "../assets/customized/customized3.webp"
import customized4 from "../assets/customized/customized4.webp"
import customized5 from "../assets/customized/customized5.webp"
import customized6 from "../assets/customized/customized6.webp"

const G  = "#2E8B34"
const DG = "#0C573E"

// Steps — no detail text, just label + icon
const MNM_STEPS = [
  { n:1, label:"Pick a size",           icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg> },
  { n:2, label:"Choose a style",        icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg> },
  { n:3, label:"Select your flowers",   icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
  { n:4, label:"Add finishing touches", icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg> },
]

const DESCRIBE_STEPS = [
  { label:"Write your description",    icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg> },
  { label:"Our AI builds the concept", icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> },
  { label:"Review and refine",         icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> },
  { label:"We handcraft and deliver",  icon:<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> },
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
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, visible]
}

export default function CustomizeSection({ onNavigate }) {
  const { isDark } = useTheme()
  const w = useWidth()
  const [promoRef, promoVisible]     = useScrollReveal(0.04)
  const [galleryRef, galleryVisible] = useScrollReveal(0.04)

  // Breakpoints
  // isDesk ≥ 900  → 4-col with side images
  // isMid  ≥ 600  → 2-col cards, no images (covers landscape mobile)
  // mobile < 600  → 1-col stacked
  const isDesk = w >= 900
  const isMid  = w >= 600

  const padH = isDesk ? 28 : isMid ? 20 : 16
  const padV = isDesk ? 64 : isMid ? 48 : 36

  // Gallery columns
  const galleryCols = isDesk ? 6 : isMid ? 4 : 3

  // Card grid
  const cardCols = isDesk ? "0.55fr 1fr 1fr 0.55fr" : isMid ? "1fr 1fr" : "1fr"

  // ── Color tokens ──────────────────────────────────────────────────────────
  const headingC  = isDark ? "#f3f4f6" : "#1f2937"
  const subC      = isDark ? "#9ca3af" : "#6b7280"
  const outerBg   = isDark ? "#0d1810"  : "#f5f0ea"
  const cardBg    = isDark ? "#1a2332"  : "#ffffff"
  const cardBdr   = isDark ? "#2a3a2d"  : "#e6ddd4"
  const stepRowBg = isDark ? "#141e16"  : "#f8f4ef"
  const stepRowBdr= isDark ? "#243028"  : "#ede5db"
  const iconBg    = isDark ? "rgba(46,139,52,0.18)" : "#e8f3e8"
  const iconBdr   = isDark ? "rgba(46,139,52,0.3)"  : "#c6dfc6"
  const numBg     = isDark ? "rgba(46,139,52,0.22)" : "#dff0df"
  const galleryBg = isDark ? "#111827"  : "#ffffff"
  const accentG   = isDark ? "#4ade80"  : G

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — Two Ways to Build
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor:outerBg }}>
        <div
          ref={promoRef}
          style={{
            maxWidth:1320, margin:"0 auto", padding:`${padV}px ${padH}px ${padV - 8}px`,
            opacity:promoVisible?1:0, transform:promoVisible?"none":"translateY(22px)",
            transition:"opacity 0.75s ease, transform 0.75s ease",
          }}
        >
          {/* Centered heading */}
          <div className="text-center mb-10">
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ height:1, width:28, background:G, opacity:0.5 }}/>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color:accentG }}>Make It Personal</p>
              <div style={{ height:1, width:28, background:G, opacity:0.5 }}/>
            </div>

            <h2 className="text-3xl font-bold mb-3" style={{ color:headingC }}>
              Two Ways to Build Your<br/>
              <span style={{ color:G }}>Perfect Arrangement</span>
            </h2>

            <p className="text-sm" style={{ color:subC }}>
              Create something beautiful, just the way you imagine it.
            </p>
          </div>

          {/* Main grid */}
          <div style={{ display:"grid", gridTemplateColumns:cardCols, gap:16, alignItems:"stretch" }}>

            {/* Left image — desktop only */}
            {isDesk && (
              <div style={{ borderRadius:16, overflow:"hidden", boxShadow:isDark?"0 8px 28px rgba(0,0,0,0.45)":"0 8px 28px rgba(0,0,0,0.1)", opacity:promoVisible?1:0, transform:promoVisible?"none":"translateX(-14px)", transition:"opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s" }}>
                <img src={MixAndMatchImg} alt="Mix and Match" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
              </div>
            )}

            {/* Mix and Match card */}
            <div style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, borderRadius:16, padding:`${isDesk?28:22}px ${isDesk?24:20}px 24px`, display:"flex", flexDirection:"column", boxShadow:isDark?"0 4px 20px rgba(0,0,0,0.3)":"0 4px 20px rgba(0,0,0,0.06)", opacity:promoVisible?1:0, transform:promoVisible?"none":"translateY(14px)", transition:"opacity 0.65s ease 0.18s, transform 0.65s ease 0.18s" }}>

              <div style={{ width:46, height:46, borderRadius:"50%", backgroundColor:iconBg, border:`1px solid ${iconBdr}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, color:G }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>

              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>Option 1</p>
              <h3 className="text-xl font-bold mb-2" style={{ color:headingC }}>Mix & Match</h3>
              <p className="text-sm mb-5" style={{ color:subC, lineHeight:1.6 }}>
                Pick every detail and create a bouquet that fits the moment perfectly.
              </p>

              {/* Steps — icon + label only, no detail text */}
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:20, flex:1 }}>
                {MNM_STEPS.map(step => (
                  <div key={step.n} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", backgroundColor:stepRowBg, borderRadius:9, border:`1px solid ${stepRowBdr}` }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", backgroundColor:numBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:"10px", fontWeight:700, color:G }}>{step.n}</span>
                    </div>
                    <div style={{ width:26, height:26, borderRadius:7, backgroundColor:iconBg, border:`1px solid ${iconBdr}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:G }}>
                      {step.icon}
                    </div>
                    <p className="text-sm font-semibold" style={{ color:headingC, margin:0 }}>{step.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate?.("mix-and-match")}
                className="w-full flex items-center justify-center gap-2 font-bold text-white transition-all"
                style={{ backgroundColor:DG, padding:"11px 18px", borderRadius:10, border:"none", cursor:"pointer", fontSize:"13px" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor=G; e.currentTarget.style.boxShadow="0 5px 16px rgba(46,139,52,0.3)" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor=DG; e.currentTarget.style.boxShadow="none" }}>
                Start Building
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>
            </div>

            {/* Describe card */}
            <div style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, borderRadius:16, padding:`${isDesk?28:22}px ${isDesk?24:20}px 24px`, display:"flex", flexDirection:"column", boxShadow:isDark?"0 4px 20px rgba(0,0,0,0.3)":"0 4px 20px rgba(0,0,0,0.06)", opacity:promoVisible?1:0, transform:promoVisible?"none":"translateY(14px)", transition:"opacity 0.65s ease 0.27s, transform 0.65s ease 0.27s" }}>

              <div style={{ width:46, height:46, borderRadius:"50%", backgroundColor:iconBg, border:`1px solid ${iconBdr}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, color:G }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </div>

              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>option 2</p>
              <h3 className="text-xl font-bold mb-2" style={{ color:headingC }}>Describe Your Arrangement</h3>
              <p className="text-sm mb-5" style={{ color:subC, lineHeight:1.6 }}>
                Have something in mind? Tell us and our AI will bring it to life.
              </p>

              {/* Steps — icon + label only, no detail text */}
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:20, flex:1 }}>
                {DESCRIBE_STEPS.map((step, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", backgroundColor:stepRowBg, borderRadius:9, border:`1px solid ${stepRowBdr}` }}>
                    <div style={{ width:26, height:26, borderRadius:7, backgroundColor:iconBg, border:`1px solid ${iconBdr}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:G }}>
                      {step.icon}
                    </div>
                    <p className="text-sm font-semibold" style={{ color:headingC, margin:0 }}>{step.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate?.("describe-arrangement")}
                className="w-full flex items-center justify-center gap-2 font-bold text-white transition-all"
                style={{ backgroundColor:DG, padding:"11px 18px", borderRadius:10, border:"none", cursor:"pointer", fontSize:"13px" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor=G; e.currentTarget.style.boxShadow="0 5px 16px rgba(46,139,52,0.3)" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor=DG; e.currentTarget.style.boxShadow="none" }}>
                Start Building
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>
            </div>

            {/* Right image — desktop only */}
            {isDesk && (
              <div style={{ borderRadius:16, overflow:"hidden", boxShadow:isDark?"0 8px 28px rgba(0,0,0,0.45)":"0 8px 28px rgba(0,0,0,0.1)", opacity:promoVisible?1:0, transform:promoVisible?"none":"translateX(14px)", transition:"opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s" }}>
                <img src={DescribeImg} alt="Describe arrangement" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
              </div>
            )}
          </div>

          {/* Bottom caption */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <svg width="13" height="13" fill="none" stroke={subC} viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span className="text-xs" style={{ color:subC }}>Made with care. Delivered with love.</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — AI Gallery
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor:galleryBg }}>
        <div
          ref={galleryRef}
          style={{
            maxWidth:1320, margin:"0 auto", padding:`${isDesk?48:36}px ${padH}px ${isDesk?60:44}px`,
            opacity:galleryVisible?1:0, transform:galleryVisible?"none":"translateY(20px)",
            transition:"opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:3, height:24, backgroundColor:G, borderRadius:2, flexShrink:0 }}/>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color:accentG }}>Created by Our Customers</p>
                <h3 className="text-xl font-bold" style={{ color:headingC }}>See What Others Have Made</h3>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.("ai-gallery")}
              className="text-xs font-semibold"
              style={{ color:accentG, background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}
              onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
              View All &rarr;
            </button>
          </div>

          {/* Responsive gallery grid */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${galleryCols},minmax(0,1fr))`, gap:10 }}>
            {AI_IMAGES.map((img, i) => (
              <div
                key={i}
                onClick={() => onNavigate?.("ai-gallery")}
                style={{ position:"relative", aspectRatio:"1/1", borderRadius:8, overflow:"hidden", cursor:"pointer", boxShadow:isDark?"0 3px 12px rgba(0,0,0,0.35)":"0 3px 12px rgba(0,0,0,0.07)", opacity:galleryVisible?1:0, transform:galleryVisible?"none":"translateY(14px)", transition:`opacity 0.5s ease ${i*55}ms, transform 0.5s ease ${i*55}ms, box-shadow 0.22s` }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow=isDark?"0 8px 22px rgba(0,0,0,0.5)":"0 8px 22px rgba(0,0,0,0.14)"; e.currentTarget.querySelector("img").style.transform="scale(1.08)"; e.currentTarget.querySelector(".tag-overlay").style.opacity="1" }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=isDark?"0 3px 12px rgba(0,0,0,0.35)":"0 3px 12px rgba(0,0,0,0.07)"; e.currentTarget.querySelector("img").style.transform="scale(1)"; e.currentTarget.querySelector(".tag-overlay").style.opacity="0" }}
              >
                <img src={img.src} alt={`AI arrangement ${i+1}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform 0.55s ease" }}/>
                <div className="tag-overlay" style={{ position:"absolute", inset:0, backgroundColor:"rgba(10,31,13,0.52)", display:"flex", alignItems:"flex-end", padding:9, opacity:0, transition:"opacity 0.22s" }}>
                  <span style={{ fontSize:"10px", fontWeight:700, color:"#fff", backgroundColor:"rgba(46,139,52,0.85)", borderRadius:5, padding:"2px 7px" }}>{img.tag}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mt-4" style={{ color:isDark?"#6b7280":"#8a9a8e" }}>
            Real arrangements built by our customers.{" "}
            <span className="font-semibold" style={{ color:accentG, cursor:"pointer" }} onClick={() => onNavigate?.("ai-gallery")}>
              View the full gallery
            </span>
          </p>
        </div>
      </section>
    </>
  )
}