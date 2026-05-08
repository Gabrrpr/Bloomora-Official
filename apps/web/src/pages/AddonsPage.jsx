import { useState, useEffect, useRef } from "react"
import ProductPreviewModal from "../components/ProductPreviewModal.jsx"
import Footer from "../components/Footer.jsx"
import { api } from "../services/api.js" // 👈 Added API import

const G  = "#2E8B34"
const DG = "#0C573E"

// ── Dynamic image loader — src/assets/products/addons/ ────────────────────────
const addonImg = (filename) =>
  new URL(`../assets/products/addons/${filename}`, import.meta.url).href

// ── Add-on catalog ────────────────────────────────────────────────────────────
const ALL_ADDONS = [
  { id:1,  image:addonImg("CadburyFruit&Nut.webp"), name:"Cadbury Fruit & Nut",    price:169, original:220, rating:4.8, reviews:94,  ribbon:"Popular",     category:"Cadbury",  brand:"Cadbury",  weight:"90g" },
  { id:2,  image:addonImg("CadburyMilkChoc.webp"),  name:"Cadbury Milk Chocolate", price:149, original:195, rating:4.9, reviews:142, ribbon:"Best Seller", category:"Cadbury",  brand:"Cadbury",  weight:"90g" },
  { id:3,  image:addonImg("ferrero8pcs.webp"),       name:"Ferrero Rocher 8pcs",    price:199, original:260, rating:4.9, reviews:218, ribbon:"Best Seller", category:"Ferrero",  brand:"Ferrero",  weight:"100g" },
  { id:4,  image:addonImg("ferrero12pcs.webp"),      name:"Ferrero Rocher 12pcs",   price:349, original:450, rating:4.9, reviews:183, ribbon:"Popular",      category:"Ferrero",  brand:"Ferrero",  weight:"150g" },
  { id:5,  image:addonImg("ferrero24pcs.webp"),      name:"Ferrero Rocher 24pcs",   price:599, original:780, rating:5.0, reviews:97,  ribbon:"Premium",      category:"Ferrero",  brand:"Ferrero",  weight:"300g" },
  { id:6,  image:addonImg("hersheyCnC.webp"),        name:"Hershey's Cookies & Cream",price:149,original:195,rating:4.7, reviews:76,  ribbon:null,           category:"Hershey's",brand:"Hershey's",weight:"40g" },
  { id:7,  image:addonImg("hersheyOriginal.webp"),   name:"Hershey's Milk Chocolate",price:149,original:195,rating:4.8, reviews:88,  ribbon:null,           category:"Hershey's",brand:"Hershey's",weight:"40g" },
  { id:8,  image:addonImg("M&MsMilkChoc.webp"),      name:"M&M's Milk Chocolate",   price:179, original:230, rating:4.7, reviews:61,  ribbon:null,           category:"M&M's",    brand:"M&M's",    weight:"100g" },
  { id:9,  image:addonImg("M&MsPeanut.webp"),        name:"M&M's Peanut",           price:179, original:230, rating:4.8, reviews:74,  ribbon:"Popular",      category:"M&M's",    brand:"M&M's",    weight:"100g" },
  { id:10, image:addonImg("Snickers.webp"),           name:"Snickers",               price:149, original:195, rating:4.6, reviews:52,  ribbon:null,           category:"Other",    brand:"Mars",    weight:"50g" },
  { id:11, image:addonImg("Toblerone.webp"),          name:"Toblerone",              price:199, original:260, rating:4.9, reviews:109, ribbon:"Popular",      category:"Other",    brand:"Toblerone",weight:"100g" },
  { id:12, image:addonImg("twix.webp"),               name:"Twix",                   price:149, original:195, rating:4.7, reviews:48,  ribbon:null,           category:"Other",    brand:"Mars",    weight:"50g" },
]

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34",
  "Popular":     "#f59e0b",
  "Premium":     "#7c3aed",
}

const SORT_OPTIONS = [
  { value:"featured",   label:"Featured"           },
  { value:"price-asc",  label:"Price: Low to High" },
  { value:"price-desc", label:"Price: High to Low" },
  { value:"rating",     label:"Top Rated"           },
]

const PRICE_RANGES = [[0,150],[150,200],[200,400],[400,700]]

