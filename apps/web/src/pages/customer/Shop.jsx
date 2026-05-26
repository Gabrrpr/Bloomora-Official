import { useState, useEffect, useRef } from "react"
import ProductPreviewModal from "../../components/ProductPreviewModal.jsx"
import Footer from "../../components/Footer.jsx"
import FallbackImage from "../../components/FallbackImage.jsx"
import { api } from "../../services/api.js"

const G  = "#2E8B34"
const DG = "#0C573E"

const RIBBON_COLORS = {
  "Best Seller":"#2E8B34", "Top Pick":"#0C573E", "New":"#3b82f6",
  "Popular":"#f59e0b", "Premium":"#7c3aed", "Rare Find":"#ec4899",
}

const PRICE_RANGES = [[0,500],[500,1000],[1000,1500],[1500,2500]]
const SORT_OPTIONS = [
  { value:"best-selling", label:"Best Selling" },
  { value:"price-asc",    label:"Price: Low to High" },
  { value:"price-desc",   label:"Price: High to Low" },
  { value:"rating",       label:"Top Rated" },
  { value:"newest",       label:"Newest" },
]

const discount = (orig, price) => Math.round((1 - price / orig) * 100)

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
  return (
    <div className="bg-white flex group hover:shadow-md transition-shadow duration-200"
      style={{ border:"1px solid #e8edf0", borderRadius:"12px", overflow:"hidden", cursor:"pointer", height:"210px" }}
      onClick={() => onPreview(product)}>
      <div className="relative flex-shrink-0" style={{ width:"210px", height:"100%", backgroundColor:"#f8fafb" }}>
        <FallbackImage
          src={product.image}
          alt={product.name}
          fallbackSrc="/EstingsLogo.svg"
          className="group-hover:scale-105 transition-transform duration-500"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        />
        {product.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white shadow"
              style={{ backgroundColor:RIBBON_COLORS[product.ribbon], clipPath:"polygon(0 0, calc(100% - 7px) 0, 100% 50%, calc(100% - 7px) 100%, 0 100%)", padding:"3px 16px 3px 10px" }}>
              {product.ribbon}
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow" style={{ backgroundColor:DG }}>
          -{discount(product.original, product.price)}%
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center" style={{ padding:"20px 28px", minWidth:0 }}>
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest mb-2 px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor:"#f0fdf4", color:G, width:"fit-content" }}>{product.category}</span>
        <h3 style={{ fontSize:"16px", fontWeight:700, color:"#111827", margin:"0 0 8px", lineHeight:1.25 }}>{product.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <Stars rating={product.rating} size="md"/>
          <span style={{ fontSize:"13px", fontWeight:600, color:"#374151" }}>{product.rating}</span>
          <span style={{ fontSize:"13px", color:"#9ca3af" }}>({product.reviews.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:G }}/>
          <span style={{ fontSize:"12px", color:"#6b7280" }}>In Stock · Ready to deliver</span>
        </div>
      </div>
      <div className="flex flex-col justify-between flex-shrink-0" style={{ width:"190px", padding:"20px 22px" }}>
        <div className="flex justify-end">
          <WishlistBtn id={product.id} wishlist={wishlist} toggleWishlist={toggleWishlist}/>
        </div>
        <div>
          <div style={{ fontSize:"24px", fontWeight:800, color:G, lineHeight:1, marginBottom:"3px" }}>
            ₱{product.price.toLocaleString()}
          </div>
          <div style={{ fontSize:"13px", color:"#9ca3af", textDecoration:"line-through" }}>
            ₱{product.original.toLocaleString()}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onPreview(product) }}
          className="w-full flex items-center justify-center gap-1.5 text-white rounded-lg transition-all"
          style={{ backgroundColor:G, padding:"9px 12px", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor=DG}
          onMouseLeave={e => e.currentTarget.style.backgroundColor=G}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Details
        </button>
      </div>
    </div>
  )
}

