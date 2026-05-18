import { useEffect, useMemo, useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, WhiteCard, ActionBtns, EmptyRow, TableWrap, TH, TD } from "./_adminShared"

const PAGE_SIZE = 10

function FInput({ label, value, onChange, placeholder, type = "text", disabled, isDark, inputBg, inputBdr, inputTxt }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#94a3b8" : "#374151" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
        style={{
          borderColor: inputBdr,
          backgroundColor: disabled ? (isDark ? "#162032" : "#f9fafb") : inputBg,
          color: disabled ? (isDark ? "#64748b" : "#9ca3af") : inputTxt,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={e => { if (!disabled) { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` } }}
        onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }}
      />
    </div>
  )
}

function FTextArea({ label, value, onChange, rows = 3, placeholder, isDark, inputBg, inputBdr, inputTxt }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: isDark ? "#94a3b8" : "#374151" }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all resize-none"
        style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
        onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
        onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }}
      />
    </div>
  )
}

function ModalShell({ title, onClose, children, isDark }) {
  const modalBg  = isDark ? "#1a2332" : "white"
  const modalBdr = isDark ? "#2d3748" : "#e8edf2"
  const headerBg = isDark ? "linear-gradient(135deg,#0f172a,#162032)" : "linear-gradient(135deg,#f0fdf4,#fafff8)"
  const headerBdr = isDark ? "#1e293b" : "#f1f5f9"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(3px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        className="rounded-xl w-full overflow-hidden"
        style={{ maxWidth: "760px", maxHeight: "90vh", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: `1px solid ${modalBdr}`, backgroundColor: modalBg }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${headerBdr}`, background: headerBg }}>
          <div>
            <p className="text-base font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>Manage campaign details</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg transition-all"
            style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(90vh - 110px)" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function toDatetimeLocalValue(d) {
  const dt = typeof d === "string" ? new Date(d) : d
  if (!dt || Number.isNaN(dt.getTime())) return ""
  const pad = n => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function AdminCampaignsModal({ mode, campaign, onClose, onSaved, allProducts, isDark }) {
  const inputBg  = isDark ? "#0f172a" : "white"
  const inputBdr = isDark ? "#475569" : "#dde3ec"
  const inputTxt = isDark ? "#f1f5f9" : "#111827"
  const cardBg   = isDark ? "#1a2332" : "white"
  const cardBdr  = isDark ? "#2d3748" : "#e8edf2"

  const [form, setForm] = useState(() => {
    const now = new Date()
    return {
      name: campaign?.name || "",
      campaign_key: campaign?.campaign_key || "",
      start_at: campaign?.start_at ? toDatetimeLocalValue(campaign.start_at) : toDatetimeLocalValue(now),
      end_at: campaign?.end_at ? toDatetimeLocalValue(campaign.end_at) : toDatetimeLocalValue(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
      is_active: campaign?.is_active ?? true,
    }
  })

  const [selectedProductIds, setSelectedProductIds] = useState(
    Array.isArray(campaign?.product_ids) ? campaign.product_ids : campaign?.products?.map(p => p.id) || []
  )
  const [errors, setErrors] = useState({})
  const set = k => v => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = "Campaign name is required"
    if (!form.campaign_key.trim()) errs.campaign_key = "Campaign key is required"
    if (!form.start_at) errs.start_at = "Start date/time is required"
    if (!form.end_at) errs.end_at = "End date/time is required"
    if (form.start_at && form.end_at) {
      const s = new Date(form.start_at), e = new Date(form.end_at)
      if (!isNaN(s) && !isNaN(e) && e < s) errs.end_at = "End must be after start"
    }
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    const payload = {
      name: form.name.trim(),
      campaign_key: form.campaign_key.trim(),
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      is_active: !!form.is_active,
    }
    try {
      if (mode === "create") {
        const created = await api.createCampaign(payload)
        if (selectedProductIds.length) await api.setCampaignProducts(created.id, selectedProductIds)
      } else {
        const updated = await api.updateCampaign(campaign.id, payload)
        if (selectedProductIds.length) await api.setCampaignProducts(updated.id, selectedProductIds)
      }
      onSaved?.()
      onClose?.()
    } catch (e) {
      alert(e.message || "Failed to save campaign")
    }
  }

  const toggleProduct = id => setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <ModalShell title={mode === "create" ? "Add Campaign" : "Edit Campaign"} onClose={onClose} isDark={isDark}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FInput label="Campaign Name" value={form.name} onChange={set("name")} placeholder="e.g. Summer Sale"
          isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
        <FInput label="Campaign Key" value={form.campaign_key} onChange={set("campaign_key")} placeholder="unique_key"
          disabled={mode === "edit"} isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
        <FInput label="Start At" type="datetime-local" value={form.start_at} onChange={set("start_at")}
          isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />
        <FInput label="End At" type="datetime-local" value={form.end_at} onChange={set("end_at")}
          isDark={isDark} inputBg={inputBg} inputBdr={inputBdr} inputTxt={inputTxt} />

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: isDark ? "#cbd5e1" : "#374151" }}>
            <input type="checkbox" checked={!!form.is_active} onChange={e => set("is_active")(e.target.checked)} />
            Active
          </label>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="md:col-span-2">
            <div className="rounded-lg border p-3"
              style={{ borderColor: isDark ? "rgba(239,68,68,0.3)" : "#fecaca", backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "#fef2f2" }}>
              {Object.values(errors).map((msg, idx) => (
                <p key={idx} className="text-xs font-medium" style={{ color: isDark ? "#f87171" : "#dc2626" }}>{msg}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
          Products (assign to campaign)
        </p>
        <div className="border rounded-lg p-3" style={{ borderColor: cardBdr, backgroundColor: isDark ? "#0f172a" : "#fafbfc" }}>
          {allProducts.length === 0 ? (
            <p className="text-sm" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>No products available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allProducts.slice(0, 30).map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                  style={{ color: isDark ? "#cbd5e1" : "#374151" }}>
                  <input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                  <span className="truncate" title={p.name}>{p.name}</span>
                </label>
              ))}
              {allProducts.length > 30 && (
                <p className="text-xs" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
                  Showing first 30 products. Refine later if needed.
                </p>
              )}
            </div>
          )}
        </div>
        <p className="text-xs mt-2" style={{ color: isDark ? "#64748b" : "#9ca3af" }}>
          Selecting products is optional. If none selected, campaign will have no product mapping.
        </p>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button onClick={onClose}
          className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
          style={{ borderColor: isDark ? "#374151" : "#dde3ec", color: isDark ? "#94a3b8" : "#6b7280", backgroundColor: isDark ? "#1a2332" : "white" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? "#2d3f55" : "#f9fafb"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? "#1a2332" : "white"}>
          Cancel
        </button>
        <button onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Save Campaign
        </button>
      </div>
    </ModalShell>
  )
}

export default function AdminCampaigns() {
  const { isDark } = useTheme()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("create")
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [products, setProducts]   = useState([])
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage]           = useState(1)

  const toolbarBg  = isDark ? "#111827" : "#fafbfc"
  const toolbarBdr = isDark ? "#1e293b" : "#f1f5f9"
  const inputBg    = isDark ? "#1e293b" : "white"
  const inputBdr   = isDark ? "#374151" : "#dde3ec"
  const inputTxt   = isDark ? "#e2e8f0" : "#374151"
  const cardBg     = isDark ? "#1a2332" : "white"
  const cardBdr    = isDark ? "#1e293b" : "#e8edf2"
  const subTxt     = isDark ? "#94a3b8" : "#64748b"
  const rowHover   = isDark ? "rgba(74,222,128,0.04)" : "#f8fffe"

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await api.getCampaigns()
      const data = res.data || res
      const list = data?.campaigns ? data.campaigns : data || []
      setCampaigns(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error(e)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await api.getAdminProducts()
      const list = (res.data || res) || []
      setProducts(list.map(p => ({ id: p.id, name: p.name })))
    } catch (e) {
      console.error("Failed to fetch products for campaigns", e)
      setProducts([])
    }
  }

  useEffect(() => { fetchCampaigns(); fetchProducts() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return campaigns.filter(c => {
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.campaign_key?.toLowerCase().includes(q)
      const matchStatus = !statusFilter || (statusFilter === "active" ? c.is_active : !c.is_active)
      return matchSearch && matchStatus
    })
  }, [campaigns, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe   = Math.min(page, totalPages)
  const startIdx   = (pageSafe - 1) * PAGE_SIZE
  const paginated  = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter])

  return (
    <div className="space-y-5">
      {showModal && (
        <AdminCampaignsModal
          mode={modalMode}
          campaign={activeCampaign}
          onClose={() => setShowModal(false)}
          onSaved={() => fetchCampaigns()}
          allProducts={products}
          isDark={isDark}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>Campaigns</h1>
        <button
          onClick={() => { setModalMode("create"); setActiveCampaign(null); setShowModal(true) }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Campaign
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <WhiteCard label="Total Campaigns"   value={campaigns.length}                         accentColor="#3b82f6" />
        <WhiteCard label="Active"            value={campaigns.filter(c => c.is_active).length}  accentColor="#22c55e" />
        <WhiteCard label="Inactive"          value={campaigns.filter(c => !c.is_active).length} accentColor="#ef4444" />
        <WhiteCard label="Assigned products" value="—" subGray />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}>

        {/* Toolbar */}
        <div className="p-4" style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isDark ? "#64748b" : "#9ca3af" }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or campaign key"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)` }}
                onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }}
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none"
                style={{ borderColor: inputBdr, backgroundColor: inputBg, color: inputTxt, minWidth: "160px" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.15)` }}
                onBlur={e => { e.target.style.borderColor = inputBdr; e.target.style.boxShadow = "none" }}>
                <option value="">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: isDark ? "#64748b" : "#9ca3af" }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            <button
              onClick={() => fetchCampaigns()}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
              Refresh
            </button>
          </div>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="w-10 h-10 rounded-full border-2 animate-spin mb-3"
              style={{ borderColor: isDark ? "#334155" : "#dcfce7", borderTopColor: isDark ? "#4ade80" : "#16a34a" }} />
            <p className="text-sm font-medium" style={{ color: subTxt }}>Loading campaigns...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: "740px" }}>
              <thead style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
                <tr>
                  {["Campaign", "Key", "Status", "Start", "End", "Action"].map((h, i) => (
                    <th key={h}
                      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${i === 5 ? "text-right" : "text-left"}`}
                      style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map((c, idx) => (
                  <tr key={c.id}
                    style={{ borderBottom: `1px solid ${toolbarBdr}`, backgroundColor: isDark ? (idx % 2 === 0 ? cardBg : "#111827") : "white" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = rowHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? (idx % 2 === 0 ? cardBg : "#111827") : "white"}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>{c.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm" style={{ color: subTxt }}>{c.campaign_key}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
                        style={c.is_active
                          ? { backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "#dcfce7", color: isDark ? "#4ade80" : "#15803d" }
                          : { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" }}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm" style={{ color: subTxt }}>{new Date(c.start_at).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm" style={{ color: subTxt }}>{new Date(c.end_at).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ActionBtns
                        onEdit={() => { setModalMode("edit"); setActiveCampaign(c); setShowModal(true) }}
                        onView={() => { setModalMode("edit"); setActiveCampaign(c); setShowModal(true) }}
                        onDelete={async () => {
                          if (!window.confirm("Delete this campaign?")) return
                          try { await api.deleteCampaign(c.id); await fetchCampaigns() }
                          catch (e) { alert(e.message || "Failed to delete campaign") }
                        }}
                      />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-14">
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
                          style={{ background: isDark ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}>
                          <svg className="w-5 h-5" style={{ color: isDark ? "#4ade80" : DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: isDark ? "#cbd5e1" : "#6b7280" }}>No campaigns found</p>
                        <p className="text-xs mt-0.5" style={{ color: subTxt }}>Create your first campaign above.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: `1px solid ${toolbarBdr}`, backgroundColor: toolbarBg }}>
          <p className="text-sm" style={{ color: subTxt }}>
            Showing {paginated.length} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
              disabled={pageSafe <= 1}
              style={{
                borderColor: pageSafe <= 1 ? (isDark ? "#2d3748" : "#e5e7eb") : (isDark ? "#374151" : "#dde3ec"),
                color: pageSafe <= 1 ? (isDark ? "#4b5563" : "#d1d5db") : (isDark ? "#94a3b8" : "#374151"),
                backgroundColor: isDark ? "#1e293b" : "white",
                cursor: pageSafe <= 1 ? "not-allowed" : "pointer",
              }}
              onClick={() => setPage(p => Math.max(1, p - 1))}>
              ← Prev
            </button>
            <span className="text-xs font-semibold px-2" style={{ color: subTxt }}>
              Page {pageSafe} / {totalPages}
            </span>
            <button
              className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
              disabled={pageSafe >= totalPages}
              style={{
                borderColor: pageSafe >= totalPages ? (isDark ? "#2d3748" : "#e5e7eb") : (isDark ? "#374151" : "#dde3ec"),
                color: pageSafe >= totalPages ? (isDark ? "#4b5563" : "#d1d5db") : (isDark ? "#94a3b8" : "#374151"),
                backgroundColor: isDark ? "#1e293b" : "white",
                cursor: pageSafe >= totalPages ? "not-allowed" : "pointer",
              }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}