const discount = (orig, price) => Math.round((1 - price / orig) * 100)

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-3 h-3" fill={i <= Math.floor(rating) ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

// ── Wishlist button ───────────────────────────────────────────────────────────
function WishlistBtn({ id, wishlist, toggleWishlist }) {
  const on = wishlist.includes(id)
  return (
    <button
      onClick={e => { e.stopPropagation(); toggleWishlist(id) }}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
      style={{ backgroundColor:on?"#fef2f2":"#f9fafb", border:on?"1px solid #fecaca":"1px solid #e5e7eb" }}>
      <svg className="w-4 h-4" fill={on?"#e11d48":"none"} stroke={on?"#e11d48":"#9ca3af"} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    </button>
  )
}

// ── List card ─────────────────────────────────────────────────────────────────
function ListCard({ addon, wishlist, toggleWishlist, onPreview }) {
  return (
    <div className="bg-white flex group hover:shadow-md transition-shadow duration-200"
      style={{ border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", cursor:"pointer" }}
      onClick={() => onPreview(addon)}>
      <div className="relative flex-shrink-0" style={{ width:180, backgroundColor:"#f9fafb" }}>
        <img src={addon.image} alt={addon.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ display:"block", aspectRatio:"1/1" }}/>
        {addon.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor:RIBBON_COLORS[addon.ribbon], clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)", padding:"3px 16px 3px 9px" }}>
              {addon.ribbon}
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor:DG }}>
          -{discount(addon.original, addon.price)}%
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0" style={{ padding:"16px 20px", gap:6 }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:G, margin:0 }}>{addon.brand || addon.category}</p>
        <p className="text-base font-bold text-gray-900 leading-snug" style={{ margin:0 }}>{addon.name}</p>
        <div className="flex items-center gap-1.5">
          <Stars rating={addon.rating}/>
          <span className="text-xs text-gray-500">{addon.rating}</span>
          <span className="text-xs text-gray-400">({addon.reviews})</span>
        </div>
        <p className="text-xs text-gray-400" style={{ margin:0 }}>{addon.weight || "Standard"}</p>
        <div className="flex items-center justify-between" style={{ marginTop:2 }}>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color:G }}>₱{addon.price.toLocaleString()}</span>
            <span className="text-sm text-gray-400 line-through">₱{addon.original.toLocaleString()}</span>
          </div>
          <WishlistBtn id={addon.id} wishlist={wishlist} toggleWishlist={toggleWishlist}/>
        </div>
        <div style={{ marginTop:6 }}>
          <button onClick={e => { e.stopPropagation(); onPreview(addon) }}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all"
            style={{ backgroundColor:G }}
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
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function GridCard({ addon, wishlist, toggleWishlist, onPreview }) {
  return (
    <div className="bg-white group hover:shadow-lg transition-shadow duration-200"
      style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", cursor:"pointer" }}
      onClick={() => onPreview(addon)}>
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio:"1/1" }}>
        <img src={addon.image} alt={addon.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
        {addon.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white px-3 py-1 shadow-sm"
              style={{ backgroundColor:RIBBON_COLORS[addon.ribbon], clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)", paddingRight:16 }}>
              {addon.ribbon}
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5"
          style={{ backgroundColor:DG, borderRadius:4 }}>
          -{discount(addon.original, addon.price)}%
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold" style={{ color:G }}>₱{addon.price.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">₱{addon.original.toLocaleString()}</span>
          </div>
          <WishlistBtn id={addon.id} wishlist={wishlist} toggleWishlist={toggleWishlist}/>
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug mb-1 line-clamp-2">{addon.name}</p>
        <p className="text-xs text-gray-400 mb-1.5">{addon.weight || "Standard"}</p>
        <div className="flex items-center gap-1 mb-3">
          <Stars rating={addon.rating}/>
          <span className="text-xs text-gray-400">{addon.rating} ({addon.reviews})</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onPreview(addon) }}
          className="w-full text-sm font-semibold py-2 text-white transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor:G, borderRadius:6 }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor=DG}
          onMouseLeave={e => e.currentTarget.style.backgroundColor=G}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Details
        </button>
      </div>
    </div>
  )
}

