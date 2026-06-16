import { useState, useEffect, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"
import { DG, G } from "./_adminShared"
import { api } from "../../services/api.js"

const ACTION_OPTIONS = ["All Actions", "Login", "Logout", "Create Record", "Update Record", "Delete Record", "Export Data", "Password Change", "Failed Login"]
const USER_OPTIONS   = ["All Users", "Admins only", "Staff only", "Delivery Staff only"]
const DATE_OPTIONS   = ["Date Range: All", "Today", "Yesterday", "This week", "This month", "Last 3 months"]

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
  
  // Smart matching: If the action string contains the key, style it accordingly.
  const matchedKey = Object.keys(cfg).find(k => action?.toLowerCase().includes(k.toLowerCase()))
  const s = cfg[matchedKey] || { bg: isDark ? "rgba(148,163,184,0.10)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#475569" }
  
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {matchedKey || "System Action"}
    </span>
  )
}

function RoleBadge({ role, isDark }) {
  const cfg = {
    admin:    { label: "Admin",    color: isDark ? "#c084fc" : "#6d28d9" },
    staff:    { label: "Staff",    color: isDark ? "#60a5fa" : "#1d4ed8" },
    delivery: { label: "Delivery", color: isDark ? "#fb923c" : "#c2410c" },
  }
  const s = cfg[role?.toLowerCase()] || { label: role || "System", color: isDark ? "#94a3b8" : "#475569" }
  return <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</span>
}

const COLS = ["Timestamp", "User ID", "Role", "Action Type", "IP Address", "Details"]
const PAGE_SIZE = 20

export default function AdminActivityLogs() {
  const { isDark } = useTheme()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [search, setSearch]             = useState("")
  const [actionFilter, setActionFilter] = useState("All Actions")
  const [userFilter, setUserFilter]     = useState("All Users")
  const [dateFilter, setDateFilter]     = useState("Date Range: All")

  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"
  const cellTxt    = isDark ? "#e2e8f0" : "#1e293b"

  // Fetch logs from your backend
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      // 🚀 THE FIX: Point to the new users.py route!
      const data = await api.get("/users/activity-logs")
      setLogs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Failed to fetch activity logs:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Filter Logic
  const filtered = logs.filter(log => {
    // 1. Search Filter (matches ID, Action text, or IP)
    const matchSearch = !search || 
      log.action?.toLowerCase().includes(search.toLowerCase()) || 
      log.ip_address?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(search.toLowerCase())

    // 2. Action Filter
    const matchAction = actionFilter === "All Actions" || log.action?.toLowerCase().includes(actionFilter.toLowerCase())

    // 3. User Role Filter
    let matchRole = true
    if (userFilter === "Admins only") matchRole = log.role?.toLowerCase() === "admin"
    if (userFilter === "Staff only") matchRole = log.role?.toLowerCase() === "staff"
    if (userFilter === "Delivery Staff only") matchRole = log.role?.toLowerCase() === "delivery"

    // 4. Date Filter Math
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
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort newest first

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paginated = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, actionFilter, userFilter, dateFilter])

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

  const handleCSV = () => {
    const headers = ["ID", "Timestamp", "User ID", "Role", "Action", "IP Address"]
    const rows = filtered.map(log => [
      log.id,
      new Date(log.created_at).toLocaleString("en-PH"),
      log.user_id || "System",
      log.role || "N/A",
      log.action,
      log.ip_address || "N/A"
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `activity_logs_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #actlogs-print-area, #actlogs-print-area * { visibility: visible !important; }
          #actlogs-print-area { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; font-family: sans-serif; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #actlogs-print-area table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          #actlogs-print-area th { background: #f0fdf4 !important; color: #0C573E !important; border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          #actlogs-print-area td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; color: #111827; }
          #actlogs-print-area tr:nth-child(even) td { background: #f9fafb !important; }
          .print-footer { margin-top: 20px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Heading row with Export + Print */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>Activity Logs</h1>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} isDark={isDark} />
        </div>
      </div>

      {/* Info strip */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: isDark ? "rgba(74,222,128,0.06)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(74,222,128,0.20)" : "#bbf7d0"}` }}>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs font-medium" style={{ color: isDark ? "#4ade80bb" : DG }}>
          All admin and staff actions are logged here for security and audit purposes.
        </p>
      </div>

      {/* Printable area */}
      <div id="actlogs-print-area">

        {/* Print header */}
        <div className="print-only" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0C573E", margin: 0 }}>Esting's Flower International Inc.</h1>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "4px 0 0" }}>Activity Logs Report</h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
              <p style={{ margin: 0 }}>Generated: {printDate}</p>
              <p style={{ margin: "2px 0 0" }}>Action: {actionFilter} | Users: {userFilter} | {dateFilter}</p>
            </div>
          </div>
          <div style={{ height: "2px", background: "linear-gradient(90deg,#0C573E,#2E8B34)", marginTop: "12px", borderRadius: "2px" }} />
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${cardBdr}`, backgroundColor: cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

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
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, Action, or IP..."
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
                  paginated.map((log, idx) => (
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

                      {/* User ID */}
                      <td className="px-4 py-3 align-top">
                        <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded" style={{ color: cellTxt }}>
                          {log.user_id ? log.user_id.slice(0, 8) + "..." : "System"}
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

                      {/* IP Address */}
                      <td className="px-4 py-3 align-top">
                        <span className="text-xs font-mono text-gray-500">{log.ip_address || "N/A"}</span>
                      </td>

                      {/* Details (Full Action Text) */}
                      <td className="px-4 py-3 align-top">
                        <span className="text-sm leading-snug break-words block max-w-xs" style={{ color: subTxt }}>
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  ))
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

        <div className="print-only print-footer">
          <p>Esting's Flower International Inc. — Confidential. For internal use only.</p>
        </div>
      </div>
    </div>
  )
}