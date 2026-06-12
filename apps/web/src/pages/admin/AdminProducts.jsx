import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"
import { DG, G, StatusBadge, TH, TD, ActionBtns, EmptyRow, TableWrap, ExportBtn } from "./_adminShared"
import FallbackImage from "../../components/FallbackImage.jsx"

const PLACEHOLDER_IMAGE = new URL("../../assets/default-img/ImageNotFound.webp", import.meta.url).href
const AVAILABILITIES = ["Available", "Limited", "Out of Stock"]
const STATUSES       = ["Active", "Inactive"]

// 🚀 OCCASIONS LIST
const OCCASIONS_LIST = [
  "Anniversary", "Birthday", "Congratulation", "Get Well", 
  "Graduation", "I am Sorry", "Love & Romance", "Mother's Day", 
  "New Baby", "Sympathy", "Thank You", "Valentine's Day", "Wedding"
]

// ── Flower petal loader (same bloom animation as the login/register screen) ──
function FlowerLoader({ message = "Loading products...", isDark = false }) {
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
function AddProductModal({ onClose, onSave, categories, products = [] }) {
  const d = useAdminTokens()
  
  const [form, setForm] = useState({ 
    name:"", group:"floral", category:"", productType:"", 
    price:"", availability:"Available", 
    status:"Active", description:"", image_url:"", 
    season_key:"", limited_start_at:"", limited_end_at:"",
    stock: 0,          
    is_visible: true,
    composition: [],
    occasions: [],
    branches: [] // 🚀 ADDED BRANCHES INITIAL STATE
  })

  const [compSelection, setCompSelection] = useState("");
  const [compQty, setCompQty] = useState(1);
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);

  const [errors, setErrors] = useState({})
  const [isUploading, setUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const set = key => val => setForm(f => ({...f,[key]:val}))

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  let maxFeasibleStock = null;
  if (form.composition.length > 0) {
    maxFeasibleStock = Infinity;
    form.composition.forEach(item => {
      const invProduct = products.find(p => p.id === item.product_id);
      const availableStock = invProduct ? invProduct.stock : 0;
      const possibleArrangements = Math.floor(availableStock / item.quantity);
      if (possibleArrangements < maxFeasibleStock) {
        maxFeasibleStock = possibleArrangements;
      }
    });
    if (maxFeasibleStock === Infinity) maxFeasibleStock = 0;
  }

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = "Product name is required"
    if (!form.category.trim()) err.category = "Category is required"
    if (!form.price || isNaN(form.price) || +form.price <= 0) err.price = "Enter a valid price"
    if (maxFeasibleStock !== null && Number(form.stock) > maxFeasibleStock) {
      err.stock = `Insufficient raw materials. Max possible: ${maxFeasibleStock}`
    }
    return err
  }

  // 🚀 Added Toggle Branch handler
  const toggleBranch = (branch) => {
    setForm(prev => ({
      ...prev,
      branches: prev.branches.includes(branch) 
        ? prev.branches.filter(b => b !== branch) 
        : [...prev.branches, branch]
    }));
  };

  const toggleOccasion = (occasion) => {
    setForm(prev => {
      const isSelected = prev.occasions.includes(occasion);
      if (isSelected) {
        return { ...prev, occasions: prev.occasions.filter(o => o !== occasion) };
      } else {
        return { ...prev, occasions: [...prev.occasions, occasion] };
      }
    });
  };

  const handleAddCompositionItem = () => {
    if (!compSelection || compQty <= 0) return;
    const material = products.find(p => p.id === compSelection);
    if (!material) return;
    if (compQty > material.stock) {
      alert(`Inventory limit reached! You only have ${material.stock} pieces of "${material.name}" in the warehouse.`);
      return;
    }
    if (form.composition.some(item => item.product_id === material.id)) {
      alert("This material is already in the recipe!");
      return;
    }
    setForm(prev => ({
      ...prev,
      composition: [
        ...prev.composition, 
        { product_id: material.id, name: material.name, quantity: compQty }
      ]
    }));
    setCompSelection("");
    setCompQty(1);
  };

  const handleRemoveCompositionItem = (idToRemove) => {
    setForm(prev => ({
      ...prev,
      composition: prev.composition.filter(item => item.product_id !== idToRemove)
    }));
  };

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
    
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("group", form.group.toLowerCase().trim());
      fd.append("category", form.category.toLowerCase().trim());
      fd.append("product_type", form.productType.toLowerCase().trim());
      fd.append("price", String(form.price));
      fd.append("status", form.status.toLowerCase());
      fd.append("is_available", form.availability !== "Out of Stock" ? "true" : "false");
      if (form.description) fd.append("description", form.description.trim());
      if (form.image_url) fd.append("image_url", form.image_url);
      fd.append("stock", String(form.stock));
      fd.append("is_visible", form.is_visible ? "true" : "false");
      if (form.season_key?.trim()) {
        fd.append("season_key", form.season_key.toLowerCase().trim());
        if (form.limited_start_at) fd.append("limited_start_at", form.limited_start_at);
        if (form.limited_end_at) fd.append("limited_end_at", form.limited_end_at);
      }
      if (form.composition.length > 0) fd.append("composition", JSON.stringify(form.composition));
      
      if (form.occasions.length > 0) fd.append("occasions", JSON.stringify(form.occasions));
      if (form.branches.length > 0) fd.append("branches", JSON.stringify(form.branches)); // 🚀 Appends branches

      const res = await api.createProduct(fd);
      onSave(res.product); 
      onClose();
    } catch (e) {
      console.error("API Error:", e);
      alert("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsSaving(false);
    }
  }

  const floralMaterials = products.filter(p => p.group?.toLowerCase() === 'floral' || p.category?.toLowerCase() === 'flower');
  const nonFloralMaterials = products.filter(p => p.group?.toLowerCase() !== 'floral' && p.category?.toLowerCase() !== 'flower');
  const selectedMaterial = products.find(p => p.id === compSelection);

  const MaterialDropdownRow = ({ p }) => {
    const isOut = p.stock === 0;
    const isLow = p.stock > 0 && p.stock <= 5;
    return (
      <div 
        onClick={() => {
          if (isOut) return;
          setCompSelection(p.id);
          setIsMaterialDropdownOpen(false);
        }}
        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isOut ? "opacity-50" : ""}`}
        style={{ borderBottom: `1px solid ${d.divider}`, backgroundColor: isOut ? (d.isDark ? "#0f172a" : "#f9fafb") : "transparent" }}
        onMouseEnter={e => !isOut && (e.currentTarget.style.backgroundColor = d.rowHov)}
        onMouseLeave={e => !isOut && (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <FallbackImage src={getProductImage(p)} fallbackSrc={PLACEHOLDER_IMAGE} className="w-8 h-8 rounded object-cover shadow-sm" style={{ border: `1px solid ${d.cardBdr}` }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: d.cellC }}>{p.name}</p>
          <p className="text-[10px] uppercase font-bold mt-0.5 truncate" style={{ color: isOut ? "#ef4444" : isLow ? "#d97706" : "#16a34a" }}>
            {isOut ? "Out of Stock" : isLow ? `Low Stock (${p.stock})` : `${p.stock} Available`}
          </p>
        </div>
      </div>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:d.overlayBg, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", zIndex:9999, top:0, left:0, width:"100vw", height:"100vh" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-xl w-full overflow-hidden flex flex-col"
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

        <div className="overflow-y-auto p-6 space-y-4 flex-1 relative">
          
          <div>
            <MLabel d={d}>Product Image <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
            {!form.image_url && (
              <label className="flex flex-col items-center justify-center w-full rounded-lg cursor-pointer transition-all"
                style={{ border:`2px dashed ${d.inputBdr}`, backgroundColor:d.inputBg, padding:"24px 16px" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#4ade80"; e.currentTarget.style.backgroundColor=d.isDark?"rgba(74,222,128,0.06)":"#f0fdf4"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=d.inputBdr; e.currentTarget.style.backgroundColor=d.inputBg}}>
                <svg className="w-8 h-8 mb-2" style={{ color:d.subC }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-semibold" style={{ color:d.cellC }}>Upload an image</span>
                <span className="text-xs mt-0.5" style={{ color:d.subC }}>PNG, JPG or WEBP. Click to browse.</span>
                <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} className="hidden"/>
              </label>
            )}
            {isUploading && <p className="text-xs mt-2 animate-pulse" style={{ color:"#4ade80" }}>Uploading...</p>}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div> 
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Group</MLabel>
                <span className="text-[10px] font-semibold" style={{ color: d.subC }}>Top level</span>
              </div>
              <MSel value={form.group} onChange={set("group")} options={["floral", "non-floral"]} d={d}/>
            </div>
            
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Category <span style={{ color:"#f87171" }}>*</span></MLabel>
                {isCustomCategory ? (
                  <button type="button" onClick={() => { setIsCustomCategory(false); set("category")(""); }} 
                    className="text-[10px] font-semibold hover:underline transition-all" style={{ color: "#ef4444" }}>
                    Cancel Custom
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold" style={{ color: d.subC }}>Main Navigation</span>
                )}
              </div>
              {isCustomCategory ? (
                <MInput value={form.category} onChange={set("category")} placeholder="Type new category..." error={errors.category} d={d}/>
              ) : (
                <MSel value={form.category} 
                  onChange={(val) => {
                    if (val === "+ Add New Category") { setIsCustomCategory(true); set("category")(""); } 
                    else { set("category")(val); }
                  }} 
                  options={["", ...categories, "+ Add New Category"]} d={d} />
              )}
              {errors.category && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.category}</p>}
            </div>

            <div>
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Type</MLabel>
                <span className="text-[10px] font-semibold" style={{ color:"#4ade80" }}>Sub-tag (e.g. Rose)</span>
              </div>
              <MInput value={form.productType} onChange={set("productType")} placeholder="e.g. Rose" d={d}/>
            </div>
          </div>

          <div>
            <MLabel d={d}>Base Selling Price (₱) <span style={{ color:"#f87171" }}>*</span></MLabel>
            <MInput type="number" value={form.price} onChange={set("price")} placeholder="999" error={errors.price} d={d}/>
            {errors.price && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.price}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <MLabel d={d}>Stock Quantity <span style={{ color:"#f87171" }}>*</span></MLabel>
              <MInput type="number" value={form.stock} onChange={set("stock")} placeholder="0" error={errors.stock} d={d}/>
              
              {maxFeasibleStock !== null && (
                <div className="mt-1.5 flex items-start gap-1.5">
                  <span className="text-[10px] mt-0.5">
                    {Number(form.stock) > maxFeasibleStock ? '❌' : '✅'}
                  </span>
                  <span className="text-[10px] leading-tight" style={{ color: Number(form.stock) > maxFeasibleStock ? "#ef4444" : d.subC }}>
                    Max feasible based on recipe: <strong>{maxFeasibleStock}</strong>
                  </span>
                </div>
              )}
              {errors.stock && <p className="text-[11px] mt-1 font-bold" style={{ color:"#f87171" }}>{errors.stock}</p>}
            </div>

            <div>
              <MLabel d={d}>Availability</MLabel>
              <div className="flex gap-1">
                {AVAILABILITIES.map(a => (
                  <button key={a} type="button" onClick={()=>set("availability")(a)}
                    className="flex-1 py-2 text-[10px] font-bold rounded-md border transition-all"
                    style={{ backgroundColor:form.availability===a?DG:d.inputBg, color:form.availability===a?"white":d.subC, borderColor:form.availability===a?DG:d.inputBdr }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 mt-4 p-3 rounded-lg" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f9fafb", border: `1px solid ${d.inputBdr}` }}>
            <input type="checkbox" id="is_visible" checked={form.is_visible} onChange={(e) => set("is_visible")(e.target.checked)} className="mt-0.5 h-4 w-4 text-green-600 rounded cursor-pointer" />
            <div className="flex flex-col">
              <label htmlFor="is_visible" className="text-sm font-semibold cursor-pointer" style={{ color: d.headC }}>Show on Customer Storefront</label>
              <span className="text-xs mt-0.5" style={{ color: d.subC }}>Uncheck this if the item is a raw material (like single stems or vases) used only for custom AI arrangements or for composing a product.</span>
            </div>
          </div>

          {/* 🚀 OCCASIONS SELECTION GRID */}
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${d.inputBdr}` }}>
            <MLabel d={d}>Occasions (Optional)</MLabel>
            <p className="text-xs mb-3" style={{ color: d.subC }}>
              Select all occasions this product is suitable for.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OCCASIONS_LIST.map((occ) => (
                <label key={occ} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={form.occasions.includes(occ)}
                    onChange={() => toggleOccasion(occ)}
                    className="rounded text-green-600 focus:ring-green-500 bg-white border-gray-300"
                  />
                  <span className="text-xs font-medium" style={{ color: d.cellC }}>{occ}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 🚀 BRANCHES SELECTION GRID */}
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${d.inputBdr}` }}>
            <MLabel d={d}>Available Branches <span style={{ color:"#f87171" }}>*</span></MLabel>
            <p className="text-xs mb-3" style={{ color: d.subC }}>
              Select which fulfillment centers carry this product.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Manila", "Pampanga"].map((branch) => (
                <label key={branch} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={form.branches.includes(branch)}
                    onChange={() => toggleBranch(branch)}
                    className="rounded text-green-600 focus:ring-green-500 bg-white border-gray-300"
                  />
                  <span className="text-xs font-medium" style={{ color: d.cellC }}>{branch}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${d.inputBdr}` }}>
            <MLabel d={d}>Arrangement Recipe (Optional)</MLabel>
            <p className="text-xs mb-4" style={{ color: d.subC }}>
              If this product is made of other items (like stems and vases), add them here so inventory updates automatically when purchased.
            </p>

            <div className="flex items-start gap-2 mb-4">
              
              <div className="flex-1 relative">
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: d.labelC }}>Material</span>
                
                <div onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                  className="w-full px-3 py-2 text-sm border rounded-md outline-none flex items-center justify-between cursor-pointer transition-all h-[42px]"
                  style={{ 
                    borderColor: isMaterialDropdownOpen ? "#4ade80" : d.inputBdr, 
                    backgroundColor: d.inputBg, 
                    boxShadow: isMaterialDropdownOpen ? "0 0 0 2px rgba(74,222,128,0.18)" : "none" 
                  }}>
                  {selectedMaterial ? (
                    <div className="flex items-center gap-2">
                      <FallbackImage src={getProductImage(selectedMaterial)} fallbackSrc={PLACEHOLDER_IMAGE} className="w-6 h-6 rounded object-cover shadow-sm" style={{ border: `1px solid ${d.cardBdr}` }}/>
                      <span className="font-semibold truncate" style={{ color: d.cellC }}>{selectedMaterial.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: d.subC }}>Select a material...</span>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${isMaterialDropdownOpen ? "rotate-180" : ""}`} style={{ color: d.subC }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>

                {isMaterialDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMaterialDropdownOpen(false)} />
                    
                    <div className="absolute left-0 right-0 top-[65px] z-50 rounded-lg border shadow-xl overflow-y-auto"
                      style={{ maxHeight: "260px", backgroundColor: d.modalBg, borderColor: d.inputBdr }}>
                      
                      <div className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider z-10"
                        style={{ backgroundColor: d.hdrBg, color: d.subC, borderBottom: `1px solid ${d.divider}` }}>
                        🌸 Floral Materials
                      </div>
                      {floralMaterials.map(p => <MaterialDropdownRow key={p.id} p={p} />)}
                      {floralMaterials.length === 0 && <p className="px-3 py-2 text-xs" style={{ color: d.subC }}>No floral items found.</p>}

                      <div className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider z-10"
                        style={{ backgroundColor: d.hdrBg, color: d.subC, borderTop: `1px solid ${d.divider}`, borderBottom: `1px solid ${d.divider}` }}>
                        🎀 Non-Floral / Accessories
                      </div>
                      {nonFloralMaterials.map(p => <MaterialDropdownRow key={p.id} p={p} />)}
                      {nonFloralMaterials.length === 0 && <p className="px-3 py-2 text-xs" style={{ color: d.subC }}>No accessories found.</p>}
                    </div>
                  </>
                )}
              </div>

              <div className="w-20">
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: d.labelC }}>Qty</span>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedMaterial ? selectedMaterial.stock : 1} 
                  value={compQty} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    const maxAvailable = selectedMaterial ? selectedMaterial.stock : 1;
                    setCompQty(val > maxAvailable ? maxAvailable : val);
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-md outline-none text-center h-[42px]"
                  style={{ borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }} 
                />
              </div>
              
              <button type="button" onClick={handleAddCompositionItem}
                disabled={!compSelection || selectedMaterial?.stock === 0}
                className="px-4 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-[18px]"
                style={{ background:`linear-gradient(135deg,${DG},${G})`, height: "42px" }}>
                Add
              </button>
            </div>

            {form.composition.length > 0 && (
              <div className="space-y-2 mt-4 pt-4" style={{ borderTop: `1px solid ${d.divider}` }}>
                {form.composition.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-2 rounded-lg border" style={{ backgroundColor: d.cardBg, borderColor: d.cardBdr }}>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold" style={{ backgroundColor: `${G}15`, color: G }}>
                        {item.quantity}x
                      </span>
                      <span className="text-sm font-semibold" style={{ color: d.cellC }}>{item.name}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveCompositionItem(item.product_id)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <MLabel d={d}>Description <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
            <MTextarea value={form.description} onChange={set("description")} placeholder="Brief description..." d={d}/>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-5 flex-shrink-0"
          style={{ borderTop:`1px solid ${d.modalFtrBdr}`, backgroundColor:d.modalFtr }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg} onMouseLeave={e=>e.currentTarget.style.backgroundColor=d.inputBg}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isUploading || isSaving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background:`linear-gradient(135deg,${DG},${G})` }}>
            {isSaving ? "Adding..." : "Add Product"}
          </button>
        </div>
      </div>
      
      {lightboxSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ backgroundColor:"rgba(0,0,0,0.85)" }} onClick={()=>setLightboxSrc(null)}>
          <FallbackImage src={lightboxSrc} alt="Enlarged" className="max-w-3xl w-full max-h-[78vh] object-contain rounded-xl" fallbackSrc={PLACEHOLDER_IMAGE}/>
        </div>
      )}
    </div>,
    document.body
  )
}

// ── Edit Product Modal ────────────────────────────────────────────────────────
function EditProductModal({ product, onClose, onSave, categories, products = [] }) {
  const d = useAdminTokens()
  
  const [form, setForm] = useState({
    name: product.name || "",
    group: product.product_group || "floral",
    category: product.category || "",
    productType: product.product_type || "",
    price: product.price ? String(product.price) : "",
    availability: !product.is_available ? "Out of Stock" : product.stock <= (product.reorder_point || 10) ? "Limited" : "Available",
    status: product.status === "active" || product.status === "Active" ? "Active" : "Inactive",
    description: product.description || "", 
    image_url: product.image_url || "",
    season_key: product.season_key || "", 
    limited_start_at: product.limited_start_at || "", 
    limited_end_at: product.limited_end_at || "",
    stock: product.stock ?? 0,
    is_visible: product.is_visible ?? true,
    composition: product.composition || [],
    occasions: product.occasions || [],
    branches: product.branches || []
  })

  const [compSelection, setCompSelection] = useState("");
  const [compQty, setCompQty] = useState(1);
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);

  const [errors, setErrors] = useState({})
  const [isUploading, setUploading] = useState(false)
  const [removeImage, setRemoveImage] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const set = key => val => setForm(f=>({...f,[key]:val}))

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  let maxFeasibleStock = null;
  if (form.composition.length > 0) {
    maxFeasibleStock = Infinity;
    form.composition.forEach(item => {
      const invProduct = products.find(p => p.id === item.product_id);
      const availableStock = invProduct ? invProduct.stock : 0;
      const possibleArrangements = Math.floor(availableStock / item.quantity);
      if (possibleArrangements < maxFeasibleStock) {
        maxFeasibleStock = possibleArrangements;
      }
    });
    if (maxFeasibleStock === Infinity) maxFeasibleStock = 0;
  }

  const validate = () => {
    const err={}
    if (!form.name.trim()) err.name="Product name is required"
    if (!form.category.trim()) err.category="Category is required"
    if (!form.price||isNaN(form.price)||+form.price<=0) err.price="Enter a valid price"
    if (maxFeasibleStock !== null && Number(form.stock) > maxFeasibleStock) {
      err.stock = `Insufficient raw materials. Max possible: ${maxFeasibleStock}`
    }
    return err
  }

  const toggleBranch = (branch) => {
    setForm(prev => ({
      ...prev,
      branches: prev.branches.includes(branch) 
        ? prev.branches.filter(b => b !== branch) 
        : [...prev.branches, branch]
    }));
  };

  const toggleOccasion = (occasion) => {
    setForm(prev => {
      const isSelected = prev.occasions.includes(occasion);
      if (isSelected) {
        return { ...prev, occasions: prev.occasions.filter(o => o !== occasion) };
      } else {
        return { ...prev, occasions: [...prev.occasions, occasion] };
      }
    });
  };

  const handleAddCompositionItem = () => {
    if (!compSelection || compQty <= 0) return;
    const material = products.find(p => p.id === compSelection);
    if (!material) return;
    if (compQty > material.stock) {
      alert(`Inventory limit reached! You only have ${material.stock} pieces of "${material.name}" in the warehouse.`);
      return;
    }
    if (form.composition.some(item => item.product_id === material.id)) {
      alert("This material is already in the recipe!");
      return;
    }
    setForm(prev => ({
      ...prev,
      composition: [
        ...prev.composition, 
        { product_id: material.id, name: material.name, quantity: compQty }
      ]
    }));
    setCompSelection("");
    setCompQty(1);
  };

  const handleRemoveCompositionItem = (idToRemove) => {
    setForm(prev => ({
      ...prev,
      composition: prev.composition.filter(item => item.product_id !== idToRemove)
    }));
  };

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
    if (isSaving) return;
    const err = validate(); 
    if (Object.keys(err).length) { setErrors(err); return; }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", (form.name || "").trim());
      fd.append("group", (form.group || "floral").toLowerCase().trim());
      fd.append("category", (form.category || "").toLowerCase().trim());
      fd.append("product_type", (form.productType || "").toLowerCase().trim());
      fd.append("price", String(form.price));
      fd.append("status", (form.status || "active").toLowerCase());
      fd.append("is_available", form.availability !== "Out of Stock" ? "true" : "false");
      if (form.description) fd.append("description", form.description.trim());
      if (form.image_url) fd.append("image_url", form.image_url);
      fd.append("stock", String(form.stock));
      fd.append("is_visible", form.is_visible ? "true" : "false");
      if (form.season_key?.trim()) {
        fd.append("season_key", form.season_key.toLowerCase().trim());
        if (form.limited_start_at) fd.append("limited_start_at", form.limited_start_at);
        if (form.limited_end_at) fd.append("limited_end_at", form.limited_end_at);
      }
      fd.append("composition", JSON.stringify(form.composition));
      
      if (form.occasions.length > 0) fd.append("occasions", JSON.stringify(form.occasions));
      
      // 🚀 APPPEND BRANCHES TO THE PUT REQUEST
      if (form.branches.length > 0) fd.append("branches", JSON.stringify(form.branches));

      const res = await api.updateProduct(product.id, fd);
      onSave(res.product); 
      onClose();
    } catch (e) {
      console.error("API Error:", e);
      alert("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsSaving(false);
    }
  }

  const previewUrl = removeImage ? "" : (form.image_url || getProductImage(product))
  const floralMaterials = products.filter(p => p.group?.toLowerCase() === 'floral' || p.category?.toLowerCase() === 'flower');
  const nonFloralMaterials = products.filter(p => p.group?.toLowerCase() !== 'floral' && p.category?.toLowerCase() !== 'flower');
  const selectedMaterial = products.find(p => p.id === compSelection);

  const MaterialDropdownRow = ({ p }) => {
    const isOut = p.stock === 0;
    const isLow = p.stock > 0 && p.stock <= 5;
    return (
      <div 
        onClick={() => {
          if (isOut) return;
          setCompSelection(p.id);
          setIsMaterialDropdownOpen(false);
        }}
        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isOut ? "opacity-50" : ""}`}
        style={{ borderBottom: `1px solid ${d.divider}`, backgroundColor: isOut ? (d.isDark ? "#0f172a" : "#f9fafb") : "transparent" }}
        onMouseEnter={e => !isOut && (e.currentTarget.style.backgroundColor = d.rowHov)}
        onMouseLeave={e => !isOut && (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <FallbackImage src={getProductImage(p)} fallbackSrc={PLACEHOLDER_IMAGE} className="w-8 h-8 rounded object-cover shadow-sm" style={{ border: `1px solid ${d.cardBdr}` }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: d.cellC }}>{p.name}</p>
          <p className="text-[10px] uppercase font-bold mt-0.5 truncate" style={{ color: isOut ? "#ef4444" : isLow ? "#d97706" : "#16a34a" }}>
            {isOut ? "Out of Stock" : isLow ? `Low Stock (${p.stock})` : `${p.stock} Available`}
          </p>
        </div>
      </div>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor:d.overlayBg, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", zIndex:9999, top:0, left:0, width:"100vw", height:"100vh" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="rounded-xl w-full overflow-hidden flex flex-col"
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

        <div className="overflow-y-auto p-6 space-y-4 flex-1 relative">
          <div>
            <MLabel d={d}>Product Image <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
            {(!previewUrl || previewUrl===PLACEHOLDER_IMAGE) && (
              <label className="flex flex-col items-center justify-center w-full rounded-lg cursor-pointer transition-all"
                style={{ border:`2px dashed ${d.inputBdr}`, backgroundColor:d.inputBg, padding:"24px 16px" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#4ade80"; e.currentTarget.style.backgroundColor=d.isDark?"rgba(74,222,128,0.06)":"#f0fdf4"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=d.inputBdr; e.currentTarget.style.backgroundColor=d.inputBg}}>
                <svg className="w-8 h-8 mb-2" style={{ color:d.subC }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-semibold" style={{ color:d.cellC }}>Upload an image</span>
                <span className="text-xs mt-0.5" style={{ color:d.subC }}>PNG, JPG or WEBP. Click to browse.</span>
                <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} className="hidden"/>
              </label>
            )}
            {isUploading && <p className="text-xs mt-2 animate-pulse" style={{ color:"#4ade80" }}>Uploading...</p>}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Group</MLabel>
                <span className="text-[10px] font-semibold" style={{ color: d.subC }}>Top level</span>
              </div>
              <MSel value={form.group} onChange={set("group")} options={["floral", "non-floral"]} d={d}/>
            </div>
            
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Category <span style={{ color:"#f87171" }}>*</span></MLabel>
                <span className="text-[10px] font-semibold" style={{ color: d.subC }}>Main Navigation</span>
              </div>
              <MSel value={form.category} onChange={set("category")} options={["", ...categories]} d={d}/>
              {errors.category && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.category}</p>}
            </div>

            <div>
              <div className="flex items-end justify-between mb-1.5">
                <MLabel d={d}>Type</MLabel>
                <span className="text-[10px] font-semibold" style={{ color:"#4ade80" }}>Sub-tag (e.g. Rose)</span>
              </div>
              <MInput value={form.productType} onChange={set("productType")} placeholder="e.g. Rose" d={d}/>
            </div>
          </div>

          <div>
            <MLabel d={d}>Status</MLabel>
            <MSel value={form.status} onChange={set("status")} options={STATUSES} d={d}/>
          </div>

          <div>
            <MLabel d={d}>Base Selling Price (₱) <span style={{ color:"#f87171" }}>*</span></MLabel>
            <MInput type="number" value={form.price} onChange={set("price")} placeholder="999" error={errors.price} d={d}/>
            {errors.price && <p className="text-[11px] mt-1" style={{ color:"#f87171" }}>{errors.price}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <MLabel d={d}>Stock Quantity <span style={{ color:"#f87171" }}>*</span></MLabel>
              <MInput type="number" value={form.stock} onChange={set("stock")} placeholder="0" error={errors.stock} d={d}/>
              
              {maxFeasibleStock !== null && (
                <div className="mt-1.5 flex items-start gap-1.5">
                  <span className="text-[10px] mt-0.5">
                    {Number(form.stock) > maxFeasibleStock ? '❌' : '✅'}
                  </span>
                  <span className="text-[10px] leading-tight" style={{ color: Number(form.stock) > maxFeasibleStock ? "#ef4444" : d.subC }}>
                    Max feasible based on recipe: <strong>{maxFeasibleStock}</strong>
                  </span>
                </div>
              )}
              {errors.stock && <p className="text-[11px] mt-1 font-bold" style={{ color:"#f87171" }}>{errors.stock}</p>}
            </div>

            <div>
              <MLabel d={d}>Availability</MLabel>
              <div className="flex gap-1">
                {AVAILABILITIES.map(a => (
                  <button key={a} type="button" onClick={()=>set("availability")(a)}
                    className="flex-1 py-2 text-[10px] font-bold rounded-md border transition-all"
                    style={{ backgroundColor:form.availability===a?DG:d.inputBg, color:form.availability===a?"white":d.subC, borderColor:form.availability===a?DG:d.inputBdr }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <MLabel d={d}>Visibility</MLabel>
            <div className="flex items-start space-x-3 mt-2 p-3 rounded-lg" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f9fafb", border: `1px solid ${d.inputBdr}` }}>
              <input 
                type="checkbox" 
                id="edit_is_visible" 
                checked={form.is_visible} 
                onChange={(e) => set("is_visible")(e.target.checked)} 
                className="mt-0.5 h-4 w-4 text-green-600 rounded cursor-pointer" 
              />
              <div className="flex flex-col">
                <label htmlFor="edit_is_visible" className="text-sm font-semibold cursor-pointer" style={{ color: d.headC }}>Show on Customer Storefront</label>
                <span className="text-xs mt-0.5" style={{ color: d.subC }}>Uncheck this if the item is a raw material used only for custom AI arrangements.</span>
              </div>
            </div>
          </div>

          {/* 🚀 OCCASIONS SELECTION GRID */}
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${d.inputBdr}` }}>
            <MLabel d={d}>Occasions (Optional)</MLabel>
            <p className="text-xs mb-3" style={{ color: d.subC }}>
              Select all occasions this product is suitable for.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OCCASIONS_LIST.map((occ) => (
                <label key={occ} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={form.occasions.includes(occ)}
                    onChange={() => toggleOccasion(occ)}
                    className="rounded text-green-600 focus:ring-green-500 bg-white border-gray-300"
                  />
                  <span className="text-xs font-medium" style={{ color: d.cellC }}>{occ}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 🚀 BRANCHES SELECTION GRID */}
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${d.inputBdr}` }}>
            <MLabel d={d}>Available Branches <span style={{ color:"#f87171" }}>*</span></MLabel>
            <p className="text-xs mb-3" style={{ color: d.subC }}>
              Select which fulfillment centers carry this product.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Manila", "Pampanga"].map((branch) => (
                <label key={branch} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={form.branches.includes(branch)}
                    onChange={() => toggleBranch(branch)}
                    className="rounded text-green-600 focus:ring-green-500 bg-white border-gray-300"
                  />
                  <span className="text-xs font-medium" style={{ color: d.cellC }}>{branch}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: d.isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${d.inputBdr}` }}>
            <MLabel d={d}>Arrangement Recipe (Optional)</MLabel>
            <p className="text-xs mb-4" style={{ color: d.subC }}>
              If this product is made of other items (like stems and vases), add them here so inventory updates automatically when purchased.
            </p>

            <div className="flex items-start gap-2 mb-4">
              
              <div className="flex-1 relative">
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: d.labelC }}>Material</span>
                
                <div onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                  className="w-full px-3 py-2 text-sm border rounded-md outline-none flex items-center justify-between cursor-pointer transition-all h-[42px]"
                  style={{ 
                    borderColor: isMaterialDropdownOpen ? "#4ade80" : d.inputBdr, 
                    backgroundColor: d.inputBg, 
                    boxShadow: isMaterialDropdownOpen ? "0 0 0 2px rgba(74,222,128,0.18)" : "none" 
                  }}>
                  {selectedMaterial ? (
                    <div className="flex items-center gap-2">
                      <FallbackImage src={getProductImage(selectedMaterial)} fallbackSrc={PLACEHOLDER_IMAGE} className="w-6 h-6 rounded object-cover shadow-sm" style={{ border: `1px solid ${d.cardBdr}` }}/>
                      <span className="font-semibold truncate" style={{ color: d.cellC }}>{selectedMaterial.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: d.subC }}>Select a material...</span>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${isMaterialDropdownOpen ? "rotate-180" : ""}`} style={{ color: d.subC }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>

                {isMaterialDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMaterialDropdownOpen(false)} />
                    
                    <div className="absolute left-0 right-0 top-[65px] z-50 rounded-lg border shadow-xl overflow-y-auto"
                      style={{ maxHeight: "260px", backgroundColor: d.modalBg, borderColor: d.inputBdr }}>
                      
                      <div className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider z-10"
                        style={{ backgroundColor: d.hdrBg, color: d.subC, borderBottom: `1px solid ${d.divider}` }}>
                        🌸 Floral Materials
                      </div>
                      {floralMaterials.map(p => <MaterialDropdownRow key={p.id} p={p} />)}
                      {floralMaterials.length === 0 && <p className="px-3 py-2 text-xs" style={{ color: d.subC }}>No floral items found.</p>}

                      <div className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider z-10"
                        style={{ backgroundColor: d.hdrBg, color: d.subC, borderTop: `1px solid ${d.divider}`, borderBottom: `1px solid ${d.divider}` }}>
                        🎀 Non-Floral / Accessories
                      </div>
                      {nonFloralMaterials.map(p => <MaterialDropdownRow key={p.id} p={p} />)}
                      {nonFloralMaterials.length === 0 && <p className="px-3 py-2 text-xs" style={{ color: d.subC }}>No accessories found.</p>}
                    </div>
                  </>
                )}
              </div>

              <div className="w-20">
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: d.labelC }}>Qty</span>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedMaterial ? selectedMaterial.stock : 1} 
                  value={compQty} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    const maxAvailable = selectedMaterial ? selectedMaterial.stock : 1;
                    setCompQty(val > maxAvailable ? maxAvailable : val);
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-md outline-none text-center h-[42px]"
                  style={{ borderColor:d.inputBdr, backgroundColor:d.inputBg, color:d.inputTxt }} 
                />
              </div>
              
              <button type="button" onClick={handleAddCompositionItem}
                disabled={!compSelection || selectedMaterial?.stock === 0}
                className="px-4 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-[18px]"
                style={{ background:`linear-gradient(135deg,${DG},${G})`, height: "42px" }}>
                Add
              </button>
            </div>

            {form.composition.length > 0 && (
              <div className="space-y-2 mt-4 pt-4" style={{ borderTop: `1px solid ${d.divider}` }}>
                {form.composition.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-2 rounded-lg border" style={{ backgroundColor: d.cardBg, borderColor: d.cardBdr }}>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold" style={{ backgroundColor: `${G}15`, color: G }}>
                        {item.quantity}x
                      </span>
                      <span className="text-sm font-semibold" style={{ color: d.cellC }}>{item.name}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveCompositionItem(item.product_id)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <MLabel d={d}>Description <span style={{ color:d.subC, fontWeight:400 }}>(optional)</span></MLabel>
            <MTextarea value={form.description} onChange={set("description")} placeholder="Brief description..." d={d}/>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-5 flex-shrink-0"
          style={{ borderTop:`1px solid ${d.modalFtrBdr}`, backgroundColor:d.modalFtr }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-md transition-all"
            style={{ borderColor:d.inputBdr, color:d.subC, backgroundColor:d.inputBg }}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=d.hdrBg} onMouseLeave={e=>e.currentTarget.style.backgroundColor=d.inputBg}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isUploading || isSaving}
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
    </div>,
    document.body
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
    { label:"Occasions",    value:product.occasions?.length > 0 ? product.occasions.join(", ") : "—" }, 
    { label:"Branches",     value:product.branches?.length > 0 ? product.branches.join(", ") : "—" }, // 🚀 ADDED TO VIEW
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
              <p className="text-sm font-semibold" style={{ color:d.cellC, textTransform: row.capitalize ? 'capitalize' : 'none' }}>{row.value}</p>
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
      const productsRes = await api.getAdminProducts();
      const prods = productsRes.data || productsRes
      setProducts(prods);
      setLowCount(prods.filter(p => p.stock<=(p.reorder_point||10)).length);
      setTotalCount(prods.length);
    } catch (e) { 
      console.error("Failed to fetch products",e);
    } finally { 
      setLoading(false);
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPage(1) }, [search,category,status,priceSort])

  const handleSave     = p => { setProducts(prev=>[p,...prev]); setTotalCount(c=>c+1) }
  const handleEditSave = p => { setProducts(prev=>prev.map(x=>x.id===p.id?p:x)); setEditingProduct(null) }

  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/products/admin/${id}`); 
      if (response.delete_type === "hard") {
        setProducts(prev => prev.filter(p => p.id !== id));
        setTotalCount(c => c - 1); 
      } else {
        setProducts(prev => prev.map(p => 
          p.id === id ? { ...p, status: "inactive", is_available: false } : p
        ));
      }
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

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold" style={{ color:d.headC }}>Products</h1>
        <FlowerLoader message="Loading products..." isDark={isDark}/>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {showModal && <AddProductModal onClose={()=>setShowModal(false)} onSave={handleSave} categories={dynamicCategories} products={products}/>}
      {editingProduct && <EditProductModal product={editingProduct} onClose={()=>setEditingProduct(null)} onSave={handleEditSave} categories={dynamicCategories} products={products}/>}
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