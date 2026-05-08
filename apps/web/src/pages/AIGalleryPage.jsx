import { useState, useEffect, useCallback, useRef } from "react"

import c1  from "../assets/customized/customized1.webp"
import c2  from "../assets/customized/customized2.webp"
import c3  from "../assets/customized/customized3.webp"
import c4  from "../assets/customized/customized4.webp"
import c5  from "../assets/customized/customized5.webp"
import c6  from "../assets/customized/customized6.webp"
import c7  from "../assets/customized/customized7.webp"
import c8  from "../assets/customized/customized8.webp"
import c9  from "../assets/customized/customized9.webp"
import c10 from "../assets/customized/customized10.webp"

const ARRANGEMENTS = [
  {
    id: 1, src: c1, title: "Rose Cascade", mood: "Romantic",
    palette: ["#e11d48","#f43f5e","#fda4af"],
    prompt: "A sweeping cascade of deep red roses with soft pink tips, perfect for a romantic anniversary gift.",
  },
  {
    id: 2, src: c2, title: "Garden Whisper", mood: "Dreamy",
    palette: ["#7c3aed","#a78bfa","#ddd6fe"],
    prompt: "Dreamy lavender and violet blooms arranged loosely, like wildflowers freshly picked from a secret garden.",
  },
  {
    id: 3, src: c3, title: "Sunlit Meadow", mood: "Cheerful",
    palette: ["#d97706","#fbbf24","#fef3c7"],
    prompt: "Warm golden sunflowers and amber dahlias that feel like a bright and joyful summer afternoon.",
  },
  {
    id: 4, src: c4, title: "Ivory Elegance", mood: "Classic",
    palette: ["#6b7280","#9ca3af","#f9fafb"],
    prompt: "Timeless white and ivory roses in a refined, structured arrangement perfect for formal occasions.",
  },
  {
    id: 5, src: c5, title: "Blossom Storm", mood: "Bold",
    palette: ["#db2777","#ec4899","#fbcfe8"],
    prompt: "Bold fuchsia and hot pink blooms bursting outward like a joyful explosion of color and energy.",
  },
  {
    id: 6, src: c6, title: "Forest Calm", mood: "Earthy",
    palette: ["#15803d","#22c55e","#bbf7d0"],
    prompt: "Earthy greens, eucalyptus, and ivory florals rooted in a calm and natural woodland aesthetic.",
  },
  {
    id: 7, src: c7, title: "Lavender Dusk", mood: "Serene",
    palette: ["#7e22ce","#c084fc","#ede9fe"],
    prompt: "Soft lavender and lilac blooms that glow gently, like the last light settling over a quiet open field.",
  },
  {
    id: 8, src: c8, title: "Coral Sunrise", mood: "Warm",
    palette: ["#ea580c","#fb923c","#fed7aa"],
    prompt: "Warm coral and peach roses that catch the first morning light in a bright and vibrant arrangement.",
  },
  {
    id: 9, src: c9, title: "Midnight Bloom", mood: "Mysterious",
    palette: ["#1e1b4b","#4338ca","#a5b4fc"],
    prompt: "Deep navy and indigo flowers with silver-tipped petals that carry an air of mystery and quiet elegance.",
  },
  {
    id: 10, src: c10, title: "Peach Reverie", mood: "Soft",
    palette: ["#be185d","#f9a8d4","#fdf2f8"],
    prompt: "Delicate peach and blush tones in a light, airy arrangement meant for a gentle and heartfelt gesture.",
  },
]

const N   = ARRANGEMENTS.length
const mod = (a, b) => ((a % b) + b) % b
const G   = "#2E8B34"
const DG  = "#0C573E"

// Navbar height: PromoCarousel (52px) + NavBar (52px) = 104px
const NAVBAR_H = 104

