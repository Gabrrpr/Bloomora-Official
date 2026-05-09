import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import estingsLogo from "../../assets/EstingsLogo.svg"
import estingsText from "../../assets/Estings.svg"
import AdminChat           from "../../components/admin/AdminChat"
import AdminOrders         from "./AdminOrders"
import AdminProducts       from "./AdminProducts"
import AdminInventory      from "./AdminInventory"
import AdminStaff          from "./AdminStaff"
import AdminCustomers      from "./AdminCustomers"
import AdminTransactions   from "./AdminTransactions"
import AdminDelivery       from "./AdminDelivery"
import AdminActivityLogs   from "./AdminActivityLogs"
import AdminSettings       from "./AdminSettings"
import AdminHero           from "./AdminHero"
import AdminAdvertisements from "./AdminAdvertisements"
import AdminCampaigns    from "./AdminCampaigns"

import { api } from "../../services/api.js"
import { GreenCard, WhiteCard, ComingSoon } from "./_adminShared"

const DG = "#0C573E"
const G  = "#2E8B34"
const GREEN_FILTER = "brightness(0) saturate(100%) invert(38%) sepia(72%) saturate(500%) hue-rotate(90deg) brightness(90%)"

const SIDEBAR_MIN            = 60
const SIDEBAR_MAX            = 220
const SIDEBAR_SNAP_THRESHOLD = 120

const BRANCHES = [
  { key: "all",      label: "All Branches" },
  { key: "manila",   label: "Manila"       },
  { key: "pampanga", label: "Pampanga"     },
]

