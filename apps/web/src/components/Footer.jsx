import { useEffect } from "react"
import paypalImg       from "../assets/footer/PayPal.png"
import westernUnionImg from "../assets/footer/WesternUnion.png"
import gcashImg        from "../assets/footer/GCash.png"
import bdoImg          from "../assets/footer/BDO.png"
import bpiImg          from "../assets/footer/BPI.png"
import metrobankImg    from "../assets/footer/Metrobank.png"
import lalamoveImg     from "../assets/footer/Lalamove.png"

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

const C = {
  accentLight: "#b8d4c2",
  text:        "rgba(255,255,255,0.95)",
  textMid:     "rgba(255,255,255,0.75)",
  textDim:     "rgba(255,255,255,0.45)",
  divider:     "rgba(255,255,255,0.08)",
  cardBg:      "rgba(255,255,255,0.04)",
}
const FOOTER_BG = "#0C5240"

const FOOTER_CSS = `
  .ft-navlink {
    background: none; border: none; cursor: pointer; padding: 0;
    font-size: 13px; text-align: left; display: block;
    transition: color 0.15s, padding-left 0.15s;
    font-family: var(--font-ui);
  }
  .ft-navlink:hover { color: white !important; padding-left: 5px; }
  .ft-social {
    width: 34px; height: 34px; display: flex; align-items: center;
    justify-content: center; border-radius: 8px; text-decoration: none;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-social:hover {
    background: rgba(125,170,145,0.18) !important;
    border-color: #7daa91 !important; color: white !important;
  }
  .ft-logo-img {
    border-radius: 4px; opacity: 0.82;
    transition: opacity 0.15s, transform 0.15s;
  }
  .ft-logo-img:hover { opacity: 1 !important; transform: scale(1.06); }
  .ft-top-btn {
    width: 32px; height: 32px; display: flex; align-items: center;
    justify-content: center; border-radius: 8px; cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .ft-top-btn:hover {
    background: rgba(125,170,145,0.20) !important;
    border-color: #7daa91 !important; color: white !important;
  }

  @keyframes ftSway1 { 0%,100%{ transform:rotate(-3deg)   } 50%{ transform:rotate(3deg)   } }
  @keyframes ftSway2 { 0%,100%{ transform:rotate(2.5deg)  } 50%{ transform:rotate(-3.5deg) } }
  @keyframes ftSway3 { 0%,100%{ transform:rotate(-2deg)   } 50%{ transform:rotate(2.5deg)  } }
  @keyframes ftSway4 { 0%,100%{ transform:rotate(3.5deg)  } 50%{ transform:rotate(-2.5deg) } }
  @keyframes ftSway5 { 0%,100%{ transform:rotate(-1.5deg) } 50%{ transform:rotate(3deg)    } }
  .ft-sway1 { animation: ftSway1 4.2s ease-in-out infinite; }
  .ft-sway2 { animation: ftSway2 3.7s ease-in-out infinite 0.6s; }
  .ft-sway3 { animation: ftSway3 5.0s ease-in-out infinite 1.1s; }
  .ft-sway4 { animation: ftSway4 3.4s ease-in-out infinite 0.3s; }
  .ft-sway5 { animation: ftSway5 4.8s ease-in-out infinite 0.9s; }

  .ft-flower-border { display: block; }
  @media (max-width: 379px) { .ft-flower-border { display: none; } }
`

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
   FLOWER MEADOW BORDER

   GRASS — Each tuft is 6 filled blade paths rendered with
   quadratic bezier curves: thin at the tip, wider at the base,
   fanning outward. Light and dark blades alternate for a lush
   layered look. Tufts sway independently via their own <g>.

   FLOWERS — Flat vector style: solid fill petals + one clean
   center circle. No sheen, no stamen dots.

   HEIGHT — clamp(60px, 18vw, 230px) keeps aspect ratio exact
   at every viewport width so flowers never squish.
