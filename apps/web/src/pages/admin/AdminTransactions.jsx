import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { DG, G, StatusBadge, TH, EmptyRow, TableWrap } from "./_adminShared"

const DATE_OPTIONS   = ["Today", "Yesterday", "This Week", "This Month", "This Quarter", "This Year", "Custom Range"]
const TYPE_OPTIONS   = ["Type: All", "Sale", "Refund", "Partial Refund", "Void", "Adjustment"]
const METHOD_OPTIONS = ["Method: All", "Cash", "GCash", "Maya", "Credit Card", "Debit Card", "Bank Transfer", "Cash on Delivery"]
const STATUS_OPTIONS = ["Status: Success", "Status: All", "Pending", "Failed", "Refunded", "Voided"]

function SelectFilter({ value, onChange, options, minWidth = "130px", isDark, icon }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#374151"
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
          {icon}
        </span>
      )}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ paddingLeft: icon ? "28px" : "12px", paddingRight: "28px", borderColor: bdr, minWidth, backgroundColor: bg, color: tc }}
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


function ExportCSVBtn({ onClick, isDark }) {
  return (
    <button
      onClick={onClick}
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

function PrintBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: "#dde3ec", color: "#374151", backgroundColor: "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
    </button>
  )
}

const CalendarIcon = (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

export default function AdminTransactions() {
  const { isDark } = useTheme()
  const [search, setSearch]             = useState("")
  const [dateFilter, setDateFilter]     = useState("Today")
  const [typeFilter, setTypeFilter]     = useState("Type: All")
  const [methodFilter, setMethodFilter] = useState("Method: All")
  const [statusFilter, setStatusFilter] = useState("Status: Success")

  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"

  const STAT_CARDS = [
    { label: "Total Revenue Today", sub: "All successful sales",  value: "₱0", note: "↑ ₱0 vs yesterday", green: true  },
    { label: "Net Sales Today",     sub: "After refunds & voids", value: "₱0", note: "↑ ₱0 vs yesterday", blue: true   },
    { label: "Total Transactions",  sub: "All types combined",    value: 0,    note: "+0 vs yesterday",    purple: true },
  ]

  const COLS = ["Transaction ID", "Order ID", "Customer", "Type", "Method", "Status", "Date & Time", "Action"]

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

  const handleCSV = () => {
    const headers = ["Transaction ID", "Order ID", "Customer", "Type", "Method", "Status", "Date & Time"]
    const csv = [headers].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `transactions_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #transactions-print-area, #transactions-print-area * { visibility: visible !important; }
          #transactions-print-area {
            position: absolute; top: 0; left: 0; width: 100%; padding: 24px; font-family: sans-serif;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #transactions-print-area table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          #transactions-print-area th {
            background: #f0fdf4 !important; color: #0C573E !important;
            border: 1px solid #d1d5db; padding: 8px 10px;
            text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          }
          #transactions-print-area td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; color: #111827; }
          #transactions-print-area tr:nth-child(even) td { background: #f9fafb !important; }
          .print-footer { margin-top: 20px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ── Heading ── */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Revenue overview</p>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>₱0</span>
            <span className="text-sm font-semibold text-green-500">↑ 0% vs yesterday</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="rounded-xl p-4 sm:p-5 transition-all"
            style={{
              background: c.green ? "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)" : isDark ? "#1a2332" : "white",
              border: c.green ? "none" : `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`,
              boxShadow: c.green ? "0 4px 16px rgba(12,87,62,0.25)" : isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
            }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: c.green ? "rgba(255,255,255,0.65)" : isDark ? "#64748b" : "#94a3b8" }}>{c.label}</p>
            <p className="text-xs mb-2"
              style={{ color: c.green ? "rgba(255,255,255,0.5)" : isDark ? "#64748b" : "#94a3b8" }}>{c.sub}</p>
            <p className="text-3xl font-bold"
              style={{ color: c.green ? "white" : c.blue ? (isDark ? "#60a5fa" : "#3b82f6") : c.purple ? (isDark ? "#c084fc" : "#7c3aed") : isDark ? "#4ade80" : DG }}>
              {c.value}
            </p>
            <p className="text-xs mt-2"
              style={{ color: c.green ? "rgba(255,255,255,0.5)" : isDark ? "#64748b" : "#94a3b8" }}>{c.note}</p>
          </div>
        ))}
      </div>

      {/* ── Printable area ── */}
      <div id="transactions-print-area">

        {/* Print-only header */}
        <div className="print-only" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0C573E", margin: 0 }}>Esting's Flower International Inc.</h1>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "4px 0 0" }}>Transactions Report</h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
              <p style={{ margin: 0 }}>Generated: {printDate}</p>
              <p style={{ margin: "2px 0 0" }}>Period: {dateFilter} | Type: {typeFilter} | Method: {methodFilter}</p>
              <p style={{ margin: "2px 0 0" }}>Status: {statusFilter}</p>
            </div>
          </div>
          <div style={{ height: "2px", background: "linear-gradient(90deg,#0C573E,#2E8B34)", marginTop: "12px", borderRadius: "2px" }} />
        </div>

        {/* Table card */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${cardBdr}`, backgroundColor: cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Toolbar */}
          <div className="p-3 sm:p-4 no-print" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              <SelectFilter value={dateFilter}   onChange={setDateFilter}   options={DATE_OPTIONS}   minWidth="130px" isDark={isDark} icon={CalendarIcon} />
              <SelectFilter value={typeFilter}   onChange={setTypeFilter}   options={TYPE_OPTIONS}   minWidth="120px" isDark={isDark} />
              <SelectFilter value={methodFilter} onChange={setMethodFilter} options={METHOD_OPTIONS} minWidth="140px" isDark={isDark} />
              <SelectFilter value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} minWidth="140px" isDark={isDark} />
              <div className="relative flex-1" style={{ minWidth: "180px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Transaction ID"
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(74,222,128,0.18)" }}
                  onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
              <button className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg,${DG},${G})` }}>Filter</button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "820px" }}>
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
                  <td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>
                    Connect to the backend to load transaction data.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 flex-wrap gap-2 no-print"
            style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <span className="text-sm" style={{ color: subTxt }}>Showing 0 transactions</span>
            <div className="flex items-center gap-1">
              {["←", "1", "2", "3", "→"].map((p, i) => (
                <button key={i} className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{ background: p === "1" ? `linear-gradient(135deg,${DG},${G})` : isDark ? "#1e293b" : "white", color: p === "1" ? "white" : isDark ? "#94a3b8" : "#6b7280", border: p === "1" ? "none" : `1px solid ${isDark ? "#374151" : "#e2e8f0"}` }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Print footer */}
        <div className="print-only print-footer">
          <p>Esting's Flower International Inc. — Confidential. For internal use only.</p>
        </div>
      </div>
    </div>
  )
}