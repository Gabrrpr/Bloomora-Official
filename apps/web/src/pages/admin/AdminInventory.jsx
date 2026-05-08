import { useState, useEffect, useCallback } from "react"
import { api } from "../../services/api.js"
import { DG, G, GreenCard, WhiteCard, FilterBar, Pagination, TH, TD, EmptyRow, TableWrap, ExportBtn, ActionBtns } from "./_adminShared"

// ── Custom Inventory Status Badge ─────────────────────────────────────────────
function InvStatusBadge({ status }) {
  let bg = "bg-green-100";
  let text = "text-green-700";
  
  if (status === "Low Stock") {
    bg = "bg-orange-100";
    text = "text-orange-700";
  } else if (status === "Out of Stock") {
    bg = "bg-red-100";
    text = "text-red-700";
  }

  return (
    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${bg} ${text}`}>
      {status}
    </span>
  )
}

// ── Reusable form primitives ──────────────────────────────────────────────────
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Add New Inventory Item</h2>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600" style={{ borderColor: "#dde3ec" }}>
          ← Back to table
        </button>
      </div>

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
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95" style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Item
        </button>
      </div>
    </div>
  )
}

// ── Functional Export Button ──────────────────────────────────────────────────
function ExportInventoryBtn({ data = [] }) {
  const handleExport = () => {
    const headers = ["Item Name", "Category", "Unit Type", "Current Stock", "Cost per Unit", "Status"]
    const rows = data.length
      ? data.map(r => {
          const status = r.stock <= 0 ? "Out of Stock" : r.stock <= (r.reorder_point || 10) ? "Low Stock" : "Active";
          return `"${r.name}","${r.category}","${r.unit_type || 'piece'}","${r.stock}","${r.cost_per_unit || '0.00'}","${status}"`
        })
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
    <button onClick={handleExport} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95" style={{ borderColor: "#dde3ec" }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      Export
    </button>
  )
}

// ── Functional Pagination ─────────────────────────────────────────────────────
function InventoryPagination({ showing = "0 entries", page = 1, totalPages = 1, onPageChange }) {
  const btnBase = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const activeStyle = { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" }
  const disabledStyle = { borderColor: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed", backgroundColor: "#f9fafb" }

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
      <p className="text-xs text-gray-400">{showing}</p>
      <div className="flex items-center gap-1">
        <button
          className={btnBase} style={canPrev ? activeStyle : disabledStyle} disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >← Prev</button>
        
        {([page - 1, page, page + 1]).filter(p => p >= 1 && p <= totalPages).map(p => (
          <button
            key={p} className={btnBase}
            style={p === page ? { ...activeStyle, borderColor: G, color: G } : activeStyle}
            onClick={() => onPageChange(p)}
          >{p}</button>
        ))}

        <button
          className={btnBase} style={canNext ? activeStyle : disabledStyle} disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >Next →</button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminInventory() {
  const PAGE_SIZE = 15;

  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      // Reusing products endpoint since it joins inventory data (stock & reorder_point)
      const { data } = await api.get("/products/admin/all")
      setInventory(data || [])
    } catch (err) {
      console.error("Failed to load inventory:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Calculated Stats
  const totalItems = inventory.length;
  // Fallback to a placeholder percentage if cost_per_unit is null/empty for demo purposes
  const totalValue = inventory.reduce((sum, item) => sum + ((item.cost_per_unit || (item.price * 0.4)) * item.stock), 0);
  const lowStockCount = inventory.filter(item => item.stock > 0 && item.stock <= (item.reorder_point || 10)).length;
  const outOfStockCount = inventory.filter(item => item.stock <= 0).length;

  // Filtering
  const filtered = inventory.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.id.includes(search)
    let matchStatus = true;
    if (statusFilter === "Active") matchStatus = item.stock > (item.reorder_point || 10);
    if (statusFilter === "Low Stock") matchStatus = item.stock > 0 && item.stock <= (item.reorder_point || 10);
    if (statusFilter === "Out of Stock") matchStatus = item.stock <= 0;
    
    return matchSearch && matchStatus;
  })

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const startIdx = (pageSafe - 1) * PAGE_SIZE
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter])

  if (showForm) return <AddItemForm onBack={() => setShowForm(false)} />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Inventory Management</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GreenCard
          label="Total Items"
          value={totalItems}
          action="Add Item"
          onAction={() => setShowForm(true)}
        />
        <WhiteCard label="Est. Inventory Value" value={`₱${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`} accentColor="#3b82f6" />
        <WhiteCard label="Low Stock Items" value={lowStockCount} accentColor="#f59e0b">
          <button className="text-xs font-semibold mt-2 block" style={{ color: "#16a34a" }} onClick={() => setStatusFilter("Low Stock")}>
            Review Needs
          </button>
        </WhiteCard>
        <WhiteCard label="Out of Stock Items" value={outOfStockCount} accentColor="#ef4444">
          <button className="text-xs font-semibold mt-2 text-red-500 block" onClick={() => setStatusFilter("Out of Stock")}>
            Action Required
          </button>
        </WhiteCard>
      </div>

      <TableWrap loading={loading}>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
                <option value="">Status: All</option>
                <option value="Active">Active</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Item ID or name"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
            </div>

            <ExportInventoryBtn data={filtered} />
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
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                 <EmptyRow cols={7} message="Loading inventory data..." />
              ) : paginated.length > 0 ? paginated.map(item => {
                
                // Logic for Inventory Status
                const invStatus = item.stock <= 0 ? "Out of Stock" : item.stock <= (item.reorder_point || 10) ? "Low Stock" : "Active";
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <TD><span className="font-medium text-gray-800">{item.name}</span></TD>
                    <TD><span className="text-gray-600 capitalize">{item.category}</span></TD>
                    <TD><span className="text-gray-500">{item.unit_type || "piece"}</span></TD>
                    <TD>
                      <span className={`font-semibold ${item.stock <= 0 ? 'text-red-600' : item.stock <= (item.reorder_point || 10) ? 'text-orange-500' : 'text-gray-800'}`}>
                        {item.stock}
                      </span>
                    </TD>
                    <TD>₱{item.cost_per_unit || "0.00"}</TD>
                    
                    {/* 👇 The custom InvStatusBadge is safely injected here */}
                    <TD><InvStatusBadge status={invStatus} /></TD>
                    
                    <TD><ActionBtns onEdit={() => setShowForm(true)} /></TD>
                  </tr>
                )
              }) : (
                <EmptyRow cols={7} message="No inventory items found matching your criteria." />
              )}
            </tbody>
          </table>
        </div>

        <InventoryPagination 
          showing={`Showing ${paginated.length} of ${filtered.length} entries`}
          page={pageSafe}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </TableWrap>
    </div>
  )
}