import { useState } from "react"
import { DG, G, GreenCard, WhiteCard, FilterBar, Pagination, TH, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

// ── Reusable form primitives (same style as AdminStaff) ───────────────────────
function FInput({ placeholder, value, onChange, type = "text", hint }) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
      />
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}

function FTextarea({ placeholder, value, onChange, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all resize-none"
      style={{ borderColor: "#dde3ec" }}
      onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
      onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
    />
  )
}

function FSel({ options, value, onChange, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md bg-white cursor-pointer outline-none transition-all"
        style={{ borderColor: "#dde3ec", color: value ? "#0f172a" : "#9ca3af" }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
        onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

function StepCard({ n, title, children }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>{n}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FL({ children }) {
  return <label className="block text-xs font-semibold text-gray-600 mb-1">{children}</label>
}

// ── Add Item Form ─────────────────────────────────────────────────────────────
function AddItemForm({ onBack }) {
  const [f, setF] = useState({
    name: "", sku: "", category: "", unit: "", branch: "",
    stock: "", reorderLevel: "", costPerUnit: "", supplier: "",
    location: "", notes: "", status: ""
  })
  const s = k => v => setF(p => ({ ...p, [k]: v }))

  const CATEGORIES = ["Fresh Flowers", "Dried Flowers", "Artificial Flowers", "Foliage & Greenery", "Vases & Containers", "Ribbons & Wrapping", "Floral Foam & Supplies", "Seasonal & Event"]
  const UNITS = ["piece", "bunch", "stem", "box", "pack", "roll", "sheet", "kg", "g", "L", "mL"]
  const STATUSES = ["Active", "Low Stock", "Out of Stock", "Discontinued"]

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard label="Total Items" value={0} />
        {["Total Inventory Value", "Low Stock Items", "Out of Stock Items"].map(l => (
          <WhiteCard key={l} label={l} value={l.includes("Value") ? "₱0" : 0} />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Add New Item</h2>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600"
          style={{ borderColor: "#dde3ec" }}
        >
          ← Back to table
        </button>
      </div>

      {/* Form grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StepCard n={1} title="Item Information">
          <div><FL>Item Name</FL><FInput placeholder="e.g. Red Roses – Premium" value={f.name} onChange={s("name")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL>SKU / Item ID</FL><FInput placeholder="e.g. FLW-001" value={f.sku} onChange={s("sku")} hint="Unique identifier for this item" /></div>
            <div><FL>Category</FL><FSel options={CATEGORIES} value={f.category} onChange={s("category")} placeholder="Select category" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL>Unit of Measure</FL><FSel options={UNITS} value={f.unit} onChange={s("unit")} placeholder="Select unit" /></div>
            <div><FL>Branch</FL><FSel options={["Manila", "Pampanga"]} value={f.branch} onChange={s("branch")} placeholder="Select branch" /></div>
          </div>
        </StepCard>

        <StepCard n={2} title="Stock Details">
          <div className="grid grid-cols-2 gap-3">
            <div><FL>Current Stock</FL><FInput type="number" placeholder="0" value={f.stock} onChange={s("stock")} /></div>
            <div><FL>Reorder Level</FL><FInput type="number" placeholder="e.g. 10" value={f.reorderLevel} onChange={s("reorderLevel")} hint="Alert threshold" /></div>
          </div>
          <div><FL>Cost per Unit (₱)</FL><FInput type="number" placeholder="0.00" value={f.costPerUnit} onChange={s("costPerUnit")} /></div>
          <div><FL>Status</FL><FSel options={STATUSES} value={f.status} onChange={s("status")} placeholder="Select status" /></div>
        </StepCard>

        <StepCard n={3} title="Supplier & Location">
          <div><FL>Supplier Name</FL><FInput placeholder="e.g. Manila Flower Wholesale" value={f.supplier} onChange={s("supplier")} /></div>
          <div><FL>Storage Location</FL><FInput placeholder="e.g. Shelf A3 – Cold Room" value={f.location} onChange={s("location")} /></div>
        </StepCard>

        <StepCard n={4} title="Notes">
          <div><FL>Additional Notes</FL><FTextarea placeholder="Any special handling, notes, or reminders for this item..." value={f.notes} onChange={s("notes")} /></div>
        </StepCard>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>
    </div>
  )
}

// ── Functional Export Button ──────────────────────────────────────────────────
function ExportInventoryBtn({ data = [] }) {
  const handleExport = () => {
    const headers = ["Item Name", "SKU", "Category", "Unit", "Current Stock", "Cost per Unit (₱)", "Status", "Branch"]
    const rows = data.length
      ? data.map(r => headers.map(h => r[h] ?? "").join(","))
      : [headers.map(() => "—").join(",")]
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
      style={{ borderColor: "#dde3ec" }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export
    </button>
  )
}

// ── Functional Pagination ─────────────────────────────────────────────────────
function InventoryPagination({ total = 0, page = 1, onPage }) {
  const disabled = total === 0
  const btnBase = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const disabledStyle = { borderColor: "#e5e7eb", color: "#d1d5db", cursor: "not-allowed", backgroundColor: "#fafafa" }
  const activeStyle = { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" }

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
      <p className="text-xs text-gray-400">
        {disabled ? "Showing 0 items" : `Showing ${total} item${total !== 1 ? "s" : ""}`}
      </p>
      <div className="flex items-center gap-1">
        {["← Prev", "1", "2", "3", "Next →"].map(lbl => (
          <button
            key={lbl}
            disabled={disabled}
            onClick={() => !disabled && onPage && onPage(lbl)}
            className={btnBase}
            style={disabled ? disabledStyle : activeStyle}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.backgroundColor = "#f0fdf4"; e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G } }}
            onMouseLeave={e => { if (!disabled) { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.borderColor = "#dde3ec"; e.currentTarget.style.color = "#374151" } }}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminInventory() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [branchFilter, setBranchFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  if (showForm) return <AddItemForm onBack={() => setShowForm(false)} />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Inventory</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard
          label="Total Items"
          value={0}
          sub="↑ +0 this week"
          action="Add Item"
          onAction={() => setShowForm(true)}
        />
        <WhiteCard label="Total Inventory Value" value="₱0" sub="↑ +₱0 this week" accentColor="#3b82f6" />
        <WhiteCard label="Low Stock Items" value={0} accentColor="#f59e0b">
          <button className="text-xs font-semibold mt-2 block" style={{ color: "#16a34a" }}>↑ Needs restock</button>
        </WhiteCard>
        <WhiteCard label="Out of Stock Items" value={0} accentColor="#ef4444">
          <button className="text-xs font-semibold mt-2 text-red-500 block">↑ Action needed</button>
        </WhiteCard>
      </div>

      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          {/* Custom filter row with populated dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">Status: All</option>
                <option value="Active">Active</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Discontinued">Discontinued</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Branch */}
            <div className="relative">
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">All Branches</option>
                <option value="Manila">Manila</option>
                <option value="Pampanga">Pampanga</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Date Range */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              >
                <option value="">Date Range: All</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Item ID or name"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}
              />
            </div>

            <ExportInventoryBtn data={[]} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "680px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Item Name</TH>
                <TH>Category</TH>
                <TH>Unit</TH>
                <TH>Current Stock</TH>
                <TH>Cost per Unit</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <EmptyRow cols={7} message="Click '+ Add Item' to add your first inventory item." />
            </tbody>
          </table>
        </div>

        <InventoryPagination total={0} />
      </TableWrap>
    </div>
  )
}