const NAV_MAIN = [
  { label: "Dashboard",     staff: true,  d: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" },
  { label: "Orders",        staff: true,  d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Products",      staff: true,  d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label: "Inventory",     staff: true,  d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
  { label: "Staffs",        staff: false, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Customers",     staff: false, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { label: "Messages",      staff: true,  badge: true, d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { label: "Activity Logs", staff: false, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Transactions",  staff: true,  d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { label: "Delivery",      staff: true,  d: "M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" },
]

const NAV_APPEARANCE = [
  { label: "Hero Section",   d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { label: "Advertisements", d: "M3 7h18M3 7a2 2 0 00-2 2v8a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2M8 13h4m-4 3h8" },
  { label: "Preview Site",   d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  { label: "Campaigns",     staff: true, d: "M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7" },

]

const REVENUE_PERIODS = [
  { key:"week",  label:"Weekly",  labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], yAxis:["₱15k","₱10k","₱5k","₱0"], manila:[14,20,16,18,58,30,22], pampanga:[10,14,10,12,40,20,14] },
  { key:"month", label:"Monthly", labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], yAxis:["₱60k","₱40k","₱20k","₱0"], manila:[20,22,25,30,35,40,45,38,33,42,55,60], pampanga:[12,14,16,20,24,28,32,26,22,28,38,42] },
  { key:"year",  label:"Yearly",  labels:["2020","2021","2022","2023","2024","2025"], yAxis:["₱200k","₱150k","₱100k","₱0"], manila:[30,45,55,65,80,90], pampanga:[20,30,38,46,58,68] },
]

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKEN SYSTEM
// The key principle: dark mode needs MUCH higher contrast than the original.
// • Page background: very dark navy (#0f172a)
// • Cards: noticeably lighter than the page (#1e293b) — visible separation
// • Card borders: clearly visible (#334155)
// • Primary text: near-white (#f1f5f9)
// • Secondary text: light gray (#cbd5e1) — NOT dimmed to match background
// • Muted text: medium gray (#94a3b8) — still readable
// • Table headers/alt rows: slightly different from card (#1a2d42)
// • Inputs: dark but distinct (#0f172a bg, #475569 border)
// • Hover states: clearly lighter than base
// ─────────────────────────────────────────────────────────────────────────────
function useTokens(isDark) {
  if (isDark) return {
    // Page & surfaces — each level clearly distinct
    pageBg:      "#0f172a",          // darkest — page background
    surfaceBg:   "#1e293b",          // cards, panels — clearly lighter than page
    surfaceAlt:  "#162032",          // alt rows, disabled inputs
    cardBg:      "#1e293b",
    cardBorder:  "#334155",          // clearly visible border
    cardShadow:  "0 2px 8px rgba(0,0,0,0.4)",
    inputBg:     "#0f172a",
    inputBorder: "#475569",          // clearly visible input border
    divider:     "#334155",
    hoverBg:     "#2d3f55",          // noticeably lighter on hover
    // Text — high contrast, all readable
    textPrimary:   "#f1f5f9",        // almost white — headings, values
    textSecondary: "#cbd5e1",        // light gray — body text, labels
    textMuted:     "#94a3b8",        // medium gray — captions, metadata
    // Sidebar
    sidebarBg:     "#111827",        // slightly different from page
    sidebarBorder: "#1e293b",
    navActive:     "rgba(74,222,128,0.12)",
    navHover:      "#1e2d3d",
    navTextActive: "#4ade80",        // bright green — clearly active
    navTextNormal: "#94a3b8",        // readable gray
    navTextHover:  "#e2e8f0",        // near-white on hover
    // Accent
    accentG:  "#4ade80",
    accentDG: "#22c55e",
    // Table
    tableHead:   "#162032",          // subtly different from card
    tableBorder: "#2d3f55",
    // Misc
    overlayBg: "rgba(0,0,0,0.75)",
    badgeBg:   "#1a2d42",
    chartGrid: "#2d3f55",
    chartDash: "#2d3f55",
    // Topbar icon button
    iconBtnHover: "#1e293b",
    iconBtnBorder: "#334155",
  }

  // Light mode — unchanged
  return {
    pageBg:      "#f3f5f8",
    surfaceBg:   "#ffffff",
    surfaceAlt:  "#fafbfc",
    cardBg:      "#ffffff",
    cardBorder:  "#e8edf2",
    cardShadow:  "0 1px 3px rgba(0,0,0,0.04)",
    inputBg:     "#f7f9fc",
    inputBorder: "#dde3ec",
    divider:     "#e8edf2",
    hoverBg:     "#f8faf9",
    textPrimary:   "#111827",
    textSecondary: "#6b7280",
    textMuted:     "#9ca3af",
    sidebarBg:     "#ffffff",
    sidebarBorder: "#e8edf2",
    navActive:     "#ecf9f1",
    navHover:      "#f8faf9",
    navTextActive: G,
    navTextNormal: "#6b7280",
    navTextHover:  "#374151",
    accentG:  G,
    accentDG: DG,
    tableHead:   "#fafbfc",
    tableBorder: "#f1f5f9",
    overlayBg: "rgba(15,23,42,0.4)",
    badgeBg:   "#f1f5f9",
    chartGrid: "#f1f5f9",
    chartDash: "#f1f5f9",
    iconBtnHover: "#f3f4f6",
    iconBtnBorder: "#e5e7eb",
  }
}

// ─── Dark Mode Toggle Button ──────────────────────────────────────────────────
function DarkModeToggle() {
  const { isDark, toggleDark } = useTheme()
  return (
    <button
      onClick={toggleDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center flex-shrink-0 relative overflow-hidden"
      style={{
        width: "34px", height: "34px",
        borderRadius: "10px",
        background: isDark
          ? "linear-gradient(135deg,#1e3a5f,#2d4a7a)"
          : "linear-gradient(135deg,#fef3c7,#fde68a)",
        border: isDark ? "1.5px solid #3b5fa0" : "1.5px solid #f59e0b",
        boxShadow: isDark
          ? "0 0 12px rgba(59,130,246,0.3)"
          : "0 0 12px rgba(245,158,11,0.3)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {/* Sun */}
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: isDark ? 0 : 1,
        transform: isDark ? "rotate(90deg) scale(0.4)" : "rotate(0deg) scale(1)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <svg width="16" height="16" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </span>
      {/* Moon */}
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: isDark ? 1 : 0,
        transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.4)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <svg width="15" height="15" fill="#93c5fd" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </span>
    </button>
  )
}

// ─── Topbar Icon Button ───────────────────────────────────────────────────────
// Consistent wrapper for bell, search etc so they all have the same size + hover
function IconBtn({ onClick, active, title, badge, children, t }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative flex items-center justify-center flex-shrink-0"
      style={{
        width: "34px", height: "34px",
        borderRadius: "10px",
        color: t.textSecondary,
        backgroundColor: active ? t.navActive : "transparent",
        border: `1px solid ${active ? t.cardBorder : "transparent"}`,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = t.iconBtnHover
          e.currentTarget.style.borderColor = t.iconBtnBorder
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.borderColor = "transparent"
        }
      }}
    >
      {children}
      {badge && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"
          style={{ border: `2px solid ${t.surfaceBg}` }} />
      )}
    </button>
  )
}

function NavIcon({ d }) {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

// ─── Branch Pill Toggle ───────────────────────────────────────────────────────
function BranchToggle({ value, onChange }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg"
      style={{ backgroundColor: t.badgeBg, border: `1px solid ${t.cardBorder}` }}>
      {BRANCHES.map(b => {
        const on = value === b.key
        return (
          <button key={b.key} onClick={() => onChange(b.key)}
            className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150"
            style={{
              backgroundColor: on ? t.surfaceBg : "transparent",
              color: on ? (isDark ? "#4ade80" : DG) : t.textSecondary,
              boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}>
            {b.label}
          </button>
        )
      })}
    </div>
  )
}

function BranchBadge({ branch }) {
  if (branch === "all") return null
  const colors = {
    manila:   { bg: "#1e3a5f", color: "#93c5fd" },   // dark-mode safe blues
    pampanga: { bg: "#2e1a4a", color: "#c4b5fd" },
  }
  // Use light-mode colours in light, dark-mode in dark
  const lightColors = {
    manila:   { bg: "#dbeafe", color: "#1d4ed8" },
    pampanga: { bg: "#ede9fe", color: "#6d28d9" },
  }
  // We need isDark here but BranchBadge is small — use CSS variables hack via inline
  // Instead just always use the "safe" version that reads ok in both
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: lightColors[branch].bg, color: lightColors[branch].color }}>
      {branch === "manila" ? "Manila" : "Pampanga"}
    </span>
  )
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────
function RevenueChart({ branch }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const [periodKey, setPeriodKey] = useState("week")
  const period = REVENUE_PERIODS.find(p => p.key === periodKey)

  const currentIdx = (() => {
    if (periodKey === "week")  { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 }
    if (periodKey === "month") return new Date().getMonth()
    if (periodKey === "year")  return period.labels.indexOf(String(new Date().getFullYear()))
    return -1
  })()

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Revenue</p>
          <BranchBadge branch={branch} />
        </div>
        {/* Period toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ backgroundColor: t.badgeBg, border: `1px solid ${t.cardBorder}` }}>
          {REVENUE_PERIODS.map(p => {
            const on = p.key === periodKey
            return (
              <button key={p.key} onClick={() => setPeriodKey(p.key)}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: on ? t.surfaceBg : "transparent",
                  color: on ? (isDark ? "#4ade80" : DG) : t.textSecondary,
                  boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}>
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2" style={{ height: "184px" }}>
        {/* Y-axis */}
        <div className="flex flex-col justify-between flex-shrink-0 text-right" style={{ width: "40px", paddingBottom: "24px" }}>
          {period.yAxis.map(l => (
            <span key={l} className="text-[10px] leading-none" style={{ color: t.textMuted }}>{l}</span>
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative flex items-end gap-1"
            style={{ borderLeft: `1px solid ${t.chartGrid}`, borderBottom: `1px solid ${t.chartGrid}`, paddingLeft: "4px", paddingRight: "4px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="absolute left-0 right-0 pointer-events-none"
                style={{ top: `${(i / 4) * 100}%`, borderTop: `1px dashed ${t.chartDash}` }} />
            ))}
            {period.labels.map((lbl, i) => {
              const isCurrent = i === currentIdx
              if (branch === "all") {
                return (
                  <div key={lbl} className="flex-1 flex items-end gap-0.5" style={{ minWidth: 0 }}>
                    <div className="flex-1 rounded-t-sm transition-all duration-500"
                      style={{ height: `${period.manila[i]}%`, background: isCurrent ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : isDark ? "#1d3a5f" : "#bfdbfe", minHeight: "3px" }} />
                    <div className="flex-1 rounded-t-sm transition-all duration-500"
                      style={{ height: `${period.pampanga[i]}%`, background: isCurrent ? "linear-gradient(180deg,#a78bfa,#6d28d9)" : isDark ? "#2e1a4a" : "#ddd6fe", minHeight: "3px" }} />
                  </div>
                )
              }
              const h  = branch === "manila" ? period.manila[i] : period.pampanga[i]
              const bg = branch === "manila"
                ? isCurrent ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : isDark ? "#1d3a5f" : "#bfdbfe"
                : isCurrent ? "linear-gradient(180deg,#a78bfa,#6d28d9)" : isDark ? "#2e1a4a" : "#ddd6fe"
              return (
                <div key={lbl} className="flex-1 flex items-end" style={{ minWidth: 0 }}>
                  <div className="w-full rounded-t-sm transition-all duration-500" style={{ height: `${h}%`, background: bg, minHeight: "3px" }} />
                </div>
              )
            })}
          </div>
          {/* X labels */}
          <div className="flex gap-1 pt-1.5" style={{ paddingLeft: "4px", paddingRight: "4px" }}>
            {period.labels.map((lbl, i) => (
              <div key={lbl} className="flex-1 flex justify-center" style={{ minWidth: 0 }}>
                <span className="text-[9px] font-medium truncate"
                  style={{ color: i === currentIdx ? (isDark ? "#4ade80" : DG) : t.textMuted }}>
                  {periodKey === "month" ? lbl.slice(0, 1) : periodKey === "year" ? lbl.slice(2) : lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {branch === "all" && (
        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${t.tableBorder}` }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-[11px] font-medium" style={{ color: t.textSecondary }}>Manila</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#a78bfa" }} />
            <span className="text-[11px] font-medium" style={{ color: t.textSecondary }}>Pampanga</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Recent Orders Card ───────────────────────────────────────────────────────
function RecentOrdersCard({ branch, t }) {
  return (
    <div className="rounded-xl overflow-hidden h-full"
      style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${t.tableBorder}`, backgroundColor: t.tableHead }}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Recent Orders</p>
          <BranchBadge branch={branch} />
        </div>
        <button className="text-xs font-semibold px-2.5 py-1 rounded-md border transition-all"
          style={{ borderColor: t.cardBorder, color: t.textSecondary }}>
          View All
        </button>
      </div>
      <table className="w-full text-sm">
        <thead style={{ borderBottom: `1px solid ${t.tableBorder}` }}>
          <tr style={{ backgroundColor: t.tableHead }}>
            {["Order ID", "Customer", "Status", "Total"].map(h => (
              <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: t.textMuted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: t.textMuted }}>
              No orders yet — connect backend
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Low Stock Card ───────────────────────────────────────────────────────────
function LowStockCard({ branch, lowStock, t, isDark }) {
  return (
    <div className="rounded-xl overflow-hidden h-full"
      style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: `1px solid ${t.tableBorder}`, backgroundColor: t.tableHead }}>
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold flex-shrink-0" style={{ color: t.textPrimary }}>Low Stock List</p>
          <BranchBadge branch={branch} />
        </div>
        <button className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          Manage
        </button>
      </div>
      <div className="grid px-4 py-2"
        style={{ gridTemplateColumns: "minmax(0,2fr) minmax(70px,1fr) 64px 72px", borderBottom: `1px solid ${t.tableBorder}`, gap: "6px" }}>
        {["Product", "Category", "Reorder", "Stock"].map((h, i) => (
          <span key={h} className={`text-xs font-semibold uppercase tracking-wider${i === 3 ? " text-right" : ""}`}
            style={{ color: t.textMuted }}>{h}</span>
        ))}
      </div>
      {lowStock.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}>
            <svg className="w-5 h-5" style={{ color: isDark ? "#4ade80" : "#16a34a" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: t.textSecondary }}>All stocked up!</p>
          <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>No low stock items right now</p>
        </div>
      ) : (
        lowStock.slice(0, 8).map(item => (
          <div key={item.id} className="grid items-center px-4 py-2.5 border-b last:border-0 transition-colors"
            style={{ gridTemplateColumns: "minmax(0,2fr) minmax(70px,1fr) 64px 72px", gap: "6px", borderColor: t.tableBorder }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "#fff7ed", border: `1px solid ${isDark ? "rgba(249,115,22,0.3)" : "#fed7aa"}` }}>
                <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.048-.833-2.818 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <p className="text-sm font-medium truncate" style={{ color: t.textPrimary }}>{item.name}</p>
            </div>
            <p className="text-xs truncate" style={{ color: t.textSecondary }}>{item.category || "—"}</p>
            <p className="text-xs text-center" style={{ color: t.textSecondary }}>{item.reorder_point ?? "—"}</p>
            <div className="flex justify-end">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={item.stock === 0
                  ? { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#fef2f2", color: "#f87171" }
                  : { backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "#fff7ed", color: "#fb923c" }}>
                {item.stock === 0 ? "Out" : `${item.stock} left`}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Draggable Panel Row ──────────────────────────────────────────────────────
function DraggablePanelRow({ branch, lowStock }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const containerRef = useRef(null)
  const isDragging   = useRef(false)
  const startX       = useRef(0)
  const startPct     = useRef(0)
  const [leftPct,    setLeftPct]    = useState(58)
  const [hovHandle,  setHovHandle]  = useState(false)
  const MIN_PCT = 28; const MAX_PCT = 72

  const onMouseDown = useCallback(e => {
    e.preventDefault()
    isDragging.current = true; startX.current = e.clientX; startPct.current = leftPct
    document.body.style.userSelect = "none"; document.body.style.cursor = "col-resize"
    const onMove = e => {
      if (!isDragging.current || !containerRef.current) return
      const totalW = containerRef.current.getBoundingClientRect().width
      setLeftPct(Math.min(MAX_PCT, Math.max(MIN_PCT, startPct.current + ((e.clientX - startX.current) / totalW) * 100)))
    }
    const onUp = () => {
      isDragging.current = false; document.body.style.userSelect = ""; document.body.style.cursor = ""
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp)
  }, [leftPct])

  return (
    <>
      {/* Mobile/tablet: stacked */}
      <div className="flex flex-col gap-4 xl:hidden">
        <RecentOrdersCard branch={branch} t={t} />
        <LowStockCard branch={branch} lowStock={lowStock} t={t} isDark={isDark} />
      </div>
      {/* Desktop: draggable split */}
      <div ref={containerRef} className="hidden xl:flex items-stretch gap-0" style={{ position: "relative" }}>
        <div style={{ width: `${leftPct}%`, minWidth: 0, flexShrink: 0 }}>
          <RecentOrdersCard branch={branch} t={t} />
        </div>
        <div
          onMouseDown={onMouseDown}
          onMouseEnter={() => setHovHandle(true)}
          onMouseLeave={() => setHovHandle(false)}
          style={{ width: "12px", flexShrink: 0, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
          <div style={{ width: "1px", height: "100%", background: hovHandle ? G : t.divider, opacity: hovHandle ? 0.8 : 0.5, transition: "background 0.2s" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <LowStockCard branch={branch} lowStock={lowStock} t={t} isDark={isDark} />
        </div>
      </div>
    </>
  )
}

// ─── Dashboard Panel ──────────────────────────────────────────────────────────
function DashboardPanel({ user }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const [branch,        setBranch]        = useState("all")
  const [lowStock,      setLowStock]      = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [ordersToday,   setOrdersToday]   = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)

  useEffect(() => {
    api.get("/products/low-stock").then(d => { setLowStock(d || []); setLowStockCount(d?.length || 0) }).catch(() => {})
    if (api.getMyOrders) api.getMyOrders("today").then(d => setOrdersToday(d?.length || 0)).catch(() => {})
    if (api.getAdminOrders) api.getAdminOrders({ status: "pending" }).then(d => setPendingOrders(d?.length || 0)).catch(() => {})
  }, [])

  const branchLabel = BRANCHES.find(b => b.key === branch)?.label || "All Branches"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: t.textPrimary }}>Dashboard</h1>
        <BranchToggle value={branch} onChange={setBranch} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Total Revenue Today" value="₱0" sub={`↑ ₱0 vs yesterday${branch !== "all" ? ` · ${branchLabel}` : ""}`} />
        <WhiteCard label="Orders Today"     value={ordersToday}   sub={`+0 vs yesterday${branch !== "all" ? ` · ${branchLabel}` : ""}`}    accentColor="#3b82f6" />
        <WhiteCard label="Pending Orders"   value={pendingOrders} sub={`−0 vs yesterday${branch !== "all" ? ` · ${branchLabel}` : ""}`}    subUp={false} accentColor="#f59e0b" />
        <WhiteCard label="Low Stock Alerts" value={lowStockCount} sub={`Needs restock today${branch !== "all" ? ` · ${branchLabel}` : ""}`} subGray accentColor="#ef4444" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <RevenueChart branch={branch} />
        {/* Trending Products */}
        <div className="rounded-xl p-5" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Trending Products</p>
              <BranchBadge branch={branch} />
            </div>
            <button className="text-xs font-semibold px-2.5 py-1 rounded-md border transition-all"
              style={{ borderColor: t.cardBorder, color: t.textSecondary }}>
              View All
            </button>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: t.tableBorder }}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: t.textSecondary }}>—</p>
                <p className="text-xs" style={{ color: t.textMuted }}>0 units sold</p>
              </div>
              <p className="text-sm font-bold flex-shrink-0" style={{ color: isDark ? "#4ade80" : DG }}>₱0</p>
            </div>
          ))}
        </div>
      </div>

      <DraggablePanelRow branch={branch} lowStock={lowStock} />
    </div>
  )
}

// ─── My Profile Panel ─────────────────────────────────────────────────────────
function MyProfilePanel({ user, onBack }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "", email: user?.email || "", phone: user?.phone || "" })
  const s = k => v => setForm(p => ({ ...p, [k]: v }))

  function FRow({ label, value, onChange, type = "text", editable }) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: t.textMuted }}>{label}</label>
        <input type={type} value={value} onChange={e => onChange && onChange(e.target.value)} disabled={!editable}
          className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
          style={{ borderColor: editable ? t.inputBorder : t.divider, backgroundColor: editable ? t.inputBg : t.surfaceAlt, color: t.textPrimary }}
          onFocus={e => { if (editable) { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)` } }}
          onBlur={e => { e.target.style.borderColor = editable ? t.inputBorder : t.divider; e.target.style.boxShadow = "none" }} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: t.textPrimary }}>My Profile</h1>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all"
          style={{ borderColor: t.cardBorder, color: t.textSecondary }}>← Back to Dashboard</button>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
        <div className="h-28 w-full" style={{ background: `linear-gradient(135deg,${DG},${G})` }} />
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between" style={{ marginTop: "-36px" }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white ring-4 flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${DG},${G})`, ringColor: t.cardBg }}>
              {(form.firstName?.[0] || "A").toUpperCase()}
            </div>
            <button onClick={() => setEditMode(p => !p)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
              style={editMode
                ? { borderColor: G, color: isDark ? "#4ade80" : G, backgroundColor: isDark ? "rgba(74,222,128,0.1)" : "#f0fdf4" }
                : { borderColor: t.cardBorder, color: t.textPrimary, backgroundColor: t.cardBg }}>
              {editMode
                ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>Cancel</>
                : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>Edit Profile</>}
            </button>
          </div>
          <div className="mt-3">
            <p className="text-base font-bold" style={{ color: t.textPrimary }}>{form.firstName} {form.lastName}</p>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{user?.role || "Administrator"} · {user?.branch || "—"}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
        <p className="text-sm font-semibold mb-4" style={{ color: t.textPrimary }}>Personal Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FRow label="First Name" value={form.firstName} onChange={s("firstName")} editable={editMode} />
          <FRow label="Last Name"  value={form.lastName}  onChange={s("lastName")}  editable={editMode} />
          <FRow label="Email Address" value={form.email} onChange={s("email")} type="email" editable={editMode} />
          <FRow label="Phone Number" value={form.phone} onChange={s("phone")} editable={editMode} />
          <FRow label="Role"   value={user?.role || "Administrator"} editable={false} />
          <FRow label="Branch" value={user?.branch || "—"}           editable={false} />
        </div>
        {editMode && (
          <div className="flex justify-end mt-5">
            <button className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────
function NotificationsPage({ onBack }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const [tab, setTab] = useState("All")
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: t.textPrimary }}>Notifications</h1>
        <div className="flex items-center gap-2">
          <button className="text-xs font-semibold px-3 py-2 border rounded-md transition-all"
            style={{ borderColor: t.cardBorder, color: t.textSecondary }}>Mark all as read</button>
          <button onClick={onBack} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor: t.cardBorder, color: t.textSecondary }}>← Back</button>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
        <div className="flex px-2 pt-2" style={{ borderBottom: `1px solid ${t.tableBorder}` }}>
          {["All","Orders","Messages","System"].map(tt => (
            <button key={tt} onClick={() => setTab(tt)} className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all mr-1"
              style={{ borderColor: tab === tt ? G : "transparent", color: tab === tt ? (isDark ? "#4ade80" : G) : t.textMuted }}>{tt}</button>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0" }}>
            <svg className="w-7 h-7" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: t.textSecondary }}>All caught up!</p>
          <p className="text-xs mt-1 max-w-xs" style={{ color: t.textMuted }}>No notifications right now.</p>
        </div>
      </div>
    </div>
  )
}

