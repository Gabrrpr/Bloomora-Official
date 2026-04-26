import { useState, useEffect, useCallback, useRef } from "react"
import Footer from "../components/Footer.jsx"

import c1  from "../assets/customized/customized1.png"
import c2  from "../assets/customized/customized2.png"
import c3  from "../assets/customized/customized3.png"
import c4  from "../assets/customized/customized4.png"
import c5  from "../assets/customized/customized5.png"
import c6  from "../assets/customized/customized6.png"
import c7  from "../assets/customized/customized7.png"
import c8  from "../assets/customized/customized8.png"
import c9  from "../assets/customized/customized9.png"
import c10 from "../assets/customized/customized10.png"

const ARRANGEMENTS = [
  { id:1,  src:c1,  title:"Rose Cascade",   mood:"Romantic",   palette:["#e11d48","#f43f5e","#fda4af"], prompt:"A sweeping cascade of deep red roses with soft pink tips, perfect for a romantic anniversary" },
  { id:2,  src:c2,  title:"Garden Whisper", mood:"Dreamy",     palette:["#7c3aed","#a78bfa","#ddd6fe"], prompt:"Dreamy lavender and violet blooms arranged loosely, like wildflowers from a secret garden" },
  { id:3,  src:c3,  title:"Sunlit Meadow",  mood:"Cheerful",   palette:["#d97706","#fbbf24","#fef3c7"], prompt:"Warm golden sunflowers and amber dahlias that feel like a joyful summer afternoon" },
  { id:4,  src:c4,  title:"Ivory Elegance", mood:"Classic",    palette:["#6b7280","#9ca3af","#f9fafb"], prompt:"Timeless white and ivory roses in a refined, structured arrangement for formal occasions" },
  { id:5,  src:c5,  title:"Blossom Storm",  mood:"Bold",       palette:["#db2777","#ec4899","#fbcfe8"], prompt:"Bold fuchsia and hot pink blooms bursting outward like a joyful explosion of color" },
  { id:6,  src:c6,  title:"Forest Calm",    mood:"Earthy",     palette:["#15803d","#22c55e","#bbf7d0"], prompt:"Earthy greens, eucalyptus, and ivory florals grounded in a calm, woodland aesthetic" },
  { id:7,  src:c7,  title:"Lavender Dusk",  mood:"Serene",     palette:["#7e22ce","#c084fc","#ede9fe"], prompt:"Soft lavender and lilac blooms that glow like dusk settling over a quiet field" },
  { id:8,  src:c8,  title:"Coral Sunrise",  mood:"Warm",       palette:["#ea580c","#fb923c","#fed7aa"], prompt:"Warm coral and peach roses catching the first light of morning in a vibrant arrangement" },
  { id:9,  src:c9,  title:"Midnight Bloom", mood:"Mysterious", palette:["#1e1b4b","#4338ca","#a5b4fc"], prompt:"Deep navy and indigo flowers with silver-tipped petals for an air of mystery and elegance" },
  { id:10, src:c10, title:"Peach Reverie",  mood:"Soft",       palette:["#be185d","#f9a8d4","#fdf2f8"], prompt:"Delicate peach and blush tones in a soft, airy arrangement for a gentle, romantic gesture" },
]

const N   = ARRANGEMENTS.length
const mod = (a, b) => ((a % b) + b) % b
const G   = "#2E8B34"
const DG  = "#0C573E"