function SidebarContent({ categories = [], activeCategory, setActiveCategory, priceRange, setPriceRange, onClose }) {
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
            <button key={cat} onClick={() => { setActiveCategory(cat); onClose?.(); }}
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
          <button onClick={() => setPriceRange([0, 700])}
            className="text-left px-3 py-2 rounded-lg text-sm transition-all"
            style={{ fontWeight:priceRange[0]===0&&priceRange[1]===700?600:400, color:priceRange[0]===0&&priceRange[1]===700?"white":"#4b5563", backgroundColor:priceRange[0]===0&&priceRange[1]===700?G:"transparent" }}
            onMouseEnter={e => { if (priceRange[0]!==0||priceRange[1]!==700) e.currentTarget.style.backgroundColor="#f3f4f6" }}
            onMouseLeave={e => { if (priceRange[0]!==0||priceRange[1]!==700) e.currentTarget.style.backgroundColor="transparent" }}>
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
            <SidebarContent categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory}
              priceRange={priceRange} setPriceRange={setPriceRange} onClose={onClose}/>
          </div>
        </div>
      </div>
    </>
  )
}

const VIEW_OPTIONS = [
  { key:"list",  icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg> },
  { key:"grid2", icon:<svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg> },
  { key:"grid3", icon:<svg className="w-4 h-4" viewBox="0 0 15 15" fill="currentColor"><rect x="0"  y="0" width="4" height="6" rx="0.8"/><rect x="5.5" y="0" width="4" height="6" rx="0.8"/><rect x="11" y="0" width="4" height="6" rx="0.8"/><rect x="0"  y="8" width="4" height="7" rx="0.8"/><rect x="5.5" y="8" width="4" height="7" rx="0.8"/><rect x="11" y="8" width="4" height="7" rx="0.8"/></svg> },
  { key:"grid4", icon:<svg className="w-4 h-4" viewBox="0 0 18 15" fill="currentColor"><rect x="0" y="0" width="3.5" height="6" rx="0.6"/><rect x="4.8" y="0" width="3.5" height="6" rx="0.6"/><rect x="9.6" y="0" width="3.5" height="6" rx="0.6"/><rect x="14.5" y="0" width="3.5" height="6" rx="0.6"/><rect x="0" y="8" width="3.5" height="7" rx="0.6"/><rect x="4.8" y="8" width="3.5" height="7" rx="0.6"/><rect x="9.6" y="8" width="3.5" height="7" rx="0.6"/><rect x="14.5" y="8" width="3.5" height="7" rx="0.6"/></svg> },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AddonsPage({ onNavigate }) {
  // 1. 👇 Missing State variables added inside the component
  const [addons, setAddons]           = useState([])
  const [viewAs,    setViewAs]        = useState("grid3")
  const [sortBy,    setSortBy]        = useState("featured")
  const [category,  setCategory]      = useState("All")
  const [priceRange,setPriceRange]    = useState([0, 700])
  const [wishlist,  setWishlist]      = useState([])
  const [sortOpen,  setSortOpen]      = useState(false)
  const [filterOpen, setFilterOpen]   = useState(false)
  const [preview,   setPreview]       = useState(null)
  const sortRef = useRef(null)

  // 2. 👇 Fetch the real addons from the database when the page loads
  useEffect(() => {
    api.get("/products/") 
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map(p => {
             const fallback = ALL_ADDONS.find(f => f.name === p.name) || {}
             return {
                ...p,
                image: p.image_url || fallback.image || ALL_ADDONS[0].image,
                original: p.original_price || fallback.original || p.price * 1.2,
                rating: fallback.rating || 5.0,
                reviews: fallback.reviews || 0,
                ribbon: fallback.ribbon || null,
             }
          })
          setAddons(mapped)
        } else {
          setAddons(ALL_ADDONS)
        }
      })
      .catch(() => setAddons(ALL_ADDONS))
  }, [])

  useEffect(() => {
    const h = e => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const toggleWishlist = id => setWishlist(p => p.includes(id) ? p.filter(i=>i!==id) : [...p,id])

  // 3. 👇 Put this dynamically calculated array safely inside the component
  const dynamicCategories = ["All", ...new Set(addons.map(a => a.category).filter(Boolean))];

  const filtered = addons
    .filter(a => category==="All" || a.category===category)
    .filter(a => a.price>=priceRange[0] && a.price<=priceRange[1])
    .sort((a,b) => {
      if (sortBy==="price-asc")  return a.price-b.price
      if (sortBy==="price-desc") return b.price-a.price
      if (sortBy==="rating")     return b.rating-a.rating
      return 0
    })

  const gridStyle = {
    list:  { display:"flex", flexDirection:"column", gap:12 },
    grid2: { display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:16 },
    grid3: { display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:16 },
    grid4: { display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:16 },
  }

  return (
    <div className="min-h-screen bg-white">
      <MobileFilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)}
        categories={dynamicCategories} // 👈 Passed missing prop
        activeCategory={category} setActiveCategory={setCategory}
        priceRange={priceRange} setPriceRange={setPriceRange}/>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <button onClick={()=>onNavigate?.("shop")}
              className="hover:text-green-700 transition-colors"
              style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:"inherit" }}>
              Shop
            </button>
            <span>/</span>
            <span className="font-medium text-gray-600">Add-ons</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add-ons</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pair any arrangement with a sweet treat for a complete gift.</p>
        </div>

        <div className="flex gap-8">

          {/* ── Sidebar ── */}
          <aside className="w-52 flex-shrink-0 hidden lg:block">
             <SidebarContent categories={dynamicCategories} // 👈 Passed missing prop
              activeCategory={category} setActiveCategory={setCategory}
              priceRange={priceRange} setPriceRange={setPriceRange}/>
          </aside>

          {/* ── Main ── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom:"1px solid #f0f0f0" }}>
              <div className="flex items-center gap-2">
                
                <button onClick={() => setFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 border rounded-lg text-sm text-gray-700 transition-all hover:border-green-400"
                  style={{ borderColor:"#e5e7eb", padding:"6px 10px", height:"32px" }}>
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                  </svg>
                  <span className="text-xs font-medium">Filters</span>
                </button>

                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1 hidden lg:inline">View As</span>
                <div className="flex items-center border rounded-lg overflow-hidden hidden sm:flex" style={{ borderColor:"#e5e7eb" }}>
                  {VIEW_OPTIONS.map(({ key, icon }, idx) => (
                    <button key={key} onClick={() => setViewAs(key)}
                      className="flex items-center justify-center w-8 h-8 transition-all"
                      style={{ backgroundColor:viewAs===key?G:"white", color:viewAs===key?"white":"#6b7280", borderRight:idx<VIEW_OPTIONS.length-1?"1px solid #e5e7eb":"none" }}>
                      {icon}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-1">{filtered.length} items</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sort By</span>
                <div className="relative" ref={sortRef}>
                  <button onClick={() => setSortOpen(p=>!p)}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm text-gray-700 transition-all hover:border-green-400"
                    style={{ borderColor:sortOpen?G:"#e5e7eb", minWidth:160, justifyContent:"space-between" }}>
                    <span>{SORT_OPTIONS.find(o=>o.value===sortBy)?.label}</span>
                    <svg className="w-3.5 h-3.5 text-gray-400" style={{ transform:sortOpen?"rotate(180deg)":"rotate(0)", transition:"transform 0.15s" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </button>
                  {sortOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white z-30 w-48 overflow-hidden shadow-lg"
                      style={{ border:"1px solid #e5e7eb", borderRadius:10 }}>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-all"
                          style={{ color:sortBy===opt.value?G:"#4b5563", fontWeight:sortBy===opt.value?600:400, backgroundColor:sortBy===opt.value?"#f0fdf4":"white" }}
                          onMouseEnter={e => { if (sortBy!==opt.value) e.currentTarget.style.backgroundColor="#f9fafb" }}
                          onMouseLeave={e => { if (sortBy!==opt.value) e.currentTarget.style.backgroundColor="white" }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grid / list */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm mb-3">No add-ons match your filters.</p>
                <button onClick={() => { setCategory("All"); setPriceRange([0,700]) }}
                  className="text-sm font-semibold hover:underline" style={{ color:G }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div style={gridStyle[viewAs]}>
                {filtered.map(addon =>
                  viewAs==="list"
                    ? <ListCard key={addon.id} addon={addon} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreview}/>
                    : <GridCard key={addon.id} addon={addon} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreview}/>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate}/>

      {preview && (
        <ProductPreviewModal
          product={{ ...preview, _ribbonColor:RIBBON_COLORS[preview.ribbon] }}
          onClose={() => setPreview(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}