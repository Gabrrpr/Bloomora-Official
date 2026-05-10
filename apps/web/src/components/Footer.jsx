import { useEffect } from "react"
import paypalImg       from "../assets/PayPal.png"
import westernUnionImg from "../assets/WesternUnion.png"
import gcashImg        from "../assets/GCash.png"
import bdoImg          from "../assets/BDO.png"
import bpiImg          from "../assets/BPI.png"
import metrobankImg    from "../assets/Metrobank.png"
import lalamoveImg     from "../assets/Lalamove.png"

/* ─── Data ───────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { label: "Home",       page: "home" },
  { label: "Shop",       page: "shop" },
  { label: "Occasions",  page: "occasions" },
  { label: "About Us",   page: "about" },
  { label: "Contact Us", page: "contact" },
]
const CUSTOMER_CARE = [
  { label: "FAQs",           page: "faq" },
  { label: "Track My Order", page: "orders" },
  { label: "Return Policy",  page: "return-policy" },
]
const SOCIAL_LINKS = [
  { name: "Facebook",  href: "https://www.facebook.com/profile.php?id=100063877087893", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
  { name: "Instagram", href: "https://www.instagram.com/estingsflowershop/",            icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
  { name: "WhatsApp",  href: "#", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg> },
  { name: "Gmail",     href: "#", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 512 512"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg> },
]
const PAYMENT_METHODS = [
  { name: "PayPal",        img: paypalImg },
  { name: "Western Union", img: westernUnionImg },
  { name: "GCash",         img: gcashImg },
  { name: "BDO",           img: bdoImg },
  { name: "BPI",           img: bpiImg },
  { name: "Metrobank",     img: metrobankImg },
]

/* ─── Theme colours ──────────────────────────────────────────── */
const C = {
  accentLight: "#b8d4c2",
  text:        "rgba(255,255,255,0.95)",
  textMid:     "rgba(255,255,255,0.75)",
  textDim:     "rgba(255,255,255,0.45)",
  divider:     "rgba(255,255,255,0.08)",
  cardBg:      "rgba(255,255,255,0.04)",
}

const FOOTER_BG = "#0C5240"

/* ─── CSS ────────────────────────────────────────────────────── */
const FOOTER_CSS = `
  .ft-navlink {
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 13px; text-align: left; display: block;
    transition: color 0.15s, padding-left 0.15s;
    font-family: var(--font-ui);
  }
  .ft-navlink:hover { color: white !important; padding-left: 5px; }

  .ft-social {
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; text-decoration: none;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-social:hover {
    background: rgba(125,170,145,0.18) !important;
    border-color: #7daa91 !important;
    color: white !important;
  }

  .ft-logo-img {
    border-radius: 4px; opacity: 0.82;
    transition: opacity 0.15s, transform 0.15s;
  }
  .ft-logo-img:hover { opacity: 1 !important; transform: scale(1.06); }

  .ft-top-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-top-btn:hover {
    background: rgba(125,170,145,0.20) !important;
    border-color: #7daa91 !important;
    color: white !important;
  }

  /* Gentle sway — anchored at the stem base */
  @keyframes ftSway1 { 0%,100%{ transform:rotate(-3deg) }  50%{ transform:rotate(3deg)  } }
  @keyframes ftSway2 { 0%,100%{ transform:rotate(2.5deg) } 50%{ transform:rotate(-3.5deg)} }
  @keyframes ftSway3 { 0%,100%{ transform:rotate(-2deg) }  50%{ transform:rotate(2.5deg) } }
  @keyframes ftSway4 { 0%,100%{ transform:rotate(3.5deg) } 50%{ transform:rotate(-2.5deg)} }
  @keyframes ftSway5 { 0%,100%{ transform:rotate(-1.5deg)} 50%{ transform:rotate(3deg)  } }

  .ft-sway1 { animation: ftSway1 4.2s ease-in-out infinite; }
  .ft-sway2 { animation: ftSway2 3.7s ease-in-out infinite 0.6s; }
  .ft-sway3 { animation: ftSway3 5.0s ease-in-out infinite 1.1s; }
  .ft-sway4 { animation: ftSway4 3.4s ease-in-out infinite 0.3s; }
  .ft-sway5 { animation: ftSway5 4.8s ease-in-out infinite 0.9s; }
`

