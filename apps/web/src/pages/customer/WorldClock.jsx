import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import pageBg5 from "../../assets/PageBG5.webp"
import Footer  from "../../components/Footer"

const PH_TZ = "Asia/Manila"
const G      = "#2E8B34"
const DG     = "#0C573E"

const COUNTRIES = [
  { code:"PH", name:"Philippines",    city:"Manila",      tz:"Asia/Manila",         region:"Home",         isPH:true },
  { code:"SA", name:"Saudi Arabia",   city:"Riyadh",      tz:"Asia/Riyadh",         region:"Middle East" },
  { code:"AE", name:"UAE",            city:"Dubai",       tz:"Asia/Dubai",          region:"Middle East" },
  { code:"QA", name:"Qatar",          city:"Doha",        tz:"Asia/Qatar",          region:"Middle East" },
  { code:"KW", name:"Kuwait",         city:"Kuwait City", tz:"Asia/Kuwait",         region:"Middle East" },
  { code:"HK", name:"Hong Kong",      city:"Hong Kong",   tz:"Asia/Hong_Kong",      region:"Asia-Pacific" },
  { code:"SG", name:"Singapore",      city:"Singapore",   tz:"Asia/Singapore",      region:"Asia-Pacific" },
  { code:"JP", name:"Japan",          city:"Tokyo",       tz:"Asia/Tokyo",          region:"Asia-Pacific" },
  { code:"KR", name:"South Korea",    city:"Seoul",       tz:"Asia/Seoul",          region:"Asia-Pacific" },
  { code:"US", name:"USA (East)",     city:"New York",    tz:"America/New_York",    region:"North America" },
  { code:"US", name:"USA (West)",     city:"Los Angeles", tz:"America/Los_Angeles", region:"North America" },
  { code:"CA", name:"Canada",         city:"Toronto",     tz:"America/Toronto",     region:"North America" },
  { code:"GB", name:"United Kingdom", city:"London",      tz:"Europe/London",       region:"Europe" },
  { code:"IT", name:"Italy",          city:"Rome",        tz:"Europe/Rome",         region:"Europe" },
]

const REGIONS = ["All", "Middle East", "Asia-Pacific", "North America", "Europe"]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatus(tz) {
  const h = parseInt(new Date().toLocaleString("en-US", { timeZone:tz, hour:"numeric", hour12:false }))
  if (h >= 8 && h < 18)  return "working"
  if (h >= 18 && h < 23) return "evening"
  return "sleep"
}

const STATUS = {
  working: { label:"Working hours",         color:"#16a34a", darkColor:"#4ade80",  dot:"#22c55e" },
  evening: { label:"Evening hours",         color:"#b45309", darkColor:"#fbbf24",  dot:"#f59e0b" },
  sleep:   { label:"Late night / Sleeping", color:"#4f46e5", darkColor:"#a5b4fc",  dot:"#818cf8" },
}

function getOffset(tz) {
  const now = new Date()
  const ph  = new Date(now.toLocaleString("en-US", { timeZone:PH_TZ }))
  const loc = new Date(now.toLocaleString("en-US", { timeZone:tz }))
  const diff = (loc - ph) / 3_600_000
  if (diff === 0) return null
  const abs  = Math.abs(diff)
  const hrs  = Math.floor(abs)
  const mins = Math.round((abs - hrs) * 60)
  return { label: mins ? `${hrs}h ${mins}m` : `${hrs}h`, ahead: diff > 0 }
}

// ── Flag ──────────────────────────────────────────────────────────────────────
function Flag({ code, size = 20 }) {
  const lower = code.toLowerCase()
  return (
    <img
      src={`https://flagcdn.com/w40/${lower}.png`}
      alt={code}
      style={{ width:size*1.4, height:size, objectFit:"cover", borderRadius:"3px", flexShrink:0, border:"1px solid rgba(0,0,0,0.1)" }}
      onError={e => { e.target.style.display="none" }}
    />
  )
}