export default function AIGalleryPage({ onNavigate }) {
  const [center,  setCenter]  = useState(1)
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

  return (
    <>
      <style>{`
        /*
          FIX 1 — No scroll:
          position:fixed + top:104px fills exactly the remaining viewport
          without any calc() rounding errors. left/right/bottom:0 guarantees
          the panel never overflows regardless of browser chrome or scrollbars.

          FIX 2 — No image crop:
          Images are square. We use an <img> tag with object-fit:contain so
          the full image is always visible inside the panel, no bottom cropping.
          A subtle neutral background fills the letterbox area.
        */
        .ag-root {
          position: fixed;
          top: ${NAVBAR_H}px;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          background: #fff;
          z-index: 10;
        }
        .ag-image-panel {
          width: 55%;
          position: relative;
          overflow: hidden;
          background: #fff;
          flex-shrink: 0;
        }
        /* Square images: contain keeps the full image, no cropping */
        .ag-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
          opacity: 0;
          transition: opacity 0.75s cubic-bezier(0.4,0,0.2,1);
          will-change: opacity;
        }
        .ag-img.active { opacity: 1; }

        .ag-content-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 36px 48px 36px 40px;
          overflow: hidden;
          background: white;
          position: relative;
        }

        .ag-thumb  { transition: all 0.18s ease; }
        .ag-thumb:hover  { opacity: 1 !important; transform: scale(1.07); }
        .ag-arrow  { transition: all 0.18s ease; }
        .ag-arrow:hover  { background: rgba(46,139,52,0.18) !important; }
        .ag-cta { transition: all 0.2s ease; }
        .ag-cta:hover    { opacity: 0.88; transform: translateY(-1px); }

        /* ── Mobile: stacked, scrollable ── */
        @media (max-width: 768px) {
          .ag-root {
            position: static;
            height: auto;
            min-height: calc(100svh - ${NAVBAR_H}px);
            flex-direction: column;
            overflow: visible;
          }
          .ag-image-panel {
            width: 100%;
            height: 75vw;
            min-height: 260px;
            max-height: 420px;
            flex-shrink: 0;
          }
          .ag-img {
            object-fit: contain;
          }
          .ag-content-panel {
            flex: unset;
            padding: 22px 20px 32px;
            border-left: none;
            border-top: 1px solid #f0ede6;
            overflow: visible;
            justify-content: flex-start;
          }
        }

        @media (max-width: 480px) {
          .ag-image-panel { height: 80vw; min-height: 220px; }
          .ag-content-panel { padding: 18px 16px 28px; }
        }

        /* ── Mobile landscape: side-by-side but compact ── */
        @media (max-height: 500px) and (orientation: landscape) {
          .ag-root {
            position: fixed;
            top: ${NAVBAR_H}px;
            left: 0; right: 0; bottom: 0;
            flex-direction: row;
            overflow: hidden;
            height: auto;
            min-height: unset;
          }
          .ag-image-panel {
            width: 50%;
            height: 100%;
            max-height: unset;
            min-height: unset;
          }
          .ag-content-panel {
            flex: 1;
            padding: 12px 20px 12px 16px;
            overflow-y: auto;
            justify-content: flex-start;
            border-left: none;
            border-top: none;
          }
          /* Tighten spacing in landscape */
          .ag-content-panel h1 { font-size: clamp(16px, 3vw, 22px) !important; margin-bottom: 6px !important; }
          .ag-content-panel p  { font-size: 11px !important; margin-bottom: 10px !important; }
        }
      `}</style>

      <div className="ag-root">

        {/* ── IMAGE PANEL ── */}
        <div
          className="ag-image-panel"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Slides — <img> + object-fit:contain so square images never crop */}
          {ARRANGEMENTS.map((arr, i) => (
            <img
              key={arr.id}
              src={arr.src}
              alt={arr.title}
              className={`ag-img${i === center ? " active" : ""}`}
            />
          ))}

          {/* Bottom scrim for title readability */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 42%)",
            pointerEvents: "none",
            zIndex: 2,
          }} />

          {/* Back button */}
          <button
            onClick={() => onNavigate?.("home")}
            className="ag-arrow"
            style={{
              position: "absolute", top: 16, left: 16, zIndex: 20,
              display: "inline-flex", alignItems: "center", gap: 6,
              color: "#374151",
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid #e5e7eb",
              borderRadius: 50,
              padding: "7px 14px",
              fontSize: 12, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          {/* Prev / Next */}
          {[{ dir:"left", d:"M15 19l-7-7 7-7" }, { dir:"right", d:"M9 5l7 7-7 7" }].map(({ dir, d }) => (
            <button key={dir} onClick={() => navigate(dir)} className="ag-arrow"
              style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 20,
                [dir === "left" ? "left" : "right"]: 14,
                width: 38, height: 38, borderRadius: "50%",
                border: "1.5px solid rgba(46,139,52,0.25)",
                background: "rgba(46,139,52,0.10)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: DG,
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/>
              </svg>
            </button>
          ))}

          {/* Title overlay */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"18px 24px", zIndex:10 }}>
            <div style={{ display:"flex", gap:6, marginBottom:5 }}>
              {active.palette.map((c, i) => (
                <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:c, boxShadow:"0 0 0 1.5px rgba(255,255,255,0.4)" }} />
              ))}
            </div>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:3, fontFamily:"inherit" }}>
              {active.mood} · AI-Generated
            </p>
            <h3 style={{ color:"white", fontSize:"clamp(18px,2vw,26px)", fontWeight:800, lineHeight:1.15, margin:0, textShadow:"0 2px 10px rgba(0,0,0,0.45)", fontFamily:"inherit" }}>
              {active.title}
            </h3>
          </div>
        </div>

        {/* ── CONTENT PANEL ── */}
        <div className="ag-content-panel">

          {/* Decorative background number */}
          <div style={{ position:"absolute", bottom:-16, right:-6, fontSize:150, fontWeight:900, lineHeight:1, color:"rgba(46,139,52,0.04)", userSelect:"none", pointerEvents:"none", letterSpacing:"-0.05em", fontFamily:"inherit" }}>
            {String(center + 1).padStart(2,"0")}
          </div>

          <div style={{ position:"relative", zIndex:1, opacity:visible?1:0, transition:"opacity 0.4s ease" }}>

            {/* Tagline */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:22, height:1.5, background:G }} />
              <span style={{ color:G, fontSize:10, fontWeight:800, letterSpacing:"0.26em", textTransform:"uppercase", fontFamily:"inherit" }}>
                AI-Crafted Arrangements
              </span>
            </div>

            {/* Heading */}
            <h1 style={{ color:"#111827", fontSize:"clamp(26px,2.6vw,42px)", fontWeight:900, lineHeight:1.08, letterSpacing:"-0.02em", margin:"0 0 10px", fontFamily:"inherit" }}>
              Your Vision,<br />
              <span style={{ color:G }}>Brought to Bloom</span>
            </h1>

            {/* Body copy */}
            <p style={{ color:"#6b7280", fontSize:"clamp(13px,1vw,14px)", lineHeight:1.75, maxWidth:340, margin:"0 0 18px", fontFamily:"inherit" }}>
              Tell us what you have in mind and our AI puts together a unique arrangement just for you.
              Every piece is one of a kind and made fresh for the occasion.
            </p>

            {/* Prompt example */}
            <div style={{ borderLeft:`2px solid ${G}40`, paddingLeft:14, marginBottom:22 }}>
              <p style={{ color:"#9ca3af", fontSize:9, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:4, fontFamily:"inherit" }}>
                Try prompting:
              </p>
              <p style={{ color:"#374151", fontSize:"clamp(11.5px,0.9vw,13px)", lineHeight:1.7, fontStyle:"italic", margin:0, fontFamily:"inherit" }}>
                "{active.prompt}"
              </p>
            </div>

            {/* Thumbnails */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:26 }}>
              {ARRANGEMENTS.map((arr, i) => (
                <button
                  key={arr.id}
                  onClick={() => setCenter(i)}
                  className="ag-thumb"
                  title={arr.title}
                  style={{
                    width: 40, height: 40, borderRadius: 7,
                    overflow: "hidden", padding: 0, cursor: "pointer", flexShrink: 0,
                    border: `2px solid ${i === center ? G : "#e5e7eb"}`,
                    opacity: i === center ? 1 : 0.55,
                  }}
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
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 22px", borderRadius: 50,
                  background: G, color: "white",
                  fontSize: 13, fontWeight: 700,
                  border: "none", cursor: "pointer",
                  boxShadow: `0 6px 18px rgba(46,139,52,0.28)`,
                  fontFamily: "inherit",
                }}
              >
                Try It Now
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
              <span style={{ color:"#9ca3af", fontSize:11, fontWeight:600, letterSpacing:"0.08em", fontFamily:"inherit" }}>
                {String(center + 1).padStart(2,"0")} / {String(N).padStart(2,"0")}
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}