import { useState, useEffect, useCallback, Fragment } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, ActionBtns } from "./_adminShared"
import estingsWordmark from "../../assets/Estings.svg"

// ── Flower petal loader ──
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

function InvStatusBadge({ status, isDark }) {
  const styles = {
    "Active":       { bg: isDark ? "rgba(74,222,128,0.12)"  : "#f0fdf4", text: isDark ? "#4ade80" : "#16a34a" },
    "Low Stock":    { bg: isDark ? "rgba(251,191,36,0.12)"  : "#fffbeb", text: isDark ? "#fbbf24" : "#d97706" },
    "Out of Stock": { bg: isDark ? "rgba(248,113,113,0.12)" : "#fef2f2", text: isDark ? "#f87171" : "#dc2626" },
  }
  const s = styles[status] || styles["Active"]
  return (
    <span className="inline-block px-2.5 py-1 text-xs uppercase tracking-wider font-bold rounded-md whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {status}
    </span>
  )
}

function FInput({ placeholder, value, onChange, type = "text", isDark, disabled = false }) {
  const bg  = isDark ? "#1e293b" : "white"
  const bdr = isDark ? "#374151" : "#dde3ec"
  const tc  = isDark ? "#e2e8f0" : "#0f172a"
  
  return (
    <input 
      type={type} 
      value={value} 
      disabled={disabled}
      onChange={disabled ? undefined : e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
      style={{ 
        borderColor: bdr, 
        backgroundColor: disabled ? (isDark ? "#0f172a" : "#f9fafb") : bg,
        color: tc,
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.7 : 1
      }}
      onFocus={e => { if(!disabled) { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` } }}
      onBlur={e => { e.target.style.borderColor = bdr; e.target.style.boxShadow = "none" }} 
    />
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

function AddItemForm({ onBack, onSaveSuccess, isDark, initialData }) {
  const isEditing = Boolean(initialData);

  const [f, setF] = useState({ 
    name: initialData?.name || "", 
    sku: initialData?.sku || initialData?.id?.slice(0, 8) || "", 
    category: initialData?.category || "", 
    unit: initialData?.unit_type || "", 
    branch: "", 
    stock: initialData?.stock ?? "0", 
    reorderLevel: initialData?.reorder_point ?? "", 
    costPerUnit: initialData?.cost_per_unit ?? "", 
    status: "" 
  })
  
  const s = k => v => setF(p => ({ ...p, [k]: v }))
  const CATEGORIES = ["Fresh Flowers", "Dried Flowers", "Artificial Flowers", "Foliage & Greenery", "Vases & Containers", "Ribbons & Wrapping", "Floral Foam & Supplies", "Seasonal & Event"]
  const UNITS      = ["piece", "bunch", "stem", "box", "pack", "roll", "sheet", "kg", "g", "L", "mL"]
  const STATUSES   = ["Active", "Low Stock", "Out of Stock", "Discontinued"]

  const handleSave = async () => {
    try {
      const formData = new FormData();
      if (f.name) formData.append("name", f.name);
      if (f.category) formData.append("category", f.category);
      if (f.unit) formData.append("unit_type", f.unit);
      if (f.stock !== "") formData.append("stock", parseInt(f.stock) || 0);
      if (f.reorderLevel !== "") formData.append("reorder_point", parseInt(f.reorderLevel) || 10);
      if (f.costPerUnit !== "") formData.append("cost_per_unit", parseFloat(f.costPerUnit) || 0.00);
      if (!isEditing){
        formData.append("stock", 0)
      }
      
      const statusMap = { "Active": "active", "Low Stock": "active", "Out of Stock": "active", "Discontinued": "inactive" };
      if (f.status) formData.append("status", statusMap[f.status] || "active");

      let updatedItem = null;

      if (isEditing) {
        const res = await api.put(`/products/admin/${initialData.id}`, formData); 
        updatedItem = res.data || res;
      } else {
        formData.append("price", "0.00"); 
        const res = await api.post(`/products/admin`, formData);
        updatedItem = res.data || res;
      }

      if (onSaveSuccess) onSaveSuccess(updatedItem);
    } catch (err) {
      console.error("Failed to save inventory item:", err);
      alert("Failed to save. Check the console for details.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold" style={{ color: isDark ? "#e2e8f0" : "#111827" }}>
          {isEditing ? "Edit Inventory Item" : "Add New Inventory Item"}
        </h2>
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
            <div>
              <FL isDark={isDark}>Current Stock</FL>
              <FInput 
                type="number" 
                placeholder="0" 
                value={f.stock} 
                onChange={() => {}}
                disabled={true}
                isDark={isDark} 
              />
              <p className="text-[10px] mt-1 text-amber-600 italic">
                {isEditing 
                  ? 'To update stock, use the "Invoice" button on the main page.'
                  : 'New items start at 0 stock. Use "Invoice" to log deliveries.'}
              </p>
            </div>
            <div><FL isDark={isDark}>Reorder Level</FL><FInput type="number" placeholder="10" value={f.reorderLevel} onChange={s("reorderLevel")} isDark={isDark} /></div>
          </div>
          <div><FL isDark={isDark}>Cost per Unit (₱)</FL><FInput type="number" placeholder="0.00" value={f.costPerUnit} onChange={s("costPerUnit")} isDark={isDark} /></div>
          <div><FL isDark={isDark}>Status</FL><FSel options={STATUSES} value={f.status} onChange={s("status")} placeholder="Select" isDark={isDark} /></div>
        </StepCard>
      </div>
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          {isEditing ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </div>
  )
}

function DeleteInventoryModal({ item, onClose, onConfirm, isDeleting, isDark }) {
  const overlayBg = "rgba(15,23,42,0.72)";
  const modalBg = isDark ? "#1a2332" : "white";
  const modalBdr = isDark ? "#2d3748" : "#e8edf2";
  const headC = isDark ? "#f1f5f9" : "#111827";
  const subC = isDark ? "#94a3b8" : "#6b7280";
  const cellC = isDark ? "#e2e8f0" : "#1e293b";
  const inputBg = isDark ? "#1e293b" : "white";
  const inputBdr = isDark ? "#374151" : "#dde3ec";
  const hdrBg = isDark ? "#111827" : "#fafbfc";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: overlayBg, backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget && !isDeleting) onClose() }}>
      <div className="rounded-xl w-full overflow-hidden transform transition-all"
        style={{ maxWidth: "400px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: `1px solid ${modalBdr}`, backgroundColor: modalBg }}>
        
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2", color: isDark ? "#ef4444" : "#dc2626" }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold mb-2" style={{ color: headC }}>Delete Item</h3>
          <p className="text-sm mb-6" style={{ color: subC }}>
            Are you sure you want to delete <strong style={{ color: cellC }}>{item.name}</strong>? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isDeleting}
              className="flex-1 py-2.5 text-sm font-semibold border rounded-lg transition-all"
              style={{ borderColor: inputBdr, color: subC, backgroundColor: inputBg }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = hdrBg} 
              onMouseLeave={e => e.currentTarget.style.backgroundColor = inputBg}>
              Cancel
            </button>
            <button onClick={() => onConfirm(item.id)} disabled={isDeleting}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#ef4444", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" }}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReceiveStockModal({ inventory, onClose, onSaved, isDark }) {
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  
  // 🚀 Branch selection state for Invoices
  const [branch, setBranch] = useState("Manila");

  const today = new Date().toISOString().split('T')[0];

  const c = {
    overlay: "rgba(15,23,42,0.72)",
    bg: isDark ? "#1a2332" : "white",
    bdr: isDark ? "#2d3748" : "#e8edf2",
    head: isDark ? "#f1f5f9" : "#111827",
    sub: isDark ? "#94a3b8" : "#6b7280",
    cell: isDark ? "#e2e8f0" : "#1e293b",
    inputBg: isDark ? "#1e293b" : "white",
    inputBdr: isDark ? "#374151" : "#dde3ec",
    inputTxt: isDark ? "#e2e8f0" : "#0f172a",
    rowBg: isDark ? "#111827" : "#fafbfc",
  };

  const selectedIds = Object.keys(lines);
  const matches = !search ? [] : inventory.filter(it =>
    !lines[it.id] && (
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      String(it.id).toLowerCase().includes(search.toLowerCase())
    )
  ).slice(0, 6);

  const addLine = (it) => { 
    setLines(p => ({ ...p, [it.id]: { qty: "", cost: "", date: today } })); 
    setSearch(""); 
  };
  const removeLine = (id) => setLines(p => { const n = { ...p }; delete n[id]; return n });
  const setQty = (id, v) => setLines(p => ({ ...p, [id]: { ...p[id], qty: v } }));
  const setCost = (id, v) => setLines(p => ({ ...p, [id]: { ...p[id], cost: v } }));
  const setDate = (id, v) => setLines(p => ({ ...p, [id]: { ...p[id], date: v } }));

  const itemById = (id) => inventory.find(i => String(i.id) === String(id));
  const validLines = Object.keys(lines).filter(id => parseInt(lines[id].qty) > 0);

  const handleSave = async () => {
    if (validLines.length === 0) return;
    setSaving(true);
    const ok = [], failed = [];
    const updatedItemsForState = []; 

    for (const id of validLines) {
      const item = itemById(id);
      if (!item) { failed.push(id); continue; }

      const received = parseInt(lines[id].qty) || 0;
      const totalCost = parseFloat(lines[id].cost) || 0;
      const newStock = (parseInt(item.stock) || 0) + received;

      try {
        const fd = new FormData();
        fd.append("stock", newStock);
        if (totalCost > 0 && received > 0) {
          fd.append("cost_per_unit", (totalCost / received).toFixed(2));
        }
        await api.put(`/products/admin/${id}`, fd);

        await api.post(`/products/admin/stock-logs`, {
          product_id: id,
          qty_change: received,
          purchasing_price: totalCost,
          date_of_issuance: lines[id].date,
          branch: branch, 
          notes: `Manual Restock - Delivered to ${branch}` 
        });

        ok.push(item.name);
        updatedItemsForState.push({ id, newStock });
      } catch (e) {
        console.error("Restock failed for", id, e);
        failed.push(item.name);
      }
    }
    setSaving(false);
    setResult({ ok, failed });
    
    if (failed.length === 0) onSaved(ok.length, updatedItemsForState);
  };

  const totalUnits = validLines.reduce((s, id) => s + (parseInt(lines[id].qty) || 0), 0)

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 no-print"
      style={{ backgroundColor: c.overlay, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 9999, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}>
      <div className="rounded-xl w-full overflow-hidden flex flex-col relative"
        style={{ maxWidth: "640px", height: "min(88vh, 720px)", maxHeight: "88vh", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: `1px solid ${c.bdr}`, backgroundColor: c.bg }}>

        {saving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ backgroundColor: isDark ? "rgba(10,15,25,0.78)" : "rgba(255,255,255,0.82)", backdropFilter: "blur(2px)", zIndex: 20 }}>
            <span style={{
              width: 40, height: 40, borderRadius: "9999px",
              border: `3px solid ${isDark ? "rgba(74,222,128,0.25)" : "#d1fae5"}`,
              borderTopColor: G, display: "inline-block",
              animation: "invSpin 0.7s linear infinite",
            }} />
            <p className="text-sm font-semibold" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>Updating stock...</p>
            <style>{`@keyframes invSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: `1px solid ${c.bdr}` }}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-bold" style={{ color: c.head }}>Receive Stock</h3>
              <p className="text-xs" style={{ color: c.sub }}>Record a delivery. Quantities are added to current stock.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1.5 rounded-md transition-colors" style={{ color: c.sub }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = c.rowBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto" style={{ flex: 1 }}>
          
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: c.sub }}>
              Fulfillment Branch <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select 
                value={branch} 
                onChange={e => setBranch(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md cursor-pointer outline-none transition-all"
                style={{ borderColor: c.inputBdr, backgroundColor: c.inputBg, color: c.inputTxt }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
                onBlur={e => { e.target.style.borderColor = c.inputBdr; e.target.style.boxShadow = "none" }}
              >
                <option value="Manila">Manila</option>
                <option value="Pampanga">Pampanga</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: c.sub }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>
            <p className="text-[10px] mt-1" style={{ color: c.sub }}>Select which location is receiving this delivery.</p>
          </div>

          <div className="relative mb-4">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a product to add to this delivery"
              className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-md outline-none transition-all"
              style={{ borderColor: c.inputBdr, backgroundColor: c.inputBg, color: c.inputTxt }}
              onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
              onBlur={e => { e.target.style.borderColor = c.inputBdr; e.target.style.boxShadow = "none" }} />
            {matches.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 rounded-md overflow-hidden z-10"
                style={{ backgroundColor: c.bg, border: `1px solid ${c.bdr}`, boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
                {matches.map(it => (
                  <button key={it.id} onClick={() => addLine(it)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{ color: c.cell }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = c.rowBg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <span className="text-sm font-medium truncate">{it.name}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: c.sub }}>In stock: {it.stock ?? 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedIds.length === 0 ? (
            <div className="text-center py-10 rounded-lg" style={{ backgroundColor: c.rowBg, border: `1px dashed ${c.bdr}` }}>
              <p className="text-sm font-medium" style={{ color: c.sub }}>No products added yet.</p>
              <p className="text-xs mt-1" style={{ color: c.sub }}>Search above to add the items that arrived in this delivery.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:flex items-center gap-2 px-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: c.sub }}>
                <span className="flex-1 min-w-0">Product</span>
                <span style={{ width: 96, textAlign: "center", flexShrink: 0 }}>Qty Received</span>
                <span style={{ width: 130, textAlign: "center", flexShrink: 0 }}>Total Paid (₱)</span>
                <span style={{ width: 120, textAlign: "right", flexShrink: 0 }}>New Total</span>
                <span style={{ width: 32, flexShrink: 0 }} />
              </div>
              {selectedIds.map(id => {
                const item = itemById(id)
                if (!item) return null
                const received = parseInt(lines[id].qty) || 0
                const newTotal = (parseInt(item .stock) || 0) + received
                return (
                  <div key={id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 p-3 sm:pb-6 rounded-lg"
                    style={{ backgroundColor: c.rowBg, border: `1px solid ${c.bdr}` }}>
                    <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: c.cell }}>{item.name}</p>
                        <p className="text-xs" style={{ color: c.sub }}>Current: {item.stock ?? 0} {item.unit_type || "piece"}</p>
                      </div>
                      <button onClick={() => removeLine(id)} className="sm:hidden p-1.5 rounded-md flex-shrink-0 transition-colors" style={{ color: c.sub }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.12)" : "#fee2e2"; e.currentTarget.style.color = "#ef4444" }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = c.sub }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>

                    <div className="flex gap-3 sm:contents">
                      <div className="w-24">
                        <label className="sm:hidden text-[10px] font-bold uppercase tracking-wider block mb-1">Qty</label>
                        <input type="number" min="0" value={lines[id].qty} onChange={e => setQty(id, e.target.value)} placeholder="0"
                          className="w-full px-2 py-2 text-sm border rounded-md text-center" 
                          style={{ borderColor: c.inputBdr, backgroundColor: c.inputBg }} />
                      </div>

                      <div className="w-32">
                        <label className="sm:hidden text-[10px] font-bold uppercase tracking-wider block mb-1">Total Paid (₱)</label>
                        <input type="number" min="0" value={lines[id].cost} onChange={e => setCost(id, e.target.value)} placeholder="0.00"
                          className="w-full px-2 py-2 text-sm border rounded-md text-center" 
                          style={{ borderColor: c.inputBdr, backgroundColor: c.inputBg }} />
                      </div>

                      <div className="w-36">
                        <label className="sm:hidden text-[10px] font-bold uppercase tracking-wider block mb-1">Date Issued</label>
                        <input type="date" value={lines[id].date} onChange={e => setDate(id, e.target.value)}
                          className="w-full px-2 py-2 text-sm border rounded-md"
                          style={{ borderColor: c.inputBdr, backgroundColor: c.inputBg, color: c.inputTxt }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:block sm:w-auto" style={{ minWidth: 0 }}>
                      <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider" style={{ color: c.sub }}>New Total</span>
                      <div className="sm:w-[120px]" style={{ textAlign: "right" }}>
                        <span className="text-sm font-bold" style={{ color: received > 0 ? (isDark ? "#4ade80" : "#16a34a") : c.sub }}>
                          {item.stock ?? 0}{received > 0 ? ` → ${newTotal}` : ""}
                        </span>
                      </div>
                    </div>

                    <button onClick={() => removeLine(id)} className="hidden sm:block p-1.5 rounded-md transition-colors" style={{ color: c.sub, flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.12)" : "#fee2e2"; e.currentTarget.style.color = "#ef4444" }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = c.sub }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {result && result.failed.length > 0 && (
            <div className="mt-4 px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2", color: isDark ? "#f87171" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#fecaca"}` }}>
              <p className="font-semibold">Some items didn't save.</p>
              <p className="text-xs mt-1">Updated: {result.ok.length}. Failed: {result.failed.join(", ")}. You can retry. Already-updated items keep their new stock.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${c.bdr}`, backgroundColor: c.rowBg }}>
          <p className="text-sm" style={{ color: c.sub }}>
            {validLines.length > 0
              ? <span><strong style={{ color: c.cell }}>{validLines.length}</strong> item{validLines.length > 1 ? "s" : ""}, <strong style={{ color: c.cell }}>{totalUnits}</strong> units</span>
              : "Add items and enter quantities"}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving}
              className="px-4 py-2.5 text-sm font-semibold border rounded-md transition-all"
              style={{ borderColor: c.inputBdr, color: c.sub, backgroundColor: c.bg }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || validLines.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg,${DG},${G})` }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              {saving ? "Saving..." : `Save${validLines.length > 0 ? ` (${validLines.length})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function InvoiceBtn({ onClick, isDark }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Invoice
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

function PrintBtn({ onClick, isDark }) {
  return (
    <button onClick={onClick}
      className="no-print flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#374151", backgroundColor: isDark ? "#1e293b" : "white" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "white"}>
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

// ── Main Component ──
export default function AdminInventory() {
  const { isDark } = useTheme()
  const PAGE_SIZE = 15
  
  // States
  const [inventory, setInventory] = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  
  // 🚀 These are the core filter states required for the toolbar
  const [search, setSearch]       = useState("")
  const [branchFilter, setBranchFilter] = useState("") 
  const [statusFilter, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [stockSort, setStockSort] = useState("")
  
  const [showForm, setShowForm]   = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    try {
      await api.delete(`/products/admin/${id}`); 
      setInventory(currentInventory => currentInventory.filter(item => item.id !== id));
      setDeletingItem(null);
      setSuccessMsg("Item successfully deleted!");
      
      fetchInventory();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsDeleting(false);
    }
  }

  const dynamicCategories = Array.from(new Set(inventory.map(p => p.category?.toLowerCase()).filter(Boolean))).map(c => c.charAt(0).toUpperCase() + c.slice(1))

  // 🚀 Bulletproof Filtering Logic
  const filtered = inventory.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || String(item.id).includes(search)
    let matchStatus = true
    if (statusFilter === "Active")       matchStatus = item.stock > (item.reorder_point || 10)
    if (statusFilter === "Low Stock")    matchStatus = item.stock > 0 && item.stock <= (item.reorder_point || 10)
    if (statusFilter === "Out of Stock") matchStatus = item.stock <= 0
    const matchCat = !category || item.category?.toLowerCase() === category.toLowerCase()

    let matchBranch = true;
    if (branchFilter && branchFilter !== "All Branches") {
      if (branchFilter === "Unassigned") {
        matchBranch = !item.branches || item.branches.length === 0;
      } else {
        matchBranch = Array.isArray(item.branches) && item.branches.includes(branchFilter);
      }
    }

    return matchSearch && matchStatus && matchCat && matchBranch
  }).sort((a, b) => {
    if (stockSort === "asc") return a.stock - b.stock;
    if (stockSort === "desc") return b.stock - a.stock;
    return 0;
  })
  
  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try { 
      const data = await api.get("/products/admin/all"); 
      const activeItems = (data || []).filter(item => {
        if (item.status === 'inactive') return false;
        
        const cat = (item.category || "").toLowerCase();
        const type = (item.product_type || "").toLowerCase();
        const group = (item.product_group || "").toLowerCase();
        
        if (
          cat.includes("bouquet") || cat.includes("arrangement") ||
          type.includes("bouquet") || type.includes("arrangement") ||
          group.includes("bouquet") || group.includes("arrangement")
        ) {
          return false;
        }
        return true; 
      });
      setInventory(activeItems); 
    }
    catch (err) { console.error("Failed to load inventory:", err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const totalItems = inventory.length
  const totalValue = inventory.reduce((s, i) => {
  const cost = parseFloat(i.cost_per_unit || 0);
  const stock = parseInt(i.stock || 0); return s + (cost * stock); }, 0);
  const lowStockCount = inventory.filter(i => i.stock > 0 && i.stock <= (i.reorder_point || 10)).length
  const outOfStockCount = inventory.filter(i => i.stock <= 0).length

  const totalUnits = inventory.reduce((s, i) => s + (parseInt(i.stock || 0) || 0), 0)
  const reorderNeeded = lowStockCount + outOfStockCount
  const categoryCount = new Set(inventory.map(i => (i.category || "").toLowerCase()).filter(Boolean)).size
  const avgCost = inventory.length
    ? inventory.reduce((s, i) => s + (parseFloat(i.cost_per_unit || 0) || 0), 0) / inventory.length
    : 0
  const activeCount = Math.max(0, totalItems - lowStockCount - outOfStockCount)
  const pct = n => (totalItems ? (n / totalItems) * 100 : 0)

  const statusOf = it => it.stock <= 0 ? "Out of Stock" : it.stock <= (it.reorder_point || 10) ? "Low Stock" : "Active"

  const printGroups = (() => {
    const map = new Map()
    filtered.forEach(item => {
      const key = (item.category || "Uncategorized").toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, items]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        items,
        units: items.reduce((s, i) => s + (parseInt(i.stock || 0) || 0), 0),
        value: items.reduce((s, i) => s + (parseFloat(i.cost_per_unit || 0) || 0) * (parseInt(i.stock || 0) || 0), 0),
      }))
  })()
  const filteredUnits = filtered.reduce((s, i) => s + (parseInt(i.stock || 0) || 0), 0)
  const filteredValue = filtered.reduce((s, i) => s + (parseFloat(i.cost_per_unit || 0) || 0) * (parseInt(i.stock || 0) || 0), 0)

  const printScope = [
    category ? `Category: ${category}` : "All Categories",
    statusFilter ? `Status: ${statusFilter}` : "All Statuses",
    branchFilter ? `Branch: ${branchFilter}` : "All Branches",
    search ? `Search: "${search}"` : null,
    stockSort === "asc" ? "Sorted by Stock (Low to High)" : stockSort === "desc" ? "Sorted by Stock (High to Low)" : null,
    `${filtered.length} of ${totalItems} items`,
  ].filter(Boolean).join("   ·   ")

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paginated = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter, category, stockSort, branchFilter])

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
  const printTime   = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })

  const handleCSV = () => {
    const headers = ["Item Name", "Category", "Unit", "Current Stock", "Reorder Point", "Cost per Unit (₱)", "Status", "Branches"]
    const rows = filtered.map(item => {
      const st = item.stock <= 0 ? "Out of Stock" : item.stock <= (item.reorder_point || 10) ? "Low Stock" : "Active"
      const br = item.branches ? item.branches.join(", ") : "Unassigned"
      return [item.name, item.category || "—", item.unit_type || "piece", item.stock, item.reorder_point || 10, item.cost_per_unit || "0.00", st, br]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `inventory_${new Date().toISOString().slice(0,10)}.csv`
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  if (showForm) return (
    <AddItemForm 
      initialData={editingItem} 
      onBack={() => { setShowForm(false); setEditingItem(null); }} 
      onSaveSuccess={async (savedItem) => {
        setShowForm(false);
        setEditingItem(null);
        setSuccessMsg(editingItem ? "Item successfully updated!" : "New item added to inventory!");

        if (savedItem && savedItem.id) {
          setInventory(prev => {
            const exists = prev.find(p => String(p.id) === String(savedItem.id));
            if (exists) return prev.map(p => String(p.id) === String(savedItem.id) ? savedItem : p);
            return [savedItem, ...prev];
          });
        }
        
        fetchInventory();
        setTimeout(() => setSuccessMsg(""), 3500);
      }}
      isDark={isDark} 
    />
  )

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold" style={{ color: d.headingC }}>Inventory Management</h1>
        <FlowerLoader message="Loading inventory..." isDark={isDark} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <style>{`
        .print-only { display: none; }
        @media print {
          @page { margin: 12mm 10mm; }
          body * { visibility: hidden !important; }
          #inventory-print-area, #inventory-print-area * { visibility: visible !important; }
          #inventory-print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            font-family: "Helvetica Neue", Arial, sans-serif; color: #1f2937;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-letterhead, .print-doc-title, .print-summary, .print-health { break-inside: avoid; page-break-inside: avoid; }

          .print-letterhead {
            display: flex !important; align-items: center; justify-content: space-between; gap: 16px;
            padding: 13px 18px; border-radius: 12px;
            background: linear-gradient(135deg,#0C573E 0%,#15724B 55%,#2E8B34 100%) !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .print-logo-word { height: 34px; width: auto; max-width: 240px; display: block; object-fit: contain; filter: brightness(0) invert(1); }
          .print-tagline { margin: 5px 0 0; font-size: 8px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.82) !important; }
          .print-meta { text-align: right; flex-shrink: 0; }
          .print-meta .ref { display: inline-block; margin: 0; padding: 3px 10px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.12) !important; color: #ffffff !important; font-size: 8.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-meta .gen { margin: 6px 0 0; font-size: 9px; color: rgba(255,255,255,0.85) !important; }
          .print-meta .gen strong { color: #ffffff !important; font-weight: 700; }

          .print-doc-title { display: flex !important; flex-direction: column; align-items: center; margin: 16px 0 2px; }
          .print-doc-title .t { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #0C573E !important; }
          .print-doc-title .rule { width: 54px; height: 3px; border-radius: 9999px; margin: 7px 0 6px; background: linear-gradient(90deg,#0C573E,#2E8B34) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-doc-title .scope { margin: 0; font-size: 9px; color: #6b7280 !important; letter-spacing: 0.02em; text-align: center; }

          .print-summary { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0 0; }
          .print-summary-card { border: 1px solid #e5e7eb; border-top-width: 3px; border-radius: 9px; padding: 9px 12px 10px; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

          .print-health { margin: 10px 0 0; border: 1px solid #e5e7eb; border-radius: 9px; padding: 10px 12px 11px; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; }
          .print-health .hk { margin: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af !important; }
          .print-health .hv { margin: 0; font-size: 8.5px; color: #6b7280 !important; }
          .print-health .bar { display: flex; height: 10px; border-radius: 9999px; overflow: hidden; background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .seg { display: block; height: 100%; }
          .print-health .s-active { background: #2E8B34 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .s-low    { background: #f59e0b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .s-out    { background: #ef4444 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-health .legend { display: flex; flex-wrap: wrap; gap: 16px; margin: 7px 0 0; }
          .print-health .li { display: flex; align-items: center; gap: 5px; font-size: 8.5px; color: #374151 !important; }
          .print-health .dot { width: 7px; height: 7px; border-radius: 9999px; flex-shrink: 0; }

          .print-detail { display: block !important; margin-top: 14px; }
          .print-section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 7px; padding: 0 2px; }
          .print-section-title { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #0C573E !important; }
          .print-section-sub { margin: 0; font-size: 8.5px; color: #9ca3af !important; }
          .print-detail .twrap { border: 1px solid #dbe3df; border-radius: 10px; overflow: hidden; }
          .print-detail table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; }
          .print-detail thead { display: table-header-group; }
          .print-detail tr { page-break-inside: avoid; }
          .print-detail th { background: #0C573E !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border: none; padding: 7px; text-align: left; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.25; }
          .print-detail th.col-idx    { width: 4.5%; }
          .print-detail th.col-name   { width: 30%; }
          .print-detail th.col-unit   { width: 8.5%; }
          .print-detail th.col-stock  { width: 9%; }
          .print-detail th.col-reo    { width: 9.5%; }
          .print-detail th.col-cost   { width: 12.5%; }
          .print-detail th.col-val    { width: 13.5%; }
          .print-detail th.col-status { width: 12.5%; }
          .print-detail td { border-bottom: 1px solid #eef1f4; padding: 6.5px 7px; font-size: 9.5px; color: #1f2937 !important; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; }
          .print-detail .num { text-align: right; }
          .print-detail .center { text-align: center; }
          .print-detail .nowrap { white-space: nowrap !important; }
          .print-detail .muted { color: #6b7280 !important; }
          .print-detail .item-name { font-weight: 600; color: #0f172a !important; line-height: 1.3; }
          .print-detail tr.alt td { background: #f7faf8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-detail tbody tr:last-child td { border-bottom: none; }

          .print-detail .stk { font-weight: 700; }
          .print-detail .stk.active { color: #15803d !important; }
          .print-detail .stk.low    { color: #b45309 !important; }
          .print-detail .stk.out    { color: #b91c1c !important; }

          .print-detail tr.cat-row { page-break-after: avoid; break-after: avoid; }
          .print-detail tr.cat-row td { background: #eaf5ee !important; color: #0C573E !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border-top: 1px solid #d8ebdd; border-bottom: 1px solid #d8ebdd; padding: 6px 8px; font-size: 8.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
          .print-detail tr.cat-row .cat-meta { float: right; font-weight: 600; letter-spacing: 0; text-transform: none; color: #15724B !important; }
          .print-detail tr.grand td { background: #0C573E !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border: none; padding: 8px 7px; font-size: 9.5px; font-weight: 800; }
          .print-pill { display: inline-block !important; padding: 2px 8px; border-radius: 9999px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-pill.active { background: #dcfce7 !important; color: #15803d !important; }
          .print-pill.low    { background: #fef3c7 !important; color: #b45309 !important; }
          .print-pill.out    { background: #fee2e2 !important; color: #b91c1c !important; }

          .print-footer { display: flex !important; align-items: flex-end; justify-content: space-between; gap: 24px; margin-top: 20px; padding-top: 11px; border-top: 2px solid #e5e7eb; }
          .print-footer .note { margin: 0; font-size: 8.5px; color: #9ca3af !important; max-width: 46%; line-height: 1.55; }
          .print-footer .note strong { color: #6b7280 !important; }
          .print-signs { display: flex; gap: 34px; }
          .print-sign { text-align: center; }
          .print-sign .line { width: 170px; border-top: 1px solid #6b7280; margin: 20px 0 5px; }
          .print-sign .cap { margin: 0; font-size: 8.5px; color: #6b7280 !important; text-transform: uppercase; letter-spacing: 0.1em; }
        }
      `}</style>

      {successMsg && (
        <div className="no-print px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-all"
          style={{ 
            backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", 
            color: isDark ? "#4ade80" : "#16a34a", 
            border: `1px solid ${isDark ? "rgba(74,222,128,0.2)" : "#bbf7d0"}` 
          }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {deletingItem && (
        <DeleteInventoryModal 
          item={deletingItem} 
          onClose={() => setDeletingItem(null)} 
          onConfirm={handleConfirmDelete} 
          isDeleting={isDeleting}
          isDark={isDark} 
        />
      )}

      {showInvoice && (
        <ReceiveStockModal
          inventory={inventory}
          isDark={isDark}
          onClose={() => setShowInvoice(false)}
          onSaved={async (count, updatedItems) => {
            setShowInvoice(false)
            setSuccessMsg(`Stock received: ${count} item${count > 1 ? "s" : ""} updated.`)
            
            if (updatedItems && updatedItems.length > 0) {
              setInventory(prev => prev.map(p => {
                const match = updatedItems.find(u => String(u.id) === String(p.id));
                return match ? { ...p, stock: match.newStock } : p;
              }));
            }
            
            fetchInventory();
            setTimeout(() => setSuccessMsg(""), 3500)
          }}
        />
      )}

      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: d.headingC }}>Inventory Management</h1>
        <div className="flex items-center gap-2">
          <InvoiceBtn onClick={() => setShowInvoice(true)} isDark={isDark} />
          <ExportCSVBtn onClick={handleCSV} isDark={isDark} />
          <PrintBtn onClick={handlePrint} isDark={isDark} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div className="rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)", boxShadow: "0 4px 16px rgba(12,87,62,0.25)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.65)" }}>Total Items</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-2 leading-tight break-words">{totalItems}</p>
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
          <div key={label} className="rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden"
            style={{ backgroundColor: d.cardBg, border: `1px solid ${d.cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: accent, opacity: 0.7 }} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: d.subC }}>{label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2 leading-tight break-words" style={{ color: red ? (isDark ? "#f87171" : "#ef4444") : (isDark ? "#4ade80" : d.headingC) }}>{val}</p>
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

      <div id="inventory-print-area">
        <div className="print-only print-letterhead">
          <div>
            <img className="print-logo-word" src={estingsWordmark} alt="Esting's Flower International Inc." />
            <p className="print-tagline">Flower International Inc.</p>
          </div>
          <div className="print-meta">
            <p className="ref">Ref: INV-{new Date().toISOString().slice(0,10).replace(/-/g,"")}</p>
            <p className="gen">Generated <strong>{printDate}</strong> at <strong>{printTime}</strong></p>
          </div>
        </div>

        <div className="print-only print-doc-title">
          <p className="t">Inventory Report</p>
          <span className="rule" />
          <p className="scope">{printScope}</p>
        </div>

        <div className="print-only print-summary">
          <div className="print-summary-card c-total">
            <p className="label">Total Items</p>
            <p className="value">{totalItems}</p>
            <p className="cap">{categoryCount} categor{categoryCount === 1 ? "y" : "ies"} · {totalUnits.toLocaleString()} units</p>
          </div>
          <div className="print-summary-card c-value">
            <p className="label">Est. Inventory Value</p>
            <p className="value green">₱{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="cap">Avg ₱{avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit</p>
          </div>
          <div className="print-summary-card c-low">
            <p className="label">Low Stock</p>
            <p className="value amber">{lowStockCount}</p>
            <p className="cap">At or below reorder point</p>
          </div>
          <div className="print-summary-card c-out">
            <p className="label">Out of Stock</p>
            <p className="value red">{outOfStockCount}</p>
            <p className="cap">Zero units remaining</p>
          </div>
        </div>

        {totalItems > 0 && (
          <div className="print-only print-health">
            <div className="head">
              <p className="hk">Stock Health</p>
              <p className="hv">{reorderNeeded} of {totalItems} item{totalItems === 1 ? "" : "s"} need attention</p>
            </div>
            <div className="bar">
              {activeCount > 0 && <span className="seg s-active" style={{ width: `${pct(activeCount)}%` }} />}
              {lowStockCount > 0 && <span className="seg s-low" style={{ width: `${pct(lowStockCount)}%` }} />}
              {outOfStockCount > 0 && <span className="seg s-out" style={{ width: `${pct(outOfStockCount)}%` }} />}
            </div>
            <div className="legend">
              <span className="li"><span className="dot s-active" />Active · {activeCount} ({pct(activeCount).toFixed(0)}%)</span>
              <span className="li"><span className="dot s-low" />Low Stock · {lowStockCount} ({pct(lowStockCount).toFixed(0)}%)</span>
              <span className="li"><span className="dot s-out" />Out of Stock · {outOfStockCount} ({pct(outOfStockCount).toFixed(0)}%)</span>
            </div>
          </div>
        )}

        <div className="no-print rounded-xl overflow-hidden"
          style={{ border: `1px solid ${d.cardBdr}`, backgroundColor: d.cardBg, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

          <div className="p-3 sm:p-4" style={{ borderBottom: `1px solid ${d.toolbarBdr}`, backgroundColor: d.toolbarBg }}>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { val: category,     set: setCategory,   opts: ["All Categories", ...dynamicCategories], min: "150px" },
                { val: statusFilter, set: setStatus,     opts: ["Status: All", "Active", "Low Stock", "Out of Stock"], min: "140px",
                  map: { "Status: All": "", "Active": "Active", "Low Stock": "Low Stock", "Out of Stock": "Out of Stock" },
                  unmap: { "": "Status: All", "Active": "Active", "Low Stock": "Low Stock", "Out of Stock": "Out of Stock" } },
                { val: stockSort,    set: setStockSort,  opts: ["Sort: Default", "Stock: Low to High", "Stock: High to Low"], min: "170px",
                  map: { "Sort: Default": "", "Stock: Low to High": "asc", "Stock: High to Low": "desc" },
                  unmap: { "": "Sort: Default", "asc": "Stock: Low to High", "desc": "Stock: High to Low" } },
              ].map((f, i) => (
                <div key={i} className="relative">
                  <select value={f.unmap ? f.unmap[f.val] || f.opts[0] : f.val}
                    onChange={e => f.set(f.map ? f.map[e.target.value] || "" : e.target.value === "All Categories" ? "" : e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
                    style={{ borderColor: d.inputBdr, minWidth: f.min, backgroundColor: d.inputBg, color: d.inputTxt }}
                    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(74,222,128,0.18)` }}
                    onBlur={e => { e.target.style.borderColor = d.inputBdr; e.target.style.boxShadow = "none" }}>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              ))}

              <div className="flex-1 flex items-stretch rounded-md overflow-hidden transition-all" 
                   style={{ minWidth: "280px", border: `1px solid ${d.inputBdr}`, backgroundColor: d.inputBg }}
                   onFocusCapture={e => { e.currentTarget.style.borderColor="#4ade80"; e.currentTarget.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)" }}
                   onBlurCapture={e => { e.currentTarget.style.borderColor=d.inputBdr; e.currentTarget.style.boxShadow="none" }}>
                
                <div className="relative flex-shrink-0" style={{ borderRight: `1px solid ${d.inputBdr}` }}>
                  <select 
                    value={branchFilter || "All Branches"} 
                    onChange={(e) => setBranchFilter(e.target.value === "All Branches" ? "" : e.target.value)}
                    className="h-full appearance-none pl-3 pr-8 py-2 text-sm cursor-pointer outline-none bg-transparent"
                    style={{ color: d.inputTxt }}
                  >
                    <option value="All Branches">All Branches</option>
                    <option value="Manila">Manila</option>
                    <option value="Pampanga">Pampanga</option>
                    <option value="Unassigned">Unassigned</option>
                  </select>
                  <svg className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>

                <div className="relative flex-1 flex items-center">
                   <svg className="w-4 h-4 absolute left-3 pointer-events-none" style={{ color: isDark ? "#64748b" : "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
                  </svg>
                  <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="Search item name or ID..."
                    className="w-full pl-9 pr-3 py-2 text-sm outline-none bg-transparent"
                    style={{ color: d.inputTxt }}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "760px" }}>
              <thead style={{ borderBottom: `1px solid ${d.toolbarBdr}`, backgroundColor: d.toolbarBg }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8", width: "34%" }}>Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Cost per Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: d.subC }}>Loading inventory...</td></tr>
                ) : paginated.length > 0 ? paginated.map((item, idx) => {
                  const invStatus = statusOf(item)
                  return (
                    <tr key={item.id}
                      style={{ borderBottom: `1px solid ${isDark ? "#1e293b" : "#f8fafc"}`, backgroundColor: isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? (idx % 2 === 0 ? "#1a2332" : "#111827") : "white"}>
                      <td className="px-4 py-3 align-top">
                        <span className="font-medium block leading-snug break-words" style={{ color: d.cellTxt }}>{item.name}</span>
                      </td>
                      <td className="px-4 py-3 align-top"><span className="capitalize break-words" style={{ color: d.subC }}>{item.category || "—"}</span></td>
                      <td className="px-4 py-3 align-top"><span style={{ color: d.subC }}>{item.unit_type || "piece"}</span></td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className="font-semibold"
                          style={{ color: item.stock <= 0 ? (isDark ? "#f87171" : "#dc2626") : item.stock <= (item.reorder_point || 10) ? (isDark ? "#fbbf24" : "#d97706") : (isDark ? "#4ade80" : "#16a34a") }}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap" style={{ color: d.subC }}>₱{item.cost_per_unit || "0.00"}</td>
                      <td className="px-4 py-3 align-top">
                        <InvStatusBadge status={invStatus} isDark={isDark} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        {Array.isArray(item.branches) && item.branches.length > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" 
                            style={{ 
                              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6", 
                              color: d.subC, border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`
                            }}>
                            {item.branches.join(", ")}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ActionBtns 
                          onDelete={() => setDeletingItem(item)} 
                          onEdit={() => { setEditingItem(item); setShowForm(true); }} 
                        />
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: d.subC }}>No inventory items found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            showing={`Showing ${paginated.length} of ${filtered.length} entries`}
            page={pageSafe} totalPages={totalPages} onPageChange={setPage} isDark={isDark}
          />
        </div>

        <div className="print-only print-detail">
          <div className="print-section-head">
            <p className="print-section-title">Inventory Detail</p>
            <p className="print-section-sub">Grouped by category · row order follows the on-screen sort</p>
          </div>
          <div className="twrap">
            <table>
              <thead>
                <tr>
                  <th className="col-idx num">#</th>
                  <th className="col-name">Item Name</th>
                  <th className="col-unit">Unit</th>
                  <th className="col-stock num">Stock</th>
                  <th className="col-reo num">Reorder Pt</th>
                  <th className="col-cost num">Cost / Unit</th>
                  <th className="col-val num">Stock Value</th>
                  <th className="col-status center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "18px 8px" }}>No items match the current filters.</td></tr>
                ) : (() => {
                  let n = 0
                  return printGroups.map(g => (
                    <Fragment key={g.label}>
                      <tr className="cat-row">
                        <td colSpan={8}>
                          <span>{g.label} ({g.items.length})</span>
                          <span className="cat-meta">{g.units.toLocaleString()} units · ₱{g.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </td>
                      </tr>
                      {g.items.map((item, i) => {
                        n += 1
                        const st = statusOf(item)
                        const pillCls = st === "Out of Stock" ? "out" : st === "Low Stock" ? "low" : "active"
                        const stockValue = (parseFloat(item.cost_per_unit || 0) || 0) * (parseInt(item.stock || 0) || 0)
                        return (
                          <tr key={item.id} className={i % 2 === 1 ? "alt" : ""}>
                            <td className="num nowrap muted">{n}</td>
                            <td><span className="item-name">{item.name}</span></td>
                            <td className="muted">{item.unit_type || "piece"}</td>
                            <td className="num nowrap"><span className={`stk ${pillCls}`}>{item.stock}</span></td>
                            <td className="num nowrap muted">{item.reorder_point || 10}</td>
                            <td className="num nowrap muted">₱{(parseFloat(item.cost_per_unit || 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="num nowrap">₱{stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="center"><span className={`print-pill ${pillCls}`}>{st}</span></td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))
                })()}
                {filtered.length > 0 && (
                  <tr className="grand">
                    <td colSpan={3}>Report Total · {filtered.length} item{filtered.length === 1 ? "" : "s"}</td>
                    <td className="num nowrap">{filteredUnits.toLocaleString()}</td>
                    <td />
                    <td />
                    <td className="num nowrap">₱{filteredValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="print-only print-footer">
          <p className="note">
            <strong>Esting's Flower International Inc.</strong> Confidential. This report is generated for internal use only and reflects recorded stock levels as of the date and time indicated above. Figures are based on the filters applied at the time of printing.
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
  )
}