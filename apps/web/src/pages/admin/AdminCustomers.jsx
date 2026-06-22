import { useState, useEffect, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge, TH, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

const STATUS_OPTIONS = ["All", "Active", "Inactive", "Blocked", "Unverified"]
const ORDERS_OPTIONS = ["All Orders", "No orders yet", "1–5 orders", "6–20 orders", "21–50 orders", "50+ orders"]
const DATE_OPTIONS   = ["Last Order: Any", "Today", "This week", "This month", "Last 3 months", "Inactive 90+ days"]

// Example names/emails cycled through the search box as an animated, typewriter-style hint.
const SEARCH_SAMPLES = ["John Dela Cruz", "maria@gmail.com", "Anna Reyes", "paolo@email.com"]

function SelectFilter({ value, onChange, options, minWidth = "130px", isDark }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#374151"
  return (
    <div className="relative">
      <select
        value={value} onChange={e => onChange(e.target.value)}
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

function getName(c) {
  return `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username || c.email || "Unknown"
}

// Animated flower shown while the customers are still loading.
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

export default function AdminCustomers({ onNavigate }) {
  const { isDark } = useTheme()

  const [search, setSearch]             = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [ordersFilter, setOrdersFilter] = useState("All Orders")
  const [dateFilter, setDateFilter]     = useState("Last Order: Any")
  const [customers, setCustomers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  // Add this inside AdminCustomers()
const [viewingCustomer, setViewingCustomer] = useState(null);
  // Controls the one-time entrance animation. Once the content has eased in we
  // drop the animation class so it never replays on later re-renders.
  const [entered, setEntered]           = useState(false)
  // Animated placeholder text for the search box (typewriter hint).
  const [phText, setPhText]             = useState("")

  // ── colour tokens (mirrors AdminOrders pattern) ──────────────────────────
  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"
  const errBg      = isDark ? "rgba(239,68,68,0.10)" : "#fef2f2"
  const errBdr     = isDark ? "rgba(239,68,68,0.30)" : "#fecaca"
  const errTxt     = isDark ? "#f87171" : "#dc2626"

  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = { role: "customer" }
      if (search.trim()) params.search = search.trim()
      if (statusFilter !== "All") {
        const map = { Active: "active", Inactive: "inactive", Blocked: "inactive", Unverified: "unverified" }
        params.status = map[statusFilter] || statusFilter.toLowerCase()
      }
      const data = await api.getUsers(params)
      setCustomers(data.users || [])
    } catch (err) {
      setError(err.message || "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  // Play the entrance animation once the data has loaded, then turn it off so it
  // doesn't replay on later re-renders. Resets while loading so refreshing re-animates.
  useEffect(() => {
    if (loading) { setEntered(false); return }
    const t = setTimeout(() => setEntered(true), 1300)
    return () => clearTimeout(t)
  }, [loading])

  // Typewriter hint in the search box: types a sample name/email, pauses, deletes,
  // then the next one — looping forever while the box is empty. Stops once the user types.
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

  const total       = customers.length
  const activeCount = customers.filter(c => c.is_active && c.is_verified).length
  const inactive    = customers.filter(c => !c.is_active).length
  const unverified  = customers.filter(c => !c.is_verified).length

  const customerStatus = (c) => {
    if (!c.is_verified) return "Unverified"
    if (!c.is_active)   return "Inactive"
    return "Active"
  }

  const filtered = customers.filter(c => {
    const matchStatus = statusFilter === "All" || customerStatus(c) === statusFilter
    const matchSearch = !search ||
      getName(c).toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const STAT_CARDS = [
    { label: "Total Customers",    sub: "All registered",     value: total,       green: true  },
    { label: "Active Customers",   sub: "Verified & active",  value: activeCount, blue: true   },
    { label: "Inactive Customers", sub: "Needs re-engagement",value: inactive                  },
    { label: "Unverified",         sub: "Pending email verify",value: unverified,  amber: true  },
  ]

  // While a fetch is running (initial load or Refresh), show the flower loader.
  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium" style={{ color: subTxt }}>Total registered customers</p>
          <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>—</span>
        </div>
        <FlowerLoader message="Loading customers..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Entrance animation: plays once after load, removed afterward via `entered`. */}
      <style>{`
        @keyframes custRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .cust-rise { animation: custRise 0.85s ease-out both; }
      `}</style>

      {/* Heading */}
      <div className={entered ? "" : "cust-rise"}>
        <p className="text-sm font-medium" style={{ color: subTxt }}>Total registered customers</p>
        <div className="flex items-baseline gap-3 mt-0.5">
          <span className="text-4xl font-bold" style={{ color: isDark ? "#4ade80" : DG }}>{total}</span>
          <span className="text-sm font-semibold text-green-500">↑ 0% vs last week</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${entered ? "" : "cust-rise"}`} style={{ animationDelay: "0.18s" }}>
        {STAT_CARDS.map(c => {
          const isSelected = statusFilter === c.label
          return (
            <button key={c.label}
              onClick={() => setStatusFilter(statusFilter === c.label ? "All" : c.label)}
              className="rounded-xl p-4 sm:p-5 text-left transition-all duration-200"
              style={{
                background: c.green
                  ? "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)"
                  : isDark ? "#1a2332" : "white",
                border: c.green ? "none"
                  : isSelected
                    ? `2px solid ${isDark ? "#4ade80" : DG}`
                    : `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`,
                boxShadow: c.green
                  ? "0 4px 16px rgba(12,87,62,0.25)"
                  : isSelected ? "0 0 0 3px rgba(74,222,128,0.15)" : isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
                transform: isSelected && !c.green ? "translateY(-1px)" : "",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)" }}
              onMouseLeave={e => { if (!isSelected || c.green) e.currentTarget.style.transform = "" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: c.green ? "rgba(255,255,255,0.65)" : c.amber ? "#fbbf24" : isDark ? "#64748b" : "#94a3b8" }}>
                {c.label}
              </p>
              <p className="text-xs mb-2"
                style={{ color: c.green ? "rgba(255,255,255,0.5)" : isDark ? "#64748b" : "#94a3b8" }}>
                {c.sub}
              </p>
              <p className="text-3xl font-bold"
                style={{ color: c.green ? "white" : c.amber ? (isDark ? "#fbbf24" : "#d97706") : c.blue ? (isDark ? "#60a5fa" : "#3b82f6") : isDark ? "#4ade80" : DG }}>
                {c.value}
              </p>
              {isSelected && !c.green && (
                <p className="text-[10px] font-semibold mt-1" style={{ color: isDark ? "#4ade80" : DG }}>
                  ● Filtering by this status
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Active filters */}
      {(statusFilter !== "All" || search) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: subTxt }}>Active filters:</span>
          {statusFilter !== "All" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", color: isDark ? "#4ade80" : DG, border: `1px solid ${isDark ? "rgba(74,222,128,0.3)" : "#bbf7d0"}` }}>
              Status: {statusFilter}
              <button onClick={() => setStatusFilter("All")} style={{ color: isDark ? "#4ade80" : "#16a34a" }}>×</button>
            </span>
          )}
          <button onClick={() => { setStatusFilter("All"); setSearch("") }}
            className="text-xs font-semibold ml-1" style={{ color: "#f87171" }}>
            Clear all
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm rounded-md border" style={{ color: errTxt, backgroundColor: errBg, borderColor: errBdr }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className={`rounded-xl overflow-hidden ${entered ? "" : "cust-rise"}`}
        style={{ border: `1px solid ${cardBdr}`, backgroundColor: cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)", animationDelay: "0.36s" }}>

        {/* Toolbar */}
        <div className="p-3 sm:p-4" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <div className="flex items-center gap-2 flex-wrap">
            <SelectFilter value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} minWidth="130px" isDark={isDark} />
            <SelectFilter value={ordersFilter} onChange={setOrdersFilter} options={ORDERS_OPTIONS} minWidth="140px" isDark={isDark} />
            <SelectFilter value={dateFilter}   onChange={setDateFilter}   options={DATE_OPTIONS}   minWidth="150px" isDark={isDark} />

            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchCustomers()}
                placeholder={search ? "" : `${phText}|`}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(74,222,128,0.18)" }}
                onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }} />
            </div>

            <button onClick={fetchCustomers} disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
              Refresh
            </button>
            <ExportBtn />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "700px" }}>
            <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
              <tr>
                {["Customer Name", "Email", "Phone", "Status", "Total Orders", "Joined", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop: `1px solid ${toolbarBdr}` }}>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: subTxt }}>Loading customers...</td></tr>
              ) : filtered.length > 0 ? filtered.map((c, idx) => (
                <tr key={c.id}
                  style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f8fafc"}`, backgroundColor: isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white"}>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{getName(c)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: subTxt }}>{c.email}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: subTxt }}>{c.phone_number || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={customerStatus(c)} />
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: subTxt }}>—</td>
                  <td className="px-4 py-3 text-sm" style={{ color: subTxt }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                    onClick={() => setViewingCustomer(c)} // 🚀 Updates state to show the card
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
                    style={{ backgroundColor: isDark ? "rgba(74,222,128,0.10)" : "#f0fdf4", borderColor: isDark ? "rgba(74,222,128,0.30)" : "#bbf7d0", color: isDark ? "#4ade80" : DG }}>
                    View
                  </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: subTxt }}>
                  {search || statusFilter !== "All" ? "No customers match your filters." : "No customers found."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {viewingCustomer && (
          <>
            {/* Dark Background Overlay */}
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setViewingCustomer(null)} />
            
            {/* The Card */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 shadow-2xl flex flex-col"
              style={{ backgroundColor: isDark ? "#111827" : "white" }}>
              
              {/* Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: isDark ? "#1e293b" : "#e5e7eb" }}>
                <h2 className="font-bold text-lg" style={{ color: isDark ? "white" : "#111827" }}>Customer Details</h2>
                <button onClick={() => setViewingCustomer(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                    style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                    {(viewingCustomer.first_name?.[0] || "A").toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: isDark ? "white" : "#111827" }}>{getName(viewingCustomer)}</h3>
                  <p className="text-sm" style={{ color: subTxt }}>{viewingCustomer.email}</p>
                </div>

                <div className="space-y-4 pt-4">
                  {[
                    { label: "Phone Number", value: viewingCustomer.phone_number },
                    { label: "Account Status", value: customerStatus(viewingCustomer) },
                    { label: "Date Joined", value: viewingCustomer.created_at ? new Date(viewingCustomer.created_at).toLocaleDateString() : "N/A" }
                  ].map(field => (
                    <div key={field.label} className="flex justify-between py-2 border-b" style={{ borderColor: isDark ? "#1e293b" : "#f1f5f9" }}>
                      <span className="text-sm" style={{ color: subTxt }}>{field.label}</span>
                      <span className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>{field.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 flex-wrap gap-2"
          style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <span className="text-sm" style={{ color: subTxt }}>Showing {filtered.length} of {total} customers</span>
          <div className="flex items-center gap-1">
            {["←", "1", "2", "3", "→"].map((p, i) => (
              <button key={i} className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: p === "1" ? `linear-gradient(135deg,${DG},${G})` : isDark ? "#1e293b" : "white",
                  color: p === "1" ? "white" : isDark ? "#94a3b8" : "#6b7280",
                  border: p === "1" ? "none" : `1px solid ${isDark ? "#374151" : "#e2e8f0"}`,
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