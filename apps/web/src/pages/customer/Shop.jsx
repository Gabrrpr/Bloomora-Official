import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "../../context/ThemeContext"
import ProductPreviewModal from "../../components/ProductPreviewModal.jsx"
import Footer from "../../components/Footer.jsx"
import FallbackImage from "../../components/FallbackImage.jsx"
import GridCard from "../../components/GridCard.jsx";
import { api } from "../../services/api.js"

const G  = "#2E8B34"
const DG = "#0C573E"

const RIBBON_COLORS = {
  "Best Seller":"#2E8B34", "Top Pick":"#0C573E", "New":"#3b82f6",
  "Popular":"#f59e0b", "Premium":"#7c3aed", "Rare Find":"#ec4899",
}

const SORT_OPTIONS = [
  { value:"best-selling", label:"Best Selling" },
  { value:"price-asc",    label:"Price: Low to High" },
  { value:"price-desc",   label:"Price: High to Low" },
  { value:"rating",       label:"Top Rated" },
  { value:"newest",       label:"Newest" },
]

const discount = (orig, price) => Math.round((1 - price / orig) * 100)

const normalizeFilterValue = value => (value || "").toString().trim().toLowerCase()

const toFilterList = value => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return []

  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Fall back to comma-separated occasion values.
  }

  return trimmed.split(",")
}

const ratingFromProduct = product => Number(product?.average_rating ?? product?.rating ?? 0)
const reviewCountFromProduct = product => Number(product?.review_count ?? product?.reviews ?? 0)

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])
  return w
}

function Stars({ rating, size = "sm" }) {
  const dim = size === "md" ? "w-4 h-4" : "w-3 h-3"
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={dim} fill={i <= Math.floor(rating) ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

function WishlistBtn({ id, wishlist, toggleWishlist, small }) {
  const wishlisted = wishlist.includes(id)
  const sz = small ? "w-7 h-7" : "w-8 h-8"
  return (
    <button onClick={e => { e.stopPropagation(); toggleWishlist(id) }}
      className={`${sz} flex items-center justify-center rounded-lg transition-all flex-shrink-0`}
      style={{ backgroundColor:wishlisted?"#fef2f2":"#f3f4f6", border:wishlisted?"1px solid #fecaca":"1px solid #e5e7eb" }}>
      <svg className="w-3.5 h-3.5" fill={wishlisted?"#e11d48":"none"} stroke={wishlisted?"#e11d48":"#9ca3af"} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    </button>
  )
}

function ListCardDesktop({ product, wishlist, toggleWishlist, onPreview }) {
  const { isDark } = useTheme();
  const currentPrice = Number(product.price) || 0;
  const oldPrice = Number(product.original) || 0;
  const hasDiscount = oldPrice > currentPrice;
  const isOutOfStock = product.stock <= 0 || !product.is_available || product.status === "inactive";
  const lc = {
    bdr: isDark ? "#2d3748" : "#e8edf0", imgBg: isDark ? "#0f172a" : "#f8fafb",
    name: isDark ? "#f1f5f9" : "#111827", sub: isDark ? "#cbd5e1" : "#374151",
    muted: isDark ? "#94a3b8" : "#9ca3af", stock: isDark ? "#94a3b8" : "#6b7280",
    chipBg: isDark ? "rgba(74,222,128,0.12)" : "#f0fdf4", chipC: isDark ? "#4ade80" : G,
  };

  return (
    <div className={`bg-white flex group transition-all duration-200 relative ${isOutOfStock ? "grayscale opacity-75 cursor-not-allowed" : "hover:shadow-md cursor-pointer"}`}
      style={{ border:`1px solid ${lc.bdr}`, borderRadius:"12px", overflow:"hidden", height:"210px" }}
      onClick={() => !isOutOfStock && onPreview(product)}>
      
      {isOutOfStock && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[1px]">
          <span className="bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded shadow-lg tracking-widest uppercase">
            Out of Stock
          </span>
        </div>
      )}

      <div className="relative flex-shrink-0" style={{ width:"210px", height:"100%", backgroundColor:lc.imgBg }}>
        <FallbackImage
          src={product.image}
          alt={product.name}
          fallbackSrc="/EstingsLogo.svg"
          className="group-hover:scale-105 transition-transform duration-500"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        />
        {product.ribbon && !isOutOfStock && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white shadow"
              style={{ backgroundColor:RIBBON_COLORS[product.ribbon], clipPath:"polygon(0 0, calc(100% - 7px) 0, 100% 50%, calc(100% - 7px) 100%, 0 100%)", padding:"3px 16px 3px 10px" }}>
              {product.ribbon}
            </div>
          </div>
        )}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-3 right-3 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow" style={{ backgroundColor:DG }}>
            -{discount(oldPrice, currentPrice)}%
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center relative z-10" style={{ padding:"20px 28px", minWidth:0 }}>
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest mb-2 px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor:lc.chipBg, color:lc.chipC, width:"fit-content" }}>{product.category}</span>
        <h3 style={{ fontSize:"16px", fontWeight:700, color:lc.name, margin:"0 0 8px", lineHeight:1.25 }}>{product.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <Stars rating={product.rating} size="md"/>
          <span style={{ fontSize:"13px", fontWeight:600, color:lc.sub }}>{product.rating}</span>
          <span style={{ fontSize:"13px", color:lc.muted }}>({product.reviews.toLocaleString()})</span>
        </div>
        {!isOutOfStock && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:G }}/>
            <span style={{ fontSize:"12px", color:lc.stock }}>In Stock · Ready to deliver</span>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between flex-shrink-0 relative z-10" style={{ width:"190px", padding:"20px 22px" }}>
        <div className="flex justify-end">
          <WishlistBtn id={product.id} wishlist={wishlist} toggleWishlist={toggleWishlist}/>
        </div>
        <div>
          <div style={{ fontSize:"24px", fontWeight:800, color:G, lineHeight:1, marginBottom:"3px" }}>
            ₱{currentPrice.toLocaleString()}
          </div>
          {hasDiscount && (
            <div style={{ fontSize:"13px", color:lc.muted, textDecoration:"line-through" }}>
              ₱{oldPrice.toLocaleString()}
            </div>
          )}
        </div>
        <button disabled={isOutOfStock} onClick={e => { e.stopPropagation(); onPreview(product) }}
          className="w-full flex items-center justify-center gap-1.5 text-white rounded-lg transition-all"
          style={{ backgroundColor: isOutOfStock ? "#9ca3af" : G, padding:"9px 12px", fontSize:"13px", fontWeight:600, border:"none", cursor: isOutOfStock ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if(!isOutOfStock) e.currentTarget.style.backgroundColor=DG }}
          onMouseLeave={e => { if(!isOutOfStock) e.currentTarget.style.backgroundColor=G }}>
          View Details
        </button>
      </div>
    </div>
  )
}

