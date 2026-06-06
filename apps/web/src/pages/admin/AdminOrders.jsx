import { useState, useEffect, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge } from "./_adminShared"
import { Pagination } from "./_adminShared"

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
        style={{ borderColor: bdr, minWidth, backgroundColor: bg, color: tc }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
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

function formatStatus(status) {
  if (!status) return "Pending"
  return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

export default function AdminOrders() {
  const { isDark } = useTheme()

  const PAGE_SIZE = 35;
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState("All")
  const [branch, setBranch]         = useState("All Branches")
  const [dateRange, setDateRange]   = useState("All Time")
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.getAdminOrders({ status: statusFilter, search: search.trim() || undefined, branch, date_range: dateRange })
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) { setError(e?.message || "Failed to load orders"); setOrders([]) }
    finally { setLoading(false) }
  }, [statusFilter, search, branch, dateRange])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const counts = {
    "Out for Delivery": orders.filter(o => formatStatus(o.status) === "Out For Delivery").length,
    Pending:   orders.filter(o => formatStatus(o.status) === "Pending").length,
    Preparing: orders.filter(o => formatStatus(o.status) === "Preparing").length,
    Cancelled: orders.filter(o => formatStatus(o.status) === "Cancelled").length,
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "All" || formatStatus(o.status) === statusFilter;
    const matchBranch = branch === "All Branches" || (o.branch || "").toLowerCase() === branch.toLowerCase();
    const matchSearch = !search ||
      (o.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase());
      
    return matchStatus && matchBranch && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  // 3. THIRD: Slice the final array for the current page
  const paginatedOrders = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const subTxt   = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const errBg      = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"
  const errBdr     = isDark ? "rgba(239,68,68,0.3)" : "#fecaca"
  const errTxt     = isDark ? "#f87171" : "#dc2626"

  const STAT_CARDS = [
    { label: "Out for Delivery", sub: "On the way",        key: "Out for Delivery", green: true },
    { label: "Pending",          sub: "Need action today", key: "Pending" },
    { label: "Preparing",        sub: "In progress",       key: "Preparing" },
    { label: "Cancelled",        sub: "Review cases",      key: "Cancelled", red: true },
  ]

  const modalD = {
    overlayBg: "rgba(15,23,42,0.72)",
    modalBg:   isDark ? "#1a2332" : "white",
    modalBdr:  isDark ? "#2d3748" : "#e8edf2",
    modalHdr:  isDark ? "#111827" : "linear-gradient(135deg,#f0fdf4,#fafff8)",
    modalHdrBdr: isDark ? "#1e293b" : "#f1f5f9",
    modalFtr:  isDark ? "#0f172a" : "#fafbfc",
    modalFtrBdr: isDark ? "#1e293b" : "#f1f5f9",
  }

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

  const handleCSV = () => {
    const headers = ["Order ID", "Customer", "Email", "Payment Status", "Status", "Total (₱)", "Date", "Branch"]
    const rows = filtered.map(o => [
      o.order_number || "—", o.customer_name || "—", o.customer_email || "—",
      o.payment_status || "—", formatStatus(o.status),
      o.total_amount || 0,
      o.created_at ? new Date(o.created_at).toLocaleDateString("en-PH") : "—",
      o.branch || "—",
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `orders_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #orders-print-area, #orders-print-area * { visibility: visible !important; }
          #orders-print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            padding: 24px; font-family: sans-serif;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #orders-print-area table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          #orders-print-area th {
            background: #f0fdf4 !important; color: #0C573E !important;
            border: 1px solid #d1d5db; padding: 8px 10px;
            text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          }
          #orders-print-area td {
            border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; color: #111827;
          }
          #orders-print-area tr:nth-child(even) td { background: #f9fafb !important; }
          .print-footer { margin-top: 20px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ── Order detail modal ── */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 no-print"
          style={{ backgroundColor: modalD.overlayBg, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewingOrder(null) }}>
          <div className="rounded-xl w-full overflow-hidden flex flex-col"
            style={{ maxWidth: "560px", maxHeight: "90vh", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: `1px solid ${modalD.modalBdr}`, backgroundColor: modalD.modalBg }}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              
              style={{ borderBottom: `1px solid ${modalD.modalHdrBdr}`, background: modalD.modalHdr }}>
              <div>
                <p className="text-base font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Order Details</p>
                <p className="text-sm mt-0.5" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{viewingOrder.order_number}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="p-2 rounded-lg transition-all" style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
              {/* Customer Info */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Customer</p>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{viewingOrder.customer_name || "—"}</p>
                    <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{viewingOrder.customer_email || "—"}</p>
                    <p className="text-sm" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>{viewingOrder.customer_phone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDark ? "#0f172a" : "#f8fafc", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Delivery Address</p>
                <p className="text-sm font-medium leading-relaxed" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                  {viewingOrder.delivery_address || "No address provided"}
                </p>
                {viewingOrder.delivery_notes && (
                  <p className="text-sm mt-2 pt-2 border-t" style={{ color: isDark ? "#94a3b8" : "#64748b", borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                    {viewingOrder.delivery_notes}
                  </p>
                )}
              </div>
              
              {/* Special Instructions */}
              {viewingOrder.special_note && (
                <div 
                  className="p-4 rounded-lg shadow-sm" 
                  style={{ 
                    backgroundColor: isDark ? "rgba(217, 119, 6, 0.1)" : "#fffbeb", 
                    border: `1px solid ${isDark ? "rgba(217, 119, 6, 0.2)" : "#fde68a"}`,
                    borderLeftWidth: "4px", 
                    borderLeftColor: "#d97706" 
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="18" height="18" fill="none" stroke="#d97706" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="font-bold uppercase tracking-wider text-xs" style={{ color: isDark ? "#fbbf24" : "#b45309" }}>
                      Customer Special Instructions
                    </span>
                  </div>
                  <p className="text-sm italic font-medium whitespace-pre-wrap" style={{ color: isDark ? "#fde68a" : "#78350f" }}>
                    "{viewingOrder.special_note}"
                  </p>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Order Summary</p>
                <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                  <p className="text-sm font-medium" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                    {viewingOrder.product_name || "Custom Arrangement"}
                  </p>
                  <p className="text-sm font-bold" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    x{viewingOrder.quantity || 1}
                  </p>
                </div>
              </div>

              {/* Status and Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Payment</p>
                  <StatusBadge status={viewingOrder.payment_status || "pending"} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Status</p>
                  <StatusBadge status={formatStatus(viewingOrder.status)} />
                </div>
              </div>

              {/* Totals and Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Total</p>
                  <p className="text-sm font-bold" style={{ color: isDark ? "#4ade80" : DG }}>₱{(viewingOrder.total_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Order Date</p>
                  <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                    {viewingOrder.created_at ? new Date(viewingOrder.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? "#94a3b8" : "#4b5563" }}>Processing Branch</p>
                <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{viewingOrder.branch || "—"}</p>
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
              style={{ borderTop: `1px solid ${modalD.modalFtrBdr}`, backgroundColor: modalD.modalFtr }}>
              <button onClick={() => setViewingOrder(null)}
                className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
                style={{ borderColor: modalD.modalBdr, color: isDark ? "#94a3b8" : "#64748b", backgroundColor: modalD.modalBg }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = modalD.modalBg}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Heading ── */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Your total orders</p>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>{orders.length}</span>
            <span className="text-sm font-semibold text-green-500">↑ 0% vs last week</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        {STAT_CARDS.map(c => (
          <button key={c.key} onClick={() => setStatus(statusFilter === c.key ? "All" : c.key)}
            className="rounded-xl p-4 sm:p-5 text-left transition-all duration-200"
            style={{
              background: c.green ? "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)" : isDark ? "#1a2332" : "white",
              border: c.green ? "none" : statusFilter === c.key ? `2px solid ${isDark ? "#4ade80" : DG}` : `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`,
              boxShadow: c.green ? "0 4px 16px rgba(12,87,62,0.25)" : statusFilter === c.key ? `0 0 0 3px rgba(74,222,128,0.15)` : isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => { if (statusFilter !== c.key || c.green) e.currentTarget.style.transform = "" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: c.green ? "rgba(255,255,255,0.65)" : c.red ? "#f87171" : isDark ? "#64748b" : "#94a3b8" }}>{c.label}</p>
            <p className="text-xs mb-2"
              style={{ color: c.green ? "rgba(255,255,255,0.5)" : c.red ? "#f87171" : isDark ? "#64748b" : "#94a3b8" }}>{c.sub}</p>
            <p className="text-3xl font-bold"
              style={{ color: c.green ? "white" : c.red ? "#f87171" : isDark ? "#4ade80" : DG }}>{counts[c.key]}</p>
          </button>
        ))}
      </div>

      {/* ── Active filters ── */}
      {(statusFilter !== "All" || branch !== "All Branches" || dateRange !== "All Time" || search) && (
        <div className="flex items-center gap-2 flex-wrap no-print">
          <span className="text-xs font-medium" style={{ color: subTxt }}>Active filters:</span>
          {statusFilter !== "All" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", color: isDark ? "#4ade80" : DG, border: `1px solid ${isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0"}` }}>
              Status: {statusFilter}
              <button onClick={() => setStatus("All")} style={{ color: isDark ? "#4ade80" : "#16a34a" }}>×</button>
            </span>
          )}
          {branch !== "All Branches" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff", color: isDark ? "#93c5fd" : "#1d4ed8", border: `1px solid ${isDark ? "rgba(59,130,246,0.3)" : "#bfdbfe"}` }}>
              Branch: {branch}
              <button onClick={() => setBranch("All Branches")}>×</button>
            </span>
          )}
          <button onClick={() => { setStatus("All"); setBranch("All Branches"); setDateRange("All Time"); setSearch("") }}
            className="text-xs font-semibold ml-1" style={{ color: "#f87171" }}>Clear all</button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm rounded-md border no-print" style={{ color: errTxt, backgroundColor: errBg, borderColor: errBdr }}>{error}</div>
      )}

      {/* ── Printable area ── */}
      <div id="orders-print-area">

        {/* Print-only header */}
        <div className="print-only" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0C573E", margin: 0 }}>Esting's Flower International Inc.</h1>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "4px 0 0" }}>Orders Report</h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
              <p style={{ margin: 0 }}>Generated: {printDate}</p>
              <p style={{ margin: "2px 0 0" }}>
                Status: {statusFilter} | Branch: {branch} | Period: {dateRange}
              </p>
              <p style={{ margin: "2px 0 0" }}>Total orders: {filtered.length}</p>
            </div>
          </div>
          <div style={{ height: "2px", background: "linear-gradient(90deg,#0C573E,#2E8B34)", marginTop: "12px", borderRadius: "2px" }} />
        </div>

        {/* Table card — screen */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${isDark ? "#1e293b" : "#e8edf2"}`, backgroundColor: isDark ? "#1a2332" : "white", boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Toolbar */}
          <div className="p-3 sm:p-4 no-print" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              <SelectFilter value={statusFilter} onChange={setStatus} options={ORDER_STATUSES} minWidth="140px" isDark={isDark} />
              <SelectFilter value={branch}       onChange={setBranch}  options={BRANCHES}       minWidth="130px" isDark={isDark} />
              <SelectFilter value={dateRange}    onChange={setDateRange} options={DATE_RANGES}  minWidth="130px" isDark={isDark} />
              <div className="relative flex-1" style={{ minWidth: "180px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order ID or customer name"
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
                  onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
              <button onClick={fetchOrders} className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg,${DG},${G})` }}>Refresh</button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "700px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {["Order ID", "Customer", "Payment Status", "Status", "Total", "Order Date", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}` }}>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: subTxt }}>Loading orders...</td></tr>
                ) : filtered.length > 0 ? filtered.map((o, idx) => (
                  <tr key={o.id}
                    style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f8fafc"}`, backgroundColor: isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white"}>
                    <td className="px-4 py-3"><span className="font-mono text-xs" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>{o.order_number}</span></td>
                    <td className="px-4 py-3">
                      <span className="font-medium block" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{o.customer_name || "—"}</span>
                      <span className="text-xs" style={{ color: subTxt }}>{o.customer_email || "—"}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={o.payment_status || "pending"} /></td>
                    <td className="px-4 py-3"><StatusBadge status={formatStatus(o.status)} /></td>
                    <td className="px-4 py-3"><span className="font-semibold" style={{ color: isDark ? "#4ade80" : DG }}>₱{(o.total_amount || 0).toLocaleString()}</span></td>
                    <td className="px-4 py-3"><span style={{ color: subTxt }}>{o.created_at ? new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span></td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
                          style={{ backgroundColor: isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4", borderColor: isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0", color: isDark ? "#4ade80" : DG }}
                          onClick={() => setViewingOrder(o)}>View</button>
                        <select value={formatStatus(o.status)}
                          onChange={async e => {
                            const nextKey = e.target.value.toLowerCase().replace(/ /g, "_")
                            try { await api.updateAdminOrderStatus(o.id, nextKey); await fetchOrders() }
                            catch (err) { setError(err?.message || "Failed to update order") }
                          }}
                          className="text-xs font-semibold border rounded-md px-2 py-1 outline-none"
                          style={{ borderColor: isDark ? "#374151" : "#e2e8f0", color: isDark ? "#e2e8f0" : "#0f172a", backgroundColor: isDark ? "#1e293b" : "white" }}>
                          <option value={formatStatus(o.status)}>{formatStatus(o.status)}</option>
                          {["Pending", "Preparing", "Out For Delivery", "Delivered", "Cancelled", "Confirmed"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>No orders match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 no-print"
            style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
            <span className="text-sm" style={{ color: subTxt }}>Showing {filtered.length} of {orders.length} entries</span>
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