══════════════════════════════════════════════════════════════ */
function FlowerBorder() {
  const GROUND  = FOOTER_BG
  const GROUND2 = "#0e6b53"
  const STEM_C  = "#176648"
  const GRASS_L = "#229960"
  const GRASS_D = "#156840"
  const LEAF_C  = "#1a7a52"
  const LEAF_D  = "#135c3c"

  /* ── Petal shapes ── */
  const roundPetal = (pw, ph) =>
    `M 0 0 C ${-pw*0.92} ${-ph*0.10},${-pw*0.78} ${-ph*0.86}, 0 ${-ph} ` +
    `C ${pw*0.78} ${-ph*0.86},${pw*0.92} ${-ph*0.10}, 0 0 Z`

  const daisyPetal = (pw, ph) =>
    `M 0 0 C ${-pw*0.88} ${-ph*0.08},${-pw*0.52} ${-ph*0.80}, 0 ${-ph} ` +
    `C ${pw*0.52} ${-ph*0.80},${pw*0.88} ${-ph*0.08}, 0 0 Z`

  /* ── Leaf ── */
  const leafPath = (lx, ly, len, tilt) => {
    const r  = a => (a * Math.PI) / 180
    const tx  = lx + Math.sin(r(tilt)) * len,  ty  = ly - Math.cos(r(tilt)) * len
    const cx1 = lx + Math.sin(r(tilt-36)) * len * 0.58, cy1 = ly - Math.cos(r(tilt-36)) * len * 0.58
    const cx2 = lx + Math.sin(r(tilt+36)) * len * 0.58, cy2 = ly - Math.cos(r(tilt+36)) * len * 0.58
    return `M ${lx} ${ly} C ${cx1} ${cy1} ${tx} ${ty} ${tx} ${ty} C ${tx} ${ty} ${cx2} ${cy2} ${lx} ${ly} Z`
  }

  /* ── Single grass blade ──────────────────────────────────────
     A filled pointed shape: wide at the base (groundY),
     curves to a sharp tip via quadratic bezier.
     cx/groundY = base centre | h = height | tilt = lean angle (°)
  ──────────────────────────────────────────────────────────── */
  const bladePath = (cx, groundY, h, tilt) => {
    const w  = Math.max(2.5, h * 0.11)      // half-width at base
    const r  = (tilt * Math.PI) / 180
    const tx = cx + Math.sin(r) * h          // tip x
    const ty = groundY - Math.cos(r) * h     // tip y
    const mx = cx + Math.sin(r) * h * 0.48   // bezier mid-control x
    const my = groundY - Math.cos(r) * h * 0.48  // bezier mid-control y
    // Left edge: base-left → control (mx - offset) → tip
    // Right edge: tip → control (mx + offset) → base-right
    return (
      `M ${cx - w} ${groundY} ` +
      `Q ${mx - w * 0.4} ${my} ${tx} ${ty} ` +
      `Q ${mx + w * 0.4} ${my} ${cx + w} ${groundY} Z`
    )
  }

  /* ── Grass tuft: 6 blades fanning from one base point ───────
     sz = overall size scale. Returns array of <path> elements.
     Blades: [x-offset, tilt°, height-fraction, useDark]
  ──────────────────────────────────────────────────────────── */
  const grassTuft = (cx, groundY, sz) => {
    const blades = [
      [ -sz * 0.55, -24, 0.80, true  ],
      [ -sz * 0.28, -13, 0.96, false ],
      [ -sz * 0.05,  -3, 1.06, false ],
      [  sz * 0.18,   9, 0.98, true  ],
      [  sz * 0.40,  19, 0.84, false ],
      [ -sz * 0.12,  13, 0.72, true  ],  // short front blade for depth
    ]
    return blades.map(([dx, tilt, hf, dark], i) => (
      <path key={i} d={bladePath(cx + dx, groundY, sz * hf, tilt)}
        fill={dark ? GRASS_D : GRASS_L} />
    ))
  }

  /* ── Flowers ── */
  const FLOWERS = [
    { x:62,   groundY:202, stemH:64,  pw:16, ph:25, n:5, type:"round", color:"#f590b8", hi:"#fac8da", center:"#d4a030", double:true,  sway:"ft-sway2" },
    { x:168,  groundY:197, stemH:48,  pw:13, ph:20, n:8, type:"daisy", color:"#f8c0d5", hi:"#fde0ea", center:"#7c4028", double:false, sway:"ft-sway4" },
    { x:285,  groundY:209, stemH:86,  pw:23, ph:35, n:5, type:"round", color:"#e878a8", hi:"#f5b0cc", center:"#d4a030", double:true,  sway:"ft-sway1" },
    { x:395,  groundY:200, stemH:54,  pw:14, ph:22, n:5, type:"round", color:"#f8c0d5", hi:"#fde0ea", center:"#b07030", double:false, sway:"ft-sway3" },
    { x:510,  groundY:207, stemH:76,  pw:20, ph:31, n:5, type:"round", color:"#c898d8", hi:"#e0c0ee", center:"#d4a030", double:true,  sway:"ft-sway5" },
    { x:620,  groundY:196, stemH:46,  pw:12, ph:19, n:8, type:"daisy", color:"#f0aac5", hi:"#fad0e4", center:"#7c4028", double:false, sway:"ft-sway2" },
    { x:740,  groundY:211, stemH:96,  pw:25, ph:38, n:5, type:"round", color:"#e878a8", hi:"#f5b0cc", center:"#d4a030", double:true,  sway:"ft-sway1" },
    { x:862,  groundY:200, stemH:60,  pw:16, ph:24, n:6, type:"round", color:"#f590b8", hi:"#fac8da", center:"#b07030", double:false, sway:"ft-sway3" },
    { x:978,  groundY:206, stemH:78,  pw:21, ph:32, n:5, type:"round", color:"#c898d8", hi:"#e0c0ee", center:"#d4a030", double:true,  sway:"ft-sway4" },
    { x:1092, groundY:197, stemH:50,  pw:13, ph:21, n:8, type:"daisy", color:"#f8c0d5", hi:"#fde0ea", center:"#7c4028", double:false, sway:"ft-sway2" },
    { x:1210, groundY:208, stemH:88,  pw:24, ph:37, n:5, type:"round", color:"#e878a8", hi:"#f5b0cc", center:"#d4a030", double:true,  sway:"ft-sway5" },
    { x:1320, groundY:199, stemH:56,  pw:15, ph:23, n:5, type:"round", color:"#f0aac5", hi:"#fad0e4", center:"#d4a030", double:false, sway:"ft-sway3" },
    { x:1400, groundY:204, stemH:68,  pw:18, ph:27, n:5, type:"round", color:"#f590b8", hi:"#fac8da", center:"#d4a030", double:true,  sway:"ft-sway1" },
  ]

  /* ── Standalone grass tufts between flowers ─────────────────
     Each has its own sway + transformOrigin so it moves
     independently from the flowers around it.
  ──────────────────────────────────────────────────────────── */
  const GRASS = [
    { x:18,   groundY:198, sz:30, sway:"ft-sway3" },
    { x:65,   groundY:197, sz:22, sway:"ft-sway1" },
    { x:115,  groundY:197, sz:38, sway:"ft-sway5" },
    { x:170,  groundY:198, sz:20, sway:"ft-sway3" },
    { x:226,  groundY:199, sz:33, sway:"ft-sway2" },
    { x:282,  groundY:197, sz:24, sway:"ft-sway4" },
    { x:340,  groundY:197, sz:37, sway:"ft-sway4" },
    { x:395,  groundY:198, sz:21, sway:"ft-sway2" },
    { x:452,  groundY:198, sz:30, sway:"ft-sway1" },
    { x:508,  groundY:197, sz:23, sway:"ft-sway5" },
    { x:565,  groundY:197, sz:40, sway:"ft-sway3" },
    { x:622,  groundY:198, sz:22, sway:"ft-sway1" },
    { x:680,  groundY:198, sz:33, sway:"ft-sway5" },
    { x:740,  groundY:197, sz:26, sway:"ft-sway3" },
    { x:800,  groundY:198, sz:43, sway:"ft-sway2" },
    { x:860,  groundY:198, sz:22, sway:"ft-sway4" },
    { x:920,  groundY:197, sz:34, sway:"ft-sway4" },
    { x:978,  groundY:198, sz:24, sway:"ft-sway2" },
    { x:1035, groundY:198, sz:37, sway:"ft-sway1" },
    { x:1093, groundY:197, sz:21, sway:"ft-sway5" },
    { x:1151, groundY:198, sz:30, sway:"ft-sway3" },
    { x:1208, groundY:197, sz:23, sway:"ft-sway1" },
    { x:1265, groundY:197, sz:40, sway:"ft-sway5" },
    { x:1313, groundY:198, sz:22, sway:"ft-sway3" },
    { x:1362, groundY:198, sz:33, sway:"ft-sway2" },
    { x:1432, groundY:198, sz:27, sway:"ft-sway4" },
  ]

  const groundFrontPath = `
    M0,270 L0,192
    C30,188 55,186 90,190 C125,194 148,196 185,192
    C222,188 248,182 285,185 C322,188 348,194 385,192
    C415,190 440,184 480,186 C520,188 545,194 585,192
    C620,190 645,183 685,185 C725,187 750,193 790,192
    C825,191 850,184 892,186 C934,188 958,194 998,192
    C1030,190 1055,183 1095,185 C1135,187 1160,193 1200,192
    C1232,191 1258,184 1300,186 C1342,188 1368,192 1408,190
    C1428,189 1436,190 1440,192 L1440,270 Z`

  const groundBackPath = `
    M0,270 L0,206
    C90,198 180,194 270,200 C360,206 440,200 540,194
    C640,188 720,196 810,200 C900,204 980,196 1080,192
    C1180,188 1260,196 1360,198 C1400,199 1425,197 1440,200
    L1440,270 Z`

  return (
    <div className="ft-flower-border" aria-hidden="true"
      style={{ display:"block", width:"100%", lineHeight:0, marginBottom:"-8px", pointerEvents:"none", backgroundColor:"transparent" }}>
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
        style={{ display:"block", width:"100%", height:"clamp(60px, 18vw, 230px)" }}>

        {/* Back ground */}
        <path fill={GROUND2} fillOpacity="0.55" d={groundBackPath} />

        {/* Standalone grass tufts — drawn first so flowers sit on top */}
        {GRASS.map((g, idx) => (
          <g key={`gt-${idx}`} className={g.sway}
            style={{ transformOrigin: `${g.x}px ${g.groundY}px` }}>
            {grassTuft(g.x, g.groundY, g.sz)}
          </g>
        ))}

        {/* Flowers with grass tuft at base */}
        {FLOWERS.map((f, idx) => {
          const bloomY = f.groundY - f.stemH
          const leaf1Y = f.groundY - f.stemH * 0.38
          const leaf2Y = f.groundY - f.stemH * 0.58
          const step   = 360 / f.n
          const angles = Array.from({ length: f.n }, (_, i) => i * step)
          const pd     = f.type === "daisy" ? daisyPetal : roundPetal
          const curve  = [5, -4, 3, -5, 4, -3, 2][idx % 7]

          return (
            <g key={idx} className={f.sway}
              style={{ transformOrigin: `${f.x}px ${f.groundY}px` }}>

              {/* Tiny grass tuft at stem root — stays short, won't cover stem */}
              {grassTuft(f.x, f.groundY, f.pw * 0.9)}

              {/* Stem */}
              <path
                d={`M ${f.x} ${f.groundY} Q ${f.x + curve} ${f.groundY - f.stemH * 0.5} ${f.x} ${bloomY}`}
                stroke={STEM_C} strokeWidth={f.pw > 20 ? 3.0 : 2.3}
                strokeLinecap="round" fill="none"
              />

              {/* Leaves */}
              <path d={leafPath(f.x, leaf1Y, f.stemH * 0.30, -34)} fill={LEAF_C} />
              <path d={leafPath(f.x, leaf2Y, f.stemH * 0.26, 40)}  fill={LEAF_D} />

              {/* Bloom */}
              <g transform={`translate(${f.x}, ${bloomY})`}>
                {/* Back petal layer */}
                {f.double && angles.map((a, i) => (
                  <path key={`b${i}`} d={pd(f.pw * 0.80, f.ph * 0.88)} fill={f.hi}
                    fillOpacity="0.92" transform={`rotate(${a + step * 0.5})`} />
                ))}
                {/* Main petals */}
                {angles.map((a, i) => (
                  <path key={`p${i}`} d={pd(f.pw, f.ph)} fill={f.color}
                    transform={`rotate(${a})`} />
                ))}
                {/* Inner highlight sheen */}
                {angles.map((a, i) => (
                  <path key={`s${i}`} d={pd(f.pw * 0.44, f.ph * 0.66)} fill="white"
                    fillOpacity="0.15" transform={`rotate(${a})`} />
                ))}
                {/* Center disk + inner shadow */}
                <circle cx="0" cy="0" r={f.pw * 0.60} fill={f.center} />
                <circle cx="0" cy="0" r={f.pw * 0.32} fill="#5a2c10" fillOpacity="0.32" />
                {/* Stamen ring dots */}
                {Array.from({ length: 5 }, (_, i) => {
                  const a = (i * 72 * Math.PI) / 180
                  return (
                    <circle key={`st${i}`}
                      cx={Math.cos(a) * f.pw * 0.44} cy={Math.sin(a) * f.pw * 0.44}
                      r={f.pw * 0.07} fill="#5a2c10" fillOpacity="0.28" />
                  )
                })}
              </g>
            </g>
          )
        })}

        {/* Front ground — y extends to 270 so no seam shows */}
        <path fill={GROUND} d={groundFrontPath} />
      </svg>
    </div>
  )
}

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
      <FlowerBorder />

      <footer style={{ backgroundColor: FOOTER_BG, color: "white" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 40px 0" }}>

          {/* ROW 1 */}
          <div style={{ display:"flex", alignItems:"center", gap:"20px", flexWrap:"wrap",
            paddingBottom:"36px", borderBottom:`1px solid ${C.divider}`, marginBottom:"40px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
              <img src="/src/assets/EstingsLogo.svg" alt=""
                style={{ width:"40px", height:"40px", objectFit:"contain" }}
                onError={e => e.target.style.display="none"} />
              <img src="/src/assets/Estings.svg" alt="Esting's"
                style={{ height:"34px", objectFit:"contain", filter:"brightness(0) invert(1)" }}
                onError={e => e.target.style.display="none"} />
            </div>
            <div style={{ width:"1px", height:"36px", background:"rgba(255,255,255,0.20)", flexShrink:0 }} />
            <p style={{ fontSize:"12.5px", color:C.textMid, margin:0, lineHeight:"1.6", fontFamily:"var(--font-ui)", flexShrink:0 }}>
              Fresh flowers, handcrafted with care.<br />Serving Manila &amp; Pampanga since 1959.
            </p>
            <div style={{ flex:1 }} />
            <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0, flexWrap:"wrap" }}>
              <p style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:"0.13em", textTransform:"uppercase", color:C.accentLight, margin:0, whiteSpace:"nowrap" }}>
                Follow Us On
              </p>
              <div style={{ display:"flex", gap:"6px" }}>
                {SOCIAL_LINKS.map(s => (
                  <a key={s.name} href={s.href} title={s.name} target="_blank" rel="noopener noreferrer"
                    className="ft-social"
                    style={{ background:C.cardBg, border:`1px solid ${C.divider}`, color:C.textMid }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2 */}
          <div style={{ display:"grid", gridTemplateColumns:"160px 140px 1fr 1fr auto", gap:"40px",
            alignItems:"start", paddingBottom:"44px" }} className="ft-main-row">
            <div>
              <ColLabel>Quick Links</ColLabel>
              <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"10px" }}>
                {QUICK_LINKS.map(l => (
                  <li key={l.label}>
                    <button className="ft-navlink" onClick={() => go(l.page)} style={{ color:C.textMid }}>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ColLabel>Customer Care</ColLabel>
              <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"10px" }}>
                {CUSTOMER_CARE.map(l => (
                  <li key={l.label}>
                    <button className="ft-navlink" onClick={() => go(l.page)} style={{ color:C.textMid }}>
                      {l.label}
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
            <div style={{ display:"flex", flexDirection:"column", gap:"22px" }}>
              <div>
                <ColLabel>We Accept</ColLabel>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap", maxWidth:"160px" }}>
                  {PAYMENT_METHODS.map(({ name, img }) => (
                    <img key={name} src={img} alt={name} title={name} className="ft-logo-img"
                      style={{ height:"22px", width:"auto", maxWidth:"54px", objectFit:"contain" }} />
                  ))}
                </div>
              </div>
              <div>
                <ColLabel>Shipped Via</ColLabel>
                <img src={lalamoveImg} alt="Lalamove" className="ft-logo-img"
                  style={{ height:"24px", width:"auto", maxWidth:"90px", objectFit:"contain", display:"block" }} />
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 1024px) { .ft-main-row { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (max-width: 640px)  { .ft-main-row { grid-template-columns: repeat(2, 1fr) !important; gap: 28px !important; } }
            @media (max-width: 400px)  { .ft-main-row { grid-template-columns: 1fr !important; } }
          `}</style>
        </div>

        {/* Copyright bar */}
        <div style={{ borderTop:`1px solid ${C.divider}`, background:"rgba(0,0,0,0.18)" }}>
          <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"14px 40px",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
            <p style={{ fontSize:"12px", color:C.textDim, margin:0, fontFamily:"var(--font-ui)" }}>
              © {new Date().getFullYear()} Esting's Flower International Inc. All rights reserved.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
              <button onClick={() => go("terms")}
                style={{ fontSize:"12px", color:C.textDim, background:"none", border:"none", cursor:"pointer", padding:0, transition:"color 0.15s", fontFamily:"var(--font-ui)" }}
                onMouseEnter={e => e.currentTarget.style.color = C.text}
                onMouseLeave={e => e.currentTarget.style.color = C.textDim}>
                Terms of Service
              </button>
              <button onClick={scrollToTop} title="Back to top" className="ft-top-btn"
                style={{ background:C.cardBg, border:`1px solid ${C.divider}`, color:C.textMid }}>
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