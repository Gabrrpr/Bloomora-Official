export const DG = "#0C573E"
export const G  = "#2E8B34"

// ── Status badge ──────────────────────────────────────────────────────────────
const BADGE = {
  "Active":            { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Inactive":          { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Disabled":          { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "In stock":          { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Out of stock":      { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Low stock":         { bg: "#fef9c3", color: "#92400e", dot: "#eab308" },
  "Preparing":         { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Out for Delivery":  { bg: "#dbeafe", color: "#1e40af", dot: "#60a5fa" },
  "Out for delivery":  { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  "Cancelled":         { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Pending":           { bg: "#fef9c3", color: "#92400e", dot: "#eab308" },
  "Delivered":         { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Paid":              { bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
  "Unpaid":            { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Refunded":          { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  "Success":           { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Failed":            { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Available":         { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Payment":           { bg: "#eff6ff", color: "#1e40af", dot: null },
  "Refund":            { bg: "#fef3c7", color: "#92400e", dot: null },
}

export function StatusBadge({ status }) {
  const s = BADGE[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />}
      {status}
    </span>
  )
}

import { useTheme } from "../../context/ThemeContext"; // Make sure this path is correct for your shared file!

export function StatCard({ label, value, sub, trend, trendValue, alert }) {
  const { isDark } = useTheme();
  // Quick inline tokens for the shared card
  const t = isDark 
    ? { cardBg: "#1e293b", cardBorder: "#334155", textPrimary: "#f1f5f9", textSecondary: "#cbd5e1", textMuted: "#94a3b8" }
    : { cardBg: "#ffffff", cardBorder: "#e8edf2", textPrimary: "#111827", textSecondary: "#6b7280", textMuted: "#9ca3af" };

  return (
    <div className="p-5 rounded-xl border shadow-sm transition-all relative" style={{ backgroundColor: t.cardBg, borderColor: alert ? '#fca5a5' : t.cardBorder }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium" style={{ color: t.textSecondary }}>{label}</p>
          <h3 className="text-2xl font-bold mt-1" style={{ color: t.textPrimary }}>{value}</h3>
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
        {alert && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
      <p className="text-xs mt-3 font-medium" style={{ color: alert ? '#ef4444' : t.textMuted }}>{sub}</p>
    </div>
  );
}

// ── Green stat card ───────────────────────────────────────────────────────────
export function GreenCard({ label, sublabel, value, prefix = "", sub, subColor, action, onAction }) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden transition-all duration-200 cursor-default select-none"
      style={{ background: `linear-gradient(135deg, #0a4a34 0%, #1a7040 60%, #2E8B34 100%)`, boxShadow: "0 4px 16px rgba(12,87,62,0.30)" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(12,87,62,0.38)" }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(12,87,62,0.30)" }}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
        {sublabel && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{sublabel}</p>}
        <p className="text-3xl font-bold text-white mt-2 leading-none">{prefix}{typeof value === "number" ? value.toLocaleString() : value}</p>
        {sub && <p className="text-xs mt-2 flex items-center gap-1 font-medium" style={{ color: subColor || "rgba(255,255,255,0.55)" }}>{sub}</p>}
        {action && (
          <button onClick={onAction} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            {action}
          </button>
        )}
      </div>
    </div>
  )
}

// ── White stat card ───────────────────────────────────────────────────────────
export function WhiteCard({ label, sublabel, value, prefix = "", sub, subUp, subRed, subGray, accentColor = "#0C573E", children }) {
  return (
    <div className="bg-white rounded-xl p-5 transition-all duration-200 cursor-default relative overflow-hidden"
      style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)", e.currentTarget.style.borderColor = "#d1dce8" }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "#e8edf2" }}>
      {/* Colored top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{label}</p>
      {sublabel && <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>{sublabel}</p>}
      <p className="text-3xl font-bold mt-2 leading-none" style={{ color: "#0f172a" }}>
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && (
        <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${subRed ? "text-red-500" : subGray ? "text-gray-400" : "text-green-600"}`}>
          {!subGray && (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={subUp === false ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
            </svg>
          )}
          {sub}
        </p>
      )}
      {children}
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────
export function FilterBar({ dropdowns = [], searchPlaceholder = "Search...", search, onSearch, extra }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {dropdowns.map(d => (
        <div key={d} className="relative">
          <select className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer transition-all outline-none"
            style={{ borderColor: "#dde3ec", minWidth: "110px" }}
            onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
            onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
            <option>{d}</option>
          </select>
          <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      ))}
      <div className="relative flex-1" style={{ minWidth: "180px" }}>
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
        </svg>
        <input value={search} onChange={e => onSearch?.(e.target.value)} placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
          style={{ borderColor: "#dde3ec" }}
          onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
          onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
      </div>
      <button className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
        style={{ background: `linear-gradient(135deg, ${DG} 0%, ${G} 100%)` }}>Filter</button>
      {extra}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ showing = "0 entries" }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <span className="text-sm text-gray-400">{showing}</span>
      <div className="flex items-center gap-1">
        {["Previous","1","2","3",">","Next →"].map(p => (
          <button key={p} className="px-2.5 py-1.5 rounded-md text-xs transition-all hover:scale-105 active:scale-95"
            style={{ background: p === "1" ? `linear-gradient(135deg, ${DG}, ${G})` : "white", color: p === "1" ? "white" : "#6b7280", border: p === "1" ? "none" : "1px solid #e2e8f0", fontWeight: p === "1" ? 600 : 400 }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Table heading ─────────────────────────────────────────────────────────────
export function TH({ children, right = false }) {
  return (
    <th className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      style={{ color: "#64748b" }}>
      {children}
    </th>
  )
}

// ── Table data cell ───────────────────────────────────────────────────────────
export function TD({ children, className = "", right = false }) {
  return (
    <td className={`px-5 py-3.5 text-sm ${right ? "text-right" : ""} ${className}`}>{children}</td>
  )
}

// ── Empty table row ───────────────────────────────────────────────────────────
export function EmptyRow({ cols, message = "No data yet — connect to the backend." }) {
  return (
    <tr>
      <td colSpan={cols}>
        <div className="flex flex-col items-center justify-center py-14">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
            <svg className="w-5 h-5" style={{ color: DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">No data yet</p>
          <p className="text-xs text-gray-400 mt-0.5">{message}</p>
        </div>
      </td>
    </tr>
  )
}

// ── Table wrapper ─────────────────────────────────────────────────────────────
export function TableWrap({ children, loading }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden"
      style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-14">
          <div className="w-10 h-10 rounded-full border-2 border-green-100 border-t-green-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading products…</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// ── Export button ─────────────────────────────────────────────────────────────
export function ExportBtn({ label = "Export" }) {
  return (
    <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
      style={{ borderColor: "#dde3ec" }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </button>
  )
}

// ── Action: View Details + icon ───────────────────────────────────────────────
export function ViewDetailsBtn({ label = "View Details", onView }) {
  return (
    <button onClick={onView}
      className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
      style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: DG }}>
      {label}
    </button>
  )
}

export function IconBtn({ onClick, icon, dark = false, color }) {
  return (
    <button onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-all active:scale-95"
      style={{ backgroundColor: dark ? "#1e293b" : color || "#f8fafc", border: dark ? "none" : "1px solid #e2e8f0" }}>
      {icon}
    </button>
  )
}

// ── Action buttons (Edit / View / Delete) ─────────────────────────────────────
export function ActionBtns({ onEdit, onView, onDelete }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onEdit}
        className="px-3 py-1.5 text-xs font-semibold text-white rounded-md transition-all hover:opacity-85 active:scale-95"
        style={{ backgroundColor: DG }}>
        Edit
      </button>
      <button onClick={onView}
        className="px-3 py-1.5 text-xs font-semibold rounded-md border transition-all hover:shadow-sm active:scale-95"
        style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: DG }}>
        View
      </button>
      <button onClick={onDelete}
        className="w-7 h-7 flex items-center justify-center rounded-md transition-all hover:bg-red-600 active:scale-95"
        style={{ backgroundColor: "#1e293b" }}>
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

// ── Coming soon panel ─────────────────────────────────────────────────────────
export function ComingSoon({ label }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "340px" }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}>
          <svg className="w-7 h-7" style={{ color: DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-700">{label}</p>
        <p className="text-sm text-gray-400 mt-1">This section will be connected to your backend soon.</p>
      </div>
    </div>
  )
}
