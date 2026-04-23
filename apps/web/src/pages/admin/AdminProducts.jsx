import { useState } from "react"
import { DG, G, StatusBadge, FilterBar, Pagination, TH, TD, ActionBtns, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

// ── Add Product Modal ─────────────────────────────────────────────────────────
const CATEGORIES = ["Roses", "Bouquets", "Tulips", "Sunflowers", "Arrangements", "Mixed Flowers", "Orchids", "Lilies", "Carnations", "Botanicals & Gifts"]
const AVAILABILITIES = ["Available", "Limited", "Out of Stock"]
const STATUSES = ["Active", "Inactive"]

function AddProductModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", category: "", price: "", originalPrice: "",
    availability: "Available", status: "Active", description: "", image: null,
  })
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState(null)

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm(f => ({ ...f, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const err = {}
    if (!form.name.trim())          err.name = "Product name is required"
    if (!form.category)             err.category = "Category is required"
    if (!form.price || isNaN(form.price) || +form.price <= 0) err.price = "Enter a valid price"
    if (form.originalPrice && (+form.originalPrice < +form.price)) err.originalPrice = "Original price must be ≥ selling price"
    return err
  }

  const handleSave = () => {
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl w-full overflow-hidden"
        style={{ maxWidth: "640px", maxHeight: "90vh", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", border: "1px solid #e8edf2" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0fdf4, #fafff8)" }}>
          <div>
            <p className="text-base font-bold text-gray-900">Add New Product</p>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details to add a new product to your catalog</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(90vh - 130px)" }}>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Product Image</label>
            <label className="flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 border-dashed transition-all hover:border-green-400"
              style={{ borderColor: preview ? G : "#dde3ec", backgroundColor: preview ? "#f0fdf4" : "#fafbfc", height: "120px" }}>
              {preview ? (
                <img src={preview} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
              ) : (
                <div className="text-center">
                  <svg className="w-7 h-7 mx-auto mb-1.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs font-medium text-gray-500">Click to upload image</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e => set("name")(e.target.value)}
              placeholder="e.g. Dozen Red Ecuador Roses"
              className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
              style={{ borderColor: errors.name ? "#ef4444" : "#dde3ec" }}
              onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
              onBlur={e => { e.target.style.borderColor = errors.name ? "#ef4444" : "#dde3ec"; e.target.style.boxShadow = "none" }} />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Category + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category <span className="text-red-400">*</span></label>
              <div className="relative">
                <select value={form.category} onChange={e => set("category")(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md bg-white cursor-pointer outline-none transition-all"
                  style={{ borderColor: errors.category ? "#ef4444" : "#dde3ec", color: form.category ? "#0f172a" : "#9ca3af" }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
                  onBlur={e => { e.target.style.borderColor = errors.category ? "#ef4444" : "#dde3ec"; e.target.style.boxShadow = "none" }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {errors.category && <p className="text-[11px] text-red-500 mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <div className="relative">
                <select value={form.status} onChange={e => set("status")(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md bg-white cursor-pointer outline-none transition-all"
                  style={{ borderColor: "#dde3ec" }}
                  onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
                  onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Price + Original Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Selling Price (₱) <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={form.price} onChange={e => set("price")(e.target.value)}
                placeholder="e.g. 999"
                className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: errors.price ? "#ef4444" : "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
                onBlur={e => { e.target.style.borderColor = errors.price ? "#ef4444" : "#dde3ec"; e.target.style.boxShadow = "none" }} />
              {errors.price && <p className="text-[11px] text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Original Price (₱)</label>
              <input type="number" min="0" value={form.originalPrice} onChange={e => set("originalPrice")(e.target.value)}
                placeholder="e.g. 1299 (before discount)"
                className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: errors.originalPrice ? "#ef4444" : "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
                onBlur={e => { e.target.style.borderColor = errors.originalPrice ? "#ef4444" : "#dde3ec"; e.target.style.boxShadow = "none" }} />
              {errors.originalPrice && <p className="text-[11px] text-red-500 mt-1">{errors.originalPrice}</p>}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Availability</label>
            <div className="flex gap-2">
              {AVAILABILITIES.map(a => (
                <button key={a} onClick={() => set("availability")(a)}
                  className="flex-1 py-2 text-xs font-semibold rounded-md border transition-all"
                  style={{
                    backgroundColor: form.availability === a ? DG : "white",
                    color:           form.availability === a ? "white" : "#6b7280",
                    borderColor:     form.availability === a ? DG : "#dde3ec",
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={form.description} onChange={e => set("description")(e.target.value)}
              placeholder="Brief description of the product..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all resize-none"
              style={{ borderColor: "#dde3ec" }}
              onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)` }}
              onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600"
            style={{ borderColor: "#dde3ec" }}>
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${DG}, ${G})`, boxShadow: "0 2px 8px rgba(12,87,62,0.25)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [search, setSearch]         = useState("")
  const [category, setCategory]     = useState("")
  const [status, setStatus]         = useState("")
  const [priceSort, setPriceSort]   = useState("")
  const [showModal, setShowModal]   = useState(false)
  const [products, setProducts]     = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [lowCount, setLowCount]     = useState(0)

  const handleSave = (newProduct) => {
    setProducts(prev => [{ ...newProduct, id: Date.now() }, ...prev])
    setTotalCount(c => c + 1)
  }

  const handleDelete = (id) => {
    if (window.confirm("Delete this product?")) {
      setProducts(prev => prev.filter(p => p.id !== id))
      setTotalCount(c => Math.max(0, c - 1))
    }
  }

  // Filtered products
  const filtered = products.filter(p => {
    const matchSearch   = !search   || p.name?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !category || p.category === category
    const matchStatus   = !status   || p.status === status
    return matchSearch && matchCategory && matchStatus
  }).sort((a, b) => {
    if (priceSort === "asc")  return +a.price - +b.price
    if (priceSort === "desc") return +b.price - +a.price
    return 0
  })

  return (
    <div className="space-y-5">
      {showModal && <AddProductModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      <h1 className="text-xl font-bold text-gray-900">Products</h1>

      {/* Stat cards — equal height using flex + align-stretch */}
      <div className="flex flex-wrap gap-3 items-stretch">

        {/* Total Products — green */}
        <div className="rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200"
          style={{
            flex: "1 0 200px", maxWidth: "300px",
            background: "linear-gradient(135deg, #0a4a34 0%, #1a7040 60%, #2E8B34 100%)",
            boxShadow: "0 4px 16px rgba(12,87,62,0.28)",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(12,87,62,0.36)" }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(12,87,62,0.28)" }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.65)" }}>Total Products</p>
            <p className="text-3xl font-bold text-white mt-2">{totalCount}</p>
            <p className="text-xs mt-1.5 font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>↑ +0 this week</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:scale-105 active:scale-95 mt-3 self-start"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Low stock — white, same height */}
        <div className="bg-white rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200"
          style={{
            flex: "1 0 180px", maxWidth: "260px",
            border: "1px solid #e8edf2", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#d1dce8" }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e8edf2" }}>
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: "#ef4444", opacity: 0.6 }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Low stock products</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{lowCount}</p>
            <p className="text-xs mt-1.5 font-medium text-red-500">↑ +0 this week</p>
          </div>
          <button className="text-xs font-semibold hover:underline mt-3 self-start transition-colors" style={{ color: DG }}>
            Review Inventory
          </button>
        </div>
      </div>

      {/* Table */}
      <TableWrap>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category */}
            <div className="relative">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec", minWidth: "130px" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Status */}
            <div className="relative">
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec", minWidth: "120px" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Price sort */}
            <div className="relative">
              <select value={priceSort} onChange={e => setPriceSort(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec", minWidth: "160px" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }}>
                <option value="">Price: Default</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Product ID or name"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
                onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.12)` }}
                onBlur={e => { e.target.style.borderColor = "#dde3ec"; e.target.style.boxShadow = "none" }} />
            </div>

            <button className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>Filter</button>
            <ExportBtn />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "700px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Image</TH>
                <TH>Product Name</TH>
                <TH>Category</TH>
                <TH>Price</TH>
                <TH>Status</TH>
                <TH>Availability</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length > 0 ? filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <TD>
                    {p.image ? (
                      <img src={URL.createObjectURL(p.image)} alt={p.name} className="w-10 h-10 rounded-lg object-cover" style={{ border: "1px solid #e8edf2" }} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                        <svg className="w-5 h-5" style={{ color: DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                        </svg>
                      </div>
                    )}
                  </TD>
                  <TD><span className="font-medium text-gray-800">{p.name}</span></TD>
                  <TD><span className="text-gray-600">{p.category}</span></TD>
                  <TD>
                    <div>
                      <span className="font-semibold text-gray-800">₱{(+p.price).toLocaleString()}</span>
                      {p.originalPrice && <span className="block text-xs text-gray-400 line-through">₱{(+p.originalPrice).toLocaleString()}</span>}
                    </div>
                  </TD>
                  <TD><StatusBadge status={p.status} /></TD>
                  <TD><StatusBadge status={p.availability} /></TD>
                  <TD><ActionBtns onEdit={() => {}} onView={() => {}} onDelete={() => handleDelete(p.id)} /></TD>
                </tr>
              )) : (
                <EmptyRow cols={7} message="No products yet — click '+ Add Product' to add your first product." />
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-400">Showing {filtered.length} of {products.length} entries</span>
          <div className="flex items-center gap-1">
            {["Previous","1","2","3",">","Next →"].map(p => (
              <button key={p} className="px-2.5 py-1.5 rounded-md text-xs transition-all"
                style={{ background: p === "1" ? `linear-gradient(135deg, ${DG}, ${G})` : "white", color: p === "1" ? "white" : "#6b7280", border: p === "1" ? "none" : "1px solid #e2e8f0", fontWeight: p === "1" ? 600 : 400 }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </TableWrap>
    </div>
  )
}