function ListCardMobile({ product, wishlist, toggleWishlist, onPreview }) {
  const wishlisted = wishlist.includes(product.id)
  return (
    <div
      className="bg-white flex group transition-shadow duration-200 hover:shadow-sm"
      style={{ border:"1px solid #e8edf0", borderRadius:"12px", overflow:"hidden", cursor:"pointer", alignItems:"stretch" }}
      onClick={() => onPreview(product)}
    >
      <div className="relative flex-shrink-0" style={{ width:"108px", minHeight:"108px", backgroundColor:"#f8fafb", position:"relative" }}>
        <FallbackImage
          src={product.image}
          alt={product.name}
          fallbackSrc="/EstingsLogo.svg"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        />
        {product.ribbon && (
          <div className="absolute top-2 left-0 z-10">
            <div className="text-[9px] font-bold text-white"
              style={{ backgroundColor:RIBBON_COLORS[product.ribbon], clipPath:"polygon(0 0,calc(100% - 5px) 0,100% 50%,calc(100% - 5px) 100%,0 100%)", padding:"2px 10px 2px 7px" }}>
              {product.ribbon}
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor:DG }}>
          -{discount(product.original, product.price)}%
        </div>
      </div>
      <div style={{ flex:1, minWidth:0, padding:"11px 12px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:"9px", fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:G, margin:"0 0 3px" }}>
            {product.category}
          </p>
          <p style={{ fontSize:"13px", fontWeight:600, color:"#111827", lineHeight:1.3, margin:"0 0 5px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {product.name}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            <Stars rating={product.rating}/>
            <span style={{ fontSize:"11px", color:"#9ca3af" }}>({product.reviews})</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"6px", marginTop:"8px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"4px" }}>
            <span style={{ fontSize:"15px", fontWeight:800, color:G, lineHeight:1 }}>₱{product.price.toLocaleString()}</span>
            <span style={{ fontSize:"11px", color:"#9ca3af", textDecoration:"line-through" }}>₱{product.original.toLocaleString()}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
            <button onClick={e => { e.stopPropagation(); onPreview(product) }}
              style={{ display:"inline-flex", alignItems:"center", gap:"4px", backgroundColor:G, color:"white", fontSize:"11px", fontWeight:700, padding:"6px 11px", borderRadius:"8px", border:"none", cursor:"pointer", lineHeight:1, flexShrink:0 }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor=DG}
              onMouseLeave={e => e.currentTarget.style.backgroundColor=G}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              View
            </button>
            <button onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
              style={{ width:"30px", height:"30px", borderRadius:"8px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:wishlisted?"#fef2f2":"#f3f4f6", border:wishlisted?"1px solid #fecaca":"1px solid #e5e7eb", cursor:"pointer" }}>
              <svg width="13" height="13" fill={wishlisted?"#e11d48":"none"} stroke={wishlisted?"#e11d48":"#9ca3af"} strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GridCard({ product, wishlist, toggleWishlist, onPreview }) {
  return (
    <div className="bg-white group hover:shadow-lg transition-shadow duration-200"
      style={{ border:"1px solid #e5e7eb", borderRadius:"8px", overflow:"hidden", cursor:"pointer" }}
      onClick={() => onPreview(product)}>
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio:"1/1" }}>
        <FallbackImage
          src={product.image}
          alt={product.name}
          fallbackSrc="/EstingsLogo.svg"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor:RIBBON_COLORS[product.ribbon], clipPath:"polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)", padding:"3px 16px 3px 9px" }}>
              {product.ribbon}
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5" style={{ backgroundColor:DG, borderRadius:"4px" }}>
          -{discount(product.original, product.price)}%
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold" style={{ color:G }}>₱{product.price.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">₱{product.original.toLocaleString()}</span>
          </div>
          <WishlistBtn id={product.id} wishlist={wishlist} toggleWishlist={toggleWishlist} small/>
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug mb-1.5 line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-1 mb-3">
          <Stars rating={product.rating}/>
          <span className="text-xs text-gray-400">{product.rating} ({product.reviews})</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onPreview(product) }}
          className="w-full text-sm font-semibold py-2 text-white transition-all flex items-center justify-center gap-1.5"
          style={{ backgroundColor:G, borderRadius:"6px", border:"none", cursor:"pointer" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor=DG}
          onMouseLeave={e => e.currentTarget.style.backgroundColor=G}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Details
        </button>
      </div>
    </div>
  )
}

function SidebarContent({ categories, activeCategory, setActiveCategory, priceRange, setPriceRange, onClose }) {
  return (
    <div>
      {onClose && (
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-800">Filters</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">Category</p>
        <div className="flex flex-col gap-0.5">
          {categories.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); onClose?.() }}
              className="text-left px-3 py-2 rounded-lg text-sm transition-all capitalize"
              style={{ fontWeight:activeCategory===cat?600:400, color:activeCategory===cat?"white":"#4b5563", backgroundColor:activeCategory===cat?G:"transparent" }}
              onMouseEnter={e => { if (activeCategory!==cat) e.currentTarget.style.backgroundColor="#f3f4f6" }}
              onMouseLeave={e => { if (activeCategory!==cat) e.currentTarget.style.backgroundColor="transparent" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">Price Range</p>
        <div className="flex flex-col gap-0.5">
          {PRICE_RANGES.map(([min, max]) => (
            <button key={`${min}-${max}`} onClick={() => setPriceRange([min, max])}
              className="text-left px-3 py-2 rounded-lg text-sm transition-all"
              style={{ fontWeight:priceRange[0]===min&&priceRange[1]===max?600:400, color:priceRange[0]===min&&priceRange[1]===max?"white":"#4b5563", backgroundColor:priceRange[0]===min&&priceRange[1]===max?G:"transparent" }}
              onMouseEnter={e => { if (priceRange[0]!==min||priceRange[1]!==max) e.currentTarget.style.backgroundColor="#f3f4f6" }}
              onMouseLeave={e => { if (priceRange[0]!==min||priceRange[1]!==max) e.currentTarget.style.backgroundColor="transparent" }}>
              ₱{min.toLocaleString()} – ₱{max.toLocaleString()}
            </button>
          ))}
          <button onClick={() => setPriceRange([0, 2500])}
            className="text-left px-3 py-2 rounded-lg text-sm transition-all"
            style={{ fontWeight:priceRange[0]===0&&priceRange[1]===2500?600:400, color:priceRange[0]===0&&priceRange[1]===2500?"white":"#4b5563", backgroundColor:priceRange[0]===0&&priceRange[1]===2500?G:"transparent" }}
            onMouseEnter={e => { if (priceRange[0]!==0||priceRange[1]!==2500) e.currentTarget.style.backgroundColor="#f3f4f6" }}
            onMouseLeave={e => { if (priceRange[0]!==0||priceRange[1]!==2500) e.currentTarget.style.backgroundColor="transparent" }}>
            All Prices
          </button>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">Availability</p>
        <label className="flex items-center gap-2 cursor-pointer px-1">
          <input type="checkbox" defaultChecked className="w-3.5 h-3.5" style={{ accentColor:G }}/>
          <span className="text-sm text-gray-600">In Stock</span>
        </label>
      </div>
    </div>
  )
}

function MobileFilterDrawer({ open, onClose, categories, activeCategory, setActiveCategory, priceRange, setPriceRange }) {
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
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </>
  )
}

const VIEW_ALL = [
  { key:"list",  mobileVisible:true,  icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg> },
  { key:"grid2", mobileVisible:true,  icon:<svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg> },
  { key:"grid3", mobileVisible:false, icon:<svg className="w-4 h-4" viewBox="0 0 15 15" fill="currentColor"><rect x="0" y="0" width="4" height="6" rx="0.8"/><rect x="5.5" y="0" width="4" height="6" rx="0.8"/><rect x="11" y="0" width="4" height="6" rx="0.8"/><rect x="0" y="8" width="4" height="7" rx="0.8"/><rect x="5.5" y="8" width="4" height="7" rx="0.8"/><rect x="11" y="8" width="4" height="7" rx="0.8"/></svg> },
  { key:"grid4", mobileVisible:false, icon:<svg className="w-4 h-4" viewBox="0 0 18 15" fill="currentColor"><rect x="0" y="0" width="3.5" height="6" rx="0.6"/><rect x="4.8" y="0" width="3.5" height="6" rx="0.6"/><rect x="9.6" y="0" width="3.5" height="6" rx="0.6"/><rect x="14.5" y="0" width="3.5" height="6" rx="0.6"/><rect x="0" y="8" width="3.5" height="7" rx="0.6"/><rect x="4.8" y="8" width="3.5" height="7" rx="0.6"/><rect x="9.6" y="8" width="3.5" height="7" rx="0.6"/><rect x="14.5" y="8" width="3.5" height="7" rx="0.6"/></svg> },
]

export default function Shop({ onNavigate, initialCategory = "All" }) {
  const width    = useWidth()
  const isMobile = width < 768

  const [products, setProducts]               = useState([])
  const [viewAs, setViewAs]                   = useState("grid3")
  const [sortBy, setSortBy]                   = useState("best-selling")
  const [activeCategory, setActiveCategory]   = useState("All")
  const [categoryHierarchy, setCategoryHierarchy] = useState([])
  
  const [priceRange, setPriceRange]           = useState([0, 2500])
  const [wishlist, setWishlist]               = useState([])
  const [sortOpen, setSortOpen]               = useState(false)
  const [filterOpen, setFilterOpen]           = useState(false)
  const [previewProduct, setPreviewProduct]   = useState(null)
  const sortRef = useRef(null)

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    // 1. Fetch Hierarchy (Navbar & Sidebar data)
    api.get("/products/categories/hierarchy") 
      .then(data => {
        if (data) setCategoryHierarchy(data);
      })
      .catch(err => console.error("Failed to load hierarchy", err));

    // 2. Fetch Products safely without crashing if empty
    api.get("/products/")
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map(p => ({
            ...p,
            image: p.image_url || new URL("../../assets/default-img/ImageNotFound.webp", import.meta.url).href,
            original: p.original_price || (p.price * 1.2),
            rating: 5.0,
            reviews: 0,
            ribbon: p.ribbon || null,
          }));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      })
      .catch(err => {
        console.error("Failed to load products", err);
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    if (isMobile && (viewAs === "grid3" || viewAs === "grid4")) setViewAs("grid2")
  }, [isMobile])

  useEffect(() => {
    const h = e => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const toggleWishlist = id => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const normalizeCat = (s) => (s || "").toString().trim().toLowerCase();

  // 🚀 SMART SIDEBAR LOGIC
  const getSidebarCategories = () => {
    const activeNorm = normalizeCat(activeCategory);

    if (!activeNorm || activeNorm === "all") {
      if (categoryHierarchy.length > 0) {
        return ["All", ...categoryHierarchy.map(g => g.title)];
      }
      return ["All"];
    }

    const parentGroup = categoryHierarchy.find(g => normalizeCat(g.title) === activeNorm);
    if (parentGroup && parentGroup.items) {
      return ["All", ...parentGroup.items];
    }

    const parentOfSub = categoryHierarchy.find(g => 
      g.items && g.items.map(normalizeCat).includes(activeNorm)
    );
    if (parentOfSub && parentOfSub.items) {
      return ["All", ...parentOfSub.items];
    }

    return ["All", activeCategory];
  };

  const dynamicCategories = getSidebarCategories();

  // 🚀 SMART FILTER LOGIC
  const filtered = products
    .filter(p => normalizeCat(p.category) !== 'add-on' && normalizeCat(p.category) !== 'addon')
    .filter(p => {
      const activeNorm = normalizeCat(activeCategory);
      const pcNorm = normalizeCat(p.category);

      if (!activeNorm || activeNorm === "all") return true;

      const parentGroup = categoryHierarchy.find(g => normalizeCat(g.title) === activeNorm);
      if (parentGroup && parentGroup.items) {
        const subItemsNorm = parentGroup.items.map(normalizeCat);
        return subItemsNorm.includes(pcNorm) || pcNorm === activeNorm;
      }

      return pcNorm === activeNorm;
    })
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === "price-asc")  return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      if (sortBy === "rating")     return b.rating - a.rating
      if (sortBy === "newest")     return b.id - a.id
      return b.reviews - a.reviews
    })

  const getGridStyle = () => {
    if (viewAs === "list")  return { display:"flex", flexDirection:"column", gap:"10px" }
    if (viewAs === "grid2") return { display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:"12px" }
    if (viewAs === "grid3") return { display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:"12px" }
    if (viewAs === "grid4") return { display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:"12px" }
    return {}
  }

  const currentSortLabel    = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Best Selling"
  const activeFiltersCount  = (activeCategory !== "All" ? 1 : 0) + (priceRange[0] !== 0 || priceRange[1] !== 2500 ? 1 : 0)
  const visibleViews        = VIEW_ALL.filter(v => !isMobile || v.mobileVisible)

  return (
    <div className="min-h-screen bg-white">
      <MobileFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={dynamicCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex gap-6 lg:gap-8">

          <aside className="w-48 flex-shrink-0 hidden lg:block">
            <SidebarContent
              categories={dynamicCategories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          </aside>

          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-4" style={{ borderBottom:"1px solid #f0f0f0" }}>
              <div className="flex items-center gap-2">
                <button onClick={() => setFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 border rounded-lg text-sm text-gray-700 transition-all hover:border-green-400 relative"
                  style={{ borderColor:"#e5e7eb", padding:"6px 10px", height:"32px" }}>
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

                <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor:"#e5e7eb" }}>
                  {visibleViews.map(({ key, icon }, idx) => (
                    <button key={key} onClick={() => setViewAs(key)}
                      style={{ width:"32px", height:"32px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, backgroundColor:viewAs===key?G:"white", color:viewAs===key?"white":"#6b7280", borderRight:idx<visibleViews.length-1?"1px solid #e5e7eb":"none", cursor:"pointer", outline:"none", border:"none", transition:"background 0.15s" }}>
                      {icon}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-gray-400">{filtered.length} items</span>
              </div>

              <div className="relative" ref={sortRef}>
                <button onClick={() => setSortOpen(p => !p)}
                  className="flex items-center gap-2 border rounded-lg text-sm text-gray-700 transition-all hover:border-green-400"
                  style={{ borderColor:sortOpen?G:"#e5e7eb", padding:"6px 10px", height:"32px", minWidth:isMobile?"120px":"140px", justifyContent:"space-between" }}>
                  <span className="text-xs sm:text-sm truncate">{currentSortLabel}</span>
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0 transition-transform" style={{ transform:sortOpen?"rotate(180deg)":"rotate(0)" }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                  </svg>
                </button>

                {sortOpen && (
                  isMobile ? (
                    <div className="fixed bg-white z-[100] shadow-2xl overflow-hidden"
                      style={{ top: sortRef.current ? sortRef.current.getBoundingClientRect().bottom + 4 : 80, right: 16, width:"200px", border:"1px solid #e5e7eb", borderRadius:"12px" }}>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                          className="w-full text-left px-4 py-3 text-sm transition-all"
                          style={{ color:sortBy===opt.value?G:"#4b5563", fontWeight:sortBy===opt.value?600:400, backgroundColor:sortBy===opt.value?"#f0fdf4":"white" }}
                          onMouseEnter={e => { if (sortBy!==opt.value) e.currentTarget.style.backgroundColor="#f9fafb" }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor=sortBy===opt.value?"#f0fdf4":"white" }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute top-full right-0 mt-1 bg-white z-30 w-48 overflow-hidden shadow-lg"
                      style={{ border:"1px solid #e5e7eb", borderRadius:"10px" }}>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-all"
                          style={{ color:sortBy===opt.value?G:"#4b5563", fontWeight:sortBy===opt.value?600:400, backgroundColor:sortBy===opt.value?"#f0fdf4":"white" }}
                          onMouseEnter={e => { if (sortBy!==opt.value) e.currentTarget.style.backgroundColor="#f9fafb" }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor=sortBy===opt.value?"#f0fdf4":"white" }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {isMobile && activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeCategory !== "All" && (
                  <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full capitalize"
                    style={{ backgroundColor:"#f0fdf4", color:G, border:`1px solid ${G}33` }}>
                    {activeCategory}
                    <button onClick={() => setActiveCategory("All")} className="ml-0.5 text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
                {(priceRange[0] !== 0 || priceRange[1] !== 2500) && (
                  <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor:"#f0fdf4", color:G, border:`1px solid ${G}33` }}>
                    ₱{priceRange[0].toLocaleString()}–₱{priceRange[1].toLocaleString()}
                    <button onClick={() => setPriceRange([0, 2500])} className="ml-0.5 text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
              </div>
            )}

            {/* Products */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm mb-3">No products match your filters.</p>
                <button onClick={() => { setActiveCategory("All"); setPriceRange([0, 2500]) }}
                  className="text-sm font-semibold hover:underline" style={{ color:G }}>Clear filters</button>
              </div>
            ) : (
              <div style={getGridStyle()}>
                {filtered.map(product => {
                  if (viewAs === "list") {
                    return isMobile
                      ? <ListCardMobile key={product.id} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreviewProduct}/>
                      : <ListCardDesktop key={product.id} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreviewProduct}/>
                  }
                  return <GridCard key={product.id} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreviewProduct}/>
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>

      {previewProduct && (
        <ProductPreviewModal
          product={{ ...previewProduct, _ribbonColor: RIBBON_COLORS[previewProduct.ribbon] }}
          onClose={() => setPreviewProduct(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}