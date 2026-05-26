import { useState, useEffect, useCallback } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge, TH, TD, ActionBtns, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"
import FallbackImage from "../../components/FallbackImage.jsx"

const PLACEHOLDER_IMAGE = new URL("../../assets/default-img/ImageNotFound.webp", import.meta.url).href
const AVAILABILITIES = ["Available", "Limited", "Out of Stock"]
const STATUSES       = ["Active", "Inactive"]

// ── Dark token helper ─────────────────────────────────────────────────────────
function useAdminTokens() {
  const { isDark } = useTheme()
  return {
    isDark,
    pageBg:    isDark ? "#0f172a"  : "transparent",
    cardBg:    isDark ? "#1a2332"  : "white",
    cardBdr:   isDark ? "#2d3748"  : "#e8edf2",
    cardShdw:  isDark ? "none"     : "0 1px 3px rgba(0,0,0,0.04)",
    hdrBg:     isDark ? "#111827"  : "#fafbfc",
    hdrBdr:    isDark ? "#1e293b"  : "#f1f5f9",
    inputBg:   isDark ? "#1e293b"  : "white",
    inputBdr:  isDark ? "#374151"  : "#dde3ec",
    inputTxt:  isDark ? "#f1f5f9"  : "#111827",
    phC:       isDark ? "#475569"  : "#9ca3af",
    labelC:    isDark ? "#94a3b8"  : "#4b5563",
    headC:     isDark ? "#f1f5f9"  : "#111827",
    cellC:     isDark ? "#e2e8f0"  : "#1e293b",
    subC:      isDark ? "#94a3b8"  : "#6b7280",
    priceG:    isDark ? "#4ade80"  : DG,
    accentG:   isDark ? "#4ade80"  : G,
    rowEven:   isDark ? "#1a2332"  : "white",
    rowOdd:    isDark ? "#111827"  : "white",
    rowHov:    isDark ? "rgba(74,222,128,0.04)" : "#f8fffe",
    divider:   isDark ? "#1e293b"  : "#f1f5f9",
    overlayBg: "rgba(15,23,42,0.72)",
    modalBg:   isDark ? "#1a2332"  : "white",
    modalBdr:  isDark ? "#2d3748"  : "#e8edf2",
    modalHdr:  isDark ? "#111827"  : "linear-gradient(135deg,#f0fdf4,#fafff8)",
    modalHdrBdr: isDark ? "#1e293b" : "#f1f5f9",
    modalFtr:  isDark ? "#0f172a"  : "#fafbfc",
    modalFtrBdr: isDark ? "#1e293b" : "#f1f5f9",
  }
}

// ── Image maps ────────────────────────────────────────────────────────────────
import SpringFlowers_PurpleWrapper from "../../assets/products/bouquets/SpringFlowers_PurpleWrapper.png"
import SpringFlowers_PinkWrapper   from "../../assets/products/bouquets/SpringFlowers_PinkWrapper.png"
import SpringFlowers_GreenWrapper  from "../../assets/products/bouquets/SpringFlowers_GreenWrapper.png"
import RainbowEquadorRoses         from "../../assets/products/bouquets/RainbowEquadorRoses.png"
import MixTulips                   from "../../assets/products/bouquets/MixTulips.png"
import Dozen_YellowChinaRoses      from "../../assets/products/bouquets/Dozen_YellowChinaRoses.png"
import Dozen_RedEquadorRoses       from "../../assets/products/bouquets/Dozen_RedEquadorRoses.png"
import Dozen_RedChinaRoses         from "../../assets/products/bouquets/Dozen_RedChinaRoses.png"
import Dozen_PinkChinaRoses        from "../../assets/products/bouquets/Dozen_PinkChinaRoses.png"
import Dozen_OrangeChinaRoses      from "../../assets/products/bouquets/Dozen_OrangeChinaRoses.png"
import Roses_24pcs_Red             from "../../assets/products/bouquets/24pcs_RedEquadorRoses.png"
import Roses_10pcs_Blue            from "../../assets/products/bouquets/10pcs_BlueChinaRoses.png"
import Roses_6pcs_White            from "../../assets/products/bouquets/6pcs_WhiteEquadorRoses.png"
import Roses_6pcs_Purple           from "../../assets/products/bouquets/6pcs_PurpleChinaRoses.png"
import Sunflower_3pcs              from "../../assets/products/bouquets/3pcs_Sunflower.png"
import Tulips_3pc_Pink             from "../../assets/products/bouquets/3pc_PinkTulips.png"

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

