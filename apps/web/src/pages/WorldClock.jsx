import { useState, useEffect } from "react"

const PH_TZ = "Asia/Manila"
const DG = "#0C573E"
const G  = "#2E8B34"

const COUNTRIES = [
  { code: "PH", name: "Philippines",   city: "Manila",      tz: "Asia/Manila",          region: "Home",         isPH: true },
  { code: "SA", name: "Saudi Arabia",  city: "Riyadh",      tz: "Asia/Riyadh",          region: "Middle East" },
  { code: "AE", name: "UAE",           city: "Dubai",       tz: "Asia/Dubai",            region: "Middle East" },
  { code: "QA", name: "Qatar",         city: "Doha",        tz: "Asia/Qatar",            region: "Middle East" },
  { code: "KW", name: "Kuwait",        city: "Kuwait City", tz: "Asia/Kuwait",           region: "Middle East" },
  { code: "HK", name: "Hong Kong",     city: "Hong Kong",   tz: "Asia/Hong_Kong",        region: "Asia-Pacific" },
  { code: "SG", name: "Singapore",     city: "Singapore",   tz: "Asia/Singapore",        region: "Asia-Pacific" },
  { code: "JP", name: "Japan",         city: "Tokyo",       tz: "Asia/Tokyo",            region: "Asia-Pacific" },
  { code: "KR", name: "South Korea",   city: "Seoul",       tz: "Asia/Seoul",            region: "Asia-Pacific" },
  { code: "US", name: "USA (East)",    city: "New York",    tz: "America/New_York",      region: "North America" },
  { code: "US", name: "USA (West)",    city: "Los Angeles", tz: "America/Los_Angeles",   region: "North America" },
  { code: "CA", name: "Canada",        city: "Toronto",     tz: "America/Toronto",       region: "North America" },
  { code: "GB", name: "United Kingdom", city: "London",     tz: "Europe/London",         region: "Europe" },
  { code: "IT", name: "Italy",         city: "Rome",        tz: "Europe/Rome",           region: "Europe" },
]

const REGIONS = ["All", "Middle East", "Asia-Pacific", "North America", "Europe"]

// ── Status helpers ────────────────────────────────────────────────────────────
function getStatus(tz) {
  const h = parseInt(new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false }))
  if (h >= 8  && h < 18) return "working"
  if (h >= 18 && h < 23) return "nonwork"
  return "sleep"
}

const STATUS = {
  working: { label: "Working hours",                   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  nonwork: { label: "Non-working hours",               color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  sleep:   { label: "Sleeping / Public holidays",      color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
}

// SVG status icons
const StatusIcon = ({ type, size = 14 }) => {
  const c = STATUS[type].color
  if (type === "working") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" fill={c} fillOpacity="0.15"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  )
  if (type === "nonwork") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill={c} fillOpacity="0.15"/>
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={c} fillOpacity="0.15"/>
      <path d="M12 6v6l4 2" stroke={c} strokeWidth="1.5"/>
    </svg>
  )
}

// ── Flag image via flagcdn ───────────────────────────────────────────────────
const Flag = ({ code, size = 24 }) => {
  const lower = code.toLowerCase()
  // HK special case — use a Hong Kong flag
  const src = lower === "hk"
    ? "https://flagcdn.com/w40/hk.png"
    : `https://flagcdn.com/w40/${lower}.png`
  return (
    <img
      src={src}
      alt={code}
      style={{ width: size * 1.4, height: size, objectFit: "cover", borderRadius: "3px", flexShrink: 0, border: "1px solid rgba(0,0,0,0.08)" }}
      onError={e => { e.target.style.display = "none" }}
    />
  )
}

// ── Analog clock face ─────────────────────────────────────────────────────────
function AnalogClock({ tz, size = 90, isPH }) {
  const getAngles = () => {
    const now = new Date()
    const local = new Date(now.toLocaleString("en-US", { timeZone: tz }))
    const h = local.getHours() % 12
    const m = local.getMinutes()
    const s = local.getSeconds()
    return {
      h: (h * 30) + (m * 0.5),           // 360/12
      m: (m * 6) + (s * 0.1),            // 360/60
      s: s * 6,
    }
  }

  const [a, setA] = useState(getAngles)
  useEffect(() => {
    const id = setInterval(() => setA(getAngles()), 1000)
    return () => clearInterval(id)
  }, [tz])

  const cx = size / 2
  const r  = size / 2 - 3
  const toXY = (angle, len) => ({
    x: cx + Math.sin((angle * Math.PI) / 180) * len,
    y: cx - Math.cos((angle * Math.PI) / 180) * len,
  })

  const hEnd = toXY(a.h, r * 0.52)
  const mEnd = toXY(a.m, r * 0.72)
  const sEnd = toXY(a.s, r * 0.80)

  const accentColor = isPH ? DG : "#374151"

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <circle cx={cx} cy={cx} r={r} fill="white" stroke={isPH ? DG : "#e5e7eb"} strokeWidth={isPH ? 2.5 : 1.5} />

      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = i * 30
        const inner = r * 0.82
        const outer = r * 0.94
        const s = { x: cx + Math.sin((angle * Math.PI) / 180) * inner, y: cx - Math.cos((angle * Math.PI) / 180) * inner }
        const e = { x: cx + Math.sin((angle * Math.PI) / 180) * outer, y: cx - Math.cos((angle * Math.PI) / 180) * outer }
        return <line key={i} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={isPH ? "#a8c5b2" : "#d1d5db"} strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />
      })}

      {/* Minute markers (small dots) */}
      {Array.from({ length: 60 }).map((_, i) => {
        if (i % 5 === 0) return null
        const angle = i * 6
        const dist  = r * 0.90
        return <circle key={i} cx={cx + Math.sin((angle * Math.PI) / 180) * dist} cy={cx - Math.cos((angle * Math.PI) / 180) * dist} r={0.8} fill="#e5e7eb" />
      })}

      {/* Hour hand */}
      <line x1={cx} y1={cx} x2={hEnd.x} y2={hEnd.y} stroke={accentColor} strokeWidth={size > 80 ? 3 : 2.5} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cx} x2={mEnd.x} y2={mEnd.y} stroke={accentColor} strokeWidth={size > 80 ? 2 : 1.8} strokeLinecap="round" />
      {/* Second hand */}
      <line x1={cx} y1={cx} x2={sEnd.x} y2={sEnd.y} stroke={isPH ? G : "#ef4444"} strokeWidth={1} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={cx} cy={cx} r={size > 80 ? 3 : 2.5} fill={isPH ? DG : "#374151"} />
      <circle cx={cx} cy={cx} r={1.2} fill="white" />
    </svg>
  )
}

// ── Digital time ──────────────────────────────────────────────────────────────
function DigitalTime({ tz }) {
  const get = () => new Date().toLocaleTimeString("en-PH", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true })
  const [t, setT] = useState(get)
  useEffect(() => {
    const id = setInterval(() => setT(get()), 1000)
    return () => clearInterval(id)
  }, [tz])
  const [hm, ampm] = t.split(" ")
  return (
    <div className="flex items-baseline gap-1" style={{ fontVariantNumeric: "tabular-nums" }}>
      <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827", fontFamily: "ui-monospace, monospace" }}>{hm}</span>
      <span style={{ fontSize: "10px", fontWeight: 600, color: "#9ca3af" }}>{ampm}</span>
    </div>
  )
}

function getDateStr(tz) {
  return new Date().toLocaleDateString("en-PH", { timeZone: tz, weekday: "short", month: "short", day: "numeric" })
}

function getOffset(tz) {
  const now  = new Date()
  const ph   = new Date(now.toLocaleString("en-US", { timeZone: PH_TZ }))
  const loc  = new Date(now.toLocaleString("en-US", { timeZone: tz }))
  const diff = (loc - ph) / 3_600_000
  if (diff === 0) return null
  const abs  = Math.abs(diff)
  const hrs  = Math.floor(abs)
  const mins = Math.round((abs - hrs) * 60)
  return { label: mins ? `${hrs}h ${mins}m` : `${hrs}h`, ahead: diff > 0 }
}

// ── Clock card ────────────────────────────────────────────────────────────────
function ClockCard({ country }) {
  const [status, setStatus] = useState(() => getStatus(country.tz))
  const [date,   setDate]   = useState(() => getDateStr(country.tz))
  useEffect(() => {
    const id = setInterval(() => {
      setStatus(getStatus(country.tz))
      setDate(getDateStr(country.tz))
    }, 1000)
    return () => clearInterval(id)
  }, [country.tz])

  const diff = getOffset(country.tz)
  const s    = STATUS[status]

  return (
    <div className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{
        border: country.isPH ? `1.5px solid ${DG}` : "1px solid #e8edf2",
        boxShadow: country.isPH ? `0 2px 12px rgba(12,87,62,0.12)` : "0 1px 4px rgba(0,0,0,0.05)",
      }}>

      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: country.isPH ? "#f0fdf4" : "#fafbfc" }}>
        <div className="flex items-center gap-2">
          <Flag code={country.code} size={16} />
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">{country.name}</p>
            <p className="text-[10px] text-gray-400">{country.city}</p>
          </div>
        </div>
        {country.isPH ? (
          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: G }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Home
          </span>
        ) : diff ? (
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
            backgroundColor: diff.ahead ? "#f0fdf4" : "#fffbeb",
            color:           diff.ahead ? "#15803d" : "#92400e",
            border:          diff.ahead ? "1px solid #bbf7d0" : "1px solid #fde68a",
            fontFamily: "ui-monospace, monospace",
          }}>
            {diff.ahead ? "+" : "−"}{diff.label}
          </span>
        ) : null}
      </div>

      {/* Clock face */}
      <div className="flex flex-col items-center py-4 px-3 gap-2">
        <AnalogClock tz={country.tz} size={88} isPH={country.isPH} />
        <DigitalTime tz={country.tz} />
        <p className="text-[10px] text-gray-400">{date}</p>
      </div>

      {/* Status footer */}
      <div className="px-3 py-2 flex items-center gap-1.5"
        style={{ borderTop: "1px solid #f1f5f9", backgroundColor: s.bg }}>
        <StatusIcon type={status} size={13} />
        <span style={{ fontSize: "10px", fontWeight: 600, color: s.color }}>{s.label}</span>
      </div>
    </div>
  )
}

// ── PH Date line ─────────────────────────────────────────────────────────────
function PHDateLine({ tz }) {
  const get = () => new Date().toLocaleDateString("en-PH", { timeZone: tz, weekday: "long", month: "long", day: "numeric", year: "numeric" })
  const [d, setD] = useState(get)
  useEffect(() => {
    const id = setInterval(() => setD(get()), 5000)
    return () => clearInterval(id)
  }, [tz])
  return <p style={{ fontSize: "11px", color: "#6b7280", margin: 0, textAlign: "right" }}>{d}</p>
}

// ── PH Hero banner ────────────────────────────────────────────────────────────
function PHHero() {
  const ph = COUNTRIES[0]
  return (
    <div className="rounded-xl overflow-hidden mb-5"
      style={{ border: `1.5px solid ${DG}`, backgroundColor: "#fff", boxShadow: `0 4px 20px rgba(12,87,62,0.10)` }}>
      <div style={{ height: "3px", background: `linear-gradient(90deg, transparent, ${DG} 20%, #a8c5b2 50%, ${DG} 80%, transparent)` }} />
      <div className="ph-hero-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "24px", padding: "24px 32px" }}>
        {/* Left: clock */}
        <div style={{ flexShrink: 0 }}>
          <AnalogClock tz={PH_TZ} size={120} isPH />
        </div>

        {/* Center: info — fills all remaining space */}
        <div className="ph-hero-center">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Flag code="PH" size={18} />
            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: G, margin: 0 }}>Your Local Time</p>
          </div>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>Philippines — Manila</p>
          <DigitalTimeLarge tz={PH_TZ} />
          <p style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace", color: "#6b7280", margin: "4px 0 0", fontWeight: 600 }}>
            UTC +08:00 · Philippine Standard Time
          </p>
        </div>

        {/* Right: live badge */}
        <div className="ph-hero-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#6b7280" }}>Live</span>
          </div>
          <PHDateLine tz={PH_TZ} />
        </div>
      </div>
    </div>
  )
}

function DigitalTimeLarge({ tz }) {
  const get = () => new Date().toLocaleTimeString("en-PH", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
  const [t, setT] = useState(get)
  useEffect(() => {
    const id = setInterval(() => setT(get()), 1000)
    return () => clearInterval(id)
  }, [tz])
  const parts = t.split(" ")
  const [hms, ampm] = [parts[0], parts[1]]
  const [h, m, s]   = hms.split(":")
  return (
    <div className="flex items-baseline gap-1 mt-1" style={{ fontVariantNumeric: "tabular-nums" }}>
      <span style={{ fontSize: "36px", fontWeight: 700, color: DG, fontFamily: "ui-monospace, monospace", lineHeight: 1 }}>{h}:{m}</span>
      <span style={{ fontSize: "18px", fontWeight: 600, color: "#6b7280", fontFamily: "ui-monospace, monospace" }}>{s}</span>
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#9ca3af" }}>{ampm}</span>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Legend:</span>
      {Object.entries(STATUS).map(([key, s]) => (
        <span key={key} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md"
          style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
          <StatusIcon type={key} size={13} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const CLOCK_CSS = `
  @media (max-width: 640px) {
    .ph-hero-grid {
      grid-template-columns: 1fr !important;
      justify-items: center;
      text-align: center;
      padding: 24px 20px !important;
      gap: 16px !important;
    }
    .ph-hero-right { display: none !important; }
    .ph-hero-center {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      text-align: center !important;
    }
    .ph-hero-center > div { justify-content: center !important; }
  }
  @media (max-width: 480px) {
    .clock-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
  }
`

export default function WorldClock() {
  const [region, setRegion] = useState("All")
  useEffect(() => {
    if (document.getElementById("wc-css")) return
    const s = document.createElement("style"); s.id = "wc-css"; s.textContent = CLOCK_CSS
    document.head.appendChild(s)
    return () => document.getElementById("wc-css")?.remove()
  }, [])

  const others   = COUNTRIES.filter(c => !c.isPH && (region === "All" || c.region === region))

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 16px 40px" }}>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">World Clock</h1>
        <p className="text-sm text-gray-400 mt-0.5">Live time for common OFW destinations, relative to Philippine time.</p>
      </div>

      <PHHero />
      <Legend />

      {/* Region filter */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Region:</span>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setRegion(r)}
            className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
            style={{
              backgroundColor: region === r ? DG      : "transparent",
              color:           region === r ? "white" : "#6b7280",
              border:          region === r ? `1px solid ${DG}` : "1px solid #e5e7eb",
            }}>
            {r}
          </button>
        ))}
      </div>

      {/* Clock grid */}
      <div className="clock-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {others.map(c => <ClockCard key={c.tz + c.city} country={c} />)}
      </div>

      <p className="text-xs text-gray-400 text-center mt-5">
        Working hours estimated as 8:00 AM – 6:00 PM local time. Daylight saving applied automatically.
      </p>
    </div>
  )
}