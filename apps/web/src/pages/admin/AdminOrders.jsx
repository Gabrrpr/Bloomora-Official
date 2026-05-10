import { useState, useEffect, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge, TH, TD, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

const ORDER_STATUSES = ["All", "Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]
const BRANCHES       = ["All Branches", "Manila", "Pampanga"]
const DATE_RANGES    = ["All Time", "Today", "This Week", "This Month", "Last 30 Days"]

function SelectFilter({ value, onChange, options, minWidth = "130px", isDark }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#374151"
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor:bdr, minWidth, backgroundColor:bg, color:tc }}
        onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(74,222,128,0.18)` }}
        onBlur={e => { e.target.style.borderColor=bdr; e.target.style.boxShadow="none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:isDark?"#64748b":"#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
      </svg>
    </div>
  )
}

function formatStatus(status) {
  if (!status) return "Pending"
  return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

export default function AdminOrders() {
  const { isDark } = useTheme()
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatus] = useState("All")
  const [branch, setBranch]       = useState("All Branches")
  const [dateRange, setDateRange] = useState("All Time")
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.getAdminOrders({ status:statusFilter, search:search.trim()||undefined, branch })
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message||"Failed to load orders"); setOrders([]) }
    finally { setLoading(false) }
  }, [statusFilter, search, branch])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const counts = {
    "Out for Delivery": orders.filter(o => formatStatus(o.status)==="Out For Delivery").length,
    "Pending":          orders.filter(o => formatStatus(o.status)==="Pending").length,
    "Preparing":        orders.filter(o => formatStatus(o.status)==="Preparing").length,
    "Cancelled":        orders.filter(o => formatStatus(o.status)==="Cancelled").length,
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter==="All" || formatStatus(o.status)===statusFilter
    const matchBranch = branch==="All Branches" || (o.branch||"").toLowerCase()===branch.toLowerCase()
    const matchSearch = !search || (o.order_number||"").toLowerCase().includes(search.toLowerCase()) || (o.customer_name||"").toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchBranch && matchSearch
  })

  // ── dark mode tokens ───────────────────────────────────────────────────────
  const pageTxt    = isDark ? "#e2e8f0" : "#0f172a"
  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const errBg      = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"
  const errBdr     = isDark ? "rgba(239,68,68,0.3)" : "#fecaca"
  const errTxt     = isDark ? "#f87171" : "#dc2626"

  const STAT_CARDS = [
    { label:"Out for Delivery", sub:"On the way",        key:"Out for Delivery", green:true },
    { label:"Pending",          sub:"Need action today", key:"Pending" },
    { label:"Preparing",        sub:"In progress",       key:"Preparing" },
    { label:"Cancelled",        sub:"Review cases",      key:"Cancelled", red:true },
  ]

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div>
        <p className="text-sm font-medium" style={{ color:subTxt }}>Your total orders</p>
        <div className="flex items-baseline gap-3 mt-0.5">
          <span className="text-4xl font-bold" style={{ color:isDark?"#4ade80":DG }}>{orders.length}</span>
          <span className="text-sm font-semibold text-green-500">↑ 0% vs last week</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(c => (
          <button key={c.key} onClick={() => setStatus(statusFilter===c.key?"All":c.key)}
            className="rounded-xl p-4 sm:p-5 text-left transition-all duration-200"
            style={{
              background: c.green
                ? "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)"
                : (isDark ? "#1a2332" : "white"),
              border: c.green ? "none"
                : statusFilter===c.key
                  ? `2px solid ${isDark?"#4ade80":DG}`
                  : `1px solid ${isDark?"#2d3748":"#e8edf2"}`,
              boxShadow: c.green ? "0 4px 16px rgba(12,87,62,0.25)"
                : statusFilter===c.key
                  ? `0 0 0 3px rgba(74,222,128,0.15)`
                  : isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
              transform: statusFilter===c.key && !c.green ? "translateY(-1px)" : "",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)" }}
            onMouseLeave={e => { if (statusFilter!==c.key||c.green) e.currentTarget.style.transform="" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: c.green ? "rgba(255,255,255,0.65)" : c.red ? "#f87171" : isDark?"#64748b":"#94a3b8" }}>
              {c.label}
            </p>
            <p className="text-xs mb-2"
              style={{ color: c.green ? "rgba(255,255,255,0.5)" : c.red ? "#f87171" : isDark?"#64748b":"#94a3b8" }}>
              {c.sub}
            </p>
            <p className="text-3xl font-bold"
              style={{ color: c.green ? "white" : c.red ? "#f87171" : (isDark?"#4ade80":DG) }}>
              {counts[c.key]}
            </p>
            {statusFilter===c.key && !c.green && (
              <p className="text-[10px] font-semibold mt-1" style={{ color:isDark?"#4ade80":DG }}>● Filtering by this status</p>
            )}
          </button>
        ))}
      </div>

      {/* Active filters */}
      {(statusFilter!=="All"||branch!=="All Branches"||dateRange!=="All Time"||search) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color:subTxt }}>Active filters:</span>
          {statusFilter!=="All" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor:isDark?"rgba(74,222,128,0.12)":"#f0fdf4", color:isDark?"#4ade80":DG, border:`1px solid ${isDark?"rgba(74,222,128,0.3)":"#bbf7d0"}` }}>
              Status: {statusFilter}
              <button onClick={() => setStatus("All")} style={{ color:isDark?"#4ade80":"#16a34a" }}>×</button>
            </span>
          )}
          {branch!=="All Branches" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor:isDark?"rgba(59,130,246,0.12)":"#eff6ff", color:isDark?"#93c5fd":"#1d4ed8", border:`1px solid ${isDark?"rgba(59,130,246,0.3)":"#bfdbfe"}` }}>
              Branch: {branch}
              <button onClick={() => setBranch("All Branches")}>×</button>
            </span>
          )}
          <button onClick={() => { setStatus("All"); setBranch("All Branches"); setDateRange("All Time"); setSearch("") }}
            className="text-xs font-semibold ml-1" style={{ color:"#f87171" }}>
            Clear all
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm rounded-md border"
          style={{ color:errTxt, backgroundColor:errBg, borderColor:errBdr }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden"
        style={{ border:`1px solid ${isDark?"#1e293b":"#e8edf2"}`, backgroundColor:isDark?"#1a2332":"white", boxShadow:isDark?"none":"0 1px 3px rgba(0,0,0,0.04)" }}>

        {/* Toolbar */}
        <div className="p-3 sm:p-4" style={{ borderBottom:`1px solid ${toolbarBdr}`, backgroundColor:toolbarBg }}>
          <div className="flex items-center gap-2 flex-wrap">
            <SelectFilter value={statusFilter} onChange={setStatus} options={ORDER_STATUSES} minWidth="140px" isDark={isDark}/>
            <SelectFilter value={branch} onChange={setBranch} options={BRANCHES} minWidth="130px" isDark={isDark}/>
            <SelectFilter value={dateRange} onChange={setDateRange} options={DATE_RANGES} minWidth="130px" isDark={isDark}/>
            <div className="relative flex-1" style={{ minWidth:"180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:isDark?"#64748b":"#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order ID or customer name"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                style={{ borderColor:inputBdr, backgroundColor:inputBg, color:inputTxt }}
                onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 2px rgba(74,222,128,0.18)` }}
                onBlur={e => { e.target.style.borderColor=inputBdr; e.target.style.boxShadow="none" }}/>
            </div>
            <button onClick={fetchOrders}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background:`linear-gradient(135deg,${DG},${G})` }}>
              Refresh
            </button>
            <ExportBtn/>
          </div>
        </div>

        {/* Responsive table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth:"700px" }}>
            <thead style={{ borderBottom:`1px solid ${toolbarBdr}`, backgroundColor:toolbarBg }}>
              <tr>
                {["Order ID","Customer","Payment Status","Status","Total","Order Date","Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color:isDark?"#64748b":"#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop:`1px solid ${isDark?"#1e293b":"#f1f5f9"}` }}>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color:subTxt }}>Loading orders...</td></tr>
              ) : filtered.length > 0 ? filtered.map((o, idx) => (
                <tr key={o.id}
                  style={{ borderBottom:`1px solid ${isDark?"#1e293b":"#f8fafc"}`, backgroundColor:isDark?(idx%2===0?"#1a2332":"#111827"):"white" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor=isDark?"rgba(74,222,128,0.04)":"#f8fffe"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor=isDark?(idx%2===0?"#1a2332":"#111827"):"white"}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color:isDark?"#94a3b8":"#6b7280" }}>{o.order_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium block" style={{ color:isDark?"#e2e8f0":"#1e293b" }}>{o.customer_name||"—"}</span>
                    <span className="text-xs" style={{ color:subTxt }}>{o.customer_email||"—"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.payment_status||"pending"}/></td>
                  <td className="px-4 py-3"><StatusBadge status={formatStatus(o.status)}/></td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color:isDark?"#4ade80":DG }}>₱{(o.total_amount||0).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color:subTxt }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
                        style={{ backgroundColor:isDark?"rgba(74,222,128,0.1)":"#f0fdf4", borderColor:isDark?"rgba(74,222,128,0.3)":"#bbf7d0", color:isDark?"#4ade80":DG }}
                        onClick={() => fetchOrders()}>
                        View
                      </button>
                      <select
                        value={formatStatus(o.status)}
                        onChange={async (e) => {
                          const next = e.target.value
                          const nextKey = next.toLowerCase().replace(/ /g,"_")
                          try { await api.updateAdminOrderStatus(o.id, nextKey); await fetchOrders() }
                          catch (err) { setError(err.message||"Failed to update order") }
                        }}
                        className="text-xs font-semibold border rounded-md px-2 py-1 outline-none"
                        style={{ borderColor:isDark?"#374151":"#e2e8f0", color:isDark?"#e2e8f0":"#0f172a", backgroundColor:isDark?"#1e293b":"white" }}>
                        <option value={formatStatus(o.status)}>{formatStatus(o.status)}</option>
                        {["Pending","Preparing","Out For Delivery","Delivered","Cancelled","Confirmed"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color:subTxt }}>No orders match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3"
          style={{ borderTop:`1px solid ${toolbarBdr}`, backgroundColor:toolbarBg }}>
          <span className="text-sm" style={{ color:subTxt }}>Showing {filtered.length} of {orders.length} entries</span>
          <div className="flex items-center gap-1">
            {["←","1","2","3","→"].map((p,i) => (
              <button key={i} className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: p==="1" ? `linear-gradient(135deg,${DG},${G})` : (isDark?"#1e293b":"white"),
                  color: p==="1" ? "white" : (isDark?"#94a3b8":"#6b7280"),
                  border: p==="1" ? "none" : `1px solid ${isDark?"#374151":"#e2e8f0"}`,
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}