// ── Analog clock ──────────────────────────────────────────────────────────────
function AnalogClock({ tz, size = 80, isPH, isDark }) {
  const getAngles = () => {
    const now   = new Date()
    const local = new Date(now.toLocaleString("en-US", { timeZone:tz }))
    const h = local.getHours() % 12, m = local.getMinutes(), s = local.getSeconds()
    return { h:(h*30)+(m*0.5), m:(m*6)+(s*0.1), s:s*6 }
  }
  const [a, setA] = useState(getAngles)
  useEffect(() => { const id=setInterval(()=>setA(getAngles()),1000); return ()=>clearInterval(id) }, [tz])

  const cx = size/2, r = size/2 - 2.5
  const pt = (angle, len) => ({ x:cx+Math.sin((angle*Math.PI)/180)*len, y:cx-Math.cos((angle*Math.PI)/180)*len })

  const faceFill   = isDark ? "#1e293b" : "white"
  const faceStroke = isPH ? (isDark?"#4ade80":DG) : (isDark?"#334155":"#e2e8f0")
  const handC      = isDark ? (isPH?"#4ade80":"#94a3b8") : (isPH?DG:"#475569")
  const markerC    = isDark ? (isPH?"rgba(74,222,128,0.5)":"#334155") : (isPH?"#a8c5b2":"#cbd5e1")
  const secC       = isDark ? "#f87171" : "#ef4444"
  const centerC    = isDark ? (isPH?"#4ade80":"#64748b") : (isPH?DG:"#475569")

  const h = pt(a.h, r*0.50), m = pt(a.m, r*0.68), s = pt(a.s, r*0.76)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill={faceFill} stroke={faceStroke} strokeWidth={isPH?2:1.5}/>
      {Array.from({length:12}).map((_,i) => {
        const ang=i*30, i1=r*0.80, o1=r*0.92
        const s1={x:cx+Math.sin((ang*Math.PI)/180)*i1, y:cx-Math.cos((ang*Math.PI)/180)*i1}
        const e1={x:cx+Math.sin((ang*Math.PI)/180)*o1, y:cx-Math.cos((ang*Math.PI)/180)*o1}
        return <line key={i} x1={s1.x} y1={s1.y} x2={e1.x} y2={e1.y} stroke={markerC} strokeWidth={i%3===0?1.8:0.8} strokeLinecap="round"/>
      })}
      <line x1={cx} y1={cx} x2={h.x} y2={h.y} stroke={handC} strokeWidth={size>70?2.5:2} strokeLinecap="round"/>
      <line x1={cx} y1={cx} x2={m.x} y2={m.y} stroke={handC} strokeWidth={size>70?1.8:1.5} strokeLinecap="round"/>
      <line x1={cx} y1={cx} x2={s.x} y2={s.y} stroke={secC}  strokeWidth={1} strokeLinecap="round"/>
      <circle cx={cx} cy={cx} r={2.5} fill={centerC}/>
      <circle cx={cx} cy={cx} r={1}   fill={faceFill}/>
    </svg>
  )
}

// ── Digital time ──────────────────────────────────────────────────────────────
function DigitalTime({ tz, large, isDark }) {
  const get = () => new Date().toLocaleTimeString("en-PH", { timeZone:tz, hour:"2-digit", minute:"2-digit", hour12:true })
  const [t, setT] = useState(get)
  useEffect(() => { const id=setInterval(()=>setT(get()),1000); return ()=>clearInterval(id) }, [tz])
  const [hm, ap] = t.split(" ")
  return (
    <div className="flex items-baseline gap-1">
      <span style={{
        fontSize: large ? "clamp(26px,4vw,38px)" : "16px",
        fontWeight: 700,
        color: large ? (isDark?"#4ade80":DG) : (isDark?"#e2e8f0":"#1e293b"),
        letterSpacing: "-0.02em",
      }}>{hm}</span>
      <span style={{ fontSize: large?"14px":"11px", fontWeight:600, color:isDark?"#64748b":"#94a3b8" }}>{ap}</span>
    </div>
  )
}

function DateStr({ tz, isDark }) {
  const get = () => new Date().toLocaleDateString("en-PH", { timeZone:tz, weekday:"short", month:"short", day:"numeric" })
  const [d, setD] = useState(get)
  useEffect(() => { const id=setInterval(()=>setD(get()),10000); return ()=>clearInterval(id) }, [tz])
  return <span style={{ fontSize:"12px", color:isDark?"#64748b":"#94a3b8", fontWeight:500 }}>{d}</span>
}

// ── PH Banner — matches Bloomora card style ───────────────────────────────────
function PHBanner({ isDark }) {
  const bg  = isDark ? "#1a2332" : "white"
  const bdr = isDark ? "rgba(74,222,128,0.35)" : DG
  const nameC = isDark ? "#f1f5f9" : "#0f172a"
  const subC  = isDark ? "#94a3b8" : "#64748b"
  const tagBg = isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4"
  const tagC  = isDark ? "#4ade80" : G

  return (
    <div className="rounded-2xl overflow-hidden mb-6"
      style={{ backgroundColor:bg, border:`2px solid ${bdr}`, boxShadow: isDark?"0 0 0 1px rgba(74,222,128,0.1), 0 4px 24px rgba(0,0,0,0.3)":"0 4px 24px rgba(12,87,62,0.12)" }}>
      {/* Top accent bar */}
      <div style={{ height:"3px", background: isDark?"linear-gradient(90deg,rgba(74,222,128,0.2),#4ade80 30%,#86efac 50%,#4ade80 70%,rgba(74,222,128,0.2))":`linear-gradient(90deg,rgba(12,87,62,0.2),${DG} 30%,${G} 50%,${DG} 70%,rgba(12,87,62,0.2))` }}/>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
        {/* Clock */}
        <div className="flex-shrink-0">
          <AnalogClock tz={PH_TZ} size={100} isPH isDark={isDark}/>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <Flag code="PH" size={18}/>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:tagC }}>Your Local Time</span>
            {/* Live dot */}
            <span className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor:"#22c55e" }}/>
              <span style={{ fontSize:"10px", color:isDark?"#64748b":"#94a3b8" }}>Live</span>
            </span>
          </div>
          <p style={{ fontSize:"20px", fontWeight:700, color:nameC, marginBottom:"4px" }}>Philippines — Manila</p>
          <DigitalTime tz={PH_TZ} large isDark={isDark}/>
          <p style={{ fontSize:"12px", color:subC, marginTop:"4px" }}>UTC +08:00 · Philippine Standard Time</p>
        </div>

        {/* Tag */}
        <div className="hidden sm:flex flex-shrink-0">
          <span className="px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor:tagBg, color:tagC }}>
            Home Base
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Clock card ────────────────────────────────────────────────────────────────
function ClockCard({ country, isDark }) {
  const [status, setStatus] = useState(() => getStatus(country.tz))
  useEffect(() => { const id=setInterval(()=>setStatus(getStatus(country.tz)),5000); return ()=>clearInterval(id) }, [country.tz])

  const diff = getOffset(country.tz)
  const st   = STATUS[status]
  const stC  = isDark ? st.darkColor : st.color

  const cardBg   = isDark ? "#1a2332" : "white"
  const cardBdr  = isDark ? "#2d3748" : "#e5e7eb"
  const nameC    = isDark ? "#e2e8f0" : "#1e293b"
  const cityC    = isDark ? "#94a3b8" : "#64748b"
  const headerBg = isDark ? "#111827" : "#f8fafc"
  const footerBg = isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor:headerBg, borderBottom:`1px solid ${cardBdr}` }}>
        <div className="flex items-center gap-2.5">
          <Flag code={country.code} size={16}/>
          <div>
            <p className="text-xs font-bold leading-tight" style={{ color:nameC }}>{country.name}</p>
            <p style={{ fontSize:"11px", color:cityC }}>{country.city}</p>
          </div>
        </div>
        {diff ? (
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{
              backgroundColor: diff.ahead ? (isDark?"rgba(74,222,128,0.12)":"#f0fdf4") : (isDark?"rgba(251,191,36,0.12)":"#fffbeb"),
              color: diff.ahead ? (isDark?"#4ade80":"#15803d") : (isDark?"#fbbf24":"#92400e"),
            }}>
            {diff.ahead ? "+" : ""}{diff.label}
          </span>
        ) : (
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{ backgroundColor:isDark?"rgba(74,222,128,0.12)":"#f0fdf4", color:isDark?"#4ade80":G }}>
            Home
          </span>
        )}
      </div>

      {/* Clock body */}
      <div className="flex flex-col items-center py-5 gap-2.5">
        <AnalogClock tz={country.tz} size={76} isDark={isDark}/>
        <DigitalTime tz={country.tz} isDark={isDark}/>
        <DateStr tz={country.tz} isDark={isDark}/>
      </div>

      {/* Status footer */}
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderTop:`1px solid ${cardBdr}`, backgroundColor:footerBg }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor:st.dot }}/>
        <span style={{ fontSize:"11px", fontWeight:600, color:stC }}>{st.label}</span>
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ isDark }) {
  const bg  = isDark ? "#1a2332" : "#f8fafc"
  const bdr = isDark ? "#2d3748" : "#e5e7eb"
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl mb-6"
      style={{ backgroundColor:bg, border:`1px solid ${bdr}` }}>
      <span style={{ fontSize:"11px", fontWeight:700, color:isDark?"#64748b":"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em" }}>
        Status key
      </span>
      {Object.entries(STATUS).map(([key, s]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor:s.dot }}/>
          <span style={{ fontSize:"12px", fontWeight:500, color:isDark?s.darkColor:s.color }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorldClock({ onNavigate }) {
  const { isDark } = useTheme()
  const [region, setRegion] = useState("All")

  const pageBg   = isDark ? "#111827" : "white"
  const sectionBg = isDark ? "#111827" : "#f8fafc"
  const labelC   = isDark ? "#64748b" : "#94a3b8"
  const btnAct   = { backgroundColor:DG, color:"white", border:`1.5px solid ${DG}` }
  const btnInact = {
    backgroundColor: "transparent",
    color: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "1.5px solid #2d3748" : "1.5px solid #e2e8f0",
  }

  const others = COUNTRIES.filter(c => !c.isPH && (region === "All" || c.region === region))

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight:"280px" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0"
          style={{ background:"linear-gradient(to right,rgba(12,87,62,0.92) 0%,rgba(12,87,62,0.72) 55%,rgba(12,87,62,0.38) 100%)" }}/>
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color:"#86efac" }}>Help Center</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">World Clock</h1>
          <p className="text-base max-w-xl" style={{ color:"rgba(255,255,255,0.78)" }}>
            Sending flowers to a loved one abroad? Check the local time at their destination so your arrangement arrives at just the right moment.
          </p>
        </div>
      </div>

      {/* Clock section */}
      <div style={{ backgroundColor: sectionBg }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">

          {/* PH banner */}
          <PHBanner isDark={isDark}/>

          {/* Legend */}
          <Legend isDark={isDark}/>

          {/* Region filter */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span style={{ fontSize:"11px", fontWeight:700, color:labelC, textTransform:"uppercase", letterSpacing:"0.08em", marginRight:"4px" }}>
              Filter by region
            </span>
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all"
                style={region === r ? btnAct : btnInact}>
                {r}
              </button>
            ))}
          </div>

          {/* Clock grid — 2 cols mobile, 3 tablet, 4 desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {others.map(c => (
              <ClockCard key={c.tz + c.city} country={c} isDark={isDark}/>
            ))}
          </div>

          <p className="text-xs text-center mt-8"
            style={{ color:isDark?"#475569":"#94a3b8" }}>
            Working hours estimated as 8:00 AM to 6:00 PM local time. Daylight saving is applied automatically.
          </p>
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>
    </div>
  )
}