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
import AdminFAQ            from "./AdminFAQ"
import AdminFeaturedProducts from "./AdminFeaturedProducts"
import AdminPromotions     from "./AdminPromotions"
import AdminLegal          from "./AdminLegal"

import { api } from "../../services/api.js"
import { GreenCard, StatCard, WhiteCard, ComingSoon } from "./_adminShared"

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
  { label: "Hero Section",      d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { label: "Advertisements",    d: "M3 7h18M3 7a2 2 0 00-2 2v8a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2M8 13h4m-4 3h8" },
  { label: "Promotions",        d: "M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" },
  { label: "Featured Products", d: "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" },
  { label: "FAQ",               d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" },
  { label: "Legal",             d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Preview Site",      d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  { label: "Campaigns", staff: true, d: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
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
  const { isDark } = useTheme();
  const t = useTokens(isDark);
  
  const [periodKey, setPeriodKey] = useState("week");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const staticPeriod = REVENUE_PERIODS.find(p => p.key === periodKey);

  // HELPER 1: Generate rolling 7 days labels (ends on Today)
  const getRollingWeekLabels = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
    }
    return labels;
  };

  // 🚀 HELPER 2: Generate rolling 6 years labels (ends on Current Year)
  const getRollingYearLabels = () => {
    const currentYear = new Date().getFullYear();
    // Generates an array of the last 6 years, e.g., ["2021", "2022", "2023", "2024", "2025", "2026"]
    return Array.from({ length: 6 }, (_, i) => String(currentYear - 5 + i));
  };

  useEffect(() => {
    setLoading(true);

    const apiBranch = branch === "all" ? "all" : branch.charAt(0).toUpperCase() + branch.slice(1);

    api.get(`/dashboard/revenue?period=${periodKey}&branch=${apiBranch}`)
      .then(rows => {
        const period = REVENUE_PERIODS.find(p => p.key === periodKey);
        
        // 🚀 Swap in the dynamic labels for Week AND Year!
        const actualLabels = periodKey === "week" 
          ? getRollingWeekLabels() 
          : periodKey === "year" 
            ? getRollingYearLabels() 
            : period.labels;

        const manilaData = Array(actualLabels.length).fill(0);
        const pampangaData = Array(actualLabels.length).fill(0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (rows && rows.length > 0) {
          rows.forEach(row => {
            const date = new Date(row.period);
            if (isNaN(date.getTime())) return;
            
            let idx = -1;

            if (periodKey === "week") {
              const rowDate = new Date(date);
              rowDate.setHours(0, 0, 0, 0);
              const diffTime = today - rowDate;
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays >= 0 && diffDays <= 6) {
                idx = 6 - diffDays; 
              }
            } else if (periodKey === "month") {
              idx = date.getMonth();
            } else if (periodKey === "year") {
              // Map the database year to our dynamic rolling year array
              idx = actualLabels.indexOf(String(date.getFullYear()));
            }

            if (idx === -1 || idx >= actualLabels.length) return;

            const safeBranch = String(row.branch || "").trim().toLowerCase();
            const revenueNum = Number(row.revenue) || 0;

            if (safeBranch === "pampanga") {
              pampangaData[idx] += revenueNum;
            } else {
              manilaData[idx] += revenueNum;
            }
          });
        }

        const allValues = [...manilaData, ...pampangaData];
        const maxDataValue = Math.max(...allValues, 0); 

        // DYNAMIC Y-AXIS GENERATOR
        let chartCeiling = 15000; 
        if (maxDataValue > 0) {
          if (maxDataValue <= 1500) chartCeiling = 1500;
          else if (maxDataValue <= 3000) chartCeiling = 3000;
          else if (maxDataValue <= 6000) chartCeiling = 6000;
          else chartCeiling = Math.ceil(maxDataValue / 3000) * 3000;
        }

        const formatLabel = (num) => {
          if (num >= 1000000) return `₱${(num / 1000000).toFixed(1).replace('.0', '')}M`;
          if (num >= 1000) return `₱${(num / 1000).toFixed(1).replace('.0', '')}k`;
          return `₱${num}`;
        };

        const dynamicYAxis = maxDataValue > 0 ? [
          formatLabel(chartCeiling),
          formatLabel((chartCeiling * 2) / 3),
          formatLabel(chartCeiling / 3),
          "₱0"
        ] : period.yAxis;

        const calculatedManila = manilaData.map(v => v > 0 ? Math.max(2, Math.round((v / chartCeiling) * 90)) : 0);
        const calculatedPampanga = pampangaData.map(v => v > 0 ? Math.max(2, Math.round((v / chartCeiling) * 90)) : 0);

        setChartData({
          labels: actualLabels,
          yAxis: dynamicYAxis, 
          manila: calculatedManila,
          pampanga: calculatedPampanga,
          raw: { manila: manilaData, pampanga: pampangaData },
        });
      })
      .catch(err => {
        console.error("❌ REVENUE FETCH ERROR:", err);
        setChartData(null); 
      })
      .finally(() => setLoading(false));
  }, [periodKey, branch]);

  const currentIdx = (() => {
    if (periodKey === "week") return 6; // Rolling week: Today is ALWAYS index 6 (far right)
    if (periodKey === "year") return 5; // Rolling year: This Year is ALWAYS index 5 (far right)
    
    const d = new Date();
    if (periodKey === "month") return d.getMonth();
    return -1;
  })();

  const display = chartData || staticPeriod;
  const isLive = chartData !== null;

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Revenue</p>
          {loading ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse bg-gray-200 text-gray-500">Loading...</span>
          ) : isLive ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Live Data</span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Static Data (No DB records)</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: t.badgeBg, border: `1px solid ${t.cardBorder}` }}>
          {REVENUE_PERIODS.map(p => {
            const on = p.key === periodKey;
            return (
              <button key={p.key} onClick={() => setPeriodKey(p.key)}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: on ? t.surfaceBg : "transparent",
                  color: on ? (isDark ? "#4ade80" : "#0C573E") : t.textSecondary,
                  boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2" style={{ height: "184px" }}>
        <div className="flex flex-col justify-between flex-shrink-0 text-right" style={{ width: "40px", paddingBottom: "24px" }}>
          {display.yAxis.map((l, idx) => (
            <span key={`y-${l}-${idx}`} className="text-[10px] leading-none" style={{ color: t.textMuted }}>{l}</span>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative flex items-stretch gap-1" style={{ borderLeft: `1px solid ${t.chartGrid}`, borderBottom: `1px solid ${t.chartGrid}`, paddingLeft: "4px", paddingRight: "4px" }}>
            {[1, 2, 3].map(i => (
              <div key={`grid-${i}`} className="absolute left-0 right-0 pointer-events-none" style={{ top: `${(i / 4) * 100}%`, borderTop: `1px dashed ${t.chartDash}` }} />
            ))}
            
            {display.labels.map((lbl, i) => {
              const isCurrent = i === currentIdx;
              
              if (branch === "all") {
                return (
                  <div key={`bar-all-${lbl}-${i}`} className="flex-1 flex items-end gap-0.5 group h-full" style={{ minWidth: 0 }}
                    title={isLive ? `Manila: ₱${(chartData.raw?.manila[i] || 0).toLocaleString()} | Pampanga: ₱${(chartData.raw?.pampanga[i] || 0).toLocaleString()}` : ""}>
                    <div className="flex-1 rounded-t-sm transition-all duration-500 hover:opacity-80"
                      style={{ height: `${display.manila[i]}%`, background: isCurrent ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : isDark ? "#1d3a5f" : "#bfdbfe", minHeight: "3px" }} />
                    <div className="flex-1 rounded-t-sm transition-all duration-500 hover:opacity-80"
                      style={{ height: `${display.pampanga[i]}%`, background: isCurrent ? "linear-gradient(180deg,#a78bfa,#6d28d9)" : isDark ? "#2e1a4a" : "#ddd6fe", minHeight: "3px" }} />
                  </div>
                );
              }

              const isManila = branch === "manila";
              const h = isManila ? display.manila[i] : display.pampanga[i];
              const rawVal = isLive ? (isManila ? chartData.raw?.manila[i] : chartData.raw?.pampanga[i]) || 0 : 0;
              const bg = isManila
                ? isCurrent ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : isDark ? "#1d3a5f" : "#bfdbfe"
                : isCurrent ? "linear-gradient(180deg,#a78bfa,#6d28d9)" : isDark ? "#2e1a4a" : "#ddd6fe";

              return (
                <div key={`bar-single-${lbl}-${i}`} className="flex-1 flex items-end group h-full" style={{ minWidth: 0 }}
                  title={isLive ? `₱${rawVal.toLocaleString()}` : ""}>
                  <div className="w-full rounded-t-sm transition-all duration-500 hover:opacity-80"
                    style={{ height: `${h}%`, background: bg, minHeight: "3px" }} />
                </div>
              );
            })}
          </div>

          <div className="flex gap-1 pt-1.5" style={{ paddingLeft: "4px", paddingRight: "4px" }}>
            {display.labels.map((lbl, i) => (
              <div key={`label-${lbl}-${i}`} className="flex-1 flex justify-center" style={{ minWidth: 0 }}>
                <span className="text-[9px] font-medium truncate" style={{ color: i === currentIdx ? (isDark ? "#4ade80" : "#0C573E") : t.textMuted }}>
                  {periodKey === "year" ? lbl.slice(2) : lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Orders Card ───────────────────────────────────────────────────────
function RecentOrdersCard({ branch, t, orders, loading }) {
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
          {loading ? (
            <tr>
              <td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: t.textMuted }}>
                Loading recent orders...
              </td>
            </tr>
          ) : !orders || orders.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: t.textMuted }}>
                No recent orders yet
              </td>
            </tr>
          ) : (
            orders.map((o, idx) => (
              <tr
                key={o.id || idx}
                style={{ backgroundColor: idx % 2 === 0 ? t.cardBg : t.surfaceAlt }}
              >
                <td className="px-5 py-3" style={{ color: t.textSecondary }}>
                  <span className="font-mono text-xs">{o.order_number || "—"}</span>
                </td>
                <td className="px-5 py-3" style={{ color: t.textPrimary }}>
                  <span className="font-medium">{o.customer_name || "—"}</span>
                </td>
                <td className="px-5 py-3" style={{ color: t.textSecondary }}>
                  <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>
                    {String(o.status || "").replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3" style={{ color: t.textPrimary }}>
                  ₱{Number(o.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))
          )}
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
function DraggablePanelRow({ branch, lowStock, recentOrders, recentLoading }) {
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
        <RecentOrdersCard branch={branch} t={t} orders={recentOrders} loading={recentLoading} />
        <LowStockCard branch={branch} lowStock={lowStock} t={t} isDark={isDark} />
      </div>
      {/* Desktop: draggable split */}
      <div ref={containerRef} className="hidden xl:flex items-stretch gap-0" style={{ position: "relative" }}>
        <div style={{ width: `${leftPct}%`, minWidth: 0, flexShrink: 0 }}>
          {/* 🚀 FIXED: Added orders and loading props */}
          <RecentOrdersCard 
            branch={branch} 
            t={t} 
            orders={recentOrders} 
            loading={recentLoading} 
          />
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
  const { isDark } = useTheme();
  const t = useTokens(isDark);
  
  // 1. Declare branch state FIRST
  const [branch, setBranch] = useState("all");
  
  // 2. Declare other states
  const [lowStock, setLowStock] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // 3. Fetch Live Data
  useEffect(() => {
    // Fetch Low Stock
    api.get("/products/low-stock")
      .then(d => { 
        setLowStock(d || []); 
        setLowStockCount(d?.length || 0); 
      })
      .catch(() => {});

    // Fetch Summary (Revenue, Orders, Pending)
    api.get(`/dashboard/summary?branch=${branch}`)
      .then(d => {
        setRevenueToday(d?.revenue_today || 0);
        setOrdersToday(d?.orders_today || 0);
        setPendingOrders(d?.pending_orders || 0);
      })
      .catch(err => console.error("Summary Fetch Error:", err));


      setRecentLoading(true);
    // Format branch exactly how your AdminOrders page formats it
    const branchParam = branch === "all" ? "All Branches" : branch; 
    
    api.getAdminOrders({ branch: branchParam, limit: 5 })
      .then(data => {
        // Grab just the first 5 orders so we don't overload the dashboard
        setRecentOrders(Array.isArray(data) ? data.slice(0, 5) : []);
      })
      .catch(err => console.error("Recent Orders Fetch Error:", err))
      .finally(() => setRecentLoading(false));
  }, [branch]);

  const branchLabel = branch === "all" ? "All Branches" : branch.charAt(0).toUpperCase() + branch.slice(1);

  // ── Print: derived metrics for the printed Dashboard Report ──
  // The screen UI stays untouched; everything below feeds the print only.
  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
  const printTime   = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })

  const outCount     = lowStock.filter(i => (parseInt(i.stock ?? 0) || 0) <= 0).length
  const lowOnlyCount = Math.max(0, lowStock.length - outCount)
  const pct = n => (lowStock.length ? (n / lowStock.length) * 100 : 0)

  // Full low-stock list, most depleted first (screen card shows only 8)
  const printLowStock = [...lowStock].sort(
    (a, b) => (parseInt(a.stock ?? 0) || 0) - (parseInt(b.stock ?? 0) || 0)
  )

  // Report scope line shown under the printed title.
  // Note: /products/low-stock is not branch-filtered, so that section is company-wide.
  const printScope = [
    `Branch: ${branchLabel}`,
    "Daily operations snapshot",
    `${lowStock.length} low-stock item${lowStock.length === 1 ? "" : "s"}`,
  ].join("   ·   ")

  return (
    <div>

      {/* ── Print styles ──
          The printed report is fully separate from the screen UI:
          everything in .print-only renders ONLY on paper, and the
          screen dashboard is no-print. Print sections in order:
          1 letterhead band  2 title + scope  3 summary cards
          4 restock urgency bar  5 low-stock detail table  6 footer/signatures */}
      <style>{`
        .print-only { display: none; }

        @media print {
          @page { margin: 12mm 10mm; }
          body * { visibility: hidden !important; }
          #dashboard-print-area, #dashboard-print-area * { visibility: visible !important; }
          #dashboard-print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            font-family: "Helvetica Neue", Arial, sans-serif; color: #1f2937;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-letterhead, .print-doc-title, .print-summary, .print-health { break-inside: avoid; page-break-inside: avoid; }

          /* ── 1. Letterhead: brand band ── */
          .print-letterhead {
            display: flex !important; align-items: center; justify-content: space-between; gap: 16px;
            padding: 13px 18px; border-radius: 12px;
            background: linear-gradient(135deg,#0C573E 0%,#15724B 55%,#2E8B34 100%) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-logo-word {
            height: 34px; width: auto; max-width: 240px; display: block;
            object-fit: contain; filter: brightness(0) invert(1);
          }
          .print-tagline {
            margin: 5px 0 0; font-size: 8px; font-weight: 700;
            letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.82) !important;
          }
          .print-meta { text-align: right; flex-shrink: 0; }
          .print-meta .ref {
            display: inline-block; margin: 0; padding: 3px 10px; border-radius: 9999px;
            border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.12) !important;
            color: #ffffff !important; font-size: 8.5px; font-weight: 700;
            letter-spacing: 0.12em; text-transform: uppercase;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-meta .gen { margin: 6px 0 0; font-size: 9px; color: rgba(255,255,255,0.85) !important; }
          .print-meta .gen strong { color: #ffffff !important; font-weight: 700; }

          /* ── 2. Document title + report scope ── */
          .print-doc-title { display: flex !important; flex-direction: column; align-items: center; margin: 16px 0 2px; }
          .print-doc-title .t {
            margin: 0; font-size: 15px; font-weight: 800;
            letter-spacing: 0.3em; text-transform: uppercase; color: #0C573E !important;
          }
          .print-doc-title .rule {
            width: 54px; height: 3px; border-radius: 9999px; margin: 7px 0 6px;
            background: linear-gradient(90deg,#0C573E,#2E8B34) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-doc-title .scope { margin: 0; font-size: 9px; color: #6b7280 !important; letter-spacing: 0.02em; text-align: center; }

          /* ── 3. Summary cards ── */
          .print-summary { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0 0; }
          .print-summary-card {
            border: 1px solid #e5e7eb; border-top-width: 3px; border-radius: 9px; padding: 9px 12px 10px;
            background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-summary-card.c-total { border-top-color: #0C573E !important; }
          .print-summary-card.c-value { border-top-color: #2E8B34 !important; }
          .print-summary-card.c-low   { border-top-color: #d97706 !important; }
          .print-summary-card.c-out   { border-top-color: #dc2626 !important; }
          .print-summary-card .label { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-summary-card .value { margin: 3px 0 0; font-size: 19px; font-weight: 800; color: #111827 !important; }
          .print-summary-card .value.green { color: #16a34a !important; }
          .print-summary-card .value.amber { color: #d97706 !important; }
          .print-summary-card .value.red   { color: #dc2626 !important; }
          .print-summary-card .cap { margin: 3px 0 0; font-size: 8px; color: #9ca3af !important; }

          /* ── 4. Restock urgency ── */
          .print-health {
            margin: 10px 0 0; border: 1px solid #e5e7eb; border-radius: 9px; padding: 10px 12px 11px;
            background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-health .head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; }
          .print-health .hk { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-health .hv { margin: 0; font-size: 8.5px; color: #6b7280 !important; }
          .print-health .bar {
            display: flex; height: 10px; border-radius: 9999px; overflow: hidden;
            background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-health .seg { display: block; height: 100%; }
          .print-health .s-low { background: #f59e0b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .s-out { background: #ef4444 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .legend { display: flex; flex-wrap: wrap; gap: 16px; margin: 7px 0 0; }
          .print-health .li { display: flex; align-items: center; gap: 5px; font-size: 8.5px; color: #374151 !important; }
          .print-health .dot { width: 7px; height: 7px; border-radius: 9999px; flex-shrink: 0; }

          /* ── 5. Low-stock detail table ── */
          .print-detail { display: block !important; margin-top: 14px; }
          .print-section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; padding: 0 2px; }
          .print-section-title { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #0C573E !important; }
          .print-section-sub { margin: 0; font-size: 8.5px; color: #9ca3af !important; }
          .print-detail .twrap { border: 1px solid #dbe3df; border-radius: 10px; overflow: hidden; }
          .print-detail table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
          .print-detail thead { display: table-header-group; }
          .print-detail tr { page-break-inside: avoid; }
          .print-detail th {
            background: #0C573E !important; color: #ffffff !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            border: none; padding: 7px; text-align: left;
            font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.25;
          }
          .print-detail th.col-idx    { width: 5%; }
          .print-detail th.col-name   { width: 37%; }
          .print-detail th.col-cat    { width: 22%; }
          .print-detail th.col-reo    { width: 12%; }
          .print-detail th.col-stock  { width: 12%; }
          .print-detail th.col-status { width: 12%; }
          .print-detail td {
            border-bottom: 1px solid #eef1f4; padding: 6.5px 7px;
            font-size: 9.5px; color: #1f2937 !important; vertical-align: top;
            word-break: break-word; overflow-wrap: anywhere;
          }
          .print-detail .num { text-align: right; }
          .print-detail .center { text-align: center; }
          .print-detail .nowrap { white-space: nowrap !important; }
          .print-detail .muted { color: #6b7280 !important; }
          .print-detail .item-name { font-weight: 600; color: #0f172a !important; line-height: 1.3; }
          .print-detail tr.alt td { background: #f7faf8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-detail tbody tr:last-child td { border-bottom: none; }

          /* stock numbers tinted by urgency */
          .print-detail .stk { font-weight: 700; }
          .print-detail .stk.low { color: #b45309 !important; }
          .print-detail .stk.out { color: #b91c1c !important; }

          /* status pill on paper */
          .print-pill {
            display: inline-block !important; padding: 2px 8px; border-radius: 9999px;
            font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
            white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-pill.low { background: #fef3c7 !important; color: #b45309 !important; }
          .print-pill.out { background: #fee2e2 !important; color: #b91c1c !important; }

          /* ── 6. Footer + signatures ── */
          .print-footer {
            display: flex !important; align-items: flex-end; justify-content: space-between; gap: 24px;
            margin-top: 20px; padding-top: 11px; border-top: 2px solid #e5e7eb;
          }
          .print-footer .note { margin: 0; font-size: 8.5px; color: #9ca3af !important; max-width: 46%; line-height: 1.55; }
          .print-footer .note strong { color: #6b7280 !important; }
          .print-signs { display: flex; gap: 34px; }
          .print-sign { text-align: center; }
          .print-sign .line { width: 170px; border-top: 1px solid #6b7280; margin: 20px 0 5px; }
          .print-sign .cap { margin: 0; font-size: 8.5px; color: #6b7280 !important; text-transform: uppercase; letter-spacing: 0.1em; }
        }
      `}</style>

      {/* ── Screen dashboard (never printed) ── */}
      <div className="no-print space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: t.textPrimary }}>Dashboard Overview</h1>
            <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
              Welcome back, {user?.firstName || "Admin"}. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 outline-none cursor-pointer transition-all"
              style={{ backgroundColor: t.surfaceBg, color: t.textPrimary, border: `1px solid ${t.cardBorder}` }}
            >
              <option value="all">All Branches</option>
              <option value="manila">Manila Branch</option>
              <option value="pampanga">Pampanga Branch</option>
            </select>
            <button onClick={handlePrint} title="Print or save as PDF"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GreenCard 
            label="Total Revenue Today" 
            value={`₱${revenueToday.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} 
            sub={`Live · ${branchLabel}`} 
          />
          <StatCard 
            label="Orders Today" 
            value={ordersToday} 
            sub={`Live · ${branchLabel}`} 
            trend="up" 
            trendValue="12%" 
          />
          <StatCard 
            label="Pending Orders" 
            value={pendingOrders} 
            sub="Requires attention" 
            alert={pendingOrders > 0} 
          />
          <StatCard 
            label="Low Stock Items" 
            value={lowStockCount} 
            sub="Below threshold" 
            alert={lowStockCount > 0} 
          />
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Revenue Chart takes full width or adjusts to your layout */}
          <RevenueChart branch={branch} />
          
          {/* Here are your missing Recent Orders and Low Stock cards! */}
          <DraggablePanelRow 
            branch={branch} 
            lowStock={lowStock} 
            recentOrders={recentOrders}    
            recentLoading={recentLoading}  
          />
        </div>
      </div>

      {/* ── Printable area (print-only Dashboard Report) ── */}
      <div id="dashboard-print-area">

        {/* ── Print 1: letterhead brand band ── */}
        <div className="print-only print-letterhead">
          <div>
            <img className="print-logo-word" src={estingsText} alt="Esting's Flower International Inc." />
            <p className="print-tagline">Flower International Inc.</p>
          </div>
          <div className="print-meta">
            <p className="ref">Ref: DSH-{new Date().toISOString().slice(0,10).replace(/-/g,"")}</p>
            <p className="gen">Generated <strong>{printDate}</strong> at <strong>{printTime}</strong></p>
          </div>
        </div>

        {/* ── Print 2: document title + report scope ── */}
        <div className="print-only print-doc-title">
          <p className="t">Dashboard Report</p>
          <span className="rule" />
          <p className="scope">{printScope}</p>
        </div>

        {/* ── Print 3: summary cards (today's snapshot) ── */}
        <div className="print-only print-summary">
          <div className="print-summary-card c-value">
            <p className="label">Total Revenue Today</p>
            <p className="value green">₱{revenueToday.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            <p className="cap">{branchLabel}</p>
          </div>
          <div className="print-summary-card c-total">
            <p className="label">Orders Today</p>
            <p className="value">{ordersToday}</p>
            <p className="cap">Placed today · {branchLabel}</p>
          </div>
          <div className="print-summary-card c-low">
            <p className="label">Pending Orders</p>
            <p className="value amber">{pendingOrders}</p>
            <p className="cap">Requires attention</p>
          </div>
          <div className="print-summary-card c-out">
            <p className="label">Low Stock Items</p>
            <p className="value red">{lowStockCount}</p>
            <p className="cap">Company-wide · at or below reorder point</p>
          </div>
        </div>

        {/* ── Print 4: restock urgency ── */}
        {lowStock.length > 0 && (
          <div className="print-only print-health">
            <div className="head">
              <p className="hk">Restock Urgency</p>
              <p className="hv">{outCount} out of stock · {lowOnlyCount} running low</p>
            </div>
            <div className="bar">
              {outCount > 0 && <span className="seg s-out" style={{ width: `${pct(outCount)}%` }} />}
              {lowOnlyCount > 0 && <span className="seg s-low" style={{ width: `${pct(lowOnlyCount)}%` }} />}
            </div>
            <div className="legend">
              <span className="li"><span className="dot s-out" />Out of Stock · {outCount} ({pct(outCount).toFixed(0)}%)</span>
              <span className="li"><span className="dot s-low" />Low Stock · {lowOnlyCount} ({pct(lowOnlyCount).toFixed(0)}%)</span>
            </div>
          </div>
        )}

        {/* ── Print 5: low-stock detail table ──
            Prints the FULL low-stock list (the screen card shows only 8),
            sorted most depleted first. */}
        <div className="print-only print-detail">
          <div className="print-section-head">
            <p className="print-section-title">Low Stock Detail</p>
            <p className="print-section-sub">Company-wide · sorted by urgency, most depleted first</p>
          </div>
          <div className="twrap">
            <table>
              <thead>
                <tr>
                  <th className="col-idx num">#</th>
                  <th className="col-name">Product</th>
                  <th className="col-cat">Category</th>
                  <th className="col-reo num">Reorder Pt</th>
                  <th className="col-stock num">Current Stock</th>
                  <th className="col-status center">Status</th>
                </tr>
              </thead>
              <tbody>
                {printLowStock.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "18px 8px" }}>No low-stock items. All products are above their reorder points.</td></tr>
                ) : printLowStock.map((item, i) => {
                  const isOut = (parseInt(item.stock ?? 0) || 0) <= 0
                  return (
                    <tr key={item.id || i} className={i % 2 === 1 ? "alt" : ""}>
                      <td className="num nowrap muted">{i + 1}</td>
                      <td><span className="item-name">{item.name}</span></td>
                      <td className="muted">{item.category || "—"}</td>
                      <td className="num nowrap muted">{item.reorder_point ?? "—"}</td>
                      <td className="num nowrap"><span className={`stk ${isOut ? "out" : "low"}`}>{item.stock ?? 0}</span></td>
                      <td className="center"><span className={`print-pill ${isOut ? "out" : "low"}`}>{isOut ? "Out of Stock" : "Low Stock"}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Print 6: footer + signature lines ── */}
        <div className="print-only print-footer">
          <p className="note">
            <strong>Esting's Flower International Inc.</strong> Confidential. This report is generated for internal use only and reflects live dashboard figures as of the date and time indicated above. The low-stock section is company-wide and is not affected by the branch selector.
          </p>
          <div className="print-signs">
            <div className="print-sign">
              <div className="line" />
              <p className="cap">Prepared by</p>
            </div>
            <div className="print-sign">
              <div className="line" />
              <p className="cap">Approved by</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
      className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all duration-150 relative group ${collapsed ? "justify-center px-2" : "px-3"} ${!allowed ? "opacity-40 cursor-not-allowed" : ""}`}
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

      {collapsed && allowed && (
  <span className="absolute left-full ml-2 px-2.5 py-1.5 text-xs font-semibold text-white rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50"
    style={{ backgroundColor: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
    {item.label}
  </span>
)}
    </button>
  )
}

// ─── Appearance Flyout ────────────────────────────────────────────────────────
// "Appearance" collapses the CMS pages into one trigger. On hover (or click to
// pin) the sub-items fan out in a floating panel to the right of the sidebar,
// each sliding in along a gentle outward arc with a staggered delay. A hover
// bridge spans the gap so the panel doesn't snap shut while the mouse travels.
const APPEARANCE_FLYOUT_CSS = `
  @keyframes apNodeIn {
    from { opacity: 0; transform: translateX(-8px) scale(0.85); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  .ap-node { animation: apNodeIn 0.34s cubic-bezier(0.34,1.56,0.64,1) both; transition: background-color .15s, border-color .15s, color .15s, transform .15s; transform-origin: left center; }
  @media (prefers-reduced-motion: reduce) {
    .ap-node { animation: none !important; }
  }
`

function AppearanceFlyout({ items, active, setActive, collapsed, user, t, isDark }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const closeTimer = useRef(null)
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)

  // track viewport: on small screens we expand inline instead of floating
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // measure the trigger's on-screen CENTER — the origin the fan radiates from
  const measure = () => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = (r.left + r.right) / 2 || 130
    const cy = (r.top + r.bottom) / 2 || 130
    setCoords({ top: cy, left: cx })
  }

  const show = () => {
    clearTimeout(closeTimer.current)
    // measure after paint so the trigger ref is guaranteed populated
    requestAnimationFrame(measure)
    setOpen(true)
  }
  const scheduleHide = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => { if (!pinned) setOpen(false) }, 180)
  }

  // click the trigger to pin/unpin the panel open
  const togglePin = () => {
    measure()
    setPinned(p => {
      const next = !p
      setOpen(next)
      return next
    })
  }

  // close the pinned panel when clicking elsewhere
  useEffect(() => {
    if (!pinned) return
    const onDocClick = e => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        !e.target.closest?.("[data-ap-panel]")
      ) {
        setPinned(false); setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [pinned])

  // keep the panel glued to the trigger if the window resizes/scrolls while open
  useEffect(() => {
    if (!(open || pinned)) return
    const reposition = () => measure()
    window.addEventListener("resize", reposition)
    window.addEventListener("scroll", reposition, true)
    return () => {
      window.removeEventListener("resize", reposition)
      window.removeEventListener("scroll", reposition, true)
    }
  }, [open, pinned])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const isOpen = open || pinned

  // ── shared pink palette — solid surfaces in both themes (no transparency) ──
  const pillBg      = isDark ? "#3b1f30" : "#fdf2f8"
  const pillBgHover = isDark ? "#4d2840" : "#fce7f3"
  const pillBorder  = isDark ? "#6d3a55" : "#f9cee4"
  const pillBorderH = isDark ? "#9d4f78" : "#f4a9cf"
  const pillText    = isDark ? "#fbcfe8" : "#9d2463"
  const chipBg      = isDark ? "#522c43" : "#ffffff"
  const pinkAccent  = isDark ? "#f472b6" : "#db2777"   // active fill / icon / hover text

  // one pill button, shared by the floating fan (desktop) and inline list (mobile)
  const renderItem = (item, i, { floating }) => {
    const allowed = !user?.role || user.role !== "staff" || item.staff
    const on = active === item.label
    const delay = Math.abs(i - (items.length - 1) / 2) * 22 + i * 14
    return (
      <button
        key={item.label}
        onMouseEnter={floating ? (e => { if (allowed && !on) { e.currentTarget.style.backgroundColor = pillBgHover; e.currentTarget.style.borderColor = pillBorderH; e.currentTarget.style.color = pinkAccent } e.currentTarget.style.transform = "translateX(4px)" }) : undefined}
        onMouseLeave={floating ? (e => { if (allowed && !on) { e.currentTarget.style.backgroundColor = pillBg; e.currentTarget.style.borderColor = pillBorder; e.currentTarget.style.color = pillText } e.currentTarget.style.transform = "translateX(0)" }) : undefined}
        onClick={allowed ? () => { setActive(item.label); setPinned(false); setOpen(false) } : undefined}
        disabled={!allowed}
        title={item.label}
        className={`ap-node ${allowed ? "" : "opacity-40 cursor-not-allowed"}`}
        style={{
          animationDelay: `${delay}ms`,
          display: "flex",
          alignItems: "center",
          gap: 9,
          whiteSpace: "nowrap",
          padding: "7px 16px 7px 8px",
          borderRadius: 9999,
          backgroundColor: on ? pinkAccent : pillBg,
          color: on ? "#ffffff" : pillText,
          border: `1px solid ${on ? pinkAccent : pillBorder}`,
          boxShadow: floating ? (isDark ? "0 8px 22px rgba(0,0,0,0.55)" : "0 8px 22px rgba(157,36,99,0.22)") : "none",
          fontSize: 13,
          fontWeight: 600,
          alignSelf: floating ? "flex-start" : "stretch",
          width: floating ? undefined : "100%",
        }}
      >
        <span
          className="flex items-center justify-center rounded-full flex-shrink-0 relative"
          style={{
            width: 30, height: 30,
            backgroundColor: on ? "rgba(255,255,255,0.25)" : chipBg,
            color: on ? "#ffffff" : pinkAccent,
          }}
        >
          <NavIcon d={item.d} />
          {item.badge && (
            <span style={{ position: "absolute", top: -1, right: -1, width: 9, height: 9, borderRadius: 9999, backgroundColor: "#ef4444", border: `2px solid ${on ? pinkAccent : chipBg}` }} />
          )}
        </span>
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={isMobile ? undefined : show}
      onMouseLeave={isMobile ? undefined : scheduleHide}
    >
      <style>{APPEARANCE_FLYOUT_CSS}</style>

      {/* Trigger — a solid brand-green button */}
      <button
        ref={triggerRef}
        onClick={togglePin}
        title={collapsed ? "Appearance" : undefined}
        className={`w-full flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 relative ${collapsed ? "justify-center px-2" : "px-3"}`}
        style={{
          background: `linear-gradient(135deg, ${DG}, ${G})`,
          boxShadow: isOpen
            ? (isDark ? "0 0 0 2px rgba(74,222,128,0.45), 0 8px 20px -6px rgba(12,87,62,0.6)" : "0 0 0 2px rgba(46,139,52,0.25), 0 8px 20px -6px rgba(12,87,62,0.5)")
            : "0 2px 8px -2px rgba(12,87,62,0.45)",
          transform: isOpen ? "translateY(-1px)" : "none",
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.06)"; e.currentTarget.style.transform = "translateY(-1px)" }}
        onMouseLeave={e => { e.currentTarget.style.filter = "none"; if (!isOpen) e.currentTarget.style.transform = "none" }}
      >
        <span style={{ color: "#ffffff" }}>
          <NavIcon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </span>
        {!collapsed && <span className="truncate">Appearance</span>}
        {!collapsed && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}
            strokeLinecap="round" strokeLinejoin="round"
            className="ml-auto transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", color: "rgba(255,255,255,0.9)" }}>
            <path d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* MOBILE: inline accordion — items expand within the sidebar list */}
      {isMobile && isOpen && (
        <div
          className="mt-2 pl-3 flex flex-col gap-1.5"
          style={{ borderLeft: `2px solid ${pillBorder}`, marginLeft: 8 }}
        >
          {items.map((item, i) => renderItem(item, i, { floating: false }))}
        </div>
      )}

      {/* DESKTOP: floating pink fan to the right (position:fixed, escapes clip) */}
      {!isMobile && isOpen && (
        <>
          <div
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            style={{ position: "fixed", top: coords.top - 30, left: coords.left, width: 160, height: 60, zIndex: 1090 }}
          />
          <div
            data-ap-panel
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left + 150,
              transform: "translateY(-50%)",
              zIndex: 1100,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {items.map((item, i) => renderItem(item, i, { floating: true }))}
          </div>
        </>
      )}
    </div>
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
              style={{ color: isDark ? "rgba(255,255,255,0.85)" : G, opacity: 0.75 }}>
              Flower International Inc.
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        <div className="space-y-0.5">
          {/* 🚀 ADDED FILTER: Only show items the user is allowed to see */}
          {NAV_MAIN
            .filter(item => !user?.role || user.role !== "staff" || item.staff)
            .map(item => (
              <NavBtn key={item.label} item={item} active={active} setActive={setActive} collapsed={collapsed} user={user} />
          ))}
        </div>
        {/* Appearance pages collapse into one fan-out trigger */}
        <div className="space-y-0.5 mt-3">
          <AppearanceFlyout
            items={NAV_APPEARANCE.filter(item => !user?.role || user.role !== "staff" || item.staff !== false)}
            active={active}
            setActive={setActive}
            collapsed={collapsed}
            user={user}
            t={t}
            isDark={isDark}
          />
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
      case "Hero Section":      return <AdminHero />
      case "Advertisements":    return <AdminAdvertisements />
      case "Promotions":        return <AdminPromotions />
      case "Featured Products": return <AdminFeaturedProducts />
      case "FAQ":               return <AdminFAQ />
      case "Legal":             return <AdminLegal />
      case "Campaigns":         return <AdminCampaigns />
      case "Preview Site":      return <PreviewSitePanel onBack={()=>goTo("Dashboard")} />
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