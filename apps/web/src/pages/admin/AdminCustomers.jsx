import { useState } from "react"
import { DG, G, GreenCard, WhiteCard, TH, EmptyRow, TableWrap } from "./_adminShared"

// ── Functional Export Button ──────────────────────────────────────────────────
function ExportCustomersBtn({ data = [] }) {
  const handleExport = () => {
    const headers = ["Customer Name", "Email", "Phone", "Status", "Total Orders", "Last Order Date"]
    const rows = data.length
      ? data.map(r => headers.map(h => r[h] ?? "").join(","))
      : [headers.map(() => "—").join(",")]
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`
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
function CustomerPagination({ total = 0 }) {
  const disabled = total === 0
  const btnBase = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const disabledStyle = { borderColor: "#e5e7eb", color: "#d1d5db", cursor: "not-allowed", backgroundColor: "#fafafa" }
  const activeStyle = { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" }

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
      <p className="text-xs text-gray-400">
        {disabled ? "Showing 0 customers" : `Showing ${total} customer${total !== 1 ? "s" : ""}`}
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminCustomers() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [ordersFilter, setOrdersFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Customers</h1>

      <div className="flex flex-wrap gap-3">
        <div style={{ flex: "1 0 220px", maxWidth: "300px" }}>
          <GreenCard label="Total customers" value={0} sub="↑ +0 this week" />
        </div>
        <div style={{ flex: "1 0 200px", maxWidth: "280px" }}>
          <WhiteCard label="Active Customers" value={0} sub="↑ 0% vs last week" accentColor="#22c55e" />
        </div>
      </div>

      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">

            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">Status: All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
                <option value="Unverified">Unverified</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Total Orders */}
            <div className="relative">
              <select
                value={ordersFilter}
                onChange={e => setOrdersFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">Total Orders: All</option>
                <option value="0">No orders yet</option>
                <option value="1-5">1–5 orders</option>
                <option value="6-20">6–20 orders</option>
                <option value="21-50">21–50 orders</option>
                <option value="50+">50+ orders</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Last Order Date */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">Last Order: Any time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="3months">Last 3 months</option>
                <option value="inactive90">Inactive 90+ days</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find customer"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              />
            </div>

            {/* Refresh */}
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
              style={{ borderColor: "#dde3ec" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            <ExportCustomersBtn data={[]} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "760px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Customer Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Status</TH>
                <TH>Total Orders</TH>
                <TH>Last Order Date</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={7} message="Connect to the backend to load customer data." />
            </tbody>
          </table>
        </div>

        <CustomerPagination total={0} />
      </TableWrap>
    </div>
  )
}
