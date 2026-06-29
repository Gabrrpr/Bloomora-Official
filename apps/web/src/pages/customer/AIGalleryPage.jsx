import { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "../../context/ThemeContext"

import c1  from "../../assets/customized/customized1.webp"
import c2  from "../../assets/customized/customized2.webp"
import c3  from "../../assets/customized/customized3.webp"
import c4  from "../../assets/customized/customized4.webp"
import c5  from "../../assets/customized/customized5.webp"
import c6  from "../../assets/customized/customized6.webp"
import c7  from "../../assets/customized/customized7.webp"
import c8  from "../../assets/customized/customized8.webp"
import c9  from "../../assets/customized/customized9.webp"
import c10 from "../../assets/customized/customized10.webp"

const ARRANGEMENTS = [
  { id:1,  src:c1,  title:"Ivory Serenity",   mood:"Graceful",    palette:["#f5f1e6","#a3b18a","#dde3d2"], prompt:"Elegant ivory white tulips with fresh eucalyptus in a clean, minimalist bouquet, creating a timeless and graceful arrangement." },
  { id:2,  src:c2,  title:"Crimson Devotion", mood:"Romantic",    palette:["#991b1b","#e7d3b3","#f6c9d4"], prompt:"Rich red roses wrapped in kraft paper with a blush ribbon, forming a romantic bouquet full of warmth and affection." },
  { id:3,  src:c3,  title:"Blush Reverie",    mood:"Gentle",      palette:["#f4c2cc","#ffffff","#c2cbb5"], prompt:"Soft blush roses paired with delicate white baby's breath in a light, airy bouquet meant for a gentle and heartfelt gesture." },
  { id:4,  src:c4,  title:"Golden Radiance",  mood:"Cheerful",    palette:["#f5c518","#7a4a26","#14532d"], prompt:"Bright sunflowers gathered with lush greenery and wrapped simply, creating a cheerful bouquet bursting with sunshine." },
  { id:5,  src:c5,  title:"Cotton Candy Bloom", mood:"Sweet",     palette:["#f6a8c0","#f3e8d3","#fdf7f0"], prompt:"Pink and cream roses arranged into a lush, rounded bouquet with a sweet and elegant romantic charm." },
  { id:6,  src:c6,  title:"Ivory Elegance",   mood:"Refined",     palette:["#ffffff","#f3eee0","#a3b18a"], prompt:"Classic white roses accented with eucalyptus and wrapped naturally for a refined and sophisticated floral arrangement." },
  { id:7,  src:c7,  title:"Pearl Bloom Box",  mood:"Modern",      palette:["#ffffff","#f4c2cc","#a3b18a"], prompt:"Luxurious white roses nestled inside a soft pink hat box with fresh greenery, offering a modern and elegant floral presentation." },
  { id:8,  src:c8,  title:"Moonlit Garden",   mood:"Timeless",    palette:["#f8fbf7","#bcd4c0","#3f8a5b"], prompt:"A full dome of creamy white roses with eucalyptus displayed in a clear glass vase for a fresh and timeless centerpiece." },
  { id:9,  src:c9,  title:"Pure Embrace",     mood:"Elegant",     palette:["#ffffff","#dfeadd","#9bb89f"], prompt:"Pristine white roses wrapped in crisp white paper with subtle greenery, creating a clean and elegant bouquet for any occasion." },
  { id:10, src:c10, title:"Snow Whisper",     mood:"Serene",      palette:["#ffffff","#dde3d2","#a3b18a"], prompt:"Fresh white roses with delicate eucalyptus wrapped in translucent white paper, forming a simple and graceful bouquet with a serene aesthetic." },
]

const N   = ARRANGEMENTS.length
const mod = (a, b) => ((a % b) + b) % b
const G   = "#2E8B34"
const DG  = "#0C573E"
const NAVBAR_H = 104

export default function AIGalleryPage({ onNavigate }) {
  const { isDark } = useTheme()
  const [center,  setCenter]  = useState(0)
  const [visible, setVisible] = useState(false)
  const touchX = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const navigate = useCallback((dir) => {
    setCenter(p => mod(p + (dir === "right" ? 1 : -1), N))
  }, [])

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") navigate("right")
      if (e.key === "ArrowLeft")  navigate("left")
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [navigate])

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return
    const d = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(d) > 44) navigate(d > 0 ? "right" : "left")
    touchX.current = null
  }

  const active = ARRANGEMENTS[center]

  // ── Typewriter loop for the title: type → pause → delete → retype ───────────
  const [typed, setTyped] = useState("")
  useEffect(() => {
    const full = active.title
    let i = 0
    let deleting = false
    let timer
    const tick = () => {
      if (!deleting) {
        i++
        setTyped(full.slice(0, i))
        if (i >= full.length) { deleting = true; timer = setTimeout(tick, 1500); return }
        timer = setTimeout(tick, 80)
      } else {
        i--
        setTyped(full.slice(0, i))
        if (i <= 0) { deleting = false; timer = setTimeout(tick, 450); return }
        timer = setTimeout(tick, 40)
      }
    }
    setTyped("")
    timer = setTimeout(tick, 150)
    return () => clearTimeout(timer)
  }, [active.title])

  // ── Dark mode color tokens ─────────────────────────────────────────────────
  const bg         = isDark ? "#111827" : "#fff"
  const contentBg  = isDark ? "#111827" : "white"
  const accentG    = isDark ? "#4ade80" : G
  const headingC   = isDark ? "#f3f4f6" : "#111827"
  const bodyC      = isDark ? "#9ca3af" : "#6b7280"
  const promptC    = isDark ? "#d1d5db" : "#374151"
  const promptLbl  = isDark ? "#6b7280" : "#9ca3af"
  const promptBdr  = isDark ? "rgba(74,222,128,0.28)" : `${G}40`
  const decorNum   = isDark ? "rgba(74,222,128,0.05)" : "rgba(46,139,52,0.04)"
  const thumbBdr   = isDark ? "#2d3748" : "#e5e7eb"
  const counterC   = isDark ? "#6b7280" : "#9ca3af"
  const mobTopBdr  = isDark ? "#2d3748" : "#f0ede6"
  const backBg     = isDark ? "rgba(17,24,39,0.9)"   : "rgba(255,255,255,0.88)"
  const backC      = isDark ? "#d1d5db"               : "#374151"
  const backBdr    = isDark ? "#374151"               : "#e5e7eb"
  const arrowBdr   = isDark ? "rgba(74,222,128,0.25)" : "rgba(46,139,52,0.25)"
  const arrowBg    = isDark ? "rgba(74,222,128,0.10)" : "rgba(46,139,52,0.10)"
  const arrowHov   = isDark ? "rgba(74,222,128,0.22)" : "rgba(46,139,52,0.18)"
  const arrowC     = isDark ? "#4ade80"               : DG

  return (
    <>
      <style>{`
        @keyframes agFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ag-root {
          position: fixed; top: ${NAVBAR_H}px; left: 0; right: 0; bottom: 0;
          display: flex; flex-direction: row; overflow: hidden;
          background: ${bg}; z-index: 10;
          animation: agFadeIn 0.6s ease both;
        }
        .ag-image-panel {
          width: 55%; position: relative; overflow: hidden;
          background: ${bg}; flex-shrink: 0;
        }
        .ag-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: contain; object-position: center center;
          opacity: 0; transition: opacity 0.75s cubic-bezier(0.4,0,0.2,1); will-change: opacity;
        }
        .ag-img.active { opacity: 1; }
        .ag-content-panel {
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          padding: 36px 48px 36px 40px; overflow: hidden;
          background: ${contentBg}; position: relative;
        }
        .ag-thumb  { transition: all 0.18s ease; }
        .ag-thumb:hover  { opacity: 1 !important; transform: scale(1.07); }
        .ag-arrow  { transition: all 0.18s ease; }
        .ag-arrow:hover  { background: ${arrowHov} !important; }
        .ag-back  { transition: all 0.18s ease; }
        .ag-back:hover  { transform: translateX(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.14); }
        .ag-cta { transition: all 0.2s ease; }
        .ag-cta:hover { opacity: 0.88; transform: translateY(-1px); }
        @keyframes agCaretBlink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        .ag-caret {
          display: inline-block; width: 2px; height: 0.95em; margin-left: 3px;
          background: currentColor; vertical-align: -0.08em; border-radius: 1px;
          animation: agCaretBlink 0.9s steps(1) infinite;
        }

        @media (max-width: 768px) {
          .ag-root { position: static; height: auto; min-height: calc(100svh - ${NAVBAR_H}px); flex-direction: column; overflow: visible; }
          .ag-image-panel { width: 100%; height: 75vw; min-height: 260px; max-height: 420px; flex-shrink: 0; }
          .ag-img { object-fit: contain; }
          .ag-content-panel { flex: unset; padding: 22px 20px 32px; border-left: none; border-top: 1px solid ${mobTopBdr}; overflow: visible; justify-content: flex-start; }
        }
        @media (max-width: 480px) {
          .ag-image-panel { height: 80vw; min-height: 220px; }
          .ag-content-panel { padding: 18px 16px 28px; }
        }
        @media (max-height: 500px) and (orientation: landscape) {
          .ag-root { position: fixed; top: ${NAVBAR_H}px; left: 0; right: 0; bottom: 0; flex-direction: row; overflow: hidden; height: auto; min-height: unset; }
          .ag-image-panel { width: 50%; height: 100%; max-height: unset; min-height: unset; }
          .ag-content-panel { flex: 1; padding: 12px 20px 12px 16px; overflow-y: auto; justify-content: flex-start; border-left: none; border-top: none; }
          .ag-content-panel h1 { font-size: clamp(16px,3vw,22px) !important; margin-bottom: 6px !important; }
          .ag-content-panel p  { font-size: 11px !important; margin-bottom: 10px !important; }
        }
      `}</style>

      <div className="ag-root">

        {/* IMAGE PANEL */}
        <div className="ag-image-panel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {ARRANGEMENTS.map((arr, i) => (
            <img key={arr.id} src={arr.src} alt={arr.title} className={`ag-img${i===center?" active":""}`}/>
          ))}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.52) 0%,transparent 42%)", pointerEvents:"none", zIndex:2 }}/>

          {/* Back */}
          <button onClick={() => onNavigate?.("home")} className="ag-back"
            style={{ position:"absolute", top:16, left:16, zIndex:20, display:"inline-flex", alignItems:"center", gap:6, color:backC, background:backBg, backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", border:`1px solid ${backBdr}`, borderRadius:50, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>

          {/* Prev / Next */}
          {[{dir:"left",d:"M15 19l-7-7 7-7"},{dir:"right",d:"M9 5l7 7-7 7"}].map(({dir,d}) => (
            <button key={dir} onClick={() => navigate(dir)} className="ag-arrow"
              style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", zIndex:20, [dir==="left"?"left":"right"]:14, width:38, height:38, borderRadius:"50%", border:`1.5px solid ${arrowBdr}`, background:arrowBg, backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:arrowC }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/></svg>
            </button>
          ))}

          {/* Title overlay */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"18px 24px", zIndex:10 }}>
            <div style={{ display:"flex", gap:6, marginBottom:5 }}>
              {active.palette.map((c,i) => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:c, boxShadow:"0 0 0 1.5px rgba(255,255,255,0.4)" }}/>)}
            </div>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:3, fontFamily:"inherit" }}>{active.mood} · AI-Generated</p>
            <h3 style={{ color:"white", fontSize:"clamp(18px,2vw,26px)", fontWeight:800, lineHeight:1.15, margin:0, minHeight:"1.15em", textShadow:"0 2px 10px rgba(0,0,0,0.45)", fontFamily:"inherit" }}>{typed}<span className="ag-caret"/></h3>
          </div>
        </div>

        {/* CONTENT PANEL */}
        <div className="ag-content-panel">
          <div style={{ position:"absolute", bottom:-16, right:-6, fontSize:150, fontWeight:900, lineHeight:1, color:decorNum, userSelect:"none", pointerEvents:"none", letterSpacing:"-0.05em", fontFamily:"inherit" }}>
            {String(center+1).padStart(2,"0")}
          </div>

          <div style={{ position:"relative", zIndex:1, opacity:visible?1:0, transition:"opacity 0.4s ease" }}>

            {/* Tagline */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:22, height:1.5, background:accentG }}/>
              <span style={{ color:accentG, fontSize:10, fontWeight:800, letterSpacing:"0.26em", textTransform:"uppercase", fontFamily:"inherit" }}>AI-Crafted Arrangements</span>
            </div>

            {/* Heading */}
            <h1 style={{ color:headingC, fontSize:"clamp(26px,2.6vw,42px)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em", margin:"0 0 10px", fontFamily:"inherit" }}>
              Your Vision,<br/>
              <span style={{ color:accentG }}>Brought to Bloom</span>
            </h1>

            {/* Body */}
            <p style={{ color:bodyC, fontSize:"clamp(13px,1vw,14px)", lineHeight:1.7, maxWidth:560, margin:"0 0 18px", fontFamily:"inherit" }}>
              Tell us what you have in mind and our AI puts together a unique arrangement just for you. Every piece is one of a kind and made fresh for the occasion.
            </p>

            {/* Prompt */}
            <div style={{ borderLeft:`2px solid ${promptBdr}`, paddingLeft:14, marginBottom:22 }}>
              <p style={{ color:promptLbl, fontSize:9, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:4, fontFamily:"inherit" }}>Try prompting:</p>
              <p style={{ color:promptC, fontSize:"clamp(11.5px,0.9vw,13px)", lineHeight:1.7, fontStyle:"italic", margin:0, fontFamily:"inherit" }}>"{active.prompt}"</p>
            </div>

            {/* Thumbnails */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:26 }}>
              {ARRANGEMENTS.map((arr,i) => (
                <button key={arr.id} onClick={() => setCenter(i)} className="ag-thumb" title={arr.title}
                  style={{ width:40, height:40, borderRadius:7, overflow:"hidden", padding:0, cursor:"pointer", flexShrink:0, border:`2px solid ${i===center?accentG:thumbBdr}`, opacity:i===center?1:0.55 }}>
                  <img src={arr.src} alt={arr.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                </button>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <button onClick={() => onNavigate?.("make-it-personal")} className="ag-cta"
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:50, background:G, color:"white", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 6px 18px rgba(46,139,52,0.28)", fontFamily:"inherit" }}>
                Try It Now
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
              <span style={{ color:counterC, fontSize:11, fontWeight:600, letterSpacing:"0.08em", fontFamily:"inherit" }}>
                {String(center+1).padStart(2,"0")} / {String(N).padStart(2,"0")}
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}