function ListCardMobile({ product, wishlist, toggleWishlist, onPreview }) {
  const { isDark } = useTheme();
  const wishlisted = wishlist.includes(product.id)
  const currentPrice = Number(product.price) || 0;
  const oldPrice = Number(product.original) || 0;
  const hasDiscount = oldPrice > currentPrice;
  const isOutOfStock = product.stock <= 0 || !product.is_available || product.status === "inactive";
  const lc = {
    bdr: isDark ? "#2d3748" : "#e8edf0", imgBg: isDark ? "#0f172a" : "#f8fafb",
    name: isDark ? "#f1f5f9" : "#111827", muted: isDark ? "#94a3b8" : "#9ca3af",
    wishBg: isDark ? "#0f172a" : "#f3f4f6", wishBdr: isDark ? "#2d3748" : "#e5e7eb",
  };

  return (
    <div
      className={`bg-white flex group transition-all duration-200 relative ${isOutOfStock ? "grayscale opacity-75 cursor-not-allowed" : "hover:shadow-sm cursor-pointer"}`}
      style={{ border:`1px solid ${lc.bdr}`, borderRadius:"12px", overflow:"hidden", alignItems:"stretch" }}
      onClick={() => !isOutOfStock && onPreview(product)}
    >
      {isOutOfStock && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[1px]">
          <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow tracking-widest uppercase">
            Out of Stock
          </span>
        </div>
      )}

      <div className="relative flex-shrink-0" style={{ width:"108px", minHeight:"108px", backgroundColor:lc.imgBg, position:"relative" }}>
        <FallbackImage
          src={product.image}
          alt={product.name}
          fallbackSrc="/EstingsLogo.svg"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        />
        {product.ribbon && !isOutOfStock && (
          <div className="absolute top-2 left-0 z-10">
            <div className="text-[9px] font-bold text-white"
              style={{ backgroundColor:RIBBON_COLORS[product.ribbon], clipPath:"polygon(0 0,calc(100% - 5px) 0,100% 50%,calc(100% - 5px) 100%,0 100%)", padding:"2px 10px 2px 7px" }}>
              {product.ribbon}
            </div>
          </div>
        )}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute bottom-2 right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor:DG }}>
            -{discount(oldPrice, currentPrice)}%
          </div>
        )}
      </div>
      <div className="relative z-10" style={{ flex:1, minWidth:0, padding:"11px 12px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:"9px", fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:G, margin:"0 0 3px" }}>
            {product.category}
          </p>
          <p style={{ fontSize:"13px", fontWeight:600, color:lc.name, lineHeight:1.3, margin:"0 0 5px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {product.name}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            <Stars rating={product.rating}/>
            <span style={{ fontSize:"11px", color:lc.muted }}>({product.reviews})</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifycontent:"space-between", gap:"6px", marginTop:"8px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"4px" }}>
            <span style={{ fontSize:"15px", fontWeight:800, color:G, lineHeight:1 }}>₱{currentPrice.toLocaleString()}</span>
            {hasDiscount && (
              <span style={{ fontSize:"11px", color:lc.muted, textDecoration:"line-through" }}>₱{oldPrice.toLocaleString()}</span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
            <button disabled={isOutOfStock} onClick={e => { e.stopPropagation(); onPreview(product) }}
              style={{ display:"inline-flex", alignItems:"center", gap:"4px", backgroundColor:isOutOfStock?"#9ca3af":G, color:"white", fontSize:"11px", fontWeight:700, padding:"6px 11px", borderRadius:"8px", border:"none", cursor:isOutOfStock?"not-allowed":"pointer", lineHeight:1, flexShrink:0 }}
              onMouseEnter={e => { if(!isOutOfStock) e.currentTarget.style.backgroundColor=DG }}
              onMouseLeave={e => { if(!isOutOfStock) e.currentTarget.style.backgroundColor=G }}>
              View
            </button>
            <button onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
              style={{ width:"30px", height:"30px", borderRadius:"8px", flexShrink:0, display:"flex", alignItems:"center", justifycontent:"center", backgroundColor:wishlisted?(isDark?"rgba(225,29,72,0.15)":"#fef2f2"):lc.wishBg, border:wishlisted?(isDark?"1px solid rgba(225,29,72,0.4)":"1px solid #fecaca"):`1px solid ${lc.wishBdr}`, cursor:"pointer" }}>
              <svg width="13" height="13" fill={wishlisted?"#e11d48":"none"} stroke={wishlisted?"#e11d48":lc.muted} strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarContent({ 
  products, 
  activeCategory, 
  setActiveCategory, 
  activeTypes,
  setActiveTypes,
  priceRange, 
  setPriceRange,
  selectedLocations,
  setSelectedLocations,
  selectedOccasions,
  setSelectedOccasions,
  onClose
}) {
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  const handleLocationChange = (loc) => {
    setSelectedLocations([loc]); // Forces only 1 selection
    localStorage.setItem("bloomora_active_branch", loc); // Saves to local storage
    window.dispatchEvent(new Event("bloomora:branch-updated")); // Broadcasts to Navbar instantly
  };

  const toggleType = (type) => {
    setActiveTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleOccasion = (occ) => {
    const occNorm = normalizeFilterValue(occ);
    setSelectedOccasions(prev => {
      const exists = prev.some(o => normalizeFilterValue(o) === occNorm);
      return exists ? prev.filter(o => normalizeFilterValue(o) !== occNorm) : [...prev, occ];
    });
  };

  const applyPrice = () => {
    const min = minInput ? Number(minInput) : 0;
    const max = maxInput ? Number(maxInput) : 999999;
    setPriceRange([min, max]);
    onClose?.(); // on mobile, close the drawer so the filtered results are visible
  };

  const clearAll = () => {
    setActiveCategory("All");
    setActiveTypes([]);
    setSelectedOccasions([]);
    setPriceRange([0, 999999]);
    setMinInput("");
    setMaxInput("");
  };

  const groupedHierarchy = { floral: {}, 'non-floral': {} };
  
  (products || []).forEach(p => {
    const catNorm = (p.category || "").toLowerCase().trim();
    if (catNorm === 'add-on' || catNorm === 'addon') return;

    const group = (p.product_group || 'floral').toLowerCase().trim();
    const cat = p.category || "Uncategorized";
    const type = p.product_type;
    
    if (!groupedHierarchy[group]) groupedHierarchy[group] = {};
    if (!groupedHierarchy[group][cat]) groupedHierarchy[group][cat] = new Set();
    if (type) groupedHierarchy[group][cat].add(type);
  });

  const occasionMap = new Map();
  (products || []).forEach(p => {
    toFilterList(p.occasions).forEach(occ => {
      const label = (occ || "").toString().trim();
      const key = normalizeFilterValue(label);
      if (key && !occasionMap.has(key)) occasionMap.set(key, label);
    });
  });
  const uniqueOccasions = Array.from(occasionMap.values()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="w-full text-[13px] text-gray-700 font-sans pr-4">
      
      {/* 1. CATEGORIES SECTION */}
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-gray-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7"/></svg>
          All Categories
        </h3>
        
        <button 
          onClick={() => { setActiveCategory("All"); setActiveTypes([]); }}
          className="w-full text-left font-bold mb-4 transition-colors hover:text-[#2E8B34]"
          style={{ color: activeCategory === "All" ? G : "#1f2937" }}>
          All Products
        </button>

        <div className="space-y-6">
          {Object.keys(groupedHierarchy).map(groupName => {
            const categories = Object.keys(groupedHierarchy[groupName]);
            if (categories.length === 0) return null;

            return (
              <div key={groupName}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">
                  {groupName}
                </h4>
                <ul className="space-y-2.5">
                  {categories.map(cat => (
                    <li key={cat}>
                      <button 
                        onClick={() => {
                          setActiveCategory(cat);
                          setActiveTypes([]); 
                        }}
                        className="w-full text-left flex items-center gap-1.5 transition-colors hover:text-[#2E8B34] capitalize"
                        style={{ 
                          color: activeCategory === cat ? G : "#4b5563",
                          fontWeight: activeCategory === cat ? "600" : "500"
                        }}>
                        {activeCategory === cat && (
                          <span style={{ color: G, fontSize: '10px' }}>▶</span>
                        )}
                        {cat}
                      </button>

                      {activeCategory === cat && groupedHierarchy[groupName][cat].size > 0 && (
                        <ul className="mt-2 ml-4 space-y-2 border-l-2 pl-3" style={{ borderColor: "#e5e7eb" }}>
                          {Array.from(groupedHierarchy[groupName][cat]).map(type => (
                            <li key={type} className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id={`type-${type}`}
                                checked={activeTypes.includes(type)}
                                onChange={() => toggleType(type)}
                                className="w-3.5 h-3.5 rounded-sm border-gray-300 cursor-pointer focus:ring-0"
                                style={{ accentColor: G }}
                              />
                              <label htmlFor={`type-${type}`} className="cursor-pointer hover:text-gray-900 capitalize">
                                {type}
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <hr className="my-5 border-gray-200" />

      {/* 2. SEARCH FILTERS SECTION */}
      <div>
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-gray-800 uppercase tracking-wide">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
          Search Filter
        </h3>

        {uniqueOccasions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">Shop By Occasion</h4>
            <ul className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {uniqueOccasions.map(occ => (
                <li key={occ} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id={`sidebar-occ-${occ}`}
                    checked={selectedOccasions.some(o => normalizeFilterValue(o) === normalizeFilterValue(occ))}
                    onChange={() => toggleOccasion(occ)}
                    className="w-3.5 h-3.5 rounded-sm border-gray-300 cursor-pointer focus:ring-0"
                    style={{ accentColor: G }}
                  />
                  <label htmlFor={`sidebar-occ-${occ}`} className="cursor-pointer hover:text-gray-900 text-xs capitalize">
                    {occ}
                  </label>
                </li>
              ))}
            </ul>
            <hr className="my-4 border-gray-100" />
          </div>
        )}

        {/* Shipped From */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-gray-800">Shipped From</h4>
          <ul className="space-y-2.5">
            {["Manila", "Pampanga"].map(loc => (
              <li key={loc} className="flex items-center gap-2 group">
                <input 
                  type="radio" 
                  name="shipped_from_branch"
                  id={`loc-${loc}`}
                  checked={selectedLocations.includes(loc)}
                  onChange={() => handleLocationChange(loc)}
                  className="w-4 h-4 border-gray-300 cursor-pointer focus:ring-0"
                  style={{ accentColor: G }}
                />
                <label htmlFor={`loc-${loc}`} className={`cursor-pointer text-sm transition-colors ${selectedLocations.includes(loc) ? "text-gray-900 font-medium" : "text-gray-600 group-hover:text-gray-900"}`}>
                  {loc}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <hr className="my-4 border-gray-100" />

        {/* Price Range */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-gray-800">Price Range</h4>
          <div className="flex items-center justify-between gap-2 mb-3">
            <input 
              type="number" 
              placeholder="₱ MIN" 
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded shadow-sm outline-none focus:border-green-500"
            />
            <span className="text-gray-400">—</span>
            <input 
              type="number" 
              placeholder="₱ MAX" 
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded shadow-sm outline-none focus:border-green-500"
            />
          </div>
          <button 
            onClick={applyPrice}
            className="w-full py-1.5 text-white font-bold rounded transition-opacity hover:opacity-90 active:scale-95 text-xs tracking-wider"
            style={{ backgroundColor: G }}>
            APPLY
          </button>
        </div>

        {/* Clear All */}
        <button 
          onClick={clearAll}
          className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded transition-colors hover:bg-gray-200 active:scale-95 text-xs tracking-wider border border-gray-200 mt-2">
          CLEAR ALL
        </button>

      </div>
    </div>
  )
}

function MobileFilterDrawer({ open, onClose, products, activeCategory, setActiveCategory, priceRange, setPriceRange, activeTypes, setActiveTypes, selectedLocations, setSelectedLocations, selectedOccasions, setSelectedOccasions }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])
  if (!open) return null
  return (
    <>
      <style>{`@keyframes drawerUp { from { transform:translateY(100%); } to { transform:translateY(0); } }`}</style>
      <div className="fixed inset-0 z-[150] flex flex-col justify-end"
        style={{ backgroundColor:"rgba(0,0,0,0.45)", backdropFilter:"blur(2px)" }}
        onClick={onClose}>
        <div className="bg-white w-full rounded-t-2xl overflow-y-auto"
          style={{ maxHeight:"80vh", animation:"drawerUp 0.28s ease-out both" }}
          onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300"/></div>
          <div style={{ padding:"12px 24px 32px" }}>
            <SidebarContent
              products={products}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              activeTypes={activeTypes}
              setActiveTypes={setActiveTypes}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
              selectedOccasions={selectedOccasions}
              setSelectedOccasions={setSelectedOccasions}
              onClose={onClose}
            />
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 text-white font-bold rounded-xl text-sm tracking-wide active:scale-95 transition-transform"
              style={{ backgroundColor: G }}>
              Show Results
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// 🚀 UPDATED VIEW_ALL TO INCLUDE GRID 5
const VIEW_ALL = [
  { key:"list",  label:"List view",  mobileVisible:true,  icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg> },
  { key:"grid2", label:"2 per row",  mobileVisible:true,  icon:<svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg> },
  { key:"grid3", label:"3 per row",  mobileVisible:false, icon:<svg className="w-4 h-4" viewBox="0 0 15 15" fill="currentColor"><rect x="0" y="0" width="4" height="6" rx="0.8"/><rect x="5.5" y="0" width="4" height="6" rx="0.8"/><rect x="11" y="0" width="4" height="6" rx="0.8"/><rect x="0" y="8" width="4" height="7" rx="0.8"/><rect x="5.5" y="8" width="4" height="7" rx="0.8"/><rect x="11" y="8" width="4" height="7" rx="0.8"/></svg> },
  { key:"grid4", label:"4 per row",  mobileVisible:false, icon:<svg className="w-4 h-4" viewBox="0 0 18 15" fill="currentColor"><rect x="0" y="0" width="3.5" height="6" rx="0.6"/><rect x="4.8" y="0" width="3.5" height="6" rx="0.6"/><rect x="9.6" y="0" width="3.5" height="6" rx="0.6"/><rect x="14.5" y="0" width="3.5" height="6" rx="0.6"/><rect x="0" y="8" width="3.5" height="7" rx="0.6"/><rect x="4.8" y="8" width="3.5" height="7" rx="0.6"/><rect x="9.6" y="8" width="3.5" height="7" rx="0.6"/><rect x="14.5" y="8" width="3.5" height="7" rx="0.6"/></svg> },
  { key:"grid5", label:"5 per row",  mobileVisible:false, icon:<svg className="w-4 h-4" viewBox="0 0 22 15" fill="currentColor"><rect x="0" y="0" width="3.2" height="6" rx="0.6"/><rect x="4.7" y="0" width="3.2" height="6" rx="0.6"/><rect x="9.4" y="0" width="3.2" height="6" rx="0.6"/><rect x="14.1" y="0" width="3.2" height="6" rx="0.6"/><rect x="18.8" y="0" width="3.2" height="6" rx="0.6"/><rect x="0" y="8" width="3.2" height="7" rx="0.6"/><rect x="4.7" y="8" width="3.2" height="7" rx="0.6"/><rect x="9.4" y="8" width="3.2" height="7" rx="0.6"/><rect x="14.1" y="8" width="3.2" height="7" rx="0.6"/><rect x="18.8" y="8" width="3.2" height="7" rx="0.6"/></svg> },
]

function ShopLoader() {
  const petals = [
    { angle: 0,   color: "#f48fb1" },
    { angle: 60,  color: "#ec407a" },
    { angle: 120, color: "#e91e63" },
    { angle: 180, color: "#f06292" },
    { angle: 240, color: "#c2185b" },
    { angle: 300, color: "#f48fb1" },
  ]
  return (
    <div className="w-full py-24 flex flex-col items-center justify-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {petals.map(({ angle, color }, i) => (
          <g key={i} transform={`rotate(${angle} 50 50)`}>
            <ellipse cx="50" cy="27" rx="9.5" ry="21" fill={color}
              style={{ animation: `shopPetalBloom 1.4s ease-in-out ${(i * 0.2).toFixed(2)}s infinite`, animationFillMode: "both" }} />
          </g>
        ))}
        <circle cx="50" cy="50" r="12" fill="#2E8B34" />
        <circle cx="50" cy="50" r="7" fill="#f9c6d0" />
        <circle cx="50" cy="50" r="3.5" fill="#fff" opacity="0.7" />
      </svg>
      <p className="text-sm font-medium tracking-wide" style={{ color: "#6b7280" }}>Loading products...</p>
    </div>
  )
}

export default function Shop({ onNavigate, initialCategory }) {
  const { isDark } = useTheme()
  const width    = useWidth()
  const isMobile = width < 768

  const [products, setProducts]               = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [viewAs, setViewAs]                   = useState("grid4") // 🚀 Default to denser grid now that we support 5
  const [sortBy, setSortBy]                   = useState("best-selling")
  const [activeCategory, setActiveCategory]   = useState("All")
  const [categoryHierarchy, setCategoryHierarchy] = useState([])
  const [activeTypes, setActiveTypes]         = useState([]) 
  const [selectedLocations, setSelectedLocations] = useState(() => {
    const saved = localStorage.getItem("bloomora_active_branch");
    return saved ? [saved] : ["Manila"];
  });
  const [selectedOccasions, setSelectedOccasions] = useState([])
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCampaignKey, setActiveCampaignKey] = useState(() => localStorage.getItem("bloomora_active_campaign") || "")
  const [activeCampaign, setActiveCampaign] = useState(null)

  const [priceRange, setPriceRange]           = useState([0, 999999])
  const [wishlist, setWishlist]               = useState([])
  const [sortOpen, setSortOpen]               = useState(false)
  const [filterOpen, setFilterOpen]           = useState(false)
  const [previewProduct, setPreviewProduct]   = useState(null)
  const sortRef = useRef(null)
  const sortMenuRef = useRef(null)
  const searchInputRef = useRef(null)

  // Typewriter placeholder for the search bar — types a phrase, pauses, deletes,
  // then moves to the next. Driven straight to the DOM (no state) so the whole
  // Shop list doesn't re-render on every keystroke.
  useEffect(() => {
    const PHRASES = [
      "Search for bouquets…",
      "Search for red roses…",
      "Search for birthday flowers…",
      "Search for sunflowers…",
      "Search for anniversary gifts…",
      "Search for get well soon…",
    ]
    let phrase = 0, char = 0, deleting = false, timer
    const tick = () => {
      const el = searchInputRef.current
      const full = PHRASES[phrase % PHRASES.length]
      char += deleting ? -1 : 1
      if (el && !el.value) el.setAttribute("placeholder", full.slice(0, char) || "Search…")
      if (!deleting && char === full.length) { deleting = true; timer = setTimeout(tick, 1500); return }
      if (deleting && char === 0) { deleting = false; phrase++; timer = setTimeout(tick, 350); return }
      timer = setTimeout(tick, deleting ? 38 : 70)
    }
    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleBranchUpdate = () => {
      const saved = localStorage.getItem("bloomora_active_branch");
      if (saved) setSelectedLocations([saved]); 
    };
    window.addEventListener("bloomora:branch-updated", handleBranchUpdate);
    return () => window.removeEventListener("bloomora:branch-updated", handleBranchUpdate);
  }, []);

  useEffect(() => {
    if (activeCampaignKey) {
      setActiveCategory("All")
      setSelectedOccasions([])
      return
    }
    if (initialCategory && initialCategory !== "All") {
      setActiveCategory(initialCategory);
    } 
    else {
      const storedCategory = localStorage.getItem("bloomora_active_category");
      if (storedCategory) {
        const formattedCat = storedCategory.charAt(0).toUpperCase() + storedCategory.slice(1);
        setActiveCategory(formattedCat);
        localStorage.removeItem("bloomora_active_category"); 
      } else {
        setActiveCategory("All");
      }
    }

    const redirectedOccasion = localStorage.getItem("bloomora_active_occasion");
    if (redirectedOccasion) {
      setSelectedOccasions([redirectedOccasion]);
      localStorage.removeItem("bloomora_active_occasion");
    }
  }, [initialCategory, activeCampaignKey]);

  useEffect(() => {
    const handleCampaignUpdate = (event) => {
      const nextKey = event.detail?.campaignKey || localStorage.getItem("bloomora_active_campaign") || ""
      setActiveCampaignKey(nextKey)
      setSearchQuery("")
      setPriceRange([0, 999999])
    }
    window.addEventListener("bloomora:campaign-updated", handleCampaignUpdate)
    return () => window.removeEventListener("bloomora:campaign-updated", handleCampaignUpdate)
  }, [])

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search") || "";
      setSearchQuery(query);
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  useEffect(() => {
    setProductsLoading(true)
    api.get("/products/categories/hierarchy") 
      .then(data => { if (data) setCategoryHierarchy(data); })
      .catch(err => console.error("Failed to load hierarchy", err));

    const productEndpoint = activeCampaignKey
      ? `/products/?campaign_key=${encodeURIComponent(activeCampaignKey)}`
      : "/products/"

    if (activeCampaignKey) {
      api.getActiveCampaigns()
        .then(data => {
          const list = data?.campaigns ? data.campaigns : data || []
          setActiveCampaign(Array.isArray(list) ? list.find(c => c.campaign_key === activeCampaignKey) || null : null)
        })
        .catch(() => setActiveCampaign(null))
    } else {
      setActiveCampaign(null)
    }

    api.get(productEndpoint)
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map(p => ({
            ...p,
            image: p.image_url || new URL("../../assets/default-img/ImageNotFound.webp", import.meta.url).href,
            original: p.original_price || null, 
            rating: ratingFromProduct(p),
            reviews: reviewCountFromProduct(p),
            ribbon: p.ribbon || null,
            search_tags: p.search_tags || p.tags || [],
          }));
          setProducts(mapped);
        } else { setProducts([]); }
      })
      .catch(err => {
        console.error("Failed to load products", err);
        setProducts([]);
      })
      .finally(() => setProductsLoading(false));
  }, [activeCampaignKey]);
  

  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;

    api.getWishlist()
      .then(data => {
        const rawList = Array.isArray(data) ? data : (data?.wishlist || []);
        const ids = rawList
          .map(item => typeof item === "string" ? item : item?.id)
          .filter(Boolean)
          .map(String);
        setWishlist(ids);
      })
      .catch(err => console.error("Failed to load wishlist", err));
  }, []);
  // 🚀 UPDATED MOBILE CHECK TO REVERT GRID 5 AS WELL
  useEffect(() => {
    if (isMobile && (viewAs === "grid3" || viewAs === "grid4" || viewAs === "grid5")) setViewAs("grid2")
  }, [isMobile, viewAs])

  useEffect(() => {
    const h = e => {
      if (sortRef.current?.contains(e.target)) return
      if (sortMenuRef.current?.contains(e.target)) return
      setSortOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const toggleWishlist = async (id) => {
    const productId = String(id);
    const isLoggedIn = !!localStorage.getItem("access_token");

    if (!isLoggedIn) {
      if (onNavigate) onNavigate("login");
      else window.location.href = "/login";
      return;
    }

    try {
      const res = await api.toggleWishlist(productId);

      if (Array.isArray(res?.wishlist)) {
        setWishlist(res.wishlist.map(String));
      } else {
        setWishlist(prev => {
          const exists = prev.includes(productId);
          if (res?.action === "removed" || exists) return prev.filter(item => item !== productId);
          return [...prev, productId];
        });
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      setToast({ key: Date.now(), msg: "Wishlist could not be updated", added: false });
    }
  }
  
  const normalizeCat = (s) => (s || "").toString().trim().toLowerCase();

  const getSidebarCategories = () => {
    const activeNorm = normalizeCat(activeCategory);
    if (!activeNorm || activeNorm === "all") {
      if (categoryHierarchy.length > 0) return ["All", ...categoryHierarchy.map(g => g.title)];
      return ["All"];
    }
    const parentGroup = categoryHierarchy.find(g => normalizeCat(g.title) === activeNorm);
    if (parentGroup && parentGroup.items) return ["All", ...parentGroup.items];
    const parentOfSub = categoryHierarchy.find(g => g.items && g.items.map(normalizeCat).includes(activeNorm));
    if (parentOfSub && parentOfSub.items) return ["All", ...parentOfSub.items];
    return ["All", activeCategory];
  };

  const dynamicCategories = getSidebarCategories();

  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    let alive = true
    const q = (searchQuery || "").trim()

    if (!q || activeCampaignKey) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }

    ;(async () => {
      try {
        setSearchLoading(true)
        const res = await api.get(`/products/search?q=${encodeURIComponent(q)}`)

        if (!alive) return

        const mapped = Array.isArray(res)
          ? res.map(p => ({
              ...p,
              image: p.image_url || p.image || new URL("../../assets/default-img/ImageNotFound.webp", import.meta.url).href,
              rating: ratingFromProduct(p),
              reviews: reviewCountFromProduct(p),
              ribbon: p.ribbon || null,
              original: p.original_price || null,
            }))
          : []

        setSearchResults(mapped)
      } catch (e) {
        console.error("Search fetch failed", e)
        if (alive) setSearchResults([])
      } finally {
        if (alive) setSearchLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [searchQuery, activeCampaignKey])

  const baseList = (searchResults !== null ? searchResults : products)

  const filtered = baseList
  .filter(p => p.is_visible !== false) 
    .map(p => {
      let branchStock = p.stock;
      const locs = selectedLocations.map(l => (l || "").toLowerCase().trim());
      
      if (locs.includes("pampanga") && !locs.includes("manila")) {
        branchStock = p.stock_pampanga !== undefined && p.stock_pampanga !== null ? p.stock_pampanga : p.stock;
      } else if (locs.includes("manila") && !locs.includes("pampanga")) {
        branchStock = p.stock_manila !== undefined && p.stock_manila !== null ? p.stock_manila : p.stock;
      }
      
      return { ...p, stock: branchStock };
    })
    .filter(p => p.is_available === true && p.status !== "inactive")
    .filter(p => normalizeCat(p.category) !== 'add-on' && normalizeCat(p.category) !== 'addon')
    .filter(p => {
      const activeNorm = normalizeCat(activeCategory);
      const pcNorm = normalizeCat(p.category);
      if (!activeNorm || activeNorm === "all") return true;
      const parentGroup = categoryHierarchy.find(g => normalizeCat(g.title) === activeNorm);
      if (parentGroup && parentGroup.items) {
        return parentGroup.items.map(normalizeCat).includes(pcNorm) || pcNorm === activeNorm;
      }
      return pcNorm === activeNorm;
    })
    .filter(p => {
      if (!activeTypes || activeTypes.length === 0) return true;
      return activeTypes.map(normalizeCat).includes(normalizeCat(p.product_type || ""));
    })
    .filter(p => {
      if (!selectedOccasions || selectedOccasions.length === 0) return true;
      const selectedOccsNorm = selectedOccasions.map(normalizeFilterValue).filter(Boolean);
      const productOccsNorm = toFilterList(p.occasions).map(normalizeFilterValue).filter(Boolean);
      return selectedOccsNorm.some(occ => productOccsNorm.includes(occ));
    })
    .filter(p => {
      if (!selectedLocations || selectedLocations.length === 0) return true;
      const selectedLocsNorm = selectedLocations.map(normalizeCat);
      
      const rawBranches = Array.isArray(p.branches) ? p.branches.map(normalizeCat) : [];
      const branches = rawBranches.length === 0 ? ["manila"] : rawBranches;
      return selectedLocsNorm.some(loc => branches.includes(loc));
      })
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      
      const matchName = (p.name || "").toLowerCase().includes(q);
      const matchCat = (p.category || "").toLowerCase().includes(q);
      const matchDesc = (p.description || "").toLowerCase().includes(q);

      const rawTags = p.search_tags ?? p.tags;
      let matchTags = false;
      if (Array.isArray(rawTags)) {
        matchTags = rawTags.some(tag => (tag || "").toLowerCase().includes(q));
      } else if (typeof rawTags === "string") {
        matchTags = rawTags.split(",").some(tag => tag.trim().toLowerCase().includes(q));
      }

      return matchName || matchCat || matchDesc || matchTags;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc")  return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating")     return (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return (b.reviews || 0) - (a.reviews || 0);
    });

  const getGridStyle = () => {
    if (viewAs === "list")  return { display:"flex", flexDirection:"column", gap:"10px" }
    if (viewAs === "grid2") return { display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:"12px", alignItems:"stretch" }
    if (viewAs === "grid3") return { display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:"12px", alignItems:"stretch" }
    if (viewAs === "grid4") return { display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:"12px", alignItems:"stretch" }
    if (viewAs === "grid5") return { display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:"10px", alignItems:"stretch" }
    return {}
  }

  const currentSortLabel    = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Best Selling"
  const activeFiltersCount  = (activeCategory !== "All" ? 1 : 0) + (selectedOccasions.length) + (selectedLocations.length)
  const visibleViews        = VIEW_ALL.filter(v => !isMobile || v.mobileVisible)

  return (
    <div className="min-h-screen bg-white shop-root">
      <style>{`@keyframes shopRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes shopPetalBloom{0%,100%{opacity:0.2}50%{opacity:1}}@keyframes shopToast{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
        /* Dark-mode overrides scoped to the Shop page */
        [data-theme="dark"] .shop-root{background-color:#0f172a;color:#e5e7eb}
        [data-theme="dark"] .shop-root .bg-white{background-color:#1a2332 !important}
        [data-theme="dark"] .shop-root .bg-white\\/30{background-color:rgba(15,23,42,0.5) !important}
        [data-theme="dark"] .shop-root .bg-gray-50{background-color:#162032 !important}
        [data-theme="dark"] .shop-root .bg-gray-100{background-color:#1e293b !important}
        [data-theme="dark"] .shop-root .bg-gray-200{background-color:#334155 !important}
        [data-theme="dark"] .shop-root .bg-gray-300{background-color:#374151 !important}
        [data-theme="dark"] .shop-root .hover\\:bg-gray-200:hover{background-color:#334155 !important}
        [data-theme="dark"] .shop-root .text-gray-900{color:#f1f5f9 !important}
        [data-theme="dark"] .shop-root .text-gray-800{color:#e5e7eb !important}
        [data-theme="dark"] .shop-root .text-gray-700{color:#cbd5e1 !important}
        [data-theme="dark"] .shop-root .text-gray-600{color:#94a3b8 !important}
        [data-theme="dark"] .shop-root .text-gray-500,[data-theme="dark"] .shop-root .text-gray-400{color:#94a3b8 !important}
        [data-theme="dark"] .shop-root .hover\\:text-gray-900:hover{color:#f1f5f9 !important}
        [data-theme="dark"] .shop-root .group:hover .group-hover\\:text-gray-900{color:#f1f5f9 !important}
        [data-theme="dark"] .shop-root .border-gray-200{border-color:#2d3748 !important}
        [data-theme="dark"] .shop-root .border-gray-300{border-color:#374151 !important}
        [data-theme="dark"] .shop-root .border-gray-100{border-color:#1f2937 !important}
        [data-theme="dark"] .shop-root hr{border-color:#2d3748 !important}
        [data-theme="dark"] .shop-root input[type="number"],[data-theme="dark"] .shop-root input[type="text"],[data-theme="dark"] .shop-root input[type="search"]{background-color:#0f172a !important;color:#e5e7eb !important}
        [data-theme="dark"] .shop-root input::placeholder{color:#64748b !important}
      `}</style>
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        products={products}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeTypes={activeTypes}
        setActiveTypes={setActiveTypes}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedLocations={selectedLocations}
        setSelectedLocations={setSelectedLocations}
        selectedOccasions={selectedOccasions}
        setSelectedOccasions={setSelectedOccasions}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8">

          <aside className="w-48 hidden lg:block flex-shrink-0" style={{ animation:"shopRise 0.5s ease 0.05s both" }}>
            <SidebarContent
              products={products} 
              activeCategory={activeCategory} 
              setActiveCategory={setActiveCategory}
              activeTypes={activeTypes}
              setActiveTypes={setActiveTypes}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
              selectedOccasions={selectedOccasions}
              setSelectedOccasions={setSelectedOccasions}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {activeCampaignKey && (
              <div className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                style={{ backgroundColor: isDark?"rgba(74,222,128,0.1)":"#f0fdf4", border:`1px solid ${isDark?"rgba(74,222,128,0.3)":`${G}33`}`, animation:"shopRise 0.5s ease 0.08s both" }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: isDark?"#4ade80":DG }}>{activeCampaign?.name || "Campaign Products"}</p>
                  <p className="text-xs mt-0.5" style={{ color: isDark?"#94a3b8":"#4b5563" }}>
                    Showing products assigned to this campaign{activeCampaign?.discount_value ? ` with ${activeCampaign.discount_type === "percent" ? `${Number(activeCampaign.discount_value)}%` : `PHP ${Number(activeCampaign.discount_value).toLocaleString()}`} off` : ""}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("bloomora_active_campaign")
                    setActiveCampaignKey("")
                    setActiveCampaign(null)
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-md border transition-all"
                  style={{ color: isDark?"#4ade80":DG, borderColor:`${G}55`, backgroundColor: isDark?"#1a2332":"white" }}>
                  View All Products
                </button>
              </div>
            )}
            <div className="relative mb-4" style={{ animation:"shopRise 0.5s ease 0.1s both" }}>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full"
                style={{ backgroundColor: isDark?"rgba(74,222,128,0.14)":"rgba(46,139,52,0.1)", color: isDark?"#4ade80":G }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z"/></svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-12 pr-11 py-3 text-sm rounded-full border-2 outline-none transition-all"
                style={{ borderColor: isDark?"#2d3748":"#e5e7eb", backgroundColor: isDark?"#0f172a":"white", color: isDark?"#e5e7eb":"#111827", boxShadow: isDark?"0 4px 16px rgba(0,0,0,0.3)":"0 4px 16px rgba(12,87,62,0.06)" }}
                onFocus={e => { e.target.style.borderColor=G; e.target.style.boxShadow="0 0 0 4px rgba(74,222,128,0.18)" }}
                onBlur={e => { e.target.style.borderColor=isDark?"#2d3748":"#e5e7eb"; e.target.style.boxShadow=isDark?"0 4px 16px rgba(0,0,0,0.3)":"0 4px 16px rgba(12,87,62,0.06)" }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); window.history.pushState({}, '', window.location.pathname); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                  style={{ color: isDark?"#94a3b8":"#9ca3af", background: isDark?"#1a2332":"#f3f4f6", border:"none", cursor:"pointer" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mb-4 pb-4" style={{ borderBottom:"1px solid #f0f0f0", animation:"shopRise 0.5s ease 0.12s both" }}>
              <div className="flex items-center gap-2">
                <button onClick={() => setFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 border rounded-lg text-sm text-gray-700 transition-all hover:border-green-400 relative"
                  style={{ borderColor: isDark?"#2d3748":"#e5e7eb", padding:"6px 10px", height:"32px" }}>
                  <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                  </svg>
                  <span className="text-xs font-medium">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold text-white rounded-full flex items-center justify-center" style={{ backgroundColor:G }}>
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-0.5 rounded-xl" style={{ backgroundColor: isDark ? "#0f172a" : "#f3f4f6", border: `1px solid ${isDark ? "#2d3748" : "#e5e7eb"}`, padding:"3px" }}>
                  {visibleViews.map(({ key, label, icon }) => {
                    const active = viewAs === key
                    return (
                      <button key={key} onClick={() => setViewAs(key)}
                        title={label} aria-label={label} aria-pressed={active}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#e5e7eb" }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = "transparent" }}
                        style={{
                          width:"30px", height:"28px", display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0, borderRadius:"8px", cursor:"pointer", outline:"none", border:"none",
                          backgroundColor: active ? G : "transparent",
                          color: active ? "white" : (isDark ? "#94a3b8" : "#6b7280"),
                          boxShadow: active ? "0 1px 3px rgba(12,87,62,0.35)" : "none",
                          transform: active ? "scale(1)" : "scale(0.96)",
                          transition:"background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
                        }}>
                        {icon}
                      </button>
                    )
                  })}
                </div>
                <span className="text-xs text-gray-400">{filtered.length} items</span>
              </div>

              <div className="relative z-50" ref={sortRef}>
                <button onClick={() => setSortOpen(p => !p)}
                  className="flex items-center gap-2 border rounded-lg text-sm text-gray-700 transition-all hover:border-green-400"
                  style={{ borderColor:sortOpen?G:(isDark?"#2d3748":"#e5e7eb"), padding:"6px 10px", height:"32px", minWidth:isMobile?"120px":"140px", justifyContent:"space-between" }}>
                  <span className="text-xs sm:text-sm truncate">{currentSortLabel}</span>
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0 transition-transform" style={{ transform:sortOpen?"rotate(180deg)":"rotate(0)" }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </button>

                {sortOpen && createPortal(
                  <div
                    ref={sortMenuRef}
                    className="fixed z-[9999] shadow-2xl overflow-hidden"
                    style={(() => {
                      const rect = sortRef.current?.getBoundingClientRect()
                      const top = rect ? rect.bottom + 4 : 80
                      const bg = isDark ? "#1a2332" : "white"
                      const bdr = `1px solid ${isDark ? "#2d3748" : "#e5e7eb"}`
                      return isMobile
                        ? { top, right: 16, width: 200, border: bdr, borderRadius: 12, backgroundColor: bg }
                        : { top, left: rect ? rect.left : undefined, width: rect ? Math.max(rect.width, 160) : 180, border: bdr, borderRadius: 10, backgroundColor: bg }
                    })()}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm transition-all"
                        style={{ color:sortBy===opt.value?(isDark?"#4ade80":G):(isDark?"#cbd5e1":"#4b5563"), fontWeight:sortBy===opt.value?600:400, backgroundColor:sortBy===opt.value?(isDark?"rgba(74,222,128,0.12)":"#f0fdf4"):(isDark?"#1a2332":"white") }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeCategory !== "All" && (
                  <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full capitalize" style={{ backgroundColor: isDark?"rgba(74,222,128,0.12)":"#f0fdf4", color: isDark?"#4ade80":G, border:`1px solid ${isDark?"rgba(74,222,128,0.3)":`${G}33`}` }}>
                    Category: {activeCategory}
                    <button onClick={() => setActiveCategory("All")} className="ml-0.5 text-green-600 font-bold">×</button>
                  </span>
                )}
                {selectedOccasions.map(occ => (
                  <span key={occ} className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full capitalize" style={{ backgroundColor: isDark?"rgba(74,222,128,0.12)":"#f0fdf4", color: isDark?"#4ade80":G, border:`1px solid ${isDark?"rgba(74,222,128,0.3)":`${G}33`}` }}>
                    Occasion: {occ}
                    <button onClick={() => setSelectedOccasions(prev => prev.filter(o => o !== occ))} className="ml-0.5 text-green-600 font-bold">×</button>
                  </span>
                ))}
              </div>
            )}

            {searchQuery && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => {
                      window.history.pushState({}, '', window.location.pathname);
                      setSearchQuery("");
                    }} 
                    className="ml-0.5 text-blue-600 font-bold hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}

            {(productsLoading || searchLoading) ? (
              <ShopLoader />
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm mb-3">No products match your filters.</p>
                <button onClick={() => { setActiveCategory("All"); setSelectedOccasions([]); setPriceRange([0, 999999]); }}
                  className="text-sm font-semibold hover:underline" style={{ color:G }}>Clear filters</button>
              </div>
            ) : (
              <div style={getGridStyle()}>
                {filtered.map((product, idx) => (
                  <div key={product.id} style={{ animation:`shopRise 0.45s ease ${0.16 + Math.min(idx, 16) * 0.04}s both` }}>
                    {viewAs === "list"
                      ? (isMobile ? <ListCardMobile product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreviewProduct}/> : <ListCardDesktop product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreviewProduct}/>)
                      : <GridCard product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreviewProduct}/>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

<Footer onNavigate={onNavigate}/>
      {previewProduct && (
        <ProductPreviewModal
          product={{ ...previewProduct, _ribbonColor: RIBBON_COLORS[previewProduct.ribbon] }}
          products={products}
          onClose={() => setPreviewProduct(null)}
          onNavigate={(action) => {
            // Support suggestion-click swapping the product preview in-place.
            if (action && typeof action === "object" && action.type === "preview-product" && action.id) {
              const next = products.find(p => String(p.id) === String(action.id));
              if (next) setPreviewProduct(next);
              return;
            }
            // Fallback to the existing page navigation.
            if (typeof onNavigate === "function") onNavigate(action);
          }}
        />
      )}



      {toast && (
        <div
          key={toast.key}
          className="fixed left-1/2 bottom-6 z-[120] flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-xl"
          style={{ background: toast.added ? G : "#374151", animation: "shopToast 0.3s ease both" }}
        >
          <svg className="w-4 h-4" fill={toast.added ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
