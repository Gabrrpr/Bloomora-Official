import { useTheme } from "../../context/ThemeContext"

export const DG = "#0C573E"
export const G  = "#2E8B34"

// ── Shared token hook ─────────────────────────────────────────────────────────
function useTokens() {
  const { isDark } = useTheme()
  if (isDark) return {
    cardBg: "#1e293b", cardBorder: "#334155", cardShadow: "0 2px 8px rgba(0,0,0,0.4)",
    tableHead: "#162032", tableBorder: "#2d3f55", inputBg: "#0f172a", inputBorder: "#475569",
    surfaceBg: "#1e293b", surfaceAlt: "#162032", hoverBg: "#2d3f55",
    textPrimary: "#f1f5f9", textSecondary: "#cbd5e1", textMuted: "#94a3b8", isDark: true,
  }
  return {
    cardBg: "#ffffff", cardBorder: "#e8edf2", cardShadow: "0 1px 3px rgba(0,0,0,0.04)",
    tableHead: "#fafbfc", tableBorder: "#f1f5f9", inputBg: "#f7f9fc", inputBorder: "#dde3ec",
    surfaceBg: "#ffffff", surfaceAlt: "#fafbfc", hoverBg: "#f8faf9",
    textPrimary: "#111827", textSecondary: "#6b7280", textMuted: "#9ca3af", isDark: false,
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────
const BADGE = {
  "Active":           { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Inactive":         { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Disabled":         { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "In stock":         { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Out of stock":     { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Low stock":        { bg: "#fef9c3", color: "#92400e", dot: "#eab308" },
  "Preparing":        { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Out for Delivery": { bg: "#dbeafe", color: "#1e40af", dot: "#60a5fa" },
  "Out for delivery": { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  "Cancelled":        { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Pending":          { bg: "#fef9c3", color: "#92400e", dot: "#eab308" },
  "Delivered":        { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Paid":             { bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
  "Unpaid":           { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Refunded":         { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  "Success":          { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Failed":           { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Available":        { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Payment":          { bg: "#eff6ff", color: "#1e40af", dot: null },
  "Refund":           { bg: "#fef3c7", color: "#92400e", dot: null },
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
// ── Export button (kept for backward compat) ───────────────────────────────
export function ExportBtn({ onClick }) {
  const t = useTokens()
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: t.cardBorder, color: t.textSecondary, backgroundColor: t.cardBg }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hoverBg}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = t.cardBg}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export
    </button>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, trend, trendValue, alert }) {
  const t = useTokens()
  return (
    <div className="p-5 rounded-xl border shadow-sm transition-all duration-200 hover:scale-[1.02] relative"
      style={{ backgroundColor: t.cardBg, borderColor: alert ? "#fca5a5" : t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium" style={{ color: t.textSecondary }}>{label}</p>
          <h3 className="text-2xl font-bold mt-1" style={{ color: t.textPrimary }}>{value}</h3>
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </span>
        )}
        {alert && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}
      </div>
      <p className="text-xs mt-3 font-medium" style={{ color: alert ? "#ef4444" : t.textMuted }}>{sub}</p>
    </div>
  )
}

// ── Green stat card ───────────────────────────────────────────────────────────
export function GreenCard({ label, sublabel, value, prefix = "", sub, subColor, action, onAction }) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden transition-all duration-200 cursor-default select-none"
      style={{ background: "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)", boxShadow: "0 4px 16px rgba(12,87,62,0.30)" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(12,87,62,0.38)" }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(12,87,62,0.30)" }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 80% 20%,white 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{sublabel}</p>}
        <p className="text-3xl font-bold text-white mt-2 leading-none">{prefix}{typeof value === "number" ? value.toLocaleString() : value}</p>
        {sub && <p className="text-xs mt-2 flex items-center gap-1 font-medium" style={{ color: subColor || "rgba(255,255,255,0.55)" }}>{sub}</p>}
        {action && (
          <button onClick={onAction} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
            {action}
          </button>
        )}
      </div>
    </div>
  )
}

// ── White stat card ───────────────────────────────────────────────────────────
export function WhiteCard({ label, sublabel, value, prefix = "", sub, subUp, subRed, subGray, accentColor = "#0C573E", children }) {
  const t = useTokens()
  return (
    <div className="rounded-xl p-5 transition-all duration-200 cursor-default relative overflow-hidden"
      style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = t.isDark ? "0 6px 20px rgba(0,0,0,0.5)" : "0 6px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = t.isDark ? "#475569" : "#d1dce8" }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = t.cardShadow; e.currentTarget.style.borderColor = t.cardBorder }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>{label}</p>
      {sublabel && <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{sublabel}</p>}
      <p className="text-3xl font-bold mt-2 leading-none" style={{ color: t.textPrimary }}>
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && (
        <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${subRed ? "text-red-500" : subGray ? "" : "text-green-500"}`}
          style={subGray ? { color: t.textMuted } : {}}>
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
  const t = useTokens()
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {dropdowns.map(d => (
        <div key={d} className="relative">
          <select className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer transition-all outline-none"
            style={{ borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.textPrimary, minWidth: "110px" }}
            onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.12)" }}
            onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }}>
            <option>{d}</option>
          </select>
          <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      ))}
      <div className="relative flex-1" style={{ minWidth: "180px" }}>
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
        </svg>
        <input value={search} onChange={e => onSearch?.(e.target.value)} placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
          style={{ borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.textPrimary }}
          onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = "0 0 0 2px rgba(46,139,52,0.12)" }}
          onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none" }} />
      </div>
      <button className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
        style={{ background: `linear-gradient(135deg,${DG},${G})` }}>Filter</button>
      {extra}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ showing = "0 entries", page = 1, totalPages = 1, onPageChange }) {
  const t = useTokens()
  const canPrev = page > 1
  const canNext = page < totalPages

  const baseBtn = "px-3 py-1.5 rounded-md text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${t.tableBorder}` }}>
      <span className="text-sm" style={{ color: t.textMuted }}>{showing}</span>
      
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => onPageChange(page - 1)} 
          disabled={!canPrev}
          className={`${baseBtn} hover:scale-105 active:scale-95 disabled:hover:scale-100`}
          style={{ backgroundColor: t.cardBg, color: t.textSecondary, border: `1px solid ${t.cardBorder}` }}>
          ← Prev
        </button>

        {/* Dynamically render previous, current, and next page buttons */}
        {([page - 1, page, page + 1]).filter(p => p >= 1 && p <= totalPages).map(p => (
          <button 
            key={p} 
            onClick={() => onPageChange(p)}
            className="px-3 py-1.5 rounded-md text-xs transition-all hover:scale-105 active:scale-95"
            style={{ 
              background: p === page ? `linear-gradient(135deg,${DG},${G})` : t.cardBg, 
              color: p === page ? "white" : t.textSecondary, 
              border: p === page ? "none" : `1px solid ${t.cardBorder}`, 
              fontWeight: p === page ? 600 : 400 
            }}>
            {p}
          </button>
        ))}

        <button 
          onClick={() => onPageChange(page + 1)} 
          disabled={!canNext}
          className={`${baseBtn} hover:scale-105 active:scale-95 disabled:hover:scale-100`}
          style={{ backgroundColor: t.cardBg, color: t.textSecondary, border: `1px solid ${t.cardBorder}` }}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ── Table heading ─────────────────────────────────────────────────────────────
export function TH({ children, right = false }) {
  const t = useTokens()
  return (
    <th className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      style={{ color: t.textMuted, backgroundColor: t.tableHead }}>
      {children}
    </th>
  )
}

export function TD({ children, className = "", right = false }) {
  const t = useTokens()
  return (
    <td className={`px-5 py-3.5 text-sm ${right ? "text-right" : ""} ${className}`} style={{ color: t.textSecondary }}>
      {children}
    </td>
  )
}

export function EmptyRow({ cols, message = "No data yet — connect to the backend." }) {
  const t = useTokens()
  return (
    <tr>
      <td colSpan={cols}>
        <div className="flex flex-col items-center justify-center py-14">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
            style={{ background: t.isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: `1px solid ${t.isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}>
            <svg className="w-5 h-5" style={{ color: t.isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: t.textSecondary }}>No data yet</p>
          <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{message}</p>
        </div>
      </td>
    </tr>
  )
}

export function TableWrap({ children, loading }) {
  const t = useTokens()
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-14">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mb-3"
            style={{ borderColor: t.isDark ? "#334155" : "#dcfce7", borderTopColor: t.isDark ? "#4ade80" : "#16a34a" }} />
          <p className="text-sm font-medium" style={{ color: t.textSecondary }}>Loading…</p>
        </div>
      ) : children}
    </div>
  )
}

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
  const t = useTokens()
  return (
    <button onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-all active:scale-95"
      style={{ backgroundColor: dark ? "#1e293b" : color || t.cardBg, border: dark ? "none" : `1px solid ${t.cardBorder}` }}>
      {icon}
    </button>
  )
}

export function ActionBtns({ onEdit, onView, onDelete }) {
  const t = useTokens()
  const base = "px-2 py-1 text-xs font-semibold rounded-md transition-colors active:scale-95"
  const divider = <span aria-hidden="true" style={{ width: 1, height: 13, backgroundColor: t.cardBorder, flexShrink: 0 }} />

  return (
    <div className="flex items-center gap-1.5">
      {onEdit && (
        <button onClick={onEdit} className={base}
          style={{ color: t.textSecondary }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hoverBg; e.currentTarget.style.color = t.isDark ? "#4ade80" : DG }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = t.textSecondary }}>
          Edit
        </button>
      )}

      {onEdit && onView && divider}

      {onView && (
        <button onClick={onView} className={base}
          style={{ color: t.textSecondary }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hoverBg; e.currentTarget.style.color = t.isDark ? "#93c5fd" : "#1d4ed8" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = t.textSecondary }}>
          View
        </button>
      )}

      {(onEdit || onView) && onDelete && divider}

      {onDelete && (
        <button onClick={onDelete} className={base}
          style={{ color: t.isDark ? "#f87171" : "#dc2626" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = t.isDark ? "rgba(239,68,68,0.12)" : "#fef2f2"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
          Delete
        </button>
      )}
    </div>
  )
}

export function ComingSoon({ label }) {
  const t = useTokens()
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "340px" }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: t.isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: `1px solid ${t.isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}>
          <svg className="w-7 h-7" style={{ color: t.isDark ? "#4ade80" : DG }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        <p className="text-base font-semibold" style={{ color: t.textSecondary }}>{label}</p>
        <p className="text-sm mt-1" style={{ color: t.textMuted }}>This section will be connected to your backend soon.</p>
      </div>
    </div>
  )
}