const vaseImg = f => new URL(`../../assets/products/vases/${f}`, import.meta.url).href
const VASE_IMAGE_MAP = {
  "Black Gold Large Vase":   vaseImg("BlackGoldLargeVase580.webp"),
  "Black Gold Regular Vase": vaseImg("BlackGoldRegularVase280.webp"),
  "Green Fountain Vase":     vaseImg("GreenFountainVase.webp"),
  "Green Grainy Curvy Vase": vaseImg("GreenGrainyCurvyVase.webp"),
  "Green Grainy Line Vase":  vaseImg("GreenGrainyLineVase.webp"),
  "Green Grainy Vase":       vaseImg("GreenGrainyVase.webp"),
  "Green Leaf Vase":         vaseImg("GreenLeafVase.webp"),
  "Green Rectangle Vase":    vaseImg("GreenRectangleVase.webp"),
  "Green Tulip Vase":        vaseImg("GreenTulipVase480.webp"),
  "Marble Hexagon Vase":     vaseImg("MarbleHexagonVase380.webp"),
  "Marble Line Vase":        vaseImg("MarbleLineVase.webp"),
  "Mint Green Simple Vase":  vaseImg("MintGreenSimpleVase.webp"),
  "Pink Abstract Vase":      vaseImg("PinkAbstractVase380.webp"),
  "White Abstract Vase":     vaseImg("WhiteAbstractVase300.webp"),
  "White Circular Vase S":   vaseImg("WhiteCircularVase80.webp"),
  "White Circular Vase L":   vaseImg("WhiteCircularVase1000.webp"),
  "White Circular Vase XL":  vaseImg("WhiteCircularVase1350.webp"),
  "White Hexagon Vase":      vaseImg("WhiteHexagonVase80.webp"),
  "White Tulip Vase":        vaseImg("WhiteTulipVase480.webp"),
}

function getProductImage(product) {
  if (product.image_url === "none" || product.image_url === "") return PLACEHOLDER_IMAGE
  if (product.image_url) return product.image_url
  return PRODUCT_IMAGE_MAP[product.name] || VASE_IMAGE_MAP[product.name] || PLACEHOLDER_IMAGE
}

