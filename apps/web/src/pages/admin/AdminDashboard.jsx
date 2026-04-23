import { useState, useRef, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import estingsLogo from "../../assets/EstingsLogo.svg"
import estingsText from "../../assets/Estings.svg"
import AdminChat         from "../../components/admin/AdminChat"
import AdminOrders       from "./AdminOrders"
import AdminProducts     from "./AdminProducts"
import AdminInventory    from "./AdminInventory"
import AdminStaff        from "./AdminStaff"
import AdminCustomers    from "./AdminCustomers"
import AdminTransactions from "./AdminTransactions"
import AdminDelivery     from "./AdminDelivery"
import AdminActivityLogs from "./AdminActivityLogs"
import AdminSettings     from "./AdminSettings"
import { GreenCard, WhiteCard, ComingSoon } from "./_adminShared"

const DG = "#0C573E"
const G  = "#2E8B34"

const GREEN_FILTER = "brightness(0) saturate(100%) invert(38%) sepia(72%) saturate(500%) hue-rotate(90deg) brightness(90%)"

const NAV = [
  { label: "Dashboard",     d: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" },
  { label: "Orders",        d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Products",      d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label: "Inventory",     d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
  { label: "Staffs",        d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Customers",     d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { label: "Messages",      d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", badge: true },
  { label: "Activity Logs", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Transactions",  d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { label: "Delivery",      d: "M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" },
]

function NavIcon({ d }) {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

// ── Dashboard panel ───────────────────────────────────────────────────────────
function DashboardPanel({ user }) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()

  // Y-axis labels and the chart height in px
  const CHART_HEIGHT = 160
  const Y_LABELS = ["₱15k", "₱10k", "₱5k", "₱0"]

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Total Revenue Today" value="₱0" sub="↑ ₱0 vs yesterday" />
        <WhiteCard label="Orders Today"    value={0} sub="+0 vs yesterday" accentColor="#3b82f6" />
        <WhiteCard label="Pending Orders"  value={0} sub="−0 vs yesterday" subUp={false} accentColor="#f59e0b" />
        <WhiteCard label="Low Stock Alerts" value={0} sub="Needs restock today" subGray accentColor="#ef4444" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

        {/* ── Revenue chart — fixed layout ── */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-800">Revenue This Week</p>
            <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ backgroundColor: "#f0fdf4", color: G }}>Weekly</span>
          </div>

          {/*
            Two-column layout:
            • Left col: fixed-width Y-axis labels
            • Right col: chart bars + X-axis day labels below
          */}
          <div className="flex gap-2" style={{ height: `${CHART_HEIGHT + 24}px` }}>

            {/* Y-axis labels — distribute evenly from top to bottom of chart area */}
            <div
              className="flex flex-col justify-between flex-shrink-0 text-right"
              style={{ width: "36px", paddingBottom: "24px" /* matches x-label row height */ }}
            >
              {Y_LABELS.map(l => (
                <span key={l} className="text-[10px] leading-none" style={{ color: "#cbd5e1" }}>{l}</span>
              ))}
            </div>

            {/* Chart area */}
            <div className="flex-1 flex flex-col">
              {/* Bars + horizontal grid lines */}
              <div
                className="flex-1 relative flex items-end gap-1.5"
                style={{
                  borderLeft: "1px solid #f1f5f9",
                  borderBottom: "1px solid #f1f5f9",
                  paddingLeft: "6px",
                  paddingRight: "4px",
                }}
              >
                {/* Horizontal grid lines (3 lines dividing 4 equal segments) */}
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: `${(i / 4) * 100}%`,
                      borderTop: "1px dashed #f1f5f9",
                    }}
                  />
                ))}

                {/* Bars */}
                {DAYS.map((d, i) => {
                  const isToday = i === todayIdx
                  const barH = isToday ? "60%" : "16%"
                  return (
                    <div key={d} className="flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: barH,
                          background: isToday
                            ? `linear-gradient(180deg, ${G} 0%, ${DG} 100%)`
                            : "#e2e8f0",
                          minHeight: "4px",
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* X-axis day labels — same flex layout as bars so they align perfectly */}
              <div className="flex gap-1.5 pt-1.5" style={{ paddingLeft: "6px", paddingRight: "4px" }}>
                {DAYS.map((d, i) => (
                  <div key={d} className="flex-1 flex justify-center">
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: i === todayIdx ? DG : "#94a3b8" }}
                    >
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trending Products */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Trending Products</p>
            <button className="text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-all text-gray-600">View All</button>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">—</p>
                <p className="text-xs text-gray-400">0 units sold</p>
              </div>
              <p className="text-sm font-bold flex-shrink-0" style={{ color: DG }}>₱0</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4">
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
            <p className="text-sm font-semibold text-gray-800">Recent Orders</p>
            <button className="text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-all text-gray-600">View All</button>
          </div>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid #f1f5f9" }}>
              <tr style={{ backgroundColor: "#fafbfc" }}>
                {["Order ID", "Customer", "Status", "Total"].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No orders yet — connect backend</td></tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
            <p className="text-sm font-semibold text-gray-800">Low Stock List</p>
            <button className="text-xs font-semibold px-2.5 py-1 rounded-md text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>Manage</button>
          </div>
          <div className="flex justify-between px-5 py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Product</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Stock</span>
          </div>
          <p className="px-5 py-8 text-center text-sm text-gray-400">No low stock items</p>
        </div>
      </div>
    </div>
  )
}

// ── Notification panel ────────────────────────────────────────────────────────
function NotificationPanel() {
  return (
    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl overflow-hidden z-50"
      style={{ width: "340px", border: "1px solid #e8edf2", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
        <div>
          <p className="text-sm font-bold text-gray-800">Notifications</p>
          <p className="text-xs text-gray-400">You have 0 unread</p>
        </div>
        <button className="text-xs font-semibold hover:underline" style={{ color: G }}>Mark all read</button>
      </div>
      <div className="flex border-b border-gray-100">
        {["All", "Orders", "Messages", "System"].map((t, i) => (
          <button key={t} className="flex-1 py-2 text-xs font-semibold border-b-2 transition-all"
            style={{ borderColor: i === 0 ? G : "transparent", color: i === 0 ? G : "#9ca3af" }}>{t}</button>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
          <svg className="w-5 h-5" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500">All caught up!</p>
        <p className="text-xs text-gray-400 mt-0.5">No new notifications right now</p>
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100 text-center" style={{ backgroundColor: "#fafbfc" }}>
        <button className="text-xs font-semibold hover:underline" style={{ color: G }}>View all notifications</button>
      </div>
    </div>
  )
}

// ── User dropdown ─────────────────────────────────────────────────────────────
function UserDropdown({ user, onLogout }) {
  return (
    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl overflow-hidden z-50"
      style={{ width: "200px", border: "1px solid #e8edf2", boxShadow: "0 16px 48px rgba(0,0,0,0.12)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0fdf4, #fafff8)" }}>
        <p className="text-xs font-bold text-gray-800">{user?.firstName || "Admin"} {user?.lastName || ""}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{user?.email || "admin@bloomora.com"}</p>
      </div>
      {[
        { label: "My Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
        { label: "Settings",   d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
      ].map(item => (
        <button key={item.label} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-all">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={item.d} /></svg>
          {item.label}
        </button>
      ))}
      <div style={{ borderTop: "1px solid #f1f5f9" }}>
        <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Logout
        </button>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarContent({ active, setActive, collapsed, onLogout }) {
  return (
    <>
      <div className={`flex items-center gap-3 py-4 ${collapsed ? "px-3 justify-center" : "px-4"}`}
        style={{ borderBottom: "1px solid #eff2f7" }}>
        <img src={estingsLogo} alt="" style={{ width: collapsed ? "28px" : "40px", height: collapsed ? "28px" : "40px", objectFit: "contain", flexShrink: 0 }} />
        {!collapsed && (
          <div>
            <img src={estingsText} alt="Esting's" style={{ height: "28px", objectFit: "contain", filter: GREEN_FILTER }} />
            <p className="text-[7.5px] font-normal uppercase tracking-widest leading-tight mt-0.5" style={{ color: G, opacity: 0.75 }}>
              Flower International Inc.
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-0.5">
        {NAV.map(item => {
          const on = active === item.label
          return (
            <button key={item.label} onClick={() => setActive(item.label)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all duration-150 relative ${collapsed ? "justify-center px-2" : "px-3"}`}
              style={{ color: on ? G : "#6b7280", fontWeight: on ? 600 : 400, backgroundColor: on ? "#ecf9f1" : "transparent", borderLeft: on && !collapsed ? `3px solid ${G}` : "3px solid transparent" }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.backgroundColor = "#f8faf9"; e.currentTarget.style.color = "#374151" } }}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280" } }}>
              <span style={{ color: on ? G : "#9ca3af" }}><NavIcon d={item.d} /></span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {item.badge && !collapsed && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
              {item.badge && collapsed && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
            </button>
          )
        })}
      </nav>

      <div className="px-2 pb-3 pt-2 space-y-0.5" style={{ borderTop: "1px solid #eff2f7" }}>
        <button onClick={() => setActive("Settings")}
          className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all ${collapsed ? "justify-center px-2" : "px-3"} ${active === "Settings" ? "font-semibold" : ""}`}
          style={{ color: active === "Settings" ? G : "#6b7280", backgroundColor: active === "Settings" ? "#ecf9f1" : "transparent", borderLeft: active === "Settings" && !collapsed ? `3px solid ${G}` : "3px solid transparent" }}
          onMouseEnter={e => { if (active !== "Settings") { e.currentTarget.style.backgroundColor = "#f8faf9"; e.currentTarget.style.color = "#374151" } }}
          onMouseLeave={e => { if (active !== "Settings") { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280" } }}>
          <span style={{ color: active === "Settings" ? G : "#9ca3af" }}>
            <NavIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </span>
          {!collapsed && "Settings"}
        </button>
        <button onClick={onLogout}
          className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm text-gray-500 transition-all ${collapsed ? "justify-center px-2" : "px-3"}`}
          title={collapsed ? "Logout" : undefined}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.color = "#dc2626" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280" }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && "Logout"}
        </button>
      </div>
    </>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────
export default function AdminDashboard({ onNavigate }) {
  const { user, logout } = useAuth()
  const [active, setActive]         = useState("Dashboard")
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen]   = useState(false)
  const [userOpen, setUserOpen]     = useState(false)
  const notifRef = useRef(null)
  const userRef  = useRef(null)

  const handleLogout = () => { logout(); onNavigate("login") }

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const renderPanel = () => {
    switch (active) {
      case "Dashboard":    return <DashboardPanel user={user} />
      case "Orders":       return <AdminOrders />
      case "Products":     return <AdminProducts />
      case "Inventory":    return <AdminInventory />
      case "Staffs":       return <AdminStaff />
      case "Customers":    return <AdminCustomers />
      case "Messages":     return <AdminChat />
      case "Activity Logs":return <AdminActivityLogs />
      case "Transactions": return <AdminTransactions />
      case "Delivery":     return <AdminDelivery />
      case "Settings":     return <AdminSettings />
      default:             return <ComingSoon label={active} />
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f3f5f8" }}>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: "rgba(15,23,42,0.4)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white flex flex-col transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.10)" }}>
        <SidebarContent active={active} setActive={(l) => { setActive(l); setMobileOpen(false) }} collapsed={false} onLogout={handleLogout} />
      </aside>

      <aside className={`hidden lg:flex flex-col bg-white flex-shrink-0 min-h-screen transition-all duration-300`}
        style={{ width: collapsed ? "60px" : "220px", borderRight: "1px solid #e8edf2", boxShadow: "1px 0 6px rgba(0,0,0,0.03)" }}>
        <SidebarContent active={active} setActive={setActive} collapsed={collapsed} onLogout={handleLogout} />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="bg-white flex-shrink-0 flex items-center gap-3 px-4 lg:px-6"
          style={{ height: "56px", borderBottom: "1px solid #e8edf2", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-500 flex-shrink-0"
            onClick={() => { if (window.innerWidth >= 1024) setCollapsed(p => !p); else setMobileOpen(p => !p) }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <p className="text-sm text-gray-500 hidden sm:block flex-shrink-0">
            Good day, <span className="font-semibold text-gray-800">{user?.firstName || "Administrator"}!</span>
          </p>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input placeholder="Search..."
                className="w-44 pl-9 pr-4 py-1.5 text-sm rounded-lg outline-none transition-all"
                style={{ border: "1px solid #dde3ec", backgroundColor: "#f7f9fc" }}
                onFocus={e => { e.target.style.width = "200px"; e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)`; e.target.style.backgroundColor = "white" }}
                onBlur={e => { e.target.style.width = "176px"; e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f7f9fc" }} />
            </div>

            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(p => !p); setUserOpen(false) }}
                className="relative p-1.5 rounded-lg transition-all text-gray-500 hover:bg-gray-100"
                style={{ backgroundColor: notifOpen ? "#f0fdf4" : undefined }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
              </button>
              {notifOpen && <NotificationPanel />}
            </div>

            <div className="relative" ref={userRef}>
              <button onClick={() => { setUserOpen(p => !p); setNotifOpen(false) }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-gray-50"
                style={{ border: "1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#e8edf2"; e.currentTarget.style.backgroundColor = "#f8faf9" }}
                onMouseLeave={e => { if (!userOpen) { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.backgroundColor = "transparent" } }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)` }}>
                  {user?.firstName?.[0] || "A"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] text-gray-400 leading-none">Logged in as</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight mt-0.5">{user?.firstName || "Administrator"}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {userOpen && <UserDropdown user={user} onLogout={handleLogout} />}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderPanel()}
        </main>
      </div>
    </div>
  )
}
