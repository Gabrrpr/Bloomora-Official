import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { DG, G, GreenCard, WhiteCard } from "./_adminShared"

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

function ExportDeliveryBtn({ data = [], isDark }) {
  const handleExport = () => {
    const headers = ["Rider Name", "Assigned Area", "Assigned Orders", "Last Assigned", "Status", "Phone"]
    const rows = data.length
      ? data.map(r => headers.map(h => r[h] ?? "").join(","))
      : [headers.map(() => "—").join(",")]
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `delivery_riders_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button onClick={handleExport}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  )
}

function DeliveryPagination({ total = 0, isDark }) {
  const disabled = total === 0
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  return (
    <div className="flex items-center justify-between px-5 py-3 no-print" style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
      <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>
        {disabled ? "Showing 0 delivery riders" : `Showing ${total} delivery rider${total !== 1 ? "s" : ""}`}
      </p>
      <div className="flex items-center gap-1">
        {["← Prev", "1", "2", "3", "Next →"].map(lbl => (
          <button key={lbl} disabled={disabled}
            className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
            style={{ borderColor: disabled ? (isDark ? "#2d3748" : "#e5e7eb") : (isDark ? "#374151" : "#dde3ec"), color: disabled ? (isDark ? "#4b5563" : "#d1d5db") : (isDark ? "#94a3b8" : "#374151"), backgroundColor: isDark ? "#1e293b" : "white", cursor: disabled ? "not-allowed" : "pointer" }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f0fdf4" }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white" }}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

function FDrop({ value, onChange, children, isDark, inputBg, inputBdr, inputTxt }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)` }}
        onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }}>
        {children}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

export default function AdminDelivery() {
  const { isDark } = useTheme()
  const [search, setSearch]             = useState("")
  const [areaFilter, setAreaFilter]     = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [ordersSort, setOrdersSort]     = useState("")

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
          #delivery-print-area, #delivery-print-area * { visibility: visible !important; }
          #delivery-print-area { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; font-family: sans-serif; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #delivery-print-area table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          #delivery-print-area th { background: #f0fdf4 !important; color: #0C573E !important; border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          #delivery-print-area td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; color: #111827; }
          #delivery-print-area tr:nth-child(even) td { background: #f9fafb !important; }
          .print-footer { margin-top: 20px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Heading row with Export + Print */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
          Delivery Operations
        </h1>
        <div className="flex items-center gap-2">
          <ExportDeliveryBtn data={[]} isDark={isDark} />
          <PrintBtn onClick={handlePrint} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Deliveries today" sublabel="Success" value={0} sub="↑ +0 this week" />
        <WhiteCard label="Out for delivery" sublabel="On the way" value={0} sub="↑ +0 vs last week" accentColor="#3b82f6" />
        <WhiteCard label="Available Riders" sublabel="Assign deliveries" value={0} sub="← 0 others out for delivery" accentColor="#22c55e" />
        <WhiteCard label="Failed deliveries" sublabel="Review Cases" value={0} sub="↑ +0 vs last week" subRed accentColor="#ef4444">
          <button className="text-xs font-semibold mt-1 text-red-400 hover:underline block">Review Cases</button>
        </WhiteCard>
      </div>

      {/* Printable area */}
      <div id="delivery-print-area">

        {/* Print header */}
        <div className="print-only" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0C573E", margin: 0 }}>Esting's Flower International Inc.</h1>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "4px 0 0" }}>Delivery Operations Report</h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
              <p style={{ margin: 0 }}>Generated: {printDate}</p>
              <p style={{ margin: "2px 0 0" }}>Area: {areaFilter || "All"} | Status: {statusFilter || "All"}</p>
            </div>
          </div>
          <div style={{ height: "2px", background: "linear-gradient(90deg,#0C573E,#2E8B34)", marginTop: "12px", borderRadius: "2px" }} />
        </div>

        {/* Table card */}
        <div className="rounded-xl overflow-hidden"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Toolbar */}
          <div className="p-4 no-print" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              <FDrop value={areaFilter} onChange={setAreaFilter} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">As. Area: All</option>
                <option value="manila_north">Manila – North</option>
                <option value="manila_south">Manila – South</option>
                <option value="manila_central">Manila – Central</option>
                <option value="quezon_city">Quezon City</option>
                <option value="pampanga_city">Pampanga – City</option>
                <option value="pampanga_angeles">Pampanga – Angeles</option>
                <option value="pampanga_mabalacat">Pampanga – Mabalacat</option>
              </FDrop>
              <FDrop value={statusFilter} onChange={setStatusFilter} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">Status: All</option>
                <option value="available">Available</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="on_break">On Break</option>
                <option value="off_duty">Off Duty</option>
                <option value="inactive">Inactive</option>
              </FDrop>
              <FDrop value={ordersSort} onChange={setOrdersSort} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt}>
                <option value="">As. Orders: All</option>
                <option value="asc">Ascending (fewest first)</option>
                <option value="desc">Descending (most first)</option>
                <option value="none">No orders assigned</option>
                <option value="max">At capacity</option>
              </FDrop>
              <div className="relative flex-1" style={{ minWidth: "180px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rider ID or name"
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)` }}
                  onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "760px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {["Image", "Rider Name", "Assigned Area", "As. Orders", "Last Assigned", "Status", "Action"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-14">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
                        style={{ background: isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}>
                        <svg className="w-5 h-5" style={{ color: isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#6b7280" }}>No data yet</p>
                      <p className="text-xs mt-0.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Connect to the backend to load delivery rider data.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <DeliveryPagination total={0} isDark={isDark} />
        </div>

        <div className="print-only print-footer">
          <p>Esting's Flower International Inc. — Confidential. For internal use only.</p>
        </div>
      </div>
    </div>
  )
}