function NotificationPanel({ onViewAll }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  return (
    <div className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
      style={{ width: "340px", backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.12)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${t.tableBorder}`, backgroundColor: t.tableHead }}>
        <div>
          <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Notifications</p>
          <p className="text-xs" style={{ color: t.textMuted }}>You have 0 unread</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs font-semibold hover:underline" style={{ color: isDark ? "#4ade80" : G }}>Mark all read</button>
          <button onClick={onViewAll} className="p-1 rounded-md transition-all" style={{ color: t.textMuted }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="flex" style={{ borderBottom: `1px solid ${t.tableBorder}` }}>
        {["All","Orders","Messages","System"].map((tt, i) => (
          <button key={tt} className="flex-1 py-2 text-xs font-semibold border-b-2 transition-all"
            style={{ borderColor: i === 0 ? G : "transparent", color: i === 0 ? (isDark ? "#4ade80" : G) : t.textMuted }}>{tt}</button>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
          <svg className="w-5 h-5" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: t.textSecondary }}>All caught up!</p>
        <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>No new notifications right now</p>
      </div>
      <div className="px-4 py-2.5 text-center" style={{ borderTop: `1px solid ${t.tableBorder}`, backgroundColor: t.tableHead }}>
        <button onClick={onViewAll} className="text-xs font-semibold hover:underline" style={{ color: isDark ? "#4ade80" : G }}>
          View all notifications →
        </button>
      </div>
    </div>
  )
}

function UserDropdown({ user, onLogout, onProfile, onSettings }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  return (
    <div className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
      style={{ width: "200px", backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.12)" }}>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${t.tableBorder}`, background: isDark ? "linear-gradient(135deg,rgba(74,222,128,0.08),transparent)" : "linear-gradient(135deg,#f0fdf4,#fafff8)" }}>
        <p className="text-xs font-bold" style={{ color: t.textPrimary }}>{user?.firstName || "Admin"} {user?.lastName || ""}</p>
        <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>{user?.email || "admin@bloomora.com"}</p>
      </div>
      {[
        { label: "My Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", action: onProfile },
        { label: "Settings",   d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", action: onSettings },
      ].map(item => (
        <button key={item.label} onClick={item.action}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all"
          style={{ color: t.textSecondary }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hoverBg; e.currentTarget.style.color = isDark ? "#4ade80" : G }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = t.textSecondary }}>
          <svg className="w-4 h-4" style={{ color: t.textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={item.d}/>
          </svg>
          {item.label}
        </button>
      ))}
      <div style={{ borderTop: `1px solid ${t.tableBorder}` }}>
        <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition-all"
          onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar Nav Button ───────────────────────────────────────────────────────
function NavBtn({ item, active, setActive, collapsed, user }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const on      = active === item.label
  const allowed = !user?.role || user.role !== "staff" || item.staff
  return (
    <button
      onClick={allowed ? () => setActive(item.label) : undefined}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all duration-150 relative ${collapsed ? "justify-center px-2" : "px-3"} ${!allowed ? "opacity-40 cursor-not-allowed" : ""}`}
      style={{
        color: on ? t.navTextActive : allowed ? t.navTextNormal : t.textMuted,
        fontWeight: on ? 600 : 400,
        backgroundColor: on ? t.navActive : "transparent",
        borderLeft: on && !collapsed ? `3px solid ${t.navTextActive}` : "3px solid transparent",
      }}
      onMouseEnter={e => { if (!on && allowed) { e.currentTarget.style.backgroundColor = t.navHover; e.currentTarget.style.color = t.navTextHover } }}
      onMouseLeave={e => { if (!on && allowed) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = t.navTextNormal } }}>
      <span style={{ color: on ? t.navTextActive : allowed ? t.textMuted : t.textMuted }}>
        <NavIcon d={item.d}/>
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {item.badge && !collapsed && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>}
      {item.badge &&  collapsed && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"/>}
    </button>
  )
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────
function SidebarContent({ active, setActive, collapsed, onLogout, user }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const logoFilter = isDark ? "brightness(0) invert(1)" : GREEN_FILTER
  return (
    <>
      <div className={`flex items-center gap-3 py-4 ${collapsed ? "px-3 justify-center" : "px-4"}`}
        style={{ borderBottom: `1px solid ${t.sidebarBorder}` }}>
        <img src={estingsLogo} alt="" style={{ width: collapsed ? "28px" : "40px", height: collapsed ? "28px" : "40px", objectFit: "contain", flexShrink: 0 }} />
        {!collapsed && (
          <div>
            <img src={estingsText} alt="Esting's" style={{ height: "28px", objectFit: "contain", filter: logoFilter }} />
            <p className="text-[7.5px] font-normal uppercase tracking-widest leading-tight mt-0.5"
              style={{ color: isDark ? "#4ade80" : G, opacity: 0.75 }}>
              Flower International Inc.
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_MAIN.map(item => <NavBtn key={item.label} item={item} active={active} setActive={setActive} collapsed={collapsed} user={user} />)}
        </div>
        {/* Appearance section separator */}
        <div className="mt-4 mb-1">
          {collapsed
            ? <div style={{ height: "1px", backgroundColor: t.divider, margin: "4px 8px 6px" }} />
            : (
              <div className="flex items-center gap-2 px-3 py-1">
                <div style={{ flex: 1, height: "1px", backgroundColor: t.divider }} />
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: t.textMuted, whiteSpace: "nowrap" }}>Appearance</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: t.divider }} />
              </div>
            )
          }
        </div>
        <div className="space-y-0.5">
          {NAV_APPEARANCE.map(item => <NavBtn key={item.label} item={item} active={active} setActive={setActive} collapsed={collapsed} user={user} />)}
        </div>
      </nav>

      <div className="px-2 pb-3 pt-2 space-y-0.5" style={{ borderTop: `1px solid ${t.sidebarBorder}` }}>
        <button onClick={() => setActive("Settings")}
          className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all ${collapsed ? "justify-center px-2" : "px-3"}`}
          style={{ color: active === "Settings" ? t.navTextActive : t.navTextNormal, fontWeight: active === "Settings" ? 600 : 400, backgroundColor: active === "Settings" ? t.navActive : "transparent", borderLeft: active === "Settings" && !collapsed ? `3px solid ${t.navTextActive}` : "3px solid transparent" }}
          onMouseEnter={e => { if (active !== "Settings") { e.currentTarget.style.backgroundColor = t.navHover; e.currentTarget.style.color = t.navTextHover } }}
          onMouseLeave={e => { if (active !== "Settings") { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = t.navTextNormal } }}>
          <span style={{ color: active === "Settings" ? t.navTextActive : t.textMuted }}>
            <NavIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </span>
          {!collapsed && "Settings"}
        </button>
        <button onClick={onLogout}
          className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all ${collapsed ? "justify-center px-2" : "px-3"}`}
          title={collapsed ? "Logout" : undefined}
          style={{ color: t.navTextNormal }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"; e.currentTarget.style.color = "#f87171" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = t.navTextNormal }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: t.textMuted, flexShrink: 0 }}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          {!collapsed && "Logout"}
        </button>
      </div>
    </>
  )
}

// ─── Preview Site ─────────────────────────────────────────────────────────────
function PreviewSitePanel({ onBack }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0" }}>
        <svg className="w-7 h-7" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: t.textPrimary }}>Preview Site</p>
      <p className="text-sm mb-6 max-w-xs" style={{ color: t.textSecondary }}>Open the customer-facing storefront in a new tab.</p>
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => { const url = (import.meta.env.VITE_WEB_URL || "").trim() || "http://localhost:5173"; window.open(url, "_blank", "noopener,noreferrer") }}
          className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          Open Storefront
        </button>
        <button onClick={onBack} className="px-5 py-2.5 text-sm font-semibold rounded-lg border transition-all"
          style={{ borderColor: t.cardBorder, color: t.textSecondary }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

// ─── Resizable Sidebar ────────────────────────────────────────────────────────
function ResizableSidebar({ active, setActive, onLogout, user, sidebarWidth, setSidebarWidth }) {
  const { isDark } = useTheme()
  const t = useTokens(isDark)
  const isDragging = useRef(false)
  const startX     = useRef(0)
  const startWidth = useRef(0)
  const [hovering, setHovering] = useState(false)
  const collapsed  = sidebarWidth <= SIDEBAR_MIN + 10

  const onMouseDown = useCallback(e => {
    e.preventDefault()
    isDragging.current = true; startX.current = e.clientX; startWidth.current = sidebarWidth
    document.body.style.userSelect = "none"; document.body.style.cursor = "col-resize"
    const onMouseMove = e => {
      if (!isDragging.current) return
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth.current + (e.clientX - startX.current))))
    }
    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false; document.body.style.userSelect = ""; document.body.style.cursor = ""
      setSidebarWidth(w => w < SIDEBAR_SNAP_THRESHOLD ? SIDEBAR_MIN : SIDEBAR_MAX)
      window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp)
    }
    window.addEventListener("mousemove", onMouseMove); window.addEventListener("mouseup", onMouseUp)
  }, [sidebarWidth, setSidebarWidth])

  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 min-h-screen relative"
      style={{ width: `${sidebarWidth}px`, backgroundColor: t.sidebarBg, borderRight: `1px solid ${t.sidebarBorder}`, boxShadow: "1px 0 6px rgba(0,0,0,0.05)", transition: isDragging.current ? "none" : "width 0.25s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden" }}>
      <SidebarContent active={active} setActive={setActive} collapsed={collapsed} onLogout={onLogout} user={user} />
      <div onMouseDown={onMouseDown} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
        style={{ position: "absolute", top: 0, right: 0, width: "6px", height: "100%", cursor: "col-resize", zIndex: 10 }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "1px", height: "100%", background: hovering ? G : t.divider, opacity: hovering ? 0.7 : 0.4, transition: "background 0.2s" }} />
      </div>
    </aside>
  )
}

// ─── Main Shell ───────────────────────────────────────────────────────────────
export default function AdminDashboard({ onNavigate }) {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const t = useTokens(isDark)

  const [active,       setActive]       = useState("Dashboard")
  const [overlay,      setOverlay]      = useState(null)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_MAX)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [userOpen,     setUserOpen]     = useState(false)
  const notifRef = useRef(null)
  const userRef  = useRef(null)

  const handleLogout  = () => { logout(); onNavigate("login") }
  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) setSidebarWidth(w => w > SIDEBAR_MIN + 10 ? SIDEBAR_MIN : SIDEBAR_MAX)
    else setMobileOpen(p => !p)
  }

  useEffect(() => {
    const handler = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const goTo = panel => { setActive(panel); setOverlay(null); setUserOpen(false); setNotifOpen(false) }

  const renderMain = () => {
    if (overlay === "profile")       return <MyProfilePanel user={user} onBack={() => setOverlay(null)} />
    if (overlay === "notifications") return <NotificationsPage onBack={() => setOverlay(null)} />
    switch (active) {
      case "Dashboard":      return <DashboardPanel user={user} />
      case "Orders":         return <AdminOrders />
      case "Products":       return <AdminProducts />
      case "Inventory":      return <AdminInventory />
      case "Staffs":         return <AdminStaff />
      case "Customers":      return <AdminCustomers />
      case "Messages":       return <AdminChat />
      case "Activity Logs":  return <AdminActivityLogs />
      case "Transactions":   return <AdminTransactions />
      case "Delivery":       return <AdminDelivery />
      case "Settings":       return <AdminSettings />
      case "Hero Section":   return <AdminHero />
      case "Advertisements": return <AdminAdvertisements />
      case "Campaigns":      return <AdminCampaigns />
      case "Preview Site":   return <PreviewSitePanel onBack={()=>goTo("Dashboard")} />
      default:               return <ComingSoon label={active} />
    }
  }


  return (
    <div className="min-h-screen flex" style={{ backgroundColor: t.pageBg }}>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: t.overlayBg, backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: t.sidebarBg, boxShadow: "4px 0 24px rgba(0,0,0,0.2)" }}>
        <SidebarContent active={active} setActive={l => { goTo(l); setMobileOpen(false) }} collapsed={false} onLogout={handleLogout} user={user} />
      </aside>

      <ResizableSidebar active={active} setActive={goTo} onLogout={handleLogout} user={user} sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth} />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* ─── Topbar ─── */}
        <header className="flex-shrink-0 flex items-center px-4 lg:px-6"
          style={{
            height: "56px",
            gap: "8px",                                    // base gap between groups
            backgroundColor: t.surfaceBg,
            borderBottom: `1px solid ${t.cardBorder}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>

          {/* Hamburger */}
          <IconBtn onClick={toggleSidebar} t={t} title="Toggle sidebar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </IconBtn>

          {/* Greeting */}
          <p className="text-sm flex-shrink-0 hidden sm:block" style={{ color: t.textSecondary, marginLeft: "4px" }}>
            Good day, <span className="font-semibold" style={{ color: t.textPrimary }}>{user?.firstName || "Administrator"}!</span>
          </p>

          <div className="flex-1" />

          {/* ── Right-side controls — wider gaps ── */}
          <div className="flex items-center" style={{ gap: "10px" }}>

            {/* Search */}
            <div className="relative hidden sm:block">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
              </svg>
              <input
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 text-sm rounded-lg outline-none transition-all"
                style={{ width: "160px", border: `1px solid ${t.inputBorder}`, backgroundColor: t.inputBg, color: t.textPrimary }}
                onFocus={e => { e.target.style.width = "200px"; e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)`; e.target.style.backgroundColor = t.surfaceBg }}
                onBlur={e => { e.target.style.width = "160px"; e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = t.inputBg }}
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5" style={{ backgroundColor: t.divider }} />

            {/* Dark mode toggle */}
            <DarkModeToggle />

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <IconBtn
                onClick={() => { setNotifOpen(p => !p); setUserOpen(false) }}
                active={notifOpen}
                badge
                title="Notifications"
                t={t}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              </IconBtn>
              {notifOpen && <NotificationPanel onViewAll={() => { setOverlay("notifications"); setNotifOpen(false) }} />}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5" style={{ backgroundColor: t.divider }} />

            {/* User menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => { setUserOpen(p => !p); setNotifOpen(false) }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all"
                style={{
                  border: `1px solid ${userOpen ? t.cardBorder : "transparent"}`,
                  backgroundColor: userOpen ? t.hoverBg : "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.cardBorder; e.currentTarget.style.backgroundColor = t.hoverBg }}
                onMouseLeave={e => { if (!userOpen) { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.backgroundColor = "transparent" } }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
                  {user?.firstName?.[0] || "A"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] leading-none" style={{ color: t.textMuted }}>Logged in as</p>
                  <p className="text-xs font-semibold leading-tight mt-0.5" style={{ color: t.textPrimary }}>
                    {user?.firstName || "Administrator"}
                  </p>
                </div>
                <svg className="w-3.5 h-3.5 hidden sm:block" style={{ color: t.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                </svg>
              </button>
              {userOpen && (
                <UserDropdown user={user} onLogout={handleLogout}
                  onProfile={() => { setOverlay("profile"); setUserOpen(false) }}
                  onSettings={() => goTo("Settings")} />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderMain()}
        </main>
      </div>
    </div>
  )
}