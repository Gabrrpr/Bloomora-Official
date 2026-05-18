import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { DG, G, ExportBtn } from "./_adminShared"

const ACTION_OPTIONS = ["All Actions", "Login", "Logout", "Create Record", "Update Record", "Delete Record", "Export Data", "Password Change", "Failed Login"]
const USER_OPTIONS   = ["All Users", "Admins only", "Staff only", "Delivery Staff only"]
const DATE_OPTIONS   = ["Date Range: All", "Today", "Yesterday", "This week", "This month", "Last 3 months"]

function PrintBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: "#dde3ec", color: "#374151", backgroundColor: "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
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
    Login:             { bg: isDark ? "rgba(74,222,128,0.12)"  : "#dcfce7", color: isDark ? "#4ade80" : "#15803d" },
    Logout:            { bg: isDark ? "rgba(148,163,184,0.10)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#475569" },
    "Create Record":   { bg: isDark ? "rgba(96,165,250,0.12)"  : "#dbeafe", color: isDark ? "#60a5fa" : "#1d4ed8" },
    "Update Record":   { bg: isDark ? "rgba(250,204,21,0.12)"  : "#fefce8", color: isDark ? "#facc15" : "#854d0e" },
    "Delete Record":   { bg: isDark ? "rgba(248,113,113,0.12)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" },
    "Export Data":     { bg: isDark ? "rgba(192,132,252,0.12)" : "#ede9fe", color: isDark ? "#c084fc" : "#6d28d9" },
    "Password Change": { bg: isDark ? "rgba(251,146,60,0.12)"  : "#fff7ed", color: isDark ? "#fb923c" : "#c2410c" },
    "Failed Login":    { bg: isDark ? "rgba(248,113,113,0.12)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" },
  }
  const s = cfg[action] || { bg: isDark ? "rgba(148,163,184,0.10)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#475569" }
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {action || "—"}
    </span>
  )
}

function RoleBadge({ role, isDark }) {
  const cfg = {
    admin:    { label: "Admin",    color: isDark ? "#c084fc" : "#6d28d9" },
    staff:    { label: "Staff",    color: isDark ? "#60a5fa" : "#1d4ed8" },
    delivery: { label: "Delivery", color: isDark ? "#fb923c" : "#c2410c" },
  }
  const s = cfg[role?.toLowerCase()] || { label: role || "—", color: isDark ? "#94a3b8" : "#475569" }
  return <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
}

const COLS = ["Timestamp", "User", "Role", "Action", "IP Address", "Details"]

export default function AdminActivityLogs() {
  const { isDark } = useTheme()
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

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

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
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>Activity Log</h1>
        <div className="flex items-center gap-2">
          <ExportBtn />
          <PrintBtn onClick={handlePrint} />
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
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(74,222,128,0.18)" }}
                  onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "700px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {COLS.map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${toolbarBdr}` }}>
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>
                    No activity logs yet — connect to the backend.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 sm:px-5 py-3 flex-wrap gap-2 no-print"
            style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <span className="text-sm" style={{ color: subTxt }}>Showing 0 log entries</span>
            <div className="flex items-center gap-1">
              {["←", "1", "2", "3", "→"].map((p, i) => (
                <button key={i} className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{ background: p === "1" ? `linear-gradient(135deg,${DG},${G})` : isDark ? "#1e293b" : "white", color: p === "1" ? "white" : isDark ? "#94a3b8" : "#6b7280", border: p === "1" ? "none" : `1px solid ${isDark ? "#374151" : "#e2e8f0"}` }}>{p}</button>
              ))}
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