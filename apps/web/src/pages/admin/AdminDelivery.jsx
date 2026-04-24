import { useState } from "react"
import { DG, G, GreenCard, WhiteCard, TH, EmptyRow, TableWrap } from "./_adminShared"

// ── Functional Export Button ──────────────────────────────────────────────────
function ExportDeliveryBtn({ data = [] }) {
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
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
      style={{ borderColor: "#dde3ec" }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export
    </button>
  )
}

// ── Functional Pagination ─────────────────────────────────────────────────────
function DeliveryPagination({ total = 0 }) {
  const disabled = total === 0
  const btnBase = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const disabledStyle = { borderColor: "#e5e7eb", color: "#d1d5db", cursor: "not-allowed", backgroundColor: "#fafafa" }
  const activeStyle = { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" }

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
      <p className="text-xs text-gray-400">
        {disabled ? "Showing 0 delivery riders" : `Showing ${total} delivery rider${total !== 1 ? "s" : ""}`}
      </p>
      <div className="flex items-center gap-1">
        {["← Prev", "1", "2", "3", "Next →"].map(lbl => (
          <button
            key={lbl}
            disabled={disabled}
            className={btnBase}
            style={disabled ? disabledStyle : activeStyle}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.backgroundColor = "#f0fdf4"; e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G } }}
            onMouseLeave={e => { if (!disabled) { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.borderColor = "#dde3ec"; e.currentTarget.style.color = "#374151" } }}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Dropdown helper ───────────────────────────────────────────────────────────
function FDrop({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
      >
        {children}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDelivery() {
  const [search, setSearch] = useState("")
  const [areaFilter, setAreaFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [ordersSort, setOrdersSort] = useState("")

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Delivery Operations</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Deliveries today" sublabel="Success" value={0} sub="↑ +0 this week" />
        <WhiteCard label="Out for delivery" sublabel="On the way" value={0} sub="↑ +0 vs last week" accentColor="#3b82f6" />
        <WhiteCard label="Available Riders" sublabel="Assign deliveries" value={0} sub="← 0 others out for delivery" accentColor="#22c55e" />
        <WhiteCard label="Failed deliveries" sublabel="Review Cases" value={0} sub="↑ +0 vs last week" subRed accentColor="#ef4444">
          <button className="text-xs font-semibold mt-1 text-red-400 hover:underline block">Review Cases</button>
        </WhiteCard>
      </div>

      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">

            {/* Assigned Area */}
            <FDrop value={areaFilter} onChange={setAreaFilter}>
              <option value="">As. Area: All</option>
              <option value="manila_north">Manila – North</option>
              <option value="manila_south">Manila – South</option>
              <option value="manila_central">Manila – Central</option>
              <option value="quezon_city">Quezon City</option>
              <option value="pampanga_city">Pampanga – City</option>
              <option value="pampanga_angeles">Pampanga – Angeles</option>
              <option value="pampanga_mabalacat">Pampanga – Mabalacat</option>
            </FDrop>

            {/* Status */}
            <FDrop value={statusFilter} onChange={setStatusFilter}>
              <option value="">Status: All</option>
              <option value="available">Available</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="on_break">On Break</option>
              <option value="off_duty">Off Duty</option>
              <option value="inactive">Inactive</option>
            </FDrop>

            {/* Assigned Orders sort */}
            <FDrop value={ordersSort} onChange={setOrdersSort}>
              <option value="">As. Orders: All</option>
              <option value="asc">Ascending (fewest first)</option>
              <option value="desc">Descending (most first)</option>
              <option value="none">No orders assigned</option>
              <option value="max">At capacity</option>
            </FDrop>

            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search rider ID or name"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <ExportDeliveryBtn data={[]} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "760px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Image</TH>
                <TH>Rider Name</TH>
                <TH>Assigned Area</TH>
                <TH>As. Orders</TH>
                <TH>Last Assigned</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={7} message="Connect to the backend to load delivery rider data." />
            </tbody>
          </table>
        </div>

        <DeliveryPagination total={0} />
      </TableWrap>
    </div>
  )
}