export default function AIGalleryPage({ onNavigate }) {
  const [center,  setCenter]  = useState(0)
  const [visible, setVisible] = useState(false)
  const touchX = useRef(null)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])

  const navigate = useCallback((dir) => setCenter(p => mod(p + (dir === "right" ? 1 : -1), N)), [])

  useEffect(() => {
    const h = (e) => { if (e.key === "ArrowRight") navigate("right"); if (e.key === "ArrowLeft") navigate("left") }
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

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"#ffffff" }}>
      <style>{`
        .ag-thumb { transition: all 0.2s ease; }
        .ag-thumb:hover { opacity: 1 !important; transform: scale(1.07); }
        .ag-arrow { transition: all 0.18s ease; }
        .ag-arrow:hover { background: rgba(46,139,52,0.08) !important; border-color: ${G} !important; }
        .ag-cta:hover { box-shadow: 0 10px 28px rgba(46,139,52,0.35) !important; transform: translateY(-2px); }
        @keyframes ag-fade { from { opacity:0; } to { opacity:1; } }
        @media (max-width: 768px) {
          .ag-layout { flex-direction: column !important; }
          .ag-image-panel { width: 100% !important; height: 56vw !important; min-height: 260px !important; position: relative !important; }
          .ag-content-panel { width: 100% !important; padding: 28px 24px 48px !important; }
          .ag-thumbs { gap: 6px !important; }
          .ag-thumb { width: 38px !important; height: 38px !important; border-radius: 6px !important; }
        }
      `}</style>

      <main style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <div className="ag-layout" style={{ flex:1, display:"flex", flexDirection:"row", minHeight:"100vh" }}>

          {/* ── IMAGE PANEL ─────────────────────────────────────────────────── */}
          <div
            className="ag-image-panel"
            style={{ width:"55%", position:"relative", overflow:"hidden", background:"#f3f4f6" }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* CSS crossfade — only images move */}
            {ARRANGEMENTS.map((arr, i) => (
              <div
                key={arr.id}
                style={{
                  position:"absolute", inset:0,
                  backgroundImage:`url(${arr.src})`,
                  backgroundSize:"cover",
                  backgroundPosition:"center",
                  opacity: i === center ? 1 : 0,
                  transition:"opacity 0.75s cubic-bezier(0.4,0,0.2,1)",
                  willChange:"opacity",
                }}
              />
            ))}

            {/* Subtle right-edge blend into white panel */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, transparent 60%, rgba(255,255,255,0.5) 100%)", pointerEvents:"none" }} />
            {/* Bottom scrim for overlay legibility */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)", pointerEvents:"none" }} />

            {/* Back button */}
            <button
              onClick={() => onNavigate?.("home")}
              className="ag-arrow"
              style={{ position:"absolute", top:20, left:20, zIndex:20, display:"inline-flex", alignItems:"center", gap:6, color:"#374151", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", border:"1px solid #e5e7eb", borderRadius:50, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            {/* Nav arrows */}
            {[{ dir:"left", d:"M15 19l-7-7 7-7" }, { dir:"right", d:"M9 5l7 7-7 7" }].map(({ dir, d }) => (
              <button
                key={dir}
                onClick={() => navigate(dir)}
                className="ag-arrow"
                style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", zIndex:20, [dir==="left"?"left":"right"]:16, width:40, height:40, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.75)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#374151" }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/>
                </svg>
              </button>
            ))}

            {/* Title + palette overlay — bottom of image only */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"24px 28px", zIndex:10 }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {active.palette.map((c, i) => (
                  <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:c, boxShadow:"0 0 0 1.5px rgba(255,255,255,0.4)" }} />
                ))}
              </div>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:4 }}>
                {active.mood} · AI-Generated
              </p>
              <h3 style={{ color:"white", fontSize:"clamp(20px,2.4vw,30px)", fontWeight:900, lineHeight:1.1, margin:0, textShadow:"0 2px 12px rgba(0,0,0,0.4)" }}>
                {active.title}
              </h3>
            </div>
          </div>

          {/* ── CONTENT PANEL — static, never re-mounts ─────────────────────── */}
          <div
            className="ag-content-panel"
            style={{ width:"45%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 52px 60px 48px", position:"relative", overflow:"hidden", background:"white", borderLeft:"1px solid #f0ede6" }}
          >
            {/* Decorative large number — very subtle */}
            <div style={{ position:"absolute", bottom:-10, right:-8, fontSize:180, fontWeight:900, lineHeight:1, color:"rgba(46,139,52,0.04)", userSelect:"none", pointerEvents:"none", letterSpacing:"-0.05em" }}>
              {String(center + 1).padStart(2,"0")}
            </div>

            {/* All content is static — only the decorative number and thumbnails react to slide changes */}
            <div style={{ position:"relative", zIndex:1, opacity:visible?1:0, transition:"opacity 0.4s ease" }}>

              {/* Section marker */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:24 }}>
                <div style={{ width:24, height:1.5, background:G }} />
                <span style={{ color:G, fontSize:10, fontWeight:800, letterSpacing:"0.26em", textTransform:"uppercase" }}>
                  AI-Crafted Arrangements
                </span>
              </div>

              {/* Headline — static, does not change on slide */}
              <h1 style={{ color:"#111827", fontSize:"clamp(30px,3.2vw,50px)", fontWeight:900, lineHeight:1.06, letterSpacing:"-0.025em", margin:"0 0 14px" }}>
                Your Vision,
                <br />
                <span style={{ color:G }}>Brought to Bloom</span>
              </h1>

              {/* Static description */}
              <p style={{ color:"#6b7280", fontSize:"clamp(13px,1.2vw,14.5px)", lineHeight:1.8, maxWidth:360, margin:"0 0 28px" }}>
                Describe your ideal bouquet and our AI creates a bespoke arrangement
                just for you — no two alike, every one made with care.
              </p>

              {/* Prompt callout — updates with slide but no layout shift */}
              <div style={{ borderLeft:`2px solid ${G}40`, paddingLeft:16, marginBottom:36, minHeight:56 }}>
                <p style={{ color:"#9ca3af", fontSize:9, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:5 }}>
                  Try prompting:
                </p>
                <p style={{ color:"#374151", fontSize:"clamp(12px,1vw,13px)", lineHeight:1.7, fontStyle:"italic", margin:0 }}>
                  "{active.prompt}"
                </p>
              </div>

              {/* Thumbnail grid */}
              <div className="ag-thumbs" style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:40 }}>
                {ARRANGEMENTS.map((arr, i) => (
                  <button
                    key={arr.id}
                    onClick={() => setCenter(i)}
                    className="ag-thumb"
                    style={{
                      width:44, height:44, borderRadius:8, overflow:"hidden", padding:0,
                      border:`2px solid ${i === center ? G : "#e5e7eb"}`,
                      opacity: i === center ? 1 : 0.55,
                      cursor:"pointer", flexShrink:0,
                      transition:"all 0.18s ease",
                    }}
                    title={arr.title}
                  >
                    <img src={arr.src} alt={arr.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  </button>
                ))}
              </div>

              {/* CTA row */}
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <button
                  onClick={() => onNavigate?.("make-it-personal")}
                  className="ag-cta"
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:50, background:G, color:"white", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", boxShadow:`0 6px 18px rgba(46,139,52,0.28)`, transition:"all 0.2s ease" }}
                >
                  Try It Now
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>

                {/* Progress indicator */}
                <span style={{ color:"#9ca3af", fontSize:11, fontWeight:600, letterSpacing:"0.08em" }}>
                  {String(center + 1).padStart(2,"0")} / {String(N).padStart(2,"0")}
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
