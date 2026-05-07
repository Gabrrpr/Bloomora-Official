import { useState, useEffect, useCallback } from "react"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge, TH, TD, ActionBtns, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"

// ── Products export (CSV report) ─────────────────────────────────────────────
function ExportProductsBtn({ data = [] }) {
  const handleExport = () => {
    const headers = [
      "id",
      "name",
      "category",
      "status",
      "availability",
      "price",
      "original_price",
      "stock",
      "reorder_point",
    ]

    const rows = data.length
      ? data.map(p => {
          const availability = !p.is_available
            ? "Out of stock"
            : (p.stock ?? 0) <= (p.reorder_point ?? 10)
              ? "Low stock"
              : "In stock"

          return [
            p.id ?? "",
            p.name ?? "",
            p.category ?? "",
            p.status ?? "",
            availability,
            p.price ?? 0,
            p.original_price ?? "",
            p.stock ?? 0,
            p.reorder_point ?? 10,
          ].map(v => {
            const s = String(v ?? "")
            // CSV escaping
            if (s.includes(",") || s.includes("\n") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`
            return s
          }).join(",")
        })
      : [headers.map(() => "—").join(",")]

    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `products_report_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600 active:scale-95"
      style={{ borderColor: "#dde3ec" }}
      title="Export filtered products as CSV report"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export Report
    </button>
  )
}


// ── Product images (same as Shop.jsx) ───────────────────────────────────────
import SpringFlowers_PurpleWrapper from "../../assets/products/SpringFlowers_PurpleWrapper.png"
import SpringFlowers_PinkWrapper   from "../../assets/products/SpringFlowers_PinkWrapper.png"
import SpringFlowers_GreenWrapper  from "../../assets/products/SpringFlowers_GreenWrapper.png"
import RainbowEquadorRoses         from "../../assets/products/RainbowEquadorRoses.png"
import MixTulips                   from "../../assets/products/MixTulips.png"
import Dozen_YellowChinaRoses      from "../../assets/products/Dozen_YellowChinaRoses.png"
import Dozen_RedEquadorRoses       from "../../assets/products/Dozen_RedEquadorRoses.png"
import Dozen_RedChinaRoses         from "../../assets/products/Dozen_RedChinaRoses.png"
import Dozen_PinkChinaRoses        from "../../assets/products/Dozen_PinkChinaRoses.png"
import Dozen_OrangeChinaRoses      from "../../assets/products/Dozen_OrangeChinaRoses.png"
import Roses_24pcs_Red             from "../../assets/products/24pcs_RedEquadorRoses.png"
import Roses_10pcs_Blue            from "../../assets/products/10pcs_BlueChinaRoses.png"
import Roses_6pcs_White            from "../../assets/products/6pcs_WhiteEquadorRoses.png"
import Roses_6pcs_Purple           from "../../assets/products/6pcs_PurpleChinaRoses.png"
import Sunflower_3pcs              from "../../assets/products/3pcs_Sunflower.png"
import Tulips_3pc_Pink             from "../../assets/products/3pc_PinkTulips.png"

const PRODUCT_IMAGE_MAP = {
  "Spring Flowers Purple Wrapper": SpringFlowers_PurpleWrapper,
  "Spring Flowers Pink Wrapper":   SpringFlowers_PinkWrapper,
  "Spring Flowers Green Wrapper":  SpringFlowers_GreenWrapper,
  "Rainbow Ecuador Roses":         RainbowEquadorRoses,
  "Mix Tulips":                    MixTulips,
  "Dozen Yellow China Roses":      Dozen_YellowChinaRoses,
  "Dozen Red Ecuador Roses":       Dozen_RedEquadorRoses,
  "Dozen Red China Roses":         Dozen_RedChinaRoses,
  "Dozen Pink China Roses":        Dozen_PinkChinaRoses,
  "Dozen Orange China Roses":      Dozen_OrangeChinaRoses,
  "24pcs Red Ecuador Roses":       Roses_24pcs_Red,
  "10pcs Blue China Roses":        Roses_10pcs_Blue,
  "6pcs White Ecuador Roses":      Roses_6pcs_White,
  "6pcs Purple China Roses":       Roses_6pcs_Purple,
  "3pcs Sunflower":                Sunflower_3pcs,
  "3pcs Pink Tulips":              Tulips_3pc_Pink,
}

const vaseImg = (filename) =>
  new URL(`../../assets/products/vases/${filename}`, import.meta.url).href

const VASE_IMAGE_MAP = {
  "Black Gold Large Vase":    vaseImg("BlackGoldLargeVase580.webp"),
  "Black Gold Regular Vase":  vaseImg("BlackGoldRegularVase280.webp"),
  "Green Fountain Vase":      vaseImg("GreenFountainVase.webp"),
  "Green Grainy Curvy Vase":  vaseImg("GreenGrainyCurvyVase.webp"),
  "Green Grainy Line Vase":   vaseImg("GreenGrainyLineVase.webp"),
  "Green Grainy Vase":        vaseImg("GreenGrainyVase.webp"),
  "Green Leaf Vase":          vaseImg("GreenLeafVase.webp"),
  "Green Rectangle Vase":     vaseImg("GreenRectangleVase.webp"),
  "Green Tulip Vase":         vaseImg("GreenTulipVase480.webp"),
  "Marble Hexagon Vase":      vaseImg("MarbleHexagonVase380.webp"),
  "Marble Line Vase":         vaseImg("MarbleLineVase.webp"),
  "Mint Green Simple Vase":   vaseImg("MintGreenSimpleVase.webp"),
  "Pink Abstract Vase":       vaseImg("PinkAbstractVase380.webp"),
  "White Abstract Vase":      vaseImg("WhiteAbstractVase300.webp"),
  "White Circular Vase S":    vaseImg("WhiteCircularVase80.webp"),
  "White Circular Vase L":    vaseImg("WhiteCircularVase1000.webp"),
  "White Circular Vase XL":   vaseImg("WhiteCircularVase1350.webp"),
  "White Hexagon Vase":       vaseImg("WhiteHexagonVase80.webp"),
  "White Tulip Vase":         vaseImg("WhiteTulipVase480.webp"),
}

function getProductImage(product) {
  if (product.image_url) return product.image_url
  return PRODUCT_IMAGE_MAP[product.name] || null
}

// ── Add Product Modal ─────────────────────────────────────────────────────────
const CATEGORIES = ["Flower", "Vase", "Wrapping", "Accessory", "Arrangement"]
const AVAILABILITIES = ["Available", "Limited", "Out of Stock"]
const STATUSES = ["Active", "Inactive"]

// ── Product Pagination (matches Staff/Customers design) ───────────────────────
function ProductPagination({
  showing = "0 entries",
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
}) {
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
          className={btnBase}
          style={canPrev ? activeStyle : disabledStyle}
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          onMouseEnter={e => {
            if (!canPrev) return
            e.currentTarget.style.backgroundColor = "#f0fdf4"
            e.currentTarget.style.borderColor = G
            e.currentTarget.style.color = G
          }}
          onMouseLeave={e => {
            if (!canPrev) return
            e.currentTarget.style.backgroundColor = ""
            e.currentTarget.style.borderColor = "#dde3ec"
            e.currentTarget.style.color = "#374151"
          }}
        >
          ← Prev
        </button>

        {/* Simple windowed page numbers: current +/- 1 */}
        {([page - 1, page, page + 1])
          .filter(p => p >= 1 && p <= totalPages)
          .map(p => (
            <button
              key={p}
              className={btnBase}
              style={p === page ? { ...activeStyle, borderColor: G, color: G } : activeStyle}
              onClick={() => onPageChange(p)}
              onMouseEnter={e => {
                if (p === page) return
                e.currentTarget.style.backgroundColor = "#f0fdf4"
                e.currentTarget.style.borderColor = G
                e.currentTarget.style.color = G
              }}
              onMouseLeave={e => {
                if (p === page) return
                e.currentTarget.style.backgroundColor = ""
                e.currentTarget.style.borderColor = "#dde3ec"
                e.currentTarget.style.color = "#374151"
              }}
            >
              {p}
            </button>
          ))}

        <button
          className={btnBase}
          style={canNext ? activeStyle : disabledStyle}
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          onMouseEnter={e => {
            if (!canNext) return
            e.currentTarget.style.backgroundColor = "#f0fdf4"
            e.currentTarget.style.borderColor = G
            e.currentTarget.style.color = G
          }}
          onMouseLeave={e => {
            if (!canNext) return
            e.currentTarget.style.backgroundColor = ""
            e.currentTarget.style.borderColor = "#dde3ec"
            e.currentTarget.style.color = "#374151"
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

function AddProductModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", category: "", price: "", originalPrice: "",
    availability: "Available", status: "Active", description: "", image_url: "",
  })
  const [errors, setErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)

  // image preview (lightbox)
  const [showImageLightbox, setShowImageLightbox] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  // image removal
  const [removeImage, setRemoveImage] = useState(false)


  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const err = {}
    if (!form.name.trim())          err.name = "Product name is required"
    if (!form.category)             err.category = "Category is required"
    if (!form.price || isNaN(form.price) || +form.price <= 0) err.price = "Enter a valid price"
    if (form.originalPrice && (+form.originalPrice < +form.price)) err.originalPrice = "Original price must be ≥ selling price"
    return err
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const fd = new FormData()
    fd.append("file", file)

    try {
      // ✅ Correct
      const res = await api.post("/products/admin/upload-image", fd);
      // Support nested axios response or custom fetch wrapper
      const url = res.data?.url || res.url
      if (url) {
        set("image_url")(url)
      } else {
        throw new Error("No URL returned from server")
      }
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message || "Unknown error"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    try {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("category", form.category.toLowerCase())
      fd.append("price", form.price)
      fd.append("status", form.status.toLowerCase())
      fd.append("is_available", form.availability !== "Out of Stock")
      if (form.description) fd.append("description", form.description)
      if (form.image_url) fd.append("image_url", form.image_url)
      const stock = form.availability === "Out of Stock" ? 0 : form.availability === "Limited" ? 5 : 50
      fd.append("stock", String(stock))
      const res = await api.createProduct(fd)
      onSave(res.product)
      onClose()
    } catch (e) {
      alert(e.message || "Failed to create product")
    }
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

          {/* Product Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Image <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all cursor-pointer disabled:opacity-50"
              />
              {isUploading && <span className="text-xs text-green-600 font-medium whitespace-nowrap animate-pulse">Uploading to Supabase...</span>}
            </div>
            {form.image_url && (
              <div className="mt-3 relative inline-block">
                <button
                  type="button"
                  aria-label="Enlarge product image"
                  onClick={() => {
                    setLightboxSrc(form.image_url)
                    setShowImageLightbox(true)
                  }}
                  className="block"
                >
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setRemoveImage(true)
                    set("image_url")("")
                  }}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {showImageLightbox && lightboxSrc && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center px-4"
                style={{ backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(3px)" }}
                onClick={() => setShowImageLightbox(false)}
              >
                <div className="relative rounded-xl overflow-hidden" style={{ maxWidth: "860px", width: "100%" }}>
                  <button
                    type="button"
                    onClick={() => setShowImageLightbox(false)}
                    className="absolute -top-3 -right-3 z-10 bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50"
                    aria-label="Close image preview"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img
                    src={lightboxSrc}
                    alt="Enlarged preview"
                    className="w-full max-h-[78vh] object-contain bg-white"
                  />
                </div>
              </div>
            )}

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
            disabled={isUploading}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

// ── Edit Product Modal ────────────────────────────────────────────────────────
function EditProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product.name || "",
    category: product.category || "",
    price: product.price ? String(product.price) : "",
    originalPrice: product.original_price ? String(product.original_price) : "",
    availability: !product.is_available ? "Out of Stock" : product.stock <= (product.reorder_point || 10) ? "Limited" : "Available",
    status: product.status === "active" || product.status === "Active" ? "Active" : "Inactive",
    description: product.description || "",
    image_url: getProductImage(product) || "",
  })
  const [errors, setErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)
  const [removeImage, setRemoveImage] = useState(false)
  const [showImageLightbox, setShowImageLightbox] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)


  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const err = {}
    if (!form.name.trim())          err.name = "Product name is required"
    if (!form.category)             err.category = "Category is required"
    if (!form.price || isNaN(form.price) || +form.price <= 0) err.price = "Enter a valid price"
    if (form.originalPrice && (+form.originalPrice < +form.price)) err.originalPrice = "Original price must be ≥ selling price"
    return err
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const fd = new FormData()
    fd.append("file", file)

    try {
      const res = await api.post("/products/admin/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      const url = res.data?.url || res.url
      if (url) {
        set("image_url")(url)
      } else {
        throw new Error("No URL returned from server")
      }
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message || "Unknown error"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    try {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("category", form.category.toLowerCase())
      fd.append("price", form.price)
      fd.append("status", form.status.toLowerCase())
      fd.append("is_available", form.availability !== "Out of Stock")
      if (form.description) fd.append("description", form.description)

      // Ensure image removal persists
      if (removeImage) {
        fd.append("image_url", "")
      } else if (form.image_url) {
        fd.append("image_url", form.image_url)
      }

      const stock = form.availability === "Out of Stock" ? 0 : form.availability === "Limited" ? 5 : 50
      fd.append("stock", String(stock))
      const res = await api.updateProduct(product.id, fd)
      onSave(res.product)
      onClose()
    } catch (e) {
      alert(e.message || "Failed to update product")
    }
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
            <p className="text-base font-bold text-gray-900">Edit Product</p>
            <p className="text-xs text-gray-400 mt-0.5">Update the product details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(90vh - 130px)" }}>
          
          {/* Product Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Image <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all cursor-pointer disabled:opacity-50"
              />
              {isUploading && <span className="text-xs text-green-600 font-medium whitespace-nowrap animate-pulse">Uploading to Supabase...</span>}
            </div>
            {form.image_url && (
              <div className="mt-3 relative inline-block">
                <button
                  type="button"
                  aria-label="Enlarge product image"
                  onClick={() => {
                    setLightboxSrc(form.image_url)
                    setShowImageLightbox(true)
                  }}
                  className="block"
                >
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRemoveImage(true)
                    set("image_url")("")
                  }}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {showImageLightbox && lightboxSrc && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center px-4"
                style={{ backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(3px)" }}
                onClick={() => setShowImageLightbox(false)}
              >
                <div className="relative rounded-xl overflow-hidden" style={{ maxWidth: "860px", width: "100%" }}>
                  <button
                    type="button"
                    onClick={() => setShowImageLightbox(false)}
                    className="absolute -top-3 -right-3 z-10 bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50"
                    aria-label="Close image preview"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img
                    src={lightboxSrc}
                    alt="Enlarged preview"
                    className="w-full max-h-[78vh] object-contain bg-white"
                  />
                </div>
              </div>
            )}

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
            disabled={isUploading}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${DG}, ${G})`, boxShadow: "0 2px 8px rgba(12,87,62,0.25)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── View Product Modal ────────────────────────────────────────────────────────
function ViewProductModal({ product, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl w-full overflow-hidden"
        style={{ maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", border: "1px solid #e8edf2" }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0fdf4, #fafff8)" }}>
          <p className="text-base font-bold text-gray-900">Product Details</p>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {getProductImage(product) ? (
            <img src={getProductImage(product)} alt={product.name} className="w-full h-48 object-cover rounded-lg" style={{ border: "1px solid #e8edf2" }} />
          ) : (
            <div className="w-full h-48 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <svg className="w-12 h-12" style={{ color: DG }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Product Name</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{product.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Category</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{product.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Status</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{product.status}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Price</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">₱{(+product.price).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Stock</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{product.stock}</p>
            </div>
          </div>
          {product.description && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Description</p>
              <p className="text-sm text-gray-700 mt-0.5">{product.description}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600"
            style={{ borderColor: "#dde3ec" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const PAGE_SIZE = 35

  const [search, setSearch]         = useState("")
  const [category, setCategory]     = useState("")
  const [status, setStatus]         = useState("")
  const [priceSort, setPriceSort]   = useState("")
  const [page, setPage]             = useState(1)

  const [showModal, setShowModal]   = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [products, setProducts]     = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [lowCount, setLowCount]     = useState(0)
  const [loading, setLoading]       = useState(true)


const fetchProducts = useCallback(async () => {
  setLoading(true)
  try {
    const [productsRes, vasesRes] = await Promise.all([
      api.getAdminProducts(),
      api.get("/vases/admin/all"),  // fetch vases separately
    ])

    const products = productsRes.data || productsRes
    const vases = (vasesRes.data || vasesRes).map(v => ({
      ...v,
      category: "vase",           // normalize category
      status: v.is_available ? "active" : "inactive",
      stock: v.quantity || 0,
      reorder_point: 10,
    }))

    const combined = [...products, ...vases]
    setProducts(combined)
    setTotalCount(combined.length)
    setLowCount(combined.filter(p => p.stock <= (p.reorder_point || 10)).length)
  } catch (e) {
    console.error("Failed to fetch products", e)
  } finally {
    setLoading(false)
  }
}, [])

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSave = (newProduct) => {
    setProducts(prev => [newProduct, ...prev])
    setTotalCount(c => c + 1)
  }

  const handleEditSave = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
    setEditingProduct(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return
    try {
      await api.deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setTotalCount(c => Math.max(0, c - 1))
    } catch (e) {
      alert(e.message || "Failed to delete product")
    }
  }

  // Filtered products
  const filtered = products.filter(p => {
    const matchSearch   = !search   || p.name?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !category || p.category?.toLowerCase() === category.toLowerCase()
    const matchStatus   = !status   || p.status === status
    return matchSearch && matchCategory && matchStatus
  }).sort((a, b) => {
    if (priceSort === "asc")  return +a.price - +b.price
    if (priceSort === "desc") return +b.price - +a.price
    return 0
  })

  // Pagination (client-side, 35 per page)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const startIdx = (pageSafe - 1) * PAGE_SIZE
  const endIdx = startIdx + PAGE_SIZE
  const paginated = filtered.slice(startIdx, endIdx)

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1)
  }, [search, category, status, priceSort])



  return (
    <div className="space-y-5">
      {showModal && <AddProductModal onClose={() => setShowModal(false)} onSave={handleSave} />}
      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onSave={handleEditSave} />}
      {viewingProduct && <ViewProductModal product={viewingProduct} onClose={() => setViewingProduct(null)} />}

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
      <TableWrap loading={loading}>
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
            <ExportProductsBtn data={filtered} />
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
              {filtered.length > 0 ? paginated.map(p => {
                const availability = !p.is_available ? "Out of stock" : p.stock <= (p.reorder_point || 10) ? "Low stock" : "In stock"
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <TD>
                      {getProductImage(p) ? (
                        <img src={getProductImage(p)} alt={p.name} className="w-10 h-10 rounded-lg object-cover" style={{ border: "1px solid #e8edf2" }} />
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
                        {p.original_price && <span className="block text-xs text-gray-400 line-through">₱{(+p.original_price).toLocaleString()}</span>}
                      </div>
                    </TD>
                    <TD><StatusBadge status={p.status} /></TD>
                    <TD><StatusBadge status={availability} /></TD>
                    <TD><ActionBtns onEdit={() => setEditingProduct(p)} onView={() => setViewingProduct(p)} onDelete={() => handleDelete(p.id)} /></TD>
                  </tr>
                )
              }) : (
                <EmptyRow cols={7} message="No products yet — click '+ Add Product' to add your first product." />
              )}
            </tbody>
          </table>
        </div>
        <ProductPagination
          showing={`Showing ${paginated.length} of ${filtered.length} entries`}
          page={pageSafe}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />

      </TableWrap>
    </div>
  )
}