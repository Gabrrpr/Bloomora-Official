import { useState, useEffect, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, ActionBtns } from "./_adminShared"

function InvStatusBadge({ status, isDark }) {
  const styles = {
    "Active":       { bg: isDark ? "rgba(74,222,128,0.12)"  : "#f0fdf4", text: isDark ? "#4ade80" : "#16a34a" },
    "Low Stock":    { bg: isDark ? "rgba(251,191,36,0.12)"  : "#fffbeb", text: isDark ? "#fbbf24" : "#d97706" },
    "Out of Stock": { bg: isDark ? "rgba(248,113,113,0.12)" : "#fef2f2", text: isDark ? "#f87171" : "#dc2626" },
  }
  const s = styles[status] || styles["Active"]
  return (
    <span className="px-2.5 py-1 text-xs uppercase tracking-wider font-bold rounded-md"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {status}
    </span>
  )
}

function FInput({ placeholder, value, onChange, type = "text", isDark }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#0f172a"
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
      style={{ borderColor: bdr, backgroundColor: bg, color: tc }}
      onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
      onBlur={e => { e.target.style.borderColor = bdr; e.target.style.boxShadow = "none" }} />
  )
}

function FSel({ options, value, onChange, placeholder, isDark }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#0f172a"
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor: bdr, backgroundColor: bg, color: value ? tc : (isDark ? "#64748b" : "#9ca3af") }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
        onBlur={e => { e.target.style.borderColor = bdr; e.target.style.boxShadow = "none" }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function StepCard({ n, title, children, isDark }) {
  return (
    <div className="rounded-xl p-5"
      style={{ backgroundColor: isDark ? "#1a2332" : "white", border: `1px solid ${isDark ? "#2d3748" : "#e8edf2"}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>{title}</p>
        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>{n}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FL({ children, isDark }) {
  return <label className="block text-sm font-semibold mb-1" style={{ color: isDark ? "#94a3b8" : "#374151" }}>{children}</label>
}

function AddItemForm({ onBack, isDark }) {
  const [f, setF] = useState({ name: "", sku: "", category: "", unit: "", branch: "", stock: "", reorderLevel: "", costPerUnit: "", status: "" })
  const s = k => v => setF(p => ({ ...p, [k]: v }))
  const CATEGORIES = ["Fresh Flowers", "Dried Flowers", "Artificial Flowers", "Foliage & Greenery", "Vases & Containers", "Ribbons & Wrapping", "Floral Foam & Supplies", "Seasonal & Event"]
  const UNITS      = ["piece", "bunch", "stem", "box", "pack", "roll", "sheet", "kg", "g", "L", "mL"]
  const STATUSES   = ["Active", "Low Stock", "Out of Stock", "Discontinued"]
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>Add New Inventory Item</h2>
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all"
          style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}>
          ← Back to table
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StepCard n={1} title="Item Information" isDark={isDark}>
          <div><FL isDark={isDark}>Item Name</FL><FInput placeholder="e.g. Red Roses – Premium" value={f.name} onChange={s("name")} isDark={isDark} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL isDark={isDark}>SKU / Item ID</FL><FInput placeholder="FLW-001" value={f.sku} onChange={s("sku")} isDark={isDark} /></div>
            <div><FL isDark={isDark}>Category</FL><FSel options={CATEGORIES} value={f.category} onChange={s("category")} placeholder="Select" isDark={isDark} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL isDark={isDark}>Unit</FL><FSel options={UNITS} value={f.unit} onChange={s("unit")} placeholder="Select" isDark={isDark} /></div>
            <div><FL isDark={isDark}>Branch</FL><FSel options={["Manila", "Pampanga"]} value={f.branch} onChange={s("branch")} placeholder="Select" isDark={isDark} /></div>
          </div>
        </StepCard>
        <StepCard n={2} title="Stock Details" isDark={isDark}>
          <div className="grid grid-cols-2 gap-3">
            <div><FL isDark={isDark}>Current Stock</FL><FInput type="number" placeholder="0" value={f.stock} onChange={s("stock")} isDark={isDark} /></div>
            <div><FL isDark={isDark}>Reorder Level</FL><FInput type="number" placeholder="10" value={f.reorderLevel} onChange={s("reorderLevel")} isDark={isDark} /></div>
          </div>
          <div><FL isDark={isDark}>Cost per Unit (₱)</FL><FInput type="number" placeholder="0.00" value={f.costPerUnit} onChange={s("costPerUnit")} isDark={isDark} /></div>
          <div><FL isDark={isDark}>Status</FL><FSel options={STATUSES} value={f.status} onChange={s("status")} placeholder="Select" isDark={isDark} /></div>
        </StepCard>
      </div>
      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Item
        </button>
      </div>
    </div>
  )
}

function ExportInventoryBtn({ data = [], isDark }) {
  const handleExport = () => {
    const headers = ["Item Name", "Category", "Unit Type", "Current Stock", "Cost per Unit", "Status"]
    const rows = data.length
      ? data.map(r => { const st = r.stock <= 0 ? "Out of Stock" : r.stock <= (r.reorder_point || 10) ? "Low Stock" : "Active"; return `"${r.name}","${r.category}","${r.unit_type || 'piece'}","${r.stock}","${r.cost_per_unit || '0.00'}","${st}"` })
      : [headers.map(() => "—").join(",")]
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" }), url = URL.createObjectURL(blob), a = document.createElement("a")
    a.href = url; a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <button onClick={handleExport}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1e293b" : "white" }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      Export
    </button>
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

function Pagination({ showing, page, totalPages, onPageChange, isDark }) {
  const bdr = isDark ? "#374151" : "#dde3ec", tc = isDark ? "#94a3b8" : "#374151"
  const dis = { borderColor: isDark ? "#2d3748" : "#e5e7eb", color: isDark ? "#475569" : "#9ca3af", cursor: "not-allowed", backgroundColor: isDark ? "#111827" : "#f9fafb" }
  return (
    <div className="flex items-center justify-between px-5 py-3 no-print" style={{ borderTop: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}` }}>
      <p className="text-sm" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>{showing}</p>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
          style={page <= 1 ? dis : { borderColor: bdr, color: tc, cursor: "pointer" }}>← Prev</button>
        {[page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages).map(p => (
          <button key={p} onClick={() => onPageChange(p)} className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
            style={p === page ? { borderColor: G, color: isDark ? "#4ade80" : G } : { borderColor: bdr, color: tc }}>{p}</button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
          style={page >= totalPages ? dis : { borderColor: bdr, color: tc, cursor: "pointer" }}>Next →</button>
      </div>
    </div>
  )
}

export default function AdminInventory() {
  const { isDark } = useTheme()
  const PAGE_SIZE = 15
  const [inventory, setInventory] = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState("")
  const [showForm, setShowForm]   = useState(false)
  const [statusFilter, setStatus] = useState("")

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try { const data = await api.get("/products/admin/all"); setInventory(data || []) }
    catch (err) { console.error("Failed to load inventory:", err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const totalItems      = inventory.length
  const totalValue      = inventory.reduce((s, i) => s + ((i.cost_per_unit || (i.price * 0.4)) * (i.stock || 0)), 0)
  const lowStockCount   = inventory.filter(i => i.stock > 0 && i.stock <= (i.reorder_point || 10)).length
  const outOfStockCount = inventory.filter(i => i.stock <= 0).length

  const filtered = inventory.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.id.includes(search)
    let matchStatus = true
    if (statusFilter === "Active")       matchStatus = item.stock > (item.reorder_point || 10)
    if (statusFilter === "Low Stock")    matchStatus = item.stock > 0 && item.stock <= (item.reorder_point || 10)
    if (statusFilter === "Out of Stock") matchStatus = item.stock <= 0
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe   = Math.min(page, totalPages)
  const paginated  = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const d = {
    headingC:  isDark ? "#e2e8f0" : "#0f172a",
    subC:      isDark ? "#94a3b8" : "#64748b",
    cardBg:    isDark ? "#1a2332" : "white",
    cardBdr:   isDark ? "#2d3748" : "#e8edf2",
    toolbarBg: isDark ? "#111827" : "#fafbfc",
    toolbarBdr:isDark ? "#1e293b" : "#f1f5f9",
    inputBg:   isDark ? "#1e293b" : "white",
    inputBdr:  isDark ? "#374151" : "#dde3ec",
    inputTxt:  isDark ? "#e2e8f0" : "#374151",
    cellTxt:   isDark ? "#e2e8f0" : "#1e293b",
  }

  const handlePrint = () => window.print()
  const printDate   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

  const handleCSV = () => {
    const headers = ["Item Name", "Category", "Unit", "Current Stock", "Reorder Point", "Cost per Unit (₱)", "Status"]
    const rows = filtered.map(item => {
      const st = item.stock <= 0 ? "Out of Stock" : item.stock <= (item.reorder_point || 10) ? "Low Stock" : "Active"
      return [item.name, item.category || "—", item.unit_type || "piece", item.stock, item.reorder_point || 10, item.cost_per_unit || "0.00", st]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `inventory_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  if (showForm) return <AddItemForm onBack={() => setShowForm(false)} isDark={isDark} />

  return (
    <div className="space-y-5">

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #inventory-print-area, #inventory-print-area * { visibility: visible !important; }
          #inventory-print-area {
            position: absolute; top: 0; left: 0; width: 100%; padding: 24px; font-family: sans-serif;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          #inventory-print-area table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          #inventory-print-area th {
            background: #f0fdf4 !important; color: #0C573E !important;
            border: 1px solid #d1d5db; padding: 8px 10px;
            text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          }
          #inventory-print-area td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; color: #111827; }
          #inventory-print-area tr:nth-child(even) td { background: #f9fafb !important; }
          .print-summary { display: flex !important; gap: 24px; margin-bottom: 12px; }
          .print-summary-item { font-size: 12px; color: #374151; }
          .print-summary-item strong { color: #0C573E; }
          .print-footer { margin-top: 20px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        }
        .print-only { display: none; }
        .print-summary { display: none; }
      `}</style>

      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: d.headingC }}>Inventory Management</h1>
        <div className="flex items-center gap-2">
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div className="rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)", boxShadow: "0 4px 16px rgba(12,87,62,0.25)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.65)" }}>Total Items</p>
            <p className="text-3xl font-bold text-white mt-2">{totalItems}</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="mt-3 self-start text-xs font-bold px-3 py-1.5 rounded-md transition-all hover:scale-105"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
            + Add Item
          </button>
        </div>
        {[
          { label: "Est. Inventory Value", val: `₱${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, accent: "#3b82f6" },
          { label: "Low Stock Items",      val: lowStockCount,    accent: "#f59e0b", action: () => setStatus("Low Stock"),    actionLabel: "Review Needs" },
          { label: "Out of Stock Items",   val: outOfStockCount,  accent: "#ef4444", action: () => setStatus("Out of Stock"), actionLabel: "Action Required", red: true },
        ].map(({ label, val, accent, action, actionLabel, red }) => (
          <div key={label} className="rounded-xl p-4 sm:p-5 flex flex-col justify-between relative"
            style={{ backgroundColor: d.cardBg, border: `1px solid ${d.cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: accent, opacity: 0.7 }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: d.subC }}>{label}</p>
              <p className="text-3xl font-bold mt-2" style={{ color: red ? (isDark ? "#f87171" : "#ef4444") : (isDark ? "#4ade80" : d.headingC) }}>{val}</p>
            </div>
            {action && (
              <button onClick={action} className="mt-3 self-start text-xs font-semibold"
                style={{ color: red ? (isDark ? "#f87171" : "#ef4444") : (isDark ? "#4ade80" : DG) }}>
                {actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Printable area ── */}
      <div id="inventory-print-area">

        {/* Print-only header */}
        <div className="print-only" style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0C573E", margin: 0 }}>Esting's Flower International Inc.</h1>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#374151", margin: "4px 0 0" }}>Inventory Report</h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
              <p style={{ margin: 0 }}>Generated: {printDate}</p>
              <p style={{ margin: "2px 0 0" }}>Filter: {statusFilter || "All"} | Showing {filtered.length} of {totalItems} items</p>
            </div>
          </div>
          <div style={{ height: "2px", background: "linear-gradient(90deg,#0C573E,#2E8B34)", marginTop: "12px", borderRadius: "2px" }} />
        </div>

        {/* Print summary row */}
        <div className="print-summary">
          <div className="print-summary-item">Total Items: <strong>{totalItems}</strong></div>
          <div className="print-summary-item">Est. Value: <strong>₱{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
          <div className="print-summary-item">Low Stock: <strong>{lowStockCount}</strong></div>
          <div className="print-summary-item">Out of Stock: <strong>{outOfStockCount}</strong></div>
        </div>

        {/* Table card */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${d.cardBdr}`, backgroundColor: d.cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Toolbar */}
          <div className="p-3 sm:p-4 no-print" style={{ borderBottom: `1px solid ${d.toolbarBdr}`, backgroundColor: d.toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
                  style={{ borderColor: d.inputBdr, minWidth: "130px", backgroundColor: d.inputBg, color: d.inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
                  onBlur={e => { e.target.style.borderColor = d.inputBdr; e.target.style.boxShadow = "none" }}>
                  <option value="">Status: All</option>
                  <option value="Active">Active</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              <div className="relative flex-1" style={{ minWidth: "180px" }}>
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item name or ID"
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                  style={{ borderColor: d.inputBdr, backgroundColor: d.inputBg, color: d.inputTxt }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
                  onBlur={e => { e.target.style.borderColor = d.inputBdr; e.target.style.boxShadow = "none" }} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "620px" }}>
              <thead style={{ borderBottom: `1px solid ${d.toolbarBdr}`, backgroundColor: d.toolbarBg }}>
                <tr>
                  {["Item Name", "Category", "Unit", "Current Stock", "Cost per Unit", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: d.subC }}>Loading inventory...</td></tr>
                ) : paginated.length > 0 ? paginated.map((item, idx) => {
                  const invStatus = item.stock <= 0 ? "Out of Stock" : item.stock <= (item.reorder_point || 10) ? "Low Stock" : "Active"
                  return (
                    <tr key={item.id}
                      style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f8fafc"}`, backgroundColor: isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white"}>
                      <td className="px-4 py-3"><span className="font-medium" style={{ color: d.cellTxt }}>{item.name}</span></td>
                      <td className="px-4 py-3"><span className="capitalize" style={{ color: d.subC }}>{item.category}</span></td>
                      <td className="px-4 py-3"><span style={{ color: d.subC }}>{item.unit_type || "piece"}</span></td>
                      <td className="px-4 py-3">
                        <span className="font-semibold"
                          style={{ color: item.stock <= 0 ? (isDark ? "#f87171" : "#dc2626") : item.stock <= (item.reorder_point || 10) ? (isDark ? "#fbbf24" : "#d97706") : (isDark ? "#4ade80" : "#16a34a") }}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: d.subC }}>₱{item.cost_per_unit || "0.00"}</td>
                      <td className="px-4 py-3"><InvStatusBadge status={invStatus} isDark={isDark} /></td>
                      <td className="px-4 py-3 no-print"><ActionBtns onEdit={() => setShowForm(true)} /></td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: d.subC }}>No inventory items found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            showing={`Showing ${paginated.length} of ${filtered.length} entries`}
            page={pageSafe} totalPages={totalPages} onPageChange={setPage} isDark={isDark}
          />
        </div>

        {/* Print footer */}
        <div className="print-only print-footer">
          <p>Esting's Flower International Inc. — Confidential. For internal use only.</p>
        </div>
      </div>
    </div>
  )
}