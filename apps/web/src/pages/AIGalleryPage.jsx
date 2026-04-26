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
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"#070d07" }}>
      <style>{`
        .ag-thumb { transition: all 0.22s ease; }
        .ag-thumb:hover { opacity: 1 !important; transform: scale(1.06); }
        .ag-arrow { transition: all 0.2s ease; }
        .ag-arrow:hover { background: rgba(255,255,255,0.15) !important; transform: translateY(-50%) scale(1.08); }
        .ag-cta:hover { box-shadow: 0 12px 32px rgba(46,139,52,0.5) !important; transform: translateY(-2px); }
        @keyframes ag-in { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        .ag-content-enter { animation: ag-in 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        @media (max-width: 768px) {
          .ag-layout { flex-direction: column !important; }
          .ag-image-panel { width: 100% !important; height: 55vw !important; min-height: 280px !important; position: relative !important; }
          .ag-content-panel { width: 100% !important; padding: 32px 24px 48px !important; min-height: unset !important; }
          .ag-counter { display: none !important; }
          .ag-thumbs { gap: 6px !important; }
          .ag-thumb { width: 40px !important; height: 40px !important; border-radius: 7px !important; }
        }
      `}</style>

      <main style={{ flex:1, display:"flex", flexDirection:"column" }}>
        <div className="ag-layout" style={{ flex:1, display:"flex", flexDirection:"row", minHeight:"100vh" }}>

          {/* ── IMAGE PANEL ─────────────────────────────────────────────────── */}
          <div
            className="ag-image-panel"
            style={{ width:"56%", position:"relative", overflow:"hidden" }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* All images — CSS crossfade, buttery smooth */}
            {ARRANGEMENTS.map((arr, i) => (
              <div
                key={arr.id}
                style={{
                  position:"absolute", inset:0,
                  backgroundImage:`url(${arr.src})`,
                  backgroundSize:"cover",
                  backgroundPosition:"center",
                  opacity: i === center ? 1 : 0,
                  transition:"opacity 0.85s cubic-bezier(0.4,0,0.2,1)",
                  willChange:"opacity",
                }}
              />
            ))}

            {/* Right-edge gradient blends into dark content panel */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(0,0,0,0) 30%, #070d07 100%)", pointerEvents:"none" }} />
            {/* Bottom gradient for text legibility */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 40%, transparent 70%)", pointerEvents:"none" }} />

            {/* Back button */}
            <button
              onClick={() => onNavigate?.("home")}
              className="ag-arrow"
              style={{ position:"absolute", top:24, left:24, zIndex:20, display:"inline-flex", alignItems:"center", gap:7, color:"rgba(255,255,255,0.7)", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:50, padding:"8px 14px", fontSize:12, fontWeight:600, cursor:"pointer", letterSpacing:"0.02em" }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            {/* Nav arrows */}
            {[{ dir:"left", d:"M15 19l-7-7 7-7", pos:"left:20px" }, { dir:"right", d:"M9 5l7 7-7 7", pos:"right:20px" }].map(({ dir, d, pos }) => (
              <button
                key={dir}
                onClick={() => navigate(dir)}
                className="ag-arrow"
                style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", zIndex:20, [dir==="left"?"left":"right"]:20, width:44, height:44, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(0,0,0,0.28)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"white" }}
              >
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/>
                </svg>
              </button>
            ))}

            {/* Arrangement info overlay — bottom left */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"32px 36px", zIndex:10 }}>
              {/* Palette dots */}
              <div style={{ display:"flex", gap:7, marginBottom:12 }}>
                {active.palette.map((c, i) => (
                  <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c, boxShadow:"0 0 0 2px rgba(255,255,255,0.2)" }} />
                ))}
              </div>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:10, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:6 }}>
                {active.mood} · AI-Generated
              </p>
              <h3 style={{ color:"white", fontSize:"clamp(22px,2.8vw,36px)", fontWeight:900, lineHeight:1.1, margin:0, textShadow:"0 2px 20px rgba(0,0,0,0.5)" }}>
                {active.title}
              </h3>
            </div>
          </div>

          {/* ── CONTENT PANEL ───────────────────────────────────────────────── */}
          <div
            className="ag-content-panel"
            style={{ width:"44%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 52px 60px 48px", position:"relative", overflow:"hidden" }}
          >
            {/* Subtle grain texture overlay */}
            <div style={{ position:"absolute", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", opacity:1, pointerEvents:"none" }} />

            {/* Large decorative counter — editorial touch */}
            <div
              className="ag-counter"
              style={{ position:"absolute", bottom:-20, right:-10, fontSize:220, fontWeight:900, lineHeight:1, color:"rgba(46,139,52,0.045)", userSelect:"none", pointerEvents:"none", letterSpacing:"-0.05em" }}
            >
              {String(center + 1).padStart(2, "0")}
            </div>

            <div
              key={center} // remount triggers animation on slide change
              className="ag-content-enter"
              style={{ position:"relative", zIndex:1, opacity:visible?1:0, transition:"opacity 0.5s ease" }}
            >
              {/* Section marker */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:28 }}>
                <div style={{ width:28, height:1.5, background:G }} />
                <span style={{ color:G, fontSize:10, fontWeight:800, letterSpacing:"0.28em", textTransform:"uppercase" }}>
                  AI-Crafted Arrangements
                </span>
              </div>

              {/* Headline */}
              <h1 style={{ color:"white", fontSize:"clamp(34px,3.8vw,58px)", fontWeight:900, lineHeight:1.04, letterSpacing:"-0.025em", margin:"0 0 16px" }}>
                Your Vision,
                <br />
                <span style={{ color:G }}>Brought to Bloom</span>
              </h1>

              {/* Description */}
              <p style={{ color:"rgba(255,255,255,0.48)", fontSize:"clamp(13px,1.3vw,15px)", lineHeight:1.85, maxWidth:360, margin:"0 0 36px" }}>
                Describe your ideal bouquet and our AI creates a bespoke arrangement
                just for you — no two alike, every one made with care.
              </p>

              {/* Prompt callout — editorial left-border style */}
              <div style={{ borderLeft:`2px solid rgba(46,139,52,0.45)`, paddingLeft:18, marginBottom:40 }}>
                <p style={{ color:"rgba(255,255,255,0.28)", fontSize:9, fontWeight:800, letterSpacing:"0.24em", textTransform:"uppercase", marginBottom:7 }}>
                  Try prompting:
                </p>
                <p style={{ color:"rgba(255,255,255,0.72)", fontSize:"clamp(12px,1.1vw,13.5px)", lineHeight:1.72, fontStyle:"italic", margin:0 }}>
                  "{active.prompt}"
                </p>
              </div>

              {/* Thumbnail grid — elegant, compact */}
              <div className="ag-thumbs" style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:44 }}>
                {ARRANGEMENTS.map((arr, i) => (
                  <button
                    key={arr.id}
                    onClick={() => setCenter(i)}
                    className="ag-thumb"
                    style={{
                      width:48, height:48, borderRadius:10, overflow:"hidden", padding:0,
                      border:`2px solid ${i === center ? G : "rgba(255,255,255,0.08)"}`,
                      opacity: i === center ? 1 : 0.38,
                      cursor:"pointer", flexShrink:0,
                    }}
                    title={arr.title}
                  >
                    <img src={arr.src} alt={arr.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  </button>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <button
                  onClick={() => onNavigate?.("make-it-personal")}
                  className="ag-cta"
                  style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"13px 26px", borderRadius:50, background:G, color:"white", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 6px 20px rgba(46,139,52,0.3)", transition:"all 0.22s ease", letterSpacing:"0.01em" }}
                >
                  Try It Now
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>

                {/* Progress indicator */}
                <span style={{ color:"rgba(255,255,255,0.22)", fontSize:11, fontWeight:600, letterSpacing:"0.08em" }}>
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