/* ─── Helpers ────────────────────────────────────────────────── */
const PinIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color:"#b8d4c2", flexShrink:0, marginTop:"2px" }}><path fillRule="evenodd" clipRule="evenodd" d="M11.54 22.351a.76.76 0 00.723 0C14.339 21.187 21 16.492 21 10.5a9 9 0 10-18 0c0 5.992 6.661 10.687 8.54 11.851zM12 13.5a3 3 0 100-6 3 3 0 000 6z"/></svg>
const ClockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:"#b8d4c2", flexShrink:0, marginTop:"1px" }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const PhoneIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:"#b8d4c2", flexShrink:0, marginTop:"1px" }}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>

const ColLabel = ({ children }) => (
  <p style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:"0.13em", textTransform:"uppercase", color:"#b8d4c2", marginBottom:"14px", marginTop:0 }}>
    {children}
  </p>
)
const InfoRow = ({ icon, children }) => (
  <div style={{ display:"flex", alignItems:"flex-start", gap:"7px", marginBottom:"6px" }}>
    <span style={{ marginTop:"2px" }}>{icon}</span>
    <p style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.75)", margin:0, lineHeight:"1.5", fontFamily:"var(--font-ui)" }}>{children}</p>
  </div>
)

/* ══════════════════════════════════════════════════════════════
   TULIP BORDER — inspired by the colourful flat tulip illustration

   Strategy:
   - viewBox 0 0 1440 260 (tall enough that NO flower is clipped)
   - A solid ground-fill path (footer green) starting ~y=180
     with gentle humps — flowers grow FROM this ground
   - Each tulip is a <g> with transform-origin at stem base (groundY)
     so the sway animation rotates around the bottom
   - Tulip shape: wide cup made from two bezier arcs + a pointed top petal
   - Sizes vary (tall/short, wide/narrow) for a natural meadow feel
   - Colours: red, hot-pink, yellow, purple, coral, white, lavender
   - Front leaves overlap the stem base for the lush look in the inspo
   - Dense packing: ~16 tulips across 1440px
══════════════════════════════════════════════════════════════ */
function TulipBorder() {
  const GROUND   = FOOTER_BG          // #0C5240 — footer bg
  const GROUND2  = "#0e6b53"          // slightly lighter back layer
  const STEM_C   = "#1b7a5a"          // stem colour
  const LEAF_C   = "#1f8c5e"          // leaf colour
  const LEAF_D   = "#166645"          // leaf dark edge

  /* Tulip bloom as a path.
     cx,cy = tip of the bloom (top centre)
     w = half-width at the open mouth
     h = height of the cup
     Returns an SVG path string for a tulip cup shape.
     The tulip: two curved side petals that come to a narrow waist,
     flaring back out at the base (open cup facing up). */
  const tulipPath = (cx, cy, w, h) => {
    // Left outer petal curve — starts at base-left, curves up to tip
    const bx = cx          // base centre x
    const by = cy + h      // base y (mouth of cup)
    const lx = cx - w      // left mouth
    const rx = cx + w      // right mouth
    // Control points give the classic tulip chalice shape
    return [
      `M ${lx} ${by}`,
      // Left petal: swoops up and inward to tip
      `C ${lx - w * 0.15} ${by - h * 0.3}, ${cx - w * 0.35} ${cy + h * 0.1}, ${cx} ${cy}`,
      // Right petal: mirrors
      `C ${cx + w * 0.35} ${cy + h * 0.1}, ${rx + w * 0.15} ${by - h * 0.3}, ${rx} ${by}`,
      // Close across the mouth with a gentle inward curve
      `Q ${bx} ${by + h * 0.18} ${lx} ${by}`,
      `Z`,
    ].join(" ")
  }

  /* Inner petal highlight — slightly narrower, lighter colour */
  const innerPetalPath = (cx, cy, w, h) => {
    const by = cy + h
    const lx = cx - w * 0.55
    const rx = cx + w * 0.55
    return [
      `M ${cx} ${cy}`,
      `C ${cx - w * 0.2} ${cy + h * 0.2}, ${lx} ${by - h * 0.25}, ${lx} ${by - h * 0.05}`,
      `Q ${cx} ${by + h * 0.08} ${rx} ${by - h * 0.05}`,
      `C ${rx} ${by - h * 0.25}, ${cx + w * 0.2} ${cy + h * 0.2}, ${cx} ${cy}`,
      `Z`,
    ].join(" ")
  }

  /* Leaf: a pointed oval tilted to one side
     lx,ly = base of leaf (on stem); tilt = + right, - left */
  const leafPath = (lx, ly, len, wide, tilt) => {
    const tx = lx + Math.sin((tilt * Math.PI) / 180) * len
    const ty = ly - Math.cos((tilt * Math.PI) / 180) * len
    const cx1 = lx + Math.sin(((tilt - 40) * Math.PI) / 180) * len * 0.5
    const cy1 = ly - Math.cos(((tilt - 40) * Math.PI) / 180) * len * 0.5
    const cx2 = lx + Math.sin(((tilt + 40) * Math.PI) / 180) * len * 0.5
    const cy2 = ly - Math.cos(((tilt + 40) * Math.PI) / 180) * len * 0.5
    return `M ${lx} ${ly} C ${cx1} ${cy1} ${tx} ${ty} ${tx} ${ty} C ${tx} ${ty} ${cx2} ${cy2} ${lx} ${ly} Z`
  }

  /* ── Tulip definitions ──────────────────────────────────────
     Each entry: { x, groundY, stemH, w, h, color, hiColor, sway }
     x       = horizontal centre of stem
     groundY = where stem meets ground (should be ~175-195 to stay inside ground fill)
     stemH   = how tall the stem is (groundY - stemH = bloom base y)
     w       = half-width of bloom mouth (bigger = wider tulip)
     h       = bloom cup height
     color   = outer petal fill
     hiColor = inner highlight petal fill (slightly lighter)
     sway    = CSS class name
  ────────────────────────────────────────────────────────────── */
  const TULIPS = [
    /* Far left — small purple */
    { x:55,   groundY:200, stemH:60, w:18, h:30, color:"#7c3aed", hiColor:"#a78bfa", sway:"ft-sway2" },
    /* Red — taller */
    { x:118,  groundY:205, stemH:78, w:22, h:36, color:"#dc2626", hiColor:"#f87171", sway:"ft-sway1" },
    /* Coral/peach — medium */
    { x:185,  groundY:198, stemH:52, w:16, h:26, color:"#ea580c", hiColor:"#fb923c", sway:"ft-sway3" },
    /* Hot pink — tall */
    { x:255,  groundY:208, stemH:88, w:24, h:38, color:"#db2777", hiColor:"#f472b6", sway:"ft-sway4" },
    /* Yellow — medium-tall */
    { x:325,  groundY:202, stemH:70, w:20, h:32, color:"#ca8a04", hiColor:"#facc15", sway:"ft-sway2" },
    /* Lavender — short */
    { x:385,  groundY:196, stemH:48, w:15, h:24, color:"#7c3aed", hiColor:"#c4b5fd", sway:"ft-sway5" },
    /* Deep pink — tall focal */
    { x:450,  groundY:210, stemH:95, w:26, h:42, color:"#be185d", hiColor:"#f9a8d4", sway:"ft-sway1" },
    /* Red-orange — medium */
    { x:528,  groundY:200, stemH:62, w:19, h:30, color:"#b91c1c", hiColor:"#fca5a5", sway:"ft-sway3" },
    /* Yellow bright — small */
    { x:592,  groundY:194, stemH:44, w:14, h:22, color:"#d97706", hiColor:"#fde68a", sway:"ft-sway4" },
    /* Purple tall */
    { x:658,  groundY:208, stemH:85, w:23, h:37, color:"#6d28d9", hiColor:"#a78bfa", sway:"ft-sway2" },
    /* Hot pink medium */
    { x:730,  groundY:200, stemH:60, w:18, h:28, color:"#ec4899", hiColor:"#fbcfe8", sway:"ft-sway5" },
    /* Red tall — centre focal */
    { x:800,  groundY:212, stemH:98, w:28, h:44, color:"#dc2626", hiColor:"#f87171", sway:"ft-sway1" },
    /* Coral small */
    { x:875,  groundY:196, stemH:50, w:16, h:25, color:"#f97316", hiColor:"#fed7aa", sway:"ft-sway3" },
    /* Yellow medium-tall */
    { x:942,  groundY:204, stemH:75, w:21, h:33, color:"#ca8a04", hiColor:"#fef08a", sway:"ft-sway4" },
    /* Pink-magenta tall */
    { x:1012, groundY:209, stemH:90, w:25, h:40, color:"#be185d", hiColor:"#f9a8d4", sway:"ft-sway2" },
    /* Lavender medium */
    { x:1082, groundY:199, stemH:58, w:17, h:27, color:"#8b5cf6", hiColor:"#ddd6fe", sway:"ft-sway5" },
    /* Red small */
    { x:1148, groundY:194, stemH:46, w:15, h:24, color:"#ef4444", hiColor:"#fca5a5", sway:"ft-sway3" },
    /* Purple tall */
    { x:1212, groundY:207, stemH:82, w:22, h:36, color:"#7c3aed", hiColor:"#c4b5fd", sway:"ft-sway1" },
    /* Yellow medium */
    { x:1275, groundY:200, stemH:64, w:19, h:30, color:"#d97706", hiColor:"#fde68a", sway:"ft-sway4" },
    /* Hot pink — small */
    { x:1335, groundY:195, stemH:48, w:16, h:25, color:"#db2777", hiColor:"#fbcfe8", sway:"ft-sway2" },
    /* Red-coral right edge */
    { x:1400, groundY:205, stemH:72, w:20, h:32, color:"#dc2626", hiColor:"#f87171", sway:"ft-sway5" },
  ]

  /* Ground humps — the y values below must be ≥ every tulip's groundY
     so all flowers are above the ground line                         */
  const groundFrontPath = `
    M0,260
    L0,192
    C30,188 55,186 80,190
    C105,194 120,196 150,192
    C180,188 200,182 230,185
    C260,188 280,194 310,192
    C335,190 355,184 385,186
    C415,188 435,194 465,192
    C490,190 510,183 540,185
    C570,187 590,193 620,192
    C648,191 668,183 700,185
    C728,187 748,193 778,192
    C805,191 825,184 855,186
    C885,188 905,194 935,192
    C960,190 980,183 1010,185
    C1040,187 1060,193 1090,192
    C1115,191 1135,184 1165,186
    C1195,188 1215,194 1245,192
    C1270,190 1290,184 1320,186
    C1350,188 1375,192 1410,190
    C1428,189 1436,190 1440,192
    L1440,260 Z
  `

  const groundBackPath = `
    M0,260
    L0,205
    C80,198 140,194 220,200
    C300,206 360,202 440,196
    C520,190 580,198 660,200
    C740,202 800,196 880,192
    C960,188 1020,196 1100,200
    C1180,204 1240,198 1320,194
    C1375,191 1415,196 1440,200
    L1440,260 Z
  `

  return (
    <div
      aria-hidden="true"
      style={{
        display: "block",
        width: "100%",
        lineHeight: 0,
        marginBottom: "-2px",
        overflow: "hidden",
        pointerEvents: "none",
        /* White bg above the SVG so the page bg shows, not ground green */
        backgroundColor: "transparent",
      }}
    >
      <svg
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display:"block", width:"100%", height:"clamp(160px, 18vw, 260px)" }}
      >
        {/* ── Back ground layer (lighter) ── */}
        <path fill={GROUND2} fillOpacity="0.5" d={groundBackPath} />

        {/* ── Tulips — drawn BEFORE front ground so stems root into earth ── */}
        {TULIPS.map((t, idx) => {
          const bloomTopY = t.groundY - t.stemH          // tip of tulip
          const bloomBaseY = bloomTopY + t.h             // mouth of cup
          // Mid-stem leaf positions
          const leaf1Y = t.groundY - t.stemH * 0.38
          const leaf2Y = t.groundY - t.stemH * 0.55

          return (
            <g
              key={idx}
              className={t.sway}
              style={{ transformOrigin: `${t.x}px ${t.groundY}px` }}
            >
              {/* Stem */}
              <line
                x1={t.x} y1={bloomBaseY + 2}
                x2={t.x} y2={t.groundY}
                stroke={STEM_C}
                strokeWidth={t.w > 20 ? 3.5 : 2.5}
                strokeLinecap="round"
              />

              {/* Leaf left */}
              <path
                d={leafPath(t.x, leaf1Y, t.stemH * 0.28, 6, -35)}
                fill={LEAF_C}
              />
              {/* Leaf right */}
              <path
                d={leafPath(t.x, leaf2Y, t.stemH * 0.24, 5, 38)}
                fill={LEAF_D}
              />

              {/* Outer tulip bloom */}
              <path
                d={tulipPath(t.x, bloomTopY, t.w, t.h)}
                fill={t.color}
              />

              {/* Inner highlight petal — lighter, narrower */}
              <path
                d={innerPetalPath(t.x, bloomTopY, t.w, t.h)}
                fill={t.hiColor}
                fillOpacity="0.75"
              />

              {/* Sepal (small green triangles at cup base) */}
              <path
                d={`M ${t.x - t.w * 0.5} ${bloomBaseY}
                    Q ${t.x - t.w * 0.65} ${bloomBaseY - t.h * 0.2} ${t.x - t.w * 0.3} ${bloomBaseY - t.h * 0.28}
                    Q ${t.x} ${bloomBaseY - t.h * 0.12} ${t.x + t.w * 0.3} ${bloomBaseY - t.h * 0.28}
                    Q ${t.x + t.w * 0.65} ${bloomBaseY - t.h * 0.2} ${t.x + t.w * 0.5} ${bloomBaseY}
                    Z`}
                fill={LEAF_C}
                fillOpacity="0.85"
              />

              {/* Base grass tufts — lush overlapping leaves at ground */}
              <ellipse cx={t.x - t.w * 0.7} cy={t.groundY} rx={t.w * 0.55} ry={t.stemH * 0.12}
                fill={LEAF_C} transform={`rotate(-28 ${t.x - t.w * 0.7} ${t.groundY})`} />
              <ellipse cx={t.x + t.w * 0.7} cy={t.groundY} rx={t.w * 0.5} ry={t.stemH * 0.10}
                fill={LEAF_D} transform={`rotate(32 ${t.x + t.w * 0.7} ${t.groundY})`} />
            </g>
          )
        })}

        {/* ── Front ground layer — sits on top of stem bases ── */}
        <path fill={GROUND} d={groundFrontPath} />

        {/* ── Grass blade tufts on front ground ── */}
        {[60,140,230,320,400,490,570,650,740,820,900,990,1070,1150,1240,1320,1400].map((gx, i) => (
          <g key={`grass-${i}`}>
            <path
              d={`M ${gx} 192 Q ${gx - 6} ${175 + (i % 3) * 4} ${gx - 2} ${165 + (i % 4) * 5}`}
              stroke={LEAF_C} strokeWidth="2.5" strokeLinecap="round" fill="none"
            />
            <path
              d={`M ${gx + 8} 192 Q ${gx + 14} ${178 + (i % 3) * 3} ${gx + 10} ${168 + (i % 5) * 4}`}
              stroke={LEAF_D} strokeWidth="2" strokeLinecap="round" fill="none"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ─── Footer ─────────────────────────────────────────────────── */
export default function Footer({ onNavigate }) {
  const go          = page => onNavigate?.(page)
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  useEffect(() => {
    if (document.getElementById("bloomora-footer-css")) return
    const tag = document.createElement("style")
    tag.id = "bloomora-footer-css"
    tag.textContent = FOOTER_CSS
    document.head.appendChild(tag)
    return () => document.getElementById("bloomora-footer-css")?.remove()
  }, [])

  return (
    <>
      {/* Tulip border — sits directly above the footer */}
      <TulipBorder />

      <footer style={{ backgroundColor: FOOTER_BG, color: "white", marginTop: "-1px" }}>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 40px 0" }}>

          {/* ══ ROW 1: Logo · divider · tagline · spacer · socials ══ */}
          <div style={{
            display: "flex", alignItems: "center", gap: "20px",
            flexWrap: "wrap",
            paddingBottom: "36px",
            borderBottom: `1px solid ${C.divider}`,
            marginBottom: "40px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <img src="/src/assets/EstingsLogo.svg" alt=""
                style={{ width: "40px", height: "40px", objectFit: "contain" }}
                onError={e => e.target.style.display = "none"} />
              <img src="/src/assets/Estings.svg" alt="Esting's"
                style={{ height: "34px", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                onError={e => e.target.style.display = "none"} />
            </div>

            <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.20)", flexShrink: 0 }} />

            <p style={{ fontSize: "12.5px", color: C.textMid, margin: 0, lineHeight: "1.6", fontFamily: "var(--font-ui)", flexShrink: 0 }}>
              Fresh flowers, handcrafted with care.<br />
              Serving Manila &amp; Pampanga since 1959.
            </p>

            <div style={{ flex: 1 }} />

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
              <p style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: C.accentLight, margin: 0, whiteSpace: "nowrap" }}>
                Follow Us On
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                {SOCIAL_LINKS.map(s => (
                  <a key={s.name} href={s.href} title={s.name} target="_blank" rel="noopener noreferrer"
                    className="ft-social"
                    style={{ background: C.cardBg, border: `1px solid ${C.divider}`, color: C.textMid }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ══ ROW 2: Nav + Branch info + Payments ══ */}
          <div
            style={{ display: "grid", gridTemplateColumns: "160px 140px 1fr 1fr auto", gap: "40px", alignItems: "start", paddingBottom: "44px" }}
            className="ft-main-row"
          >
            <div>
              <ColLabel>Quick Links</ColLabel>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {QUICK_LINKS.map(link => (
                  <li key={link.label}>
                    <button className="ft-navlink" onClick={() => go(link.page)} style={{ color: C.textMid }}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <ColLabel>Customer Care</ColLabel>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {CUSTOMER_CARE.map(link => (
                  <li key={link.label}>
                    <button className="ft-navlink" onClick={() => go(link.page)} style={{ color: C.textMid }}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <ColLabel>Manila Branch</ColLabel>
              <InfoRow icon={<PinIcon />}>Laon-Laan Cor. Dos Castillas St., Sampaloc</InfoRow>
              <InfoRow icon={<ClockIcon />}>Mon – Sat · 9:00 AM – 9:00 PM</InfoRow>
              <InfoRow icon={<PhoneIcon />}>+63 918 902 2401</InfoRow>
            </div>

            <div>
              <ColLabel>Pampanga Branch</ColLabel>
              <InfoRow icon={<PinIcon />}>McArthur Hi-way, Dolores, San Fernando</InfoRow>
              <InfoRow icon={<ClockIcon />}>Mon – Sat · 7:30 AM – 5:00 PM</InfoRow>
              <InfoRow icon={<PhoneIcon />}>+63 045 961 5378</InfoRow>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <ColLabel>We Accept</ColLabel>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", maxWidth: "160px" }}>
                  {PAYMENT_METHODS.map(({ name, img }) => (
                    <img key={name} src={img} alt={name} title={name} className="ft-logo-img"
                      style={{ height: "22px", width: "auto", maxWidth: "54px", objectFit: "contain" }} />
                  ))}
                </div>
              </div>
              <div>
                <ColLabel>Shipped Via</ColLabel>
                <img src={lalamoveImg} alt="Lalamove" className="ft-logo-img"
                  style={{ height: "24px", width: "auto", maxWidth: "90px", objectFit: "contain", display: "block" }} />
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 1024px) {
              .ft-main-row { grid-template-columns: repeat(3, 1fr) !important; }
            }
            @media (max-width: 640px) {
              .ft-main-row { grid-template-columns: repeat(2, 1fr) !important; gap: 28px !important; }
            }
            @media (max-width: 400px) {
              .ft-main-row { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>

        {/* ══ Copyright bar ══ */}
        <div style={{ borderTop: `1px solid ${C.divider}`, background: "rgba(0,0,0,0.18)" }}>
          <div style={{
            maxWidth: "1280px", margin: "0 auto", padding: "14px 40px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "12px",
          }}>
            <p style={{ fontSize: "12px", color: C.textDim, margin: 0, fontFamily: "var(--font-ui)" }}>
              © {new Date().getFullYear()} Esting's Flower International Inc. All rights reserved.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <button onClick={() => go("terms")}
                style={{ fontSize: "12px", color: C.textDim, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s", fontFamily: "var(--font-ui)" }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}>
                Terms of Service
              </button>
              <button onClick={scrollToTop} title="Back to top" className="ft-top-btn"
                style={{ background: C.cardBg, border: `1px solid ${C.divider}`, color: C.textMid }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </footer>
    </>
  )
}