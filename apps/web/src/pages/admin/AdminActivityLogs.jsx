import { useState, useEffect, useCallback, Fragment } from "react"
import { useTheme } from "../../context/ThemeContext"
import { DG, G, ADMIN_PAGE_SIZE } from "./_adminShared"
import { api } from "../../services/api.js"
import estingsWordmark from "../../assets/Estings.svg"

const ACTION_OPTIONS = ["All Actions", "Login", "Logout", "Create Record", "Update Record", "Delete Record", "Export Data", "Password Change", "Failed Login"]
const USER_OPTIONS   = ["All Users", "Admins only", "Staff only", "Delivery Staff only"]
const DATE_OPTIONS   = ["Date Range: All", "Today", "Yesterday", "This week", "This month", "Last 3 months"]

// Example action types / branches cycled through the search box as an animated, typewriter-style hint.
const SEARCH_SAMPLES = ["Login", "Update Record", "Manila", "Failed Login", "Pampanga"]

// Action types used by the printed report. Order matters: a log is matched
// against the first key its text contains, so "Failed Login" is checked
// before "Login". Each entry carries the color used in the distribution bar.
const PRINT_ACTION_META = [
  { key: "Failed Login",    label: "Failed Login",    cls: "a-failed", dot: "#b91c1c" },
  { key: "Login",           label: "Login",           cls: "a-login",  dot: "#16a34a" },
  { key: "Logout",          label: "Logout",          cls: "a-logout", dot: "#64748b" },
  { key: "Create Record",   label: "Create",          cls: "a-create", dot: "#2563eb" },
  { key: "Update Record",   label: "Update",          cls: "a-update", dot: "#d97706" },
  { key: "Delete Record",   label: "Delete",          cls: "a-delete", dot: "#dc2626" },
  { key: "Export Data",     label: "Export",          cls: "a-export", dot: "#7c3aed" },
  { key: "Password Change", label: "Password Change", cls: "a-pass",   dot: "#ea580c" },
]

function PrintBtn({ onClick, isDark }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
    </button>
  )
}

function ExportCSVBtn({ onClick, isDark }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  )
}

function SelectFilter({ value, onChange, options, minWidth = "130px", isDark }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#374151"
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor: bdr, minWidth, backgroundColor: bg, color: tc }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(74,222,128,0.18)" }}
        onBlur={e => { e.target.style.borderColor = bdr; e.target.style.boxShadow = "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function ActionBadge({ action, isDark }) {
  const cfg = {
    "Login":           { bg: isDark ? "rgba(74,222,128,0.12)"  : "#dcfce7", color: isDark ? "#4ade80" : "#15803d" },
    "Logout":          { bg: isDark ? "rgba(148,163,184,0.10)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#475569" },
    "Create Record":   { bg: isDark ? "rgba(96,165,250,0.12)"  : "#dbeafe", color: isDark ? "#60a5fa" : "#1d4ed8" },
    "Update Record":   { bg: isDark ? "rgba(250,204,21,0.12)"  : "#fefce8", color: isDark ? "#facc15" : "#854d0e" },
    "Delete Record":   { bg: isDark ? "rgba(248,113,113,0.12)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" },
    "Export Data":     { bg: isDark ? "rgba(192,132,252,0.12)" : "#ede9fe", color: isDark ? "#c084fc" : "#6d28d9" },
    "Password Change": { bg: isDark ? "rgba(251,146,60,0.12)"  : "#fff7ed", color: isDark ? "#fb923c" : "#c2410c" },
    "Failed Login":    { bg: isDark ? "rgba(248,113,113,0.12)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" },
  }
  
  // Find the first action type whose name appears in the action text, and use its colors.
  const matchedKey = Object.keys(cfg).find(k => action?.toLowerCase().includes(k.toLowerCase()))
  const s = cfg[matchedKey] || { bg: isDark ? "rgba(148,163,184,0.10)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#475569" }
  
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {matchedKey || action || "System Action"}
    </span>
  )
}

function RoleBadge({ role, isDark }) {
  const cfg = {
    admin:    { label: "Admin",    color: isDark ? "#c084fc" : "#6d28d9" },
    staff:    { label: "Staff",    color: isDark ? "#60a5fa" : "#1d4ed8" },
    delivery: { label: "Delivery", color: isDark ? "#fb923c" : "#c2410c" },
  }
  const s = cfg[role?.toLowerCase()] || { label: role || "Unknown", color: isDark ? "#94a3b8" : "#475569" }
  return <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</span>
}

function splitAction(action = "") {
  const parts = String(action || "").split(":")
  if (parts.length < 2) return { type: action || "System Action", summary: action || "System activity" }
  return {
    type: parts[0].trim(),
    summary: parts.slice(1).join(":").trim() || action,
  }
}

function extractQuotedTarget(text = "") {
  const match = String(text || "").match(/'([^']+)'|"([^"]+)"/)
  return match?.[1] || match?.[2] || ""
}

function getSpecificActivity(log) {
  const { type, summary } = splitAction(log.action)
  const target = extractQuotedTarget(log.action)
  const details = String(log.details || "").trim()
  const cleanedSummary = summary
    .replace(/^Staff\/Admin\s+/i, "")
    .replace(/\s*'[^']+'\s*$/, target ? "" : "")
    .trim()

  return {
    type,
    target,
    summary: cleanedSummary || summary || type,
    details: details || (target ? `Target record: ${target}` : ""),
  }
}

// Animated flower shown while the logs are still loading.
function FlowerLoader({ message = "Loading...", isDark = false }) {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <>
      <style>{`
        @keyframes adminPetalBloom {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1;   }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center rounded-xl"
        style={{ minHeight: "60vh", backgroundColor: isDark ? "#0f172a" : "transparent" }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          {petals.map(({ angle, color }, i) => (
            <g key={i} transform={`rotate(${angle} 50 50)`}>
              <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
                style={{ animation: `adminPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
            </g>
          ))}
          <circle cx="50" cy="50" r="12" fill="#2E8B34" />
          <circle cx="50" cy="50" r="7"  fill="#f9c6d0" />
          <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
        </svg>
        <p className="mt-4 text-sm font-medium tracking-wide" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{message}</p>
      </div>
    </>
  )
}

const COLS = ["Timestamp", "Staff Name", "Role", "Action Type", "Branch", "Specific Activity"]
const PAGE_SIZE = ADMIN_PAGE_SIZE

export default function AdminActivityLogs() {
  const { isDark } = useTheme()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [search, setSearch]             = useState("")
  const [actionFilter, setActionFilter] = useState("All Actions")
  const [userFilter, setUserFilter]     = useState("All Users")
  const [dateFilter, setDateFilter]     = useState("Date Range: All")
  
  const [entered, setEntered] = useState(false)
  const [phText, setPhText] = useState("")

  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"
  const cellTxt    = isDark ? "#e2e8f0" : "#1e293b"

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get("/users/activity-logs")
      setLogs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Failed to fetch activity logs:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  useEffect(() => {
    if (loading) { setEntered(false); return }
    const t = setTimeout(() => setEntered(true), 1300)
    return () => clearTimeout(t)
  }, [loading])

  useEffect(() => {
    if (search) { setPhText(""); return }
    let sample = 0, ch = 0, deleting = false, timer
    const tick = () => {
      const full = SEARCH_SAMPLES[sample]
      ch += deleting ? -1 : 1
      setPhText(full.slice(0, ch))
      if (!deleting && ch === full.length) { deleting = true; timer = setTimeout(tick, 1400); return }
      if (deleting && ch === 0) { deleting = false; sample = (sample + 1) % SEARCH_SAMPLES.length }
      timer = setTimeout(tick, deleting ? 55 : 110)
    }
    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [search])

  const filtered = logs.filter(log => {
    const activity = getSpecificActivity(log)
    const matchSearch = !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.branch?.toLowerCase().includes(search.toLowerCase()) ||
      log.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      activity.target?.toLowerCase().includes(search.toLowerCase()) ||
      activity.summary?.toLowerCase().includes(search.toLowerCase())

    const matchAction = actionFilter === "All Actions" || log.action?.toLowerCase().includes(actionFilter.toLowerCase())

    let matchRole = true
    if (userFilter === "Admins only") matchRole = log.role?.toLowerCase() === "admin"
    if (userFilter === "Staff only") matchRole = log.role?.toLowerCase() === "staff"
    if (userFilter === "Delivery Staff only") matchRole = log.role?.toLowerCase() === "delivery"

    let matchDate = true
    if (dateFilter !== "Date Range: All" && log.created_at) {
      const logDate = new Date(log.created_at)
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (dateFilter === "Today") {
        matchDate = logDate >= startOfToday
      } else if (dateFilter === "Yesterday") {
        const startOfYesterday = new Date(startOfToday)
        startOfYesterday.setDate(startOfYesterday.getDate() - 1)
        matchDate = logDate >= startOfYesterday && logDate < startOfToday
      } else if (dateFilter === "This week") {
        const startOfThisWeek = new Date(startOfToday)
        startOfThisWeek.setDate(startOfToday.getDate() - now.getDay())
        matchDate = logDate >= startOfThisWeek
      } else if (dateFilter === "This month") {
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        matchDate = logDate >= startOfThisMonth
      } else if (dateFilter === "Last 3 months") {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        matchDate = logDate >= threeMonthsAgo
      }
    }

    return matchSearch && matchAction && matchRole && matchDate
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paginated = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, actionFilter, userFilter, dateFilter])

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
  const printTime   = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })

  const classifyAction = a => PRINT_ACTION_META.find(m => a?.toLowerCase().includes(m.key.toLowerCase()))?.key || "Other"

  const actionCounts = filtered.reduce((m, log) => {
    const k = classifyAction(log.action)
    m[k] = (m[k] || 0) + 1
    return m
  }, {})
  
  const knownTotal = PRINT_ACTION_META.reduce((s, m) => s + (actionCounts[m.key] || 0), 0)
  const otherCount = Math.max(0, filtered.length - knownTotal)
  const pct = n => (filtered.length ? (n / filtered.length) * 100 : 0)

  const loginCount  = actionCounts["Login"] || 0
  const failedCount = actionCounts["Failed Login"] || 0
  const dataChanges = (actionCounts["Create Record"] || 0) + (actionCounts["Update Record"] || 0)
    + (actionCounts["Delete Record"] || 0) + (actionCounts["Export Data"] || 0)

  const printGroups = (() => {
    const map = new Map()
    filtered.forEach(log => {
      const k = classifyAction(log.action)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(log)
    })
    const orderOf = k => {
      const i = PRINT_ACTION_META.findIndex(m => m.key === k)
      return i === -1 ? 99 : i
    }
    return Array.from(map.entries())
      .sort((a, b) => orderOf(a[0]) - orderOf(b[0]) || a[0].localeCompare(b[0]))
      .map(([key, items]) => ({
        label: PRINT_ACTION_META.find(m => m.key === key)?.label || key,
        items,
      }))
  })()

  const printScope = [
    actionFilter !== "All Actions" ? `Action: ${actionFilter}` : "All Actions",
    userFilter !== "All Users" ? userFilter : "All Users",
    dateFilter !== "Date Range: All" ? dateFilter : "All Dates",
    search ? `Search: "${search}"` : null,
    `${filtered.length} entr${filtered.length === 1 ? "y" : "ies"}`,
  ].filter(Boolean).join("   ·   ")

  const handleCSV = () => {
    const headers = ["ID", "Timestamp", "Staff Name", "Role", "Action Type", "Branch", "Activity", "Target", "Details"]
    const rows = filtered.map(log => {
      const activity = getSpecificActivity(log)
      return [
        log.id,
        new Date(log.created_at).toLocaleString("en-PH"),
        log.staff_name || "Unknown staff",
        log.role || "Unknown",
        activity.type,
        log.branch || "N/A",
        activity.summary,
        activity.target || "",
        activity.details || "",
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `activity_logs_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>Activity Logs</h1>
        <FlowerLoader message="Loading activity logs..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <style>{`
        .print-only { display: none; }

        @keyframes actlogsRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .actlogs-rise { animation: actlogsRise 0.85s ease-out both; }

        @media print {
          @page { margin: 12mm 10mm; }
          body * { visibility: hidden !important; }
          #actlogs-print-area, #actlogs-print-area * { visibility: visible !important; }
          #actlogs-print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            font-family: "Helvetica Neue", Arial, sans-serif; color: #1f2937;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-letterhead, .print-doc-title, .print-summary, .print-health { break-inside: avoid; page-break-inside: avoid; }

          .print-letterhead {
            display: flex !important; align-items: center; justify-content: space-between; gap: 16px;
            padding: 13px 18px; border-radius: 12px;
            background: linear-gradient(135deg,#0C573E 0%,#15724B 55%,#2E8B34 100%) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-logo-word {
            height: 34px; width: auto; max-width: 240px; display: block;
            object-fit: contain; filter: brightness(0) invert(1);
          }
          .print-tagline {
            margin: 5px 0 0; font-size: 8px; font-weight: 700;
            letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.82) !important;
          }
          .print-meta { text-align: right; flex-shrink: 0; }
          .print-meta .ref {
            display: inline-block; margin: 0; padding: 3px 10px; border-radius: 9999px;
            border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.12) !important;
            color: #ffffff !important; font-size: 8.5px; font-weight: 700;
            letter-spacing: 0.12em; text-transform: uppercase;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-meta .gen { margin: 6px 0 0; font-size: 9px; color: rgba(255,255,255,0.85) !important; }
          .print-meta .gen strong { color: #ffffff !important; font-weight: 700; }

          .print-doc-title { display: flex !important; flex-direction: column; align-items: center; margin: 16px 0 2px; }
          .print-doc-title .t {
            margin: 0; font-size: 15px; font-weight: 800;
            letter-spacing: 0.3em; text-transform: uppercase; color: #0C573E !important;
          }
          .print-doc-title .rule {
            width: 54px; height: 3px; border-radius: 9999px; margin: 7px 0 6px;
            background: linear-gradient(90deg,#0C573E,#2E8B34) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-doc-title .scope { margin: 0; font-size: 9px; color: #6b7280 !important; letter-spacing: 0.02em; text-align: center; }

          .print-summary { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0 0; }
          .print-summary-card {
            border: 1px solid #e5e7eb; border-top-width: 3px; border-radius: 9px; padding: 9px 12px 10px;
            background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-summary-card.c-total { border-top-color: #0C573E !important; }
          .print-summary-card.c-login { border-top-color: #2E8B34 !important; }
          .print-summary-card.c-fail  { border-top-color: #dc2626 !important; }
          .print-summary-card.c-data  { border-top-color: #d97706 !important; }
          .print-summary-card .label { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-summary-card .value { margin: 3px 0 0; font-size: 19px; font-weight: 800; color: #111827 !important; }
          .print-summary-card .value.green { color: #16a34a !important; }
          .print-summary-card .value.amber { color: #d97706 !important; }
          .print-summary-card .value.red   { color: #dc2626 !important; }
          .print-summary-card .cap { margin: 3px 0 0; font-size: 8px; color: #9ca3af !important; }

          .print-health {
            margin: 10px 0 0; border: 1px solid #e5e7eb; border-radius: 9px; padding: 10px 12px 11px;
            background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-health .head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; }
          .print-health .hk { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-health .hv { margin: 0; font-size: 8.5px; color: #6b7280 !important; }
          .print-health .bar {
            display: flex; height: 10px; border-radius: 9999px; overflow: hidden;
            background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-health .seg { display: block; height: 100%; }
          .print-health .a-failed { background: #b91c1c !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-login  { background: #16a34a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-logout { background: #64748b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-create { background: #2563eb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-update { background: #d97706 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-delete { background: #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-export { background: #7c3aed !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-pass   { background: #ea580c !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .a-other  { background: #94a3b8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .legend { display: flex; flex-wrap: wrap; gap: 12px 16px; margin: 7px 0 0; }
          .print-health .li { display: flex; align-items: center; gap: 5px; font-size: 8.5px; color: #374151 !important; }
          .print-health .dot { width: 7px; height: 7px; border-radius: 9999px; flex-shrink: 0; }

          .print-detail { display: block !important; margin-top: 14px; }
          .print-section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; padding: 0 2px; }
          .print-section-title { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #0C573E !important; }
          .print-section-sub { margin: 0; font-size: 8.5px; color: #9ca3af !important; }
          .print-detail .twrap { border: 1px solid #dbe3df; border-radius: 10px; overflow: hidden; }
          .print-detail table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
          .print-detail thead { display: table-header-group; }
          .print-detail tr { page-break-inside: avoid; }
          .print-detail th {
            background: #0C573E !important; color: #ffffff !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border: none; padding: 7px; text-align: left;
            font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.25;
          }
          .print-detail th.col-idx    { width: 4%; }
          .print-detail th.col-time   { width: 15%; }
          .print-detail th.col-user   { width: 14%; }
          .print-detail th.col-role   { width: 10%; }
          .print-detail th.col-branch { width: 10%; }
          .print-detail th.col-action { width: 47%; }
          .print-detail td {
            border-bottom: 1px solid #eef1f4; padding: 6.5px 7px;
            font-size: 9.5px; color: #1f2937 !important; vertical-align: top;
            word-break: break-word; overflow-wrap: anywhere;
          }
          .print-detail .num { text-align: right; }
          .print-detail .center { text-align: center; }
          .print-detail .nowrap { white-space: nowrap !important; }
          .print-detail .muted { color: #6b7280 !important; }
          .print-detail .mono { font-family: "Courier New", Courier, monospace; font-size: 8.5px; }
          .print-detail .cap { text-transform: capitalize; }
          .print-detail tr.alt td { background: #f7faf8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-detail tbody tr:last-child td { border-bottom: none; }

          .print-detail tr.cat-row { page-break-after: avoid; break-after: avoid; }
          .print-detail tr.cat-row td {
            background: #eaf5ee !important; color: #0C573E !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border-top: 1px solid #d8ebdd; border-bottom: 1px solid #d8ebdd;
            padding: 6px 8px; font-size: 8.5px; font-weight: 800;
            letter-spacing: 0.08em; text-transform: uppercase;
          }
          .print-detail tr.cat-row .cat-meta {
            float: right; font-weight: 600; letter-spacing: 0;
            text-transform: none; color: #15724B !important;
          }

          .print-detail tr.grand td {
            background: #0C573E !important; color: #ffffff !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border: none; padding: 8px 7px; font-size: 9.5px; font-weight: 800;
          }

          .print-footer {
            display: flex !important; align-items: flex-end; justify-content: space-between; gap: 24px;
            margin-top: 20px; padding-top: 11px; border-top: 2px solid #e5e7eb;
          }
          .print-footer .note { margin: 0; font-size: 8.5px; color: #9ca3af !important; max-width: 46%; line-height: 1.55; }
          .print-footer .note strong { color: #6b7280 !important; }
          .print-signs { display: flex; gap: 34px; }
          .print-sign { text-align: center; }
          .print-sign .line { width: 170px; border-top: 1px solid #6b7280; margin: 20px 0 5px; }
          .print-sign .cap { margin: 0; font-size: 8.5px; color: #6b7280 !important; text-transform: uppercase; letter-spacing: 0.1em; }
        }
      `}</style>

      {/* Heading row with Export + Print */}
      <div className={`flex items-center justify-between flex-wrap gap-3 ${entered ? "" : "actlogs-rise"}`}>
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>Activity Logs</h1>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} isDark={isDark} />
        </div>
      </div>

      {/* Info strip */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${entered ? "" : "actlogs-rise"}`}
        style={{ backgroundColor: isDark ? "rgba(74,222,128,0.06)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(74,222,128,0.20)" : "#bbf7d0"}`, animationDelay: "0.18s" }}>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs font-medium" style={{ color: isDark ? "#4ade80bb" : DG }}>
          All admin and staff actions are logged here for security and audit purposes.
        </p>
      </div>

      {/* Printable area */}
      <div id="actlogs-print-area">

        {/* Print 1: letterhead brand band */}
        <div className="print-only print-letterhead">
          <div>
            <img className="print-logo-word" src={estingsWordmark} alt="Esting's Flower International Inc." />
            <p className="print-tagline">Flower International Inc.</p>
          </div>
          <div className="print-meta">
            <p className="ref">Ref: LOG-{new Date().toISOString().slice(0,10).replace(/-/g,"")}</p>
            <p className="gen">Generated <strong>{printDate}</strong> at <strong>{printTime}</strong></p>
          </div>
        </div>

        {/* Print 2: document title + report scope */}
        <div className="print-only print-doc-title">
          <p className="t">Activity Logs Report</p>
          <span className="rule" />
          <p className="scope">{printScope}</p>
        </div>

        {/* Print 3: summary cards (current view) */}
        <div className="print-only print-summary">
          <div className="print-summary-card c-total">
            <p className="label">Total Entries</p>
            <p className="value">{filtered.length}</p>
            <p className="cap">Across {dateFilter === "Date Range: All" ? "all dates" : dateFilter.toLowerCase()}</p>
          </div>
          <div className="print-summary-card c-login">
            <p className="label">Logins</p>
            <p className="value green">{loginCount}</p>
            <p className="cap">Successful sign-ins</p>
          </div>
          <div className="print-summary-card c-fail">
            <p className="label">Failed Logins</p>
            <p className="value red">{failedCount}</p>
            <p className="cap">Rejected sign-in attempts</p>
          </div>
          <div className="print-summary-card c-data">
            <p className="label">Data Changes</p>
            <p className="value amber">{dataChanges}</p>
            <p className="cap">Create, update, delete, export</p>
          </div>
        </div>

        {/* Print 4: action distribution */}
        {filtered.length > 0 && (
          <div className="print-only print-health">
            <div className="head">
              <p className="hk">Action Distribution</p>
              <p className="hv">{printGroups.length} action type{printGroups.length === 1 ? "" : "s"}</p>
            </div>
            <div className="bar">
              {PRINT_ACTION_META.map(m => {
                const n = actionCounts[m.key] || 0
                return n > 0 ? <span key={m.key} className={`seg ${m.cls}`} style={{ width: `${pct(n)}%` }} /> : null
              })}
              {otherCount > 0 && <span className="seg a-other" style={{ width: `${pct(otherCount)}%` }} />}
            </div>
            <div className="legend">
              {PRINT_ACTION_META.map(m => {
                const n = actionCounts[m.key] || 0
                return n > 0 ? (
                  <span key={m.key} className="li"><span className="dot" style={{ backgroundColor: m.dot }} />{m.label} · {n} ({pct(n).toFixed(0)}%)</span>
                ) : null
              })}
              {otherCount > 0 && (
                <span className="li"><span className="dot" style={{ backgroundColor: "#94a3b8" }} />Other · {otherCount} ({pct(otherCount).toFixed(0)}%)</span>
              )}
            </div>
          </div>
        )}

        {/* Screen table card (interactive; never printed) */}
        <div className={`no-print rounded-xl overflow-hidden ${entered ? "" : "actlogs-rise"}`}
          style={{ border: `1px solid ${cardBdr}`, backgroundColor: cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.36s" }}>

          {/* Toolbar */}
          <div className="p-3 sm:p-4 no-print" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              <SelectFilter value={actionFilter} onChange={setActionFilter} options={ACTION_OPTIONS} minWidth="140px" isDark={isDark} />
              <SelectFilter value={userFilter}   onChange={setUserFilter}   options={USER_OPTIONS}   minWidth="130px" isDark={isDark} />
              <SelectFilter value={dateFilter}   onChange={setDateFilter}   options={DATE_OPTIONS}   minWidth="150px" isDark={isDark} />
              <div className="relative flex-1" style={{ minWidth: "180px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={search ? "" : `${phText}|`}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(74,222,128,0.18)" }}
                  onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "900px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {COLS.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${toolbarBdr}` }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>
                      Loading activity logs...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>
                      No matching activity logs found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((log, idx) => {
                    const activity = getSpecificActivity(log)
                    return (
                    <tr key={log.id} 
                      style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f8fafc"}`, backgroundColor: isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white"}>
                      
                      {/* Timestamp */}
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className="text-sm font-medium" style={{ color: cellTxt }}>
                          {new Date(log.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="block text-xs mt-0.5" style={{ color: subTxt }}>
                          {new Date(log.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      {/* Staff Name (Replaced User ID) */}
                      <td className="px-4 py-3 align-top">
                        <span className="text-sm font-semibold" style={{ color: cellTxt }}>
                          {log.staff_name || "Unknown staff"}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 align-top">
                        <RoleBadge role={log.role} isDark={isDark} />
                      </td>

                      {/* Action Type Badge */}
                      <td className="px-4 py-3 align-top">
                        <ActionBadge action={log.action} isDark={isDark} />
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          log.branch?.toLowerCase() === "pampanga" 
                            ? "bg-purple-100 text-purple-700" 
                            : log.branch?.toLowerCase() === "manila"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {log.branch || "—"}
                        </span>
                      </td>

                      {/* Details (Replaced full action text column) */}
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-md">
                          <p className="text-sm font-semibold leading-snug break-words" style={{ color: cellTxt }}>
                            {activity.summary}
                          </p>
                          {activity.target && (
                            <p className="text-xs mt-1 leading-snug break-words" style={{ color: isDark ? "#4ade80" : DG }}>
                              Target: {activity.target}
                            </p>
                          )}
                          {activity.details && (
                            <p className="text-xs mt-1.5 leading-relaxed break-words" style={{ color: subTxt }}>
                              {activity.details}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {log.id && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ color: subTxt, backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
                                ID {String(log.id).slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 sm:px-5 py-3 flex-wrap gap-2 no-print"
            style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <span className="text-sm" style={{ color: subTxt }}>Showing {paginated.length} of {filtered.length} entries</span>
            
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
                style={page <= 1 ? { borderColor: inputBdr, color: subTxt, cursor: "not-allowed", opacity: 0.5 } : { borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>
                ← Prev
              </button>
              
              {[page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages).map(p => (
                <button key={p} onClick={() => setPage(p)} className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
                  style={p === page 
                    ? { borderColor: G, color: isDark ? "#4ade80" : G, backgroundColor: isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4" } 
                    : { borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>
                  {p}
                </button>
              ))}
              
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
                style={page >= totalPages ? { borderColor: inputBdr, color: subTxt, cursor: "not-allowed", opacity: 0.5 } : { borderColor: inputBdr, color: inputTxt, backgroundColor: inputBg }}>
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Print 5: full detail table, grouped by action type. */}
        <div className="print-only print-detail">
          <div className="print-section-head">
            <p className="print-section-title">Activity Detail</p>
            <p className="print-section-sub">Grouped by action type · newest first within each group</p>
          </div>
          <div className="twrap">
            <table>
              <thead>
                <tr>
                  <th className="col-idx num">#</th>
                  <th className="col-time">Timestamp</th>
                  <th className="col-user">Staff Name</th>
                  <th className="col-role">Role</th>
                  <th className="col-branch">Branch</th>
                  <th className="col-action">Action & Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "18px 8px" }}>No logs match the current filters.</td></tr>
                ) : (() => {
                  let n = 0
                  return printGroups.map(g => (
                    <Fragment key={g.label}>
                      <tr className="cat-row">
                        <td colSpan={6}>
                          <span>{g.label}</span>
                          <span className="cat-meta">{g.items.length} entr{g.items.length === 1 ? "y" : "ies"}</span>
                        </td>
                      </tr>
                      {g.items.map((log, i) => {
                        n += 1
                        const activity = getSpecificActivity(log)
                        return (
                          <tr key={log.id} className={i % 2 === 1 ? "alt" : ""}>
                            <td className="num nowrap muted">{n}</td>
                            <td className="nowrap">{log.created_at ? new Date(log.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                            <td className="mono">{log.staff_name || "Unknown staff"}</td>
                            <td className="cap">{log.role || "Unknown"}</td>
                            <td className="cap muted">{log.branch || "—"}</td>
                            <td>
                              <span className="font-semibold">{activity.summary || "—"}</span>
                              {activity.target && <span className="block mt-0.5 text-[8px] text-gray-500">Target: {activity.target}</span>}
                              {activity.details && <span className="block mt-0.5 text-[8px] text-gray-500">{activity.details}</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))
                })()}
                {filtered.length > 0 && (
                  <tr className="grand">
                    <td colSpan={5}>Report Total · all action types</td>
                    <td className="num nowrap">{filtered.length} entr{filtered.length === 1 ? "y" : "ies"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print 6: footer + signature lines */}
        <div className="print-only print-footer">
          <p className="note">
            <strong>Esting's Flower International Inc.</strong> Confidential. This report is generated for internal use only and reflects activity log records as of the date and time indicated above. Entries are based on the filters applied at the time of printing.
          </p>
          <div className="print-signs">
            <div className="print-sign">
              <div className="line" />
              <p className="cap">Prepared by</p>
            </div>
            <div className="print-sign">
              <div className="line" />
              <p className="cap">Reviewed by</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
