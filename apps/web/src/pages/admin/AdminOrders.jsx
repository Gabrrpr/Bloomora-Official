import { useState, useEffect, useCallback } from "react"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge, Pagination, TH, TD, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

const ORDER_STATUSES = ["All", "Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]
const BRANCHES       = ["All Branches", "Manila", "Pampanga"]
const DATE_RANGES    = ["All Time", "Today", "This Week", "This Month", "Last 30 Days"]

function SelectFilter({ value, onChange, options, minWidth = "130px" }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec", minWidth }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function formatStatus(status) {
  if (!status) return "Pending"
  return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

export default function AdminOrders() {
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatus] = useState("All")
  const [branch, setBranch]       = useState("All Branches")
  const [dateRange, setDateRange] = useState("All Time")
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getAdminOrders({
        status: statusFilter,
        search: search.trim() || undefined,
        branch: branch,
      })
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || "Failed to load orders")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, branch])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Counts per status (for the stat cards)
  const counts = {
    "Out for Delivery": orders.filter(o => formatStatus(o.status) === "Out For Delivery").length,
    "Pending":          orders.filter(o => formatStatus(o.status) === "Pending").length,
    "Preparing":        orders.filter(o => formatStatus(o.status) === "Preparing").length,
    "Cancelled":        orders.filter(o => formatStatus(o.status) === "Cancelled").length,
  }

  // Filter logic (client-side for date range since backend doesn't filter by date yet)
  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "All" || formatStatus(o.status) === statusFilter
    const matchBranch = branch === "All Branches" || (o.branch || "").toLowerCase() === branch.toLowerCase()
    const matchSearch = !search ||
      (o.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_email || "").toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchBranch && matchSearch
  })

  const STAT_CARDS = [
    { label: "Out for Delivery", sub: "On the way",       key: "Out for Delivery", green: true },
    { label: "Pending",          sub: "Need action today", key: "Pending" },
    { label: "Preparing",        sub: "In progress",       key: "Preparing" },
    { label: "Cancelled",        sub: "Review cases",      key: "Cancelled",        red: true },
  ]

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div>
        <p className="text-sm font-medium text-gray-500">Your total orders</p>
        <div className="flex items-baseline gap-3 mt-0.5">
          <span className="text-4xl font-bold" style={{ color: DG }}>{orders.length}</span>
          <span className="text-sm font-semibold text-green-600">↑ 0% vs last week</span>
        </div>
      </div>

      {/* Status cards — clickable to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(c => (
          <button key={c.key} onClick={() => setStatus(statusFilter === c.key ? "All" : c.key)}
            className="rounded-xl p-5 text-left transition-all duration-200"
            style={{
              background: c.green ? "linear-gradient(135deg, #0a4a34 0%, #1a7040 60%, #2E8B34 100%)" : "white",
              border:     c.green ? "none" : statusFilter === c.key ? `2px solid ${DG}` : "1px solid #e8edf2",
              boxShadow:  c.green ? "0 4px 16px rgba(12,87,62,0.25)" : statusFilter === c.key ? `0 0 0 3px rgba(12,87,62,0.1)` : "0 1px 3px rgba(0,0,0,0.04)",
              transform:  statusFilter === c.key && !c.green ? "translateY(-1px)" : "",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)" }}
            onMouseLeave={e => { if (statusFilter !== c.key || c.green) e.currentTarget.style.transform = "" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: c.green ? "rgba(255,255,255,0.65)" : c.red ? "#ef4444" : "#94a3b8" }}>
              {c.label}
            </p>
            {c.red
              ? <p className="text-xs mb-2 text-red-400">{c.sub}</p>
              : <p className="text-xs mb-2" style={{ color: c.green ? "rgba(255,255,255,0.5)" : "#94a3b8" }}>{c.sub}</p>
            }
            <p className="text-3xl font-bold" style={{ color: c.green ? "white" : c.red ? "#ef4444" : "#0f172a" }}>
              {counts[c.key]}
            </p>
            {statusFilter === c.key && !c.green && (
              <p className="text-[10px] font-semibold mt-1" style={{ color: DG }}>● Filtering by this status</p>
            )}
          </button>
        ))}
      </div>

      {/* Active filters display */}
      {(statusFilter !== "All" || branch !== "All Branches" || dateRange !== "All Time" || search) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Active filters:</span>
          {statusFilter !== "All" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#f0fdf4", color: DG, border: "1px solid #bbf7d0" }}>
              Status: {statusFilter}
              <button onClick={() => setStatus("All")} className="text-green-400 hover:text-red-500 font-bold">×</button>
            </span>
          )}
          {branch !== "All Branches" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              Branch: {branch}
              <button onClick={() => setBranch("All Branches")} className="text-blue-400 hover:text-red-500 font-bold">×</button>
            </span>
          )}
          {dateRange !== "All Time" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#fef9c3", color: "#92400e", border: "1px solid #fde68a" }}>
              Date: {dateRange}
              <button onClick={() => setDateRange("All Time")} className="text-amber-400 hover:text-red-500 font-bold">×</button>
            </span>
          )}
          <button onClick={() => { setStatus("All"); setBranch("All Branches"); setDateRange("All Time"); setSearch("") }}
            className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors ml-1">
            Clear all
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
          {error}
        </div>
      )}

      {/* Table */}
      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status dropdown */}
            <SelectFilter value={statusFilter} onChange={setStatus} options={ORDER_STATUSES} minWidth="140px" />

            {/* Branch */}
            <SelectFilter value={branch} onChange={setBranch} options={BRANCHES} minWidth="130px" />

            {/* Date range */}
            <SelectFilter value={dateRange} onChange={setDateRange} options={DATE_RANGES} minWidth="130px" />

            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "200px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order ID or customer name"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
            </div>

            <button onClick={fetchOrders}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
              Refresh
            </button>
            <ExportBtn />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "760px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Order ID</TH>
                <TH>Customer</TH>
                <TH>Payment Status</TH>
                <TH>Status</TH>
                <TH>Total</TH>
                <TH>Order Date</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Loading orders...</td></tr>
              ) : filtered.length > 0 ? filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <TD><span className="font-mono text-xs text-gray-500">{o.order_number}</span></TD>
                  <TD>
                    <div>
                      <span className="font-medium text-gray-800 block">{o.customer_name || "—"}</span>
                      <span className="text-xs text-gray-400">{o.customer_email || "—"}</span>
                    </div>
                  </TD>
                  <TD><StatusBadge status={o.payment_status || "pending"} /></TD>
                  <TD><StatusBadge status={formatStatus(o.status)} /></TD>
                  <TD><span className="font-semibold text-gray-800">₱{(o.total_amount || 0).toLocaleString()}</span></TD>
                  <TD>
                    <span className="text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
                        style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: DG }} onClick={() => fetchOrders()}>
                        View
                      </button>

                      <select
                        value={formatStatus(o.status)}
                        onChange={async (e) => {
                          const next = e.target.value;
                          const nextKey = next.toLowerCase().replace(/ /g, '_');
                          const canNext = (formatStatus(o.status) === 'Pending' && nextKey === 'preparing') ||
                            (formatStatus(o.status) === 'Confirmed' && nextKey === 'preparing') ||
                            (formatStatus(o.status) === 'Preparing' && nextKey === 'out_for_delivery') ||
                            (formatStatus(o.status) === 'Out For Delivery' && nextKey === 'Delivered') ||
                            (nextKey === 'cancelled' && formatStatus(o.status) !== 'Delivered');

                          if (!canNext) return;

                          try {
                            await api.updateAdminOrderStatus(o.id, nextKey);
                            await fetchOrders();
                          } catch (err) {
                            setError(err.message || 'Failed to update order');
                          }
                        }}
                        className="text-xs font-semibold border rounded-md px-2 py-1"
                        style={{ borderColor: '#e2e8f0', color: '#0f172a' }}>
                        <option value={formatStatus(o.status)}>{formatStatus(o.status)}</option>
                        {['Pending', 'Preparing', 'Out For Delivery', 'Delivered', 'Cancelled', 'Confirmed'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </TD>

                </tr>
              )) : (
                <EmptyRow cols={7} message="No orders match your filters." />
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-400">Showing {filtered.length} of {orders.length} entries</span>
          <div className="flex items-center gap-1">
            {["Previous","1","2","3",">","Next →"].map(p => (
              <button key={p} className="px-2.5 py-1.5 rounded-md text-xs transition-all"
                style={{ background: p === "1" ? `linear-gradient(135deg, ${DG}, ${G})` : "white", color: p === "1" ? "white" : "#6b7280", border: p === "1" ? "none" : "1px solid #e2e8f0", fontWeight: p === "1" ? 600 : 400 }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </TableWrap>
    </div>
  )
}