// ── Shared modal input components ─────────────────────────────────────────────
function MInput({ value, onChange, placeholder, type="text", error, d }) {
  return (
    <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all"
      style={{ borderColor:error?"#ef4444":d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }}
      onFocus={e => { e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)" }}
      onBlur={e => { e.target.style.borderColor=error?"#ef4444":d.inputBdr; e.target.style.boxShadow="none" }}/>
  )
}

function MSel({ value, onChange, options, d }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2.5 text-sm border rounded-md cursor-pointer outline-none transition-all"
        style={{ borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }}
        onFocus={e => { e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)" }}
        onBlur={e => { e.target.style.borderColor=d.inputBdr; e.target.style.boxShadow="none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:d.labelC }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
      </svg>
    </div>
  )
}

function MLabel({ children, d }) {
  return <label className="block text-xs font-bold mb-1.5" style={{ color:d.labelC }}>{children}</label>
}

function MTextarea({ value, onChange, placeholder, rows=3, d }) {
  return (
    <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all resize-none"
      style={{ borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }}
      onFocus={e => { e.target.style.borderColor="#4ade80"; e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)" }}
      onBlur={e => { e.target.style.borderColor=d.inputBdr; e.target.style.boxShadow="none" }}/>
  )
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function ExportProductsBtn({ data=[], d }) {
  const handleExport = () => {
    const headers = ["id","name","category","status","availability","price","original_price","stock","reorder_point"]
    const rows = data.length ? data.map(p => {
      const avail = !p.is_available?"Out of stock":(p.stock??0)<=(p.reorder_point??10)?"Low stock":"In stock"
      return [p.id??"",p.name??"",p.category??"",p.status??"",avail,p.price??0,p.original_price??"",p.stock??0,p.reorder_point??10]
        .map(v => { const s=String(v??""); return (s.includes(",")||s.includes("\n")||s.includes('"'))?`"${s.replace(/"/g,'""')}"`:s }).join(",")
    }) : [headers.map(()=>"—").join(",")]
    const csv=[headers.join(","),...rows].join("\n")
    const blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a")
    a.href=url; a.download=`products_report_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <button onClick={handleExport}
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border rounded-md transition-all active:scale-95"
      style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
      Export Report
    </button>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function ProductPagination({ showing, page, totalPages, onPageChange, d }) {
  const canPrev=page>1, canNext=page<totalPages
  const base = "px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
  const act  = { borderColor:d.inputBdr, color:d.cellC, cursor:"pointer", backgroundColor:d.inputBg }
  const dis  = { borderColor:d.divider,  color:d.subC,  cursor:"not-allowed", backgroundColor:d.hdrBg }
  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop:`1px solid ${d.divider}` }}>
      <p className="text-xs" style={{ color:d.subC }}>{showing}</p>
      <div className="flex items-center gap-1">
        <button className={base} style={canPrev?act:dis} disabled={!canPrev} onClick={()=>onPageChange(page-1)}>← Prev</button>
        {([page-1,page,page+1]).filter(p=>p>=1&&p<=totalPages).map(p=>(
          <button key={p} className={base} onClick={()=>onPageChange(p)}
            style={p===page?{...act,borderColor:"#4ade80",color:"#4ade80"}:act}>{p}</button>
        ))}
        <button className={base} style={canNext?act:dis} disabled={!canNext} onClick={()=>onPageChange(page+1)}>Next →</button>
      </div>
    </div>
  )
}

// ── Add Product Modal ─────────────────────────────────────────────────────────
function AddProductModal({ onClose, onSave, categories }) {
  const d = useAdminTokens()
  const [form, setForm] = useState({ 
    name:"", group:"floral", category:"", productType:"", 
    price:"", originalPrice:"", availability:"Available", 
    status:"Active", description:"", image_url:"", 
    season_key:"", limited_start_at:"", limited_end_at:"" 
  })
  const [errors, setErrors] = useState({})
  const [isUploading, setUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const set = key => val => setForm(f => ({...f,[key]:val}))

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = "Product name is required"
    if (!form.category.trim()) err.category = "Category is required"
    if (!form.price || isNaN(form.price) || +form.price <= 0) err.price = "Enter a valid price"
    if (form.originalPrice && +form.originalPrice < +form.price) err.originalPrice = "Original price must be greater than or equal to selling price"
    return err
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const fd=new FormData(); fd.append("file",file)
      const res=await api.post("/products/admin/upload-image",fd)
      const url=res.data?.url||res.url
      if (url) set("image_url")(url); else throw new Error("No URL returned")
    } catch (err) { alert("Upload failed: "+(err.message||"Unknown error")) }
    finally { setUploading(false) }
  }
  const handleSave = async () => {
    const err = validate(); 
    if (Object.keys(err).length) { setErrors(err); return; }
    
    try {
      const fd = new FormData();

      // 1. Core Fields (Ensure these match your FastAPI route)
      fd.append("name", form.name.trim());
      fd.append("group", form.group.toLowerCase().trim());
      fd.append("category", form.category.toLowerCase().trim());
      fd.append("product_type", form.productType.toLowerCase().trim());
      fd.append("price", String(form.price));
      fd.append("status", form.status.toLowerCase());
      fd.append("is_available", form.availability !== "Out of Stock" ? "true" : "false");
      
      // 2. Optional Fields
      if (form.description) fd.append("description", form.description.trim());
      if (form.image_url) fd.append("image_url", form.image_url);
      if (form.originalPrice) fd.append("original_price", String(form.originalPrice));
      
      // 3. Inventory Logic
      const stockVal = form.availability === "Out of Stock" ? 0 : (form.availability === "Limited" ? 5 : 50);
      fd.append("stock", String(stockVal));

      // 4. Seasonal Fields
      if (form.season_key?.trim()) {
        fd.append("season_key", form.season_key.toLowerCase().trim());
        if (form.limited_start_at) fd.append("limited_start_at", form.limited_start_at);
        if (form.limited_end_at) fd.append("limited_end_at", form.limited_end_at);
      }

      // 🚀 DEBUG: Check exactly what is being sent before the request
      for (let [key, value] of fd.entries()) {
        console.log(`Sending to API: ${key} = ${value}`);
      }

      const res = await api.createProduct(fd); 
      onSave(res.product); 
      onClose();
    } catch (e) {
      console.error("API Error:", e);
      alert("Error: " + (e.response?.data?.detail || e.message));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:d.overlayBg, backdropFilter:"blur(4px)" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-xl w-full overflow-hidden"
        style={{ maxWidth:"640px", maxHeight:"90vh", boxShadow:"0 24px 64px rgba(0,0,0,0.5)", border:`1px solid ${d.modalBdr}`, backgroundColor:d.modalBg }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom:`1px solid ${d.modalHdrBdr}`, background:d.modalHdr }}>
          <div>
            <p className="text-base font-bold" style={{ color:d.headC }}>Add New Product</p>
            <p className="text-xs mt-0.5" style={{ color:d.subC }}>Fill in the details to add a new product to your catalog</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color:d.subC }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg} onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight:"calc(90vh - 130px)" }}>
          <div>
            <MLabel d={d}>Product Image <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold cursor-pointer disabled:opacity-50"
              style={{ color:d.subC }}/>
            {isUploading && <p className="text-xs mt-1 animate-pulse" style={{ color:"#4ade80" }}>Uploading...</p>}
            {form.image_url && (
              <div className="mt-3 relative inline-block">
                <button type="button" onClick={()=>setLightboxSrc(form.image_url)} className="block">
                  <FallbackImage src={form.image_url} alt="Preview" className="h-24 w-24 object-cover rounded-lg shadow-sm"
                    style={{ border:`1px solid ${d.cardBdr}` }} fallbackSrc={PLACEHOLDER_IMAGE}/>
                </button>
                <button type="button" onClick={()=>set("image_url")("")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <MLabel d={d}>Product Name <span style={{ color:"#f87171" }}>*</span></MLabel>
            <MInput value={form.name} onChange={set("name")} placeholder="e.g. Dozen Red Ecuador Roses" error={errors.name} d={d}/>
            {errors.name && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.name}</p>}
          </div>

          {/* 3-Tier Hierarchy Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <MLabel d={d}>Group</MLabel>
              <MSel value={form.group} onChange={set("group")} options={["floral", "non-floral"]} d={d}/>
            </div>
            <div>
              <MLabel d={d}>Category <span style={{ color:"#f87171" }}>*</span></MLabel>
              <input list="cat-opts" value={form.category} onChange={e=>set("category")(e.target.value)} placeholder="e.g. Arrangement"
                className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all capitalize"
                style={{ borderColor:errors.category?"#ef4444":d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }}/>
              <datalist id="cat-opts">{categories.map(c=><option key={c} value={c}/>)}</datalist>
            </div>
            <div>
              <MLabel d={d}>Type</MLabel>
              <MInput value={form.productType} onChange={set("productType")} placeholder="e.g. Rose" d={d}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <MLabel d={d}>Selling Price (₱) <span style={{ color:"#f87171" }}>*</span></MLabel>
              <MInput type="number" value={form.price} onChange={set("price")} placeholder="999" error={errors.price} d={d}/>
            </div>
            <div>
              <MLabel d={d}>Original Price (₱)</MLabel>
              <MInput type="number" value={form.originalPrice} onChange={set("originalPrice")} placeholder="1299" error={errors.originalPrice} d={d}/>
            </div>
          </div>

          <div>
            <MLabel d={d}>Availability</MLabel>
            <div className="flex gap-2">
              {AVAILABILITIES.map(a => (
                <button key={a} onClick={()=>set("availability")(a)}
                  className="flex-1 py-2 text-xs font-bold rounded-md border transition-all"
                  style={{ backgroundColor:form.availability===a?DG:d.inputBg, color:form.availability===a?"white":d.subC, borderColor:form.availability===a?DG:d.inputBdr }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <MLabel d={d}>Description</MLabel>
            <MTextarea value={form.description} onChange={set("description")} placeholder="Brief description..." d={d}/>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop:`1px solid ${d.modalFtrBdr}`, backgroundColor:d.modalFtr }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isUploading}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90"
            style={{ background:`linear-gradient(135deg,${DG},${G})` }}>
            Add Product
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Product Modal ────────────────────────────────────────────────────────
function EditProductModal({ product, onClose, onSave, categories }) {
  const d = useAdminTokens()
  const [form, setForm] = useState({
    name:product.name||"", category:product.category||"",
    price:product.price?String(product.price):"",
    originalPrice:product.original_price?String(product.original_price):"",
    availability:!product.is_available?"Out of Stock":product.stock<=(product.reorder_point||10)?"Limited":"Available",
    status:product.status==="active"||product.status==="Active"?"Active":"Inactive",
    description:product.description||"", image_url:product.image_url||"",
    season_key:product.season_key||"", limited_start_at:product.limited_start_at||"", limited_end_at:product.limited_end_at||"",
  })
  const [errors,setErrors]=useState({})
  const [isUploading,setUploading]=useState(false)
  const [removeImage,setRemoveImage]=useState(false)
  const [lightboxSrc,setLightboxSrc]=useState(null)
  const set = key => val => setForm(f=>({...f,[key]:val}))

  const validate = () => {
    const err={}
    if (!form.name.trim()) err.name="Product name is required"
    if (!form.category.trim()) err.category="Category is required"
    if (!form.price||isNaN(form.price)||+form.price<=0) err.price="Enter a valid price"
    if (form.originalPrice&&+form.originalPrice<+form.price) err.originalPrice="Original price must be greater than or equal to selling price"
    return err
  }

  const handleUpload = async (e) => {
    const file=e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const fd=new FormData(); fd.append("file",file)
      const res=await api.post("/products/admin/upload-image",fd,{headers:{"Content-Type":"multipart/form-data"}})
      const url=res.data?.url||res.url
      if (url){set("image_url")(url);setRemoveImage(false)} else throw new Error("No URL")
    } catch (err){alert("Upload failed: "+(err.message||"Unknown"))} finally{setUploading(false)}
  }

  const handleSave = async () => {
    const err = validate(); 
    if (Object.keys(err).length) { setErrors(err); return; }
    
    try {
      const fd = new FormData();

      // 🛡️ THE FIX: (form.field || "") prevents the 'undefined' crash
      fd.append("name", (form.name || "").trim());
      fd.append("group", (form.group || "floral").toLowerCase().trim());
      fd.append("category", (form.category || "").toLowerCase().trim());
      fd.append("product_type", (form.productType || "").toLowerCase().trim());
      
      fd.append("price", String(form.price));
      fd.append("status", (form.status || "active").toLowerCase());
      fd.append("is_available", form.availability !== "Out of Stock" ? "true" : "false");
      
      // Optional Fields
      if (form.description) fd.append("description", form.description.trim());
      if (form.image_url) fd.append("image_url", form.image_url);
      if (form.originalPrice) fd.append("original_price", String(form.originalPrice));
      
      // Inventory Logic
      const stockVal = form.availability === "Out of Stock" ? 0 : (form.availability === "Limited" ? 5 : 50);
      fd.append("stock", String(stockVal));

      // Seasonal Fields
      if (form.season_key?.trim()) {
        fd.append("season_key", form.season_key.toLowerCase().trim());
        if (form.limited_start_at) fd.append("limited_start_at", form.limited_start_at);
        if (form.limited_end_at) fd.append("limited_end_at", form.limited_end_at);
      }

      const res = await api.createProduct(fd); 
      onSave(res.product); 
      onClose();
    } catch (e) {
      console.error("API Error:", e);
      alert("Error: " + (e.response?.data?.detail || e.message));
    }
  }

  const previewUrl=removeImage?"":(form.image_url||getProductImage(product))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:d.overlayBg, backdropFilter:"blur(4px)" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-xl w-full overflow-hidden"
        style={{ maxWidth:"640px", maxHeight:"90vh", boxShadow:"0 24px 64px rgba(0,0,0,0.5)", border:`1px solid ${d.modalBdr}`, backgroundColor:d.modalBg }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom:`1px solid ${d.modalHdrBdr}`, background:d.modalHdr }}>
          <div>
            <p className="text-base font-bold" style={{ color:d.headC }}>Edit Product</p>
            <p className="text-xs mt-0.5" style={{ color:d.subC }}>Update the product details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color:d.subC }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg} onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight:"calc(90vh - 130px)" }}>
          <div>
            <MLabel d={d}>Product Image <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading}
              className="block w-full text-sm cursor-pointer disabled:opacity-50" style={{ color:d.subC }}/>
            {isUploading && <p className="text-xs mt-1 animate-pulse" style={{ color:"#4ade80" }}>Uploading...</p>}
            {previewUrl && previewUrl!==PLACEHOLDER_IMAGE && (
              <div className="mt-3 relative inline-block">
                <button type="button" onClick={()=>setLightboxSrc(previewUrl)} className="block">
                  <FallbackImage src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg shadow-sm"
                    style={{ border:`1px solid ${d.cardBdr}` }} fallbackSrc={PLACEHOLDER_IMAGE}/>
                </button>
                <button type="button" onClick={()=>{setRemoveImage(true);set("image_url")("")}}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <MLabel d={d}>Product Name <span style={{ color:"#f87171" }}>*</span></MLabel>
            <MInput value={form.name} onChange={set("name")} placeholder="e.g. Dozen Red Ecuador Roses" error={errors.name} d={d}/>
            {errors.name && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. Category Field */}
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Category <span style={{ color:"#f87171" }}>*</span></MLabel>
                <span className="text-[10px] font-semibold" style={{ color:"#4ade80" }}>Type to create new</span>
              </div>
              <input list="cat-opts-edit" value={form.category} onChange={e=>set("category")(e.target.value)} placeholder="Select or type new..."
                className="w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-all capitalize"
                style={{ borderColor:errors.category?"#ef4444":d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }}
                onFocus={e=>{e.target.style.borderColor="#4ade80";e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)"}}
                onBlur={e=>{e.target.style.borderColor=errors.category?"#ef4444":d.inputBdr;e.target.style.boxShadow="none"}}/>
              <datalist id="cat-opts-edit">{categories.map(c=><option key={c} value={c}/>)}</datalist>
              {errors.category && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.category}</p>}
            </div>

            {/* 2. Type Field */}
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Type <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
                <span className="text-[10px] font-semibold" style={{ color:"#4ade80" }}>e.g. Rose, Vase</span>
              </div>
              <MInput value={form.productType} onChange={set("productType")} placeholder="e.g. Rose" d={d}/>
            </div>
          </div>

          {/* 3. Status Field (Moved to its own full-width line below the grid to fix the layout) */}
          <div>
            <MLabel d={d}>Status</MLabel>
            <MSel value={form.status} onChange={set("status")} options={STATUSES} d={d}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <MLabel d={d}>Selling Price (₱) <span style={{ color:"#f87171" }}>*</span></MLabel>
              <MInput type="number" value={form.price} onChange={set("price")} placeholder="999" error={errors.price} d={d}/>
              {errors.price && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.price}</p>}
            </div>
            <div>
              <MLabel d={d}>Original Price (₱)</MLabel>
              <MInput type="number" value={form.originalPrice} onChange={set("originalPrice")} placeholder="1299" error={errors.originalPrice} d={d}/>
              {errors.originalPrice && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.originalPrice}</p>}
            </div>
          </div>

          <div>
            <MLabel d={d}>Availability</MLabel>
            <div className="flex gap-2">
              {AVAILABILITIES.map(a=>(
                <button key={a} onClick={()=>set("availability")(a)}
                  className="flex-1 py-2 text-xs font-bold rounded-md border transition-all"
                  style={{ backgroundColor:form.availability===a?DG:d.inputBg, color:form.availability===a?"white":d.subC, borderColor:form.availability===a?DG:d.inputBdr }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <MLabel d={d}>Description <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
            <MTextarea value={form.description} onChange={set("description")} placeholder="Brief description..." d={d}/>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop:`1px solid ${d.modalFtrBdr}`, backgroundColor:d.modalFtr }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg} onMouseLeave={e=>e.currentTarget.style.backgroundColor=d.inputBg}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isUploading}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background:`linear-gradient(135deg,${DG},${G})`, boxShadow:"0 2px 8px rgba(12,87,62,0.3)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
            Save Changes
          </button>
        </div>
      </div>
      {lightboxSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ backgroundColor:"rgba(0,0,0,0.85)" }} onClick={()=>setLightboxSrc(null)}>
          <FallbackImage src={lightboxSrc} alt="Enlarged" className="max-w-3xl w-full max-h-[78vh] object-contain rounded-xl" fallbackSrc={PLACEHOLDER_IMAGE}/>
        </div>
      )}
    </div>
  )
}

// ── View Product Modal ────────────────────────────────────────────────────────
function ViewProductModal({ product, onClose }) {
  const d = useAdminTokens()
  const rows = [
    { label:"Product Name", value:product.name },
    { label:"Category",     value:product.category, capitalize:true },
    { label:"Status",       value:product.status,   capitalize:true },
    { label:"Price",        value:`₱${(+product.price).toLocaleString()}` },
    { label:"Stock",        value:product.stock },
    { label:"Description",  value:product.description || "—" },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:d.overlayBg, backdropFilter:"blur(4px)" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-xl w-full overflow-hidden"
        style={{ maxWidth:"420px", boxShadow:"0 24px 64px rgba(0,0,0,0.5)", border:`1px solid ${d.modalBdr}`, backgroundColor:d.modalBg }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom:`1px solid ${d.modalHdrBdr}`, background:d.modalHdr }}>
          <p className="text-base font-bold" style={{ color:d.headC }}>Product Details</p>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color:d.subC }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg} onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <FallbackImage src={getProductImage(product)} alt={product.name}
            className="w-full h-48 object-cover rounded-lg"
            style={{ border:`1px solid ${d.cardBdr}` }} fallbackSrc={PLACEHOLDER_IMAGE}/>
          {rows.map(row => (
            <div key={row.label}>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color:d.labelC }}>{row.label}</p>
              <p className="text-sm font-semibold" style={{ color:d.cellC }}>{row.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop:`1px solid ${d.modalFtrBdr}`, backgroundColor:d.modalFtr }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Product Modal ──────────────────────────────────────────────────────
function DeleteProductModal({ product, onClose, onConfirm, isDeleting }) {
  const d = useAdminTokens()
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: d.overlayBg, backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget && !isDeleting) onClose() }}>
      <div className="rounded-xl w-full overflow-hidden transform transition-all"
        style={{ maxWidth: "400px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", border: `1px solid ${d.modalBdr}`, backgroundColor: d.modalBg }}>
        
        <div className="p-6 text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: d.isDark ? "rgba(239,68,68,0.1)" : "#fee2e2", color: d.isDark ? "#ef4444" : "#dc2626" }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold mb-2" style={{ color: d.headC }}>Delete Product</h3>
          <p className="text-sm mb-6" style={{ color: d.subC }}>
            Are you sure you want to delete <strong style={{ color: d.cellC }}>{product.name}</strong>? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isDeleting}
              className="flex-1 py-2.5 text-sm font-semibold border rounded-lg transition-all"
              style={{ borderColor: d.inputBdr, color: d.subC, backgroundColor: d.inputBg }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = d.hdrBg} 
              onMouseLeave={e => e.currentTarget.style.backgroundColor = d.inputBg}>
              Cancel
            </button>
            <button onClick={() => onConfirm(product.id)} disabled={isDeleting}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const d = useAdminTokens()
  const { isDark } = d
  const PAGE_SIZE = 35

  const [search, setSearch]               = useState("")
  const [category, setCategory]           = useState("")
  const [status, setStatus]               = useState("")
  const [priceSort, setPriceSort]         = useState("")
  const [page, setPage]                   = useState(1)
  const [showModal, setShowModal]         = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [products, setProducts]           = useState([])
  const [totalCount, setTotalCount]       = useState(0)
  const [lowCount, setLowCount]           = useState(0)
  const [loading, setLoading]             = useState(true)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const [productsRes, vasesRes] = await Promise.all([api.getAdminProducts(), api.get("/vases/admin/all")])
      const prods = productsRes.data || productsRes
      const vases = (vasesRes.data || vasesRes).map(v => ({ ...v, category:"vase", status:v.is_available?"active":"inactive", stock:v.quantity||0, reorder_point:10 }))
      const combined = [...prods, ...vases]
      setProducts(combined); setTotalCount(combined.length)
      setLowCount(combined.filter(p => p.stock<=(p.reorder_point||10)).length)
    } catch (e) { console.error("Failed to fetch products",e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPage(1) }, [search,category,status,priceSort])


  const handleSave     = p => { setProducts(prev=>[p,...prev]); setTotalCount(c=>c+1) }
  const handleEditSave = p => { setProducts(prev=>prev.map(x=>x.id===p.id?p:x)); setEditingProduct(null) }

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    try {
      // Send the delete request to the backend
      await api.delete(`/products/admin/${id}`); 

      // 🚀 THE SOFT DELETE FIX: Update the UI to match the database
      // Instead of erasing it from the screen, mark it as Inactive
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, status: "inactive", is_available: false } : p
      )); 

      // Close the modal
      setDeletingProduct(null);
    }
    catch (e) {
      console.error("Delete failed:", e);
      const errorMsg = e.response?.data?.detail || e.message || "Failed to delete";
      alert("Error: " + errorMsg);
    }
    finally {
      setIsDeleting(false);
    }
  }

  const filtered = products.filter(p => {
    const ms=!search||p.name?.toLowerCase().includes(search.toLowerCase())
    const mc=!category||p.category?.toLowerCase()===category.toLowerCase()
    const mst=!status||p.status===status.toLowerCase()
    return ms&&mc&&mst
  }).sort((a,b) => { if(priceSort==="asc")return+a.price-+b.price; if(priceSort==="desc")return+b.price-+a.price; return 0 })

  const totalPages  = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE))
  const pageSafe    = Math.min(page,totalPages)
  const paginated   = filtered.slice((pageSafe-1)*PAGE_SIZE, pageSafe*PAGE_SIZE)

  const baseCategories     = ["Flower","Vase","Wrapping","Accessory","Arrangement","Add-on"]
  const dynamicCategories  = Array.from(new Set([...baseCategories.map(c=>c.toLowerCase()),...products.map(p=>p.category?.toLowerCase()).filter(Boolean)])).map(c=>c.charAt(0).toUpperCase()+c.slice(1))

  const selStyle = { borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }


  return (
    <div className="space-y-5">
      {showModal      && <AddProductModal  onClose={()=>setShowModal(false)}      onSave={handleSave}     categories={dynamicCategories}/>}
      {editingProduct && <EditProductModal product={editingProduct} onClose={()=>setEditingProduct(null)} onSave={handleEditSave} categories={dynamicCategories}/>}
      {viewingProduct && <ViewProductModal product={viewingProduct} onClose={()=>setViewingProduct(null)}/>}
      {deletingProduct && <DeleteProductModal product={deletingProduct} onClose={()=>setDeletingProduct(null)} onConfirm={handleConfirmDelete} isDeleting={isDeleting}/>}
      <h1 className="text-xl font-bold" style={{ color:d.headC }}>Products</h1>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3 items-stretch">
        <div className="rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200"
          style={{ flex:"1 0 200px", maxWidth:"300px", background:"linear-gradient(135deg,#0a4a34 0%,#1a7040 60%,#2E8B34 100%)", boxShadow:"0 4px 16px rgba(12,87,62,0.28)" }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(12,87,62,0.36)"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(12,87,62,0.28)"}}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage:"radial-gradient(circle at 80% 20%,white 1px,transparent 1px)", backgroundSize:"20px 20px" }}/>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.65)" }}>Total Products</p>
            <p className="text-3xl font-bold text-white mt-2">{totalCount}</p>
            <p className="text-xs mt-1.5 font-medium" style={{ color:"rgba(255,255,255,0.55)" }}>+0 this week</p>
          </div>
          <button onClick={()=>setShowModal(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all hover:scale-105 active:scale-95 mt-3 self-start"
            style={{ backgroundColor:"rgba(255,255,255,0.15)", color:"white", border:"1px solid rgba(255,255,255,0.2)" }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
            Add Product
          </button>
        </div>

        <div className="rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200"
          style={{ flex:"1 0 180px", maxWidth:"260px", backgroundColor:d.cardBg, border:`1px solid ${d.cardBdr}`, boxShadow:d.cardShdw }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)"}} onMouseLeave={e=>{e.currentTarget.style.transform=""}}>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor:"#ef4444", opacity:0.7 }}/>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:d.subC }}>Low Stock Products</p>
            <p className="text-3xl font-bold mt-2" style={{ color:isDark?"#f87171":"#ef4444" }}>{lowCount}</p>
            <p className="text-xs mt-1.5 font-semibold" style={{ color:"#f87171" }}>+0 this week</p>
          </div>
          <button className="text-xs font-semibold hover:underline mt-3 self-start" style={{ color:d.accentG }}>
            Review Inventory
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${d.cardBdr}`, backgroundColor:d.cardBg, boxShadow:d.cardShdw }}>
        {/* Toolbar */}
        <div className="p-3 sm:p-4" style={{ borderBottom:`1px solid ${d.hdrBdr}`, backgroundColor:d.hdrBg }}>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { val:category,  set:setCategory,  opts:["All Categories",...dynamicCategories], min:"130px" },
              { val:status,    set:setStatus,    opts:["All Status","Active","Inactive"],       min:"120px" },
              { val:priceSort, set:setPriceSort, opts:["Price: Default","Price: Low to High","Price: High to Low"], min:"160px",
                map:{ "Price: Default":"","Price: Low to High":"asc","Price: High to Low":"desc" },
                unmap:{ "":"Price: Default","asc":"Price: Low to High","desc":"Price: High to Low" } },
            ].map((f,i) => (
              <div key={i} className="relative">
                <select value={f.unmap?f.unmap[f.val]||f.opts[0]:f.val}
                  onChange={e => f.set(f.map?f.map[e.target.value]||"":e.target.value==="All Categories"?"":e.target.value==="All Status"?"":e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md cursor-pointer outline-none transition-all"
                  style={{ ...selStyle, minWidth:f.min }}
                  onFocus={e=>{e.target.style.borderColor="#4ade80";e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)"}}
                  onBlur={e=>{e.target.style.borderColor=d.inputBdr;e.target.style.boxShadow="none"}}>
                  {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:d.subC }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                </svg>
              </div>
            ))}
            <div className="relative flex-1" style={{ minWidth:"180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:d.subC }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product name"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md outline-none transition-all"
                style={selStyle}
                onFocus={e=>{e.target.style.borderColor="#4ade80";e.target.style.boxShadow="0 0 0 2px rgba(74,222,128,0.18)"}}
                onBlur={e=>{e.target.style.borderColor=d.inputBdr;e.target.style.boxShadow="none"}}/>
            </div>
            <button className="px-4 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background:`linear-gradient(135deg,${DG},${G})` }}>Filter</button>
            <ExportProductsBtn data={filtered} d={d}/>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth:"700px" }}>
            <thead style={{ borderBottom:`1px solid ${d.hdrBdr}`, backgroundColor:d.hdrBg }}>
              <tr>
                {["Image","Product Name","Category","Price","Status","Availability","Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color:d.subC }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color:d.subC }}>Loading products...</td></tr>
              ) : paginated.length > 0 ? paginated.map((p, idx) => {
                const avail = !p.is_available?"Out of stock":p.stock<=(p.reorder_point||10)?"Low stock":"In stock"
                return (
                  <tr key={p.id}
                    style={{ borderBottom:`1px solid ${d.divider}`, backgroundColor:idx%2===0?d.rowEven:d.rowOdd }}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.rowHov}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor=idx%2===0?d.rowEven:d.rowOdd}>
                    <td className="px-4 py-3">
                      <FallbackImage src={getProductImage(p)} alt={p.name} className="w-10 h-10 rounded-lg object-cover"
                        style={{ border:`1px solid ${d.cardBdr}` }} fallbackSrc={PLACEHOLDER_IMAGE}/>
                    </td>
                    <td className="px-4 py-3"><span className="font-semibold" style={{ color:d.cellC }}>{p.name}</span></td>
                    <td className="px-4 py-3"><span className="capitalize" style={{ color:d.subC }}>{p.category}</span></td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold" style={{ color:d.priceG }}>₱{(+p.price).toLocaleString()}</span>
                        {p.original_price && <span className="block text-xs line-through" style={{ color:d.subC }}>₱{(+p.original_price).toLocaleString()}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                    <td className="px-4 py-3"><StatusBadge status={avail}/></td>
                    <td className="px-4 py-3">
                      <ActionBtns onEdit={()=>setEditingProduct(p)} onView={()=>setViewingProduct(p)} onDelete={()=>setDeletingProduct(p)}/>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color:d.subC }}>
                  No products yet. Click Add Product to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <ProductPagination
          showing={`Showing ${paginated.length} of ${filtered.length} entries`}
          page={pageSafe} totalPages={totalPages} onPageChange={setPage} d={d}
        />
      </div>
    </div>
  )
}