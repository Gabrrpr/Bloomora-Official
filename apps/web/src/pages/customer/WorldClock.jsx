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
  if (h >= 6 && h < 17)  return "day"
  if (h >= 17 && h < 21) return "evening"
  return "night"
}

// Soft, brand-neutral day/night descriptors — no dashboard dots.
const SunIcon = (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>
const SunsetIcon = (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 10V3M5.6 6.6l1.4 1.4M2 14h2M20 14h2M17 8l1.4-1.4M22 20H2M16 14a4 4 0 0 0-8 0"/></svg>
const MoonIcon = (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>

const STATUS = {
  day:     { label:"Daytime", Icon:SunIcon },
  evening: { label:"Evening", Icon:SunsetIcon },
  night:   { label:"Night",   Icon:MoonIcon },
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
      style={{ width:size*1.4, height:size, objectFit:"cover", borderRadius:"3px", flexShrink:0, border:"1px solid rgba(0,0,0,0.08)" }}
      onError={e => { e.target.style.display="none" }}
    />
  )
}

// ── Digital time ──────────────────────────────────────────────────────────────
function DigitalTime({ tz, large, isDark }) {
  const get = () => new Date().toLocaleTimeString("en-PH", { timeZone:tz, hour:"2-digit", minute:"2-digit", hour12:true })
  const [t, setT] = useState(get)
  useEffect(() => { const id=setInterval(()=>setT(get()),1000); return ()=>clearInterval(id) }, [tz])
  const [hm, ap] = t.split(" ")
  return (
    <div className="flex items-baseline gap-1.5">
      <span style={{
        fontSize: large ? "clamp(30px,5vw,44px)" : "26px",
        fontWeight: 700,
        color: large ? (isDark?"#4ade80":DG) : (isDark?"#f1f5f9":"#111827"),
        letterSpacing: "-0.02em",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>{hm}</span>
      <span style={{ fontSize: large?"15px":"13px", fontWeight:600, color:isDark?"#64748b":"#94a3b8" }}>{ap}</span>
    </div>
  )
}

function DateStr({ tz, isDark }) {
  const get = () => new Date().toLocaleDateString("en-PH", { timeZone:tz, weekday:"short", month:"short", day:"numeric" })
  const [d, setD] = useState(get)
  useEffect(() => { const id=setInterval(()=>setD(get()),10000); return ()=>clearInterval(id) }, [tz])
  return <span style={{ fontSize:"12.5px", color:isDark?"#94a3b8":"#6b7280" }}>{d}</span>
}

// ── PH featured card ──────────────────────────────────────────────────────────
function PHBanner({ isDark }) {
  const bg    = isDark ? "#1a2332" : "white"
  const bdr   = isDark ? "rgba(74,222,128,0.3)" : "rgba(46,139,52,0.3)"
  const nameC = isDark ? "#f1f5f9" : "#1f2937"
  const subC  = isDark ? "#94a3b8" : "#6b7280"
  const tagBg = isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4"
  const tagC  = isDark ? "#4ade80" : G

  return (
    <div className="rounded-2xl mb-8 p-5 sm:p-8"
      style={{ backgroundColor:bg, border:`1px solid ${bdr}`, boxShadow: isDark?"0 8px 32px rgba(0,0,0,0.3)":"0 8px 32px rgba(12,87,62,0.08)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
            <Flag code="PH" size={18}/>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:tagC }}>Your Local Time</span>
          </div>
          <p style={{ fontSize:"15px", fontWeight:600, color:nameC, marginBottom:"10px" }}>Philippines — Manila</p>
          <DigitalTime tz={PH_TZ} large isDark={isDark}/>
          <p style={{ fontSize:"12.5px", color:subC, marginTop:"8px" }}>UTC +08:00 · Philippine Standard Time</p>
        </div>
        <div className="flex sm:flex-shrink-0 justify-center">
          <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor:tagBg, color:tagC }}>
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
  const Icon = st.Icon

  const cardBg  = isDark ? "#1a2332" : "white"
  const cardBdr = isDark ? "#2d3748" : "#e5e7eb"
  const accent  = isDark ? "#4ade80" : G
  const nameC   = isDark ? "#e5e7eb" : "#1f2937"
  const cityC   = isDark ? "#94a3b8" : "#6b7280"
  const mutedC  = isDark ? "#94a3b8" : "#6b7280"
  const chipBg  = isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"
  const chipC   = isDark ? "#cbd5e1" : "#4b5563"

  return (
    <div className="rounded-2xl p-4 sm:p-5"
      style={{ backgroundColor:cardBg, border:`1px solid ${cardBdr}`, transition:"transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow = isDark ? "0 14px 30px rgba(0,0,0,0.45)" : "0 14px 30px rgba(46,139,52,0.12)"; e.currentTarget.style.borderColor = accent }}
      onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor = cardBdr }}>

      {/* Header: flag + place, offset chip */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Flag code={country.code} size={18}/>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight truncate" style={{ color:nameC }}>{country.name}</p>
            <p style={{ fontSize:"11.5px", color:cityC }}>{country.city}</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor:chipBg, color:chipC }}>
          {diff ? `${diff.ahead ? "+" : "−"}${diff.label}` : "Same"}
        </span>
      </div>

      {/* Time */}
      <DigitalTime tz={country.tz} isDark={isDark}/>
      <div className="mt-1.5">
        <DateStr tz={country.tz} isDark={isDark}/>
      </div>

      {/* Day/night descriptor — subtle, no dashboard dot */}
      <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop:`1px solid ${cardBdr}`, color:mutedC }}>
        <Icon />
        <span style={{ fontSize:"11.5px", fontWeight:500 }}>{st.label}</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorldClock({ onNavigate }) {
  const { isDark } = useTheme()
  const [region, setRegion] = useState("All")

  const pageBg    = isDark ? "#0f172a" : "white"
  const sectionBg = isDark ? "#0f172a" : "#F7F8FA"
  const headingC  = isDark ? "#f3f4f6" : "#1f2937"
  const labelC    = isDark ? "#94a3b8" : "#9ca3af"
  const accent    = isDark ? "#4ade80" : G
  const btnAct    = { backgroundColor: accent, color: isDark ? "#0f172a" : "white", border:`1px solid ${accent}` }
  const btnInact  = {
    backgroundColor: "transparent",
    color: isDark ? "#94a3b8" : "#6b7280",
    border: isDark ? "1px solid #2d3748" : "1px solid #e5e7eb",
  }

  const others = COUNTRIES.filter(c => !c.isPH && (region === "All" || c.region === region))

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>
      <style>{`@keyframes pageRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      {/* Hero — matches About Us */}
      <div className="relative overflow-hidden max-w-[1600px] mx-auto" style={{ minHeight:"280px", animation:"pageRise 0.6s ease 0.05s both" }}>
        <img src={pageBg5} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0"
          style={{ background:"linear-gradient(to right,rgba(12,87,62,0.92) 0%,rgba(12,87,62,0.72) 55%,rgba(12,87,62,0.38) 100%)" }}/>
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-10 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 sm:mb-4" style={{ color:"#86efac" }}>Help Center</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 sm:mb-5">World Clock</h1>
            <p className="text-sm sm:text-lg leading-relaxed" style={{ color:"rgba(255,255,255,0.8)" }}>
              Sending flowers to a loved one abroad? Check the local time at their destination so your arrangement arrives at just the right moment.
            </p>
          </div>
        </div>
      </div>

      {/* Clock section */}
      <div style={{ backgroundColor: sectionBg }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-10 py-10 sm:py-16" style={{ animation:"pageRise 0.6s ease 0.16s both" }}>

          {/* PH featured card */}
          <PHBanner isDark={isDark}/>

          {/* Section heading + region filter */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accent }}>Around the World</p>
              <h2 className="text-2xl font-bold" style={{ color:headingC }}>Local times abroad</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {REGIONS.map(r => (
                <button key={r} onClick={() => setRegion(r)}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all"
                  style={region === r ? btnAct : btnInact}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Clock grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {others.map(c => (
              <ClockCard key={c.tz + c.city} country={c} isDark={isDark}/>
            ))}
          </div>

          <p className="text-xs mt-8" style={{ color:labelC }}>
            Times update live and follow each location's daylight saving automatically. Offsets shown are relative to Manila.
          </p>
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>
    </div>
  )
}
