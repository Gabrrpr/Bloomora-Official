import { useState, useEffect, useRef } from "react"
import ProductPreviewModal from "../components/ProductPreviewModal.jsx"
import Footer from "../components/Footer.jsx"
import FallbackImage from "../components/FallbackImage.jsx"
import { api } from "../services/api.js"

const G  = "#2E8B34"
const DG = "#0C573E"

// ── Dynamic image loader — place images in src/assets/products/vases/ ─────────
const vaseImg = (filename) =>
  new URL(`../assets/products/vases/${filename}`, import.meta.url).href

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

// ── Vase catalog (fallback if API fails) ─────────────────────────────────
const ALL_VASES = [
  { id:1,  image:vaseImg("BlackGoldLargeVase580.webp"),   name:"Black Gold Large Vase",   price:580,  original:750,  rating:4.8, reviews:32, ribbon:"Premium",     category:"Gold"   },
  { id:2,  image:vaseImg("BlackGoldRegularVase280.webp"),  name:"Black Gold Regular Vase", price:280,  original:360,  rating:4.6, reviews:18, ribbon:null,           category:"Gold"   },
  { id:3,  image:vaseImg("GreenFountainVase.webp"),        name:"Green Fountain Vase",     price:350,  original:450,  rating:4.7, reviews:24, ribbon:null,           category:"Green"  },
  { id:4,  image:vaseImg("GreenGrainyCurvyVase.webp"),     name:"Green Grainy Curvy Vase", price:290,  original:380,  rating:4.5, reviews:15, ribbon:null,           category:"Green"  },
  { id:5,  image:vaseImg("GreenGrainyLineVase.webp"),      name:"Green Grainy Line Vase",  price:290,  original:380,  rating:4.5, reviews:11, ribbon:null,           category:"Green"  },
  { id:6,  image:vaseImg("GreenGrainyVase.webp"),          name:"Green Grainy Vase",       price:260,  original:340,  rating:4.4, reviews:9,  ribbon:null,           category:"Green"  },
  { id:7,  image:vaseImg("GreenLeafVase.webp"),            name:"Green Leaf Vase",         price:310,  original:400,  rating:4.8, reviews:41, ribbon:"Popular",      category:"Green"  },
  { id:8,  image:vaseImg("GreenRectangleVase.webp"),       name:"Green Rectangle Vase",    price:270,  original:350,  rating:4.6, reviews:20, ribbon:null,           category:"Green"  },
  { id:9,  image:vaseImg("GreenTulipVase480.webp"),        name:"Green Tulip Vase",        price:480,  original:620,  rating:4.9, reviews:58, ribbon:"Best Seller",  category:"Green"  },
  { id:10, image:vaseImg("MarbleHexagonVase380.webp"),     name:"Marble Hexagon Vase",     price:380,  original:490,  rating:4.8, reviews:36, ribbon:"Popular",      category:"Marble" },
  { id:11, image:vaseImg("MarbleLineVase.webp"),           name:"Marble Line Vase",        price:360,  original:460,  rating:4.7, reviews:22, ribbon:null,           category:"Marble" },
  { id:12, image:vaseImg("MintGreenSimpleVase.webp"),      name:"Mint Green Simple Vase",  price:220,  original:290,  rating:4.6, reviews:17, ribbon:"New",          category:"Green"  },
  { id:13, image:vaseImg("PinkAbstractVase380.webp"),      name:"Pink Abstract Vase",      price:380,  original:490,  rating:4.7, reviews:29, ribbon:null,           category:"Pink"   },
  { id:14, image:vaseImg("PlasticPot1.webp"),              name:"Plastic Pot",             price:120,  original:160,  rating:4.3, reviews:44, ribbon:null,           category:"Pots"   },
  { id:15, image:vaseImg("WhiteAbstractVase300.webp"),     name:"White Abstract Vase",     price:300,  original:390,  rating:4.7, reviews:31, ribbon:null,           category:"White"  },
  { id:16, image:vaseImg("WhiteCircularVase80.webp"),      name:"White Circular Vase S",   price:80,   original:110,  rating:4.4, reviews:26, ribbon:null,           category:"White"  },
  { id:17, image:vaseImg("WhiteCircularVase1000.webp"),    name:"White Circular Vase L",   price:1000, original:1280, rating:4.9, reviews:14, ribbon:"Premium",      category:"White"  },
  { id:18, image:vaseImg("WhiteCircularVase1350.webp"),    name:"White Circular Vase XL",  price:1350, original:1700, rating:5.0, reviews:8,  ribbon:"Premium",      category:"White"  },
  { id:19, image:vaseImg("WhiteHexagonVase80.webp"),       name:"White Hexagon Vase",      price:80,   original:110,  rating:4.5, reviews:33, ribbon:null,           category:"White"  },
  { id:20, image:vaseImg("WhiteTulipVase480.webp"),        name:"White Tulip Vase",        price:480,  original:620,  rating:4.9, reviews:47, ribbon:"Best Seller",  category:"White"  },
]

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34",
  "Popular":     "#f59e0b",
  "Premium":     "#7c3aed",
  "New":         "#3b82f6",
}

const CATEGORIES = ["All", "Green", "White", "Marble", "Gold", "Pink", "Pots"]

const SORT_OPTIONS = [
  { value:"featured",   label:"Featured"             },
  { value:"price-asc",  label:"Price: Low to High"   },
  { value:"price-desc", label:"Price: High to Low"   },
  { value:"rating",     label:"Top Rated"             },
  { value:"newest",     label:"Newest"               },
]

const PRICE_RANGES = [[0,300],[300,600],[600,1000],[1000,2000]]

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
  const wishlisted = wishlist.includes(id)
  return (
    <button
      onClick={e => { e.stopPropagation(); toggleWishlist(id) }}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
      style={{ backgroundColor:wishlisted?"#fef2f2":"#f9fafb", border:wishlisted?"1px solid #fecaca":"1px solid #e5e7eb" }}>
      <svg className="w-4 h-4" fill={wishlisted?"#e11d48":"none"} stroke={wishlisted?"#e11d48":"#9ca3af"} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    </button>
  )
}

// ── List card — mirrors Shop.jsx ListCard ─────────────────────────────────────
function ListCard({ vase, wishlist, toggleWishlist, onPreview }) {
  return (
    <div
      className="bg-white flex group hover:shadow-md transition-shadow duration-200"
      style={{ border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", cursor:"pointer" }}
      onClick={() => onPreview(vase)}
    >
      <div className="relative flex-shrink-0" style={{ width:180, backgroundColor:"#f9fafb" }}>
        <img src={vase.image} alt={vase.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ display:"block", aspectRatio:"1/1" }}/>
        {vase.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor:RIBBON_COLORS[vase.ribbon], clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)", padding:"3px 16px 3px 9px" }}>
              {vase.ribbon}
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor:DG }}>
          -{discount(vase.original, vase.price)}%
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0" style={{ padding:"16px 20px", gap:6 }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:G, margin:0 }}>{vase.category}</p>
        <p className="text-base font-bold text-gray-900 leading-snug" style={{ margin:0 }}>{vase.name}</p>
        <div className="flex items-center gap-1.5">
          <Stars rating={vase.rating}/>
          <span className="text-xs text-gray-500">{vase.rating}</span>
          <span className="text-xs text-gray-400">({vase.reviews})</span>
        </div>
        <div className="flex items-center justify-between" style={{ marginTop:2 }}>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color:G }}>₱{vase.price.toLocaleString()}</span>
            <span className="text-sm text-gray-400 line-through">₱{vase.original.toLocaleString()}</span>
          </div>
          <WishlistBtn id={vase.id} wishlist={wishlist} toggleWishlist={toggleWishlist}/>
        </div>
        <div style={{ marginTop:6 }}>
          <button onClick={e => { e.stopPropagation(); onPreview(vase) }}
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

// ── Grid card — mirrors Shop.jsx GridCard ─────────────────────────────────────
function GridCard({ vase, wishlist, toggleWishlist, onPreview }) {
  return (
    <div
      className="bg-white group hover:shadow-lg transition-shadow duration-200"
      style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", cursor:"pointer" }}
      onClick={() => onPreview(vase)}
    >
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio:"1/1" }}>
        <FallbackImage
          src={vase.image}
          alt={vase.name}
          fallbackSrc="/EstingsLogo.svg"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {vase.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white px-3 py-1 shadow-sm"
              style={{ backgroundColor:RIBBON_COLORS[vase.ribbon], clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)", paddingRight:16 }}>
              {vase.ribbon}
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5"
          style={{ backgroundColor:DG, borderRadius:4 }}>
          -{discount(vase.original, vase.price)}%
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold" style={{ color:G }}>₱{vase.price.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">₱{vase.original.toLocaleString()}</span>
          </div>
          <WishlistBtn id={vase.id} wishlist={wishlist} toggleWishlist={toggleWishlist}/>
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug mb-1.5 line-clamp-2">{vase.name}</p>
        <div className="flex items-center gap-1 mb-3">
          <Stars rating={vase.rating}/>
          <span className="text-xs text-gray-400">{vase.rating} ({vase.reviews})</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onPreview(vase) }}
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

const VIEW_OPTIONS = [
  { key:"list",  icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg> },
  { key:"grid2", icon:<svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg> },
  { key:"grid3", icon:<svg className="w-4 h-4" viewBox="0 0 15 15" fill="currentColor"><rect x="0"  y="0" width="4" height="6" rx="0.8"/><rect x="5.5" y="0" width="4" height="6" rx="0.8"/><rect x="11" y="0" width="4" height="6" rx="0.8"/><rect x="0"  y="8" width="4" height="7" rx="0.8"/><rect x="5.5" y="8" width="4" height="7" rx="0.8"/><rect x="11" y="8" width="4" height="7" rx="0.8"/></svg> },
  { key:"grid4", icon:<svg className="w-4 h-4" viewBox="0 0 18 15" fill="currentColor"><rect x="0" y="0" width="3.5" height="6" rx="0.6"/><rect x="4.8" y="0" width="3.5" height="6" rx="0.6"/><rect x="9.6" y="0" width="3.5" height="6" rx="0.6"/><rect x="14.5" y="0" width="3.5" height="6" rx="0.6"/><rect x="0" y="8" width="3.5" height="7" rx="0.6"/><rect x="4.8" y="8" width="3.5" height="7" rx="0.6"/><rect x="9.6" y="8" width="3.5" height="7" rx="0.6"/><rect x="14.5" y="8" width="3.5" height="7" rx="0.6"/></svg> },
]

// ── Main page ─────────────────────────────────────────────────────────────────

const dynamicCategories = ["All", ...new Set(ALL_VASES.map(v => v.category))]
export default function VasesPage({ onNavigate }) {
  const [viewAs,   setViewAs]   = useState("grid3")
  const [sortBy,   setSortBy]   = useState("featured")
  const [category, setCategory] = useState("All")
  const [priceRange,setPriceRange]=useState([0,2000])
  const [wishlist, setWishlist] = useState([])
  const [sortOpen, setSortOpen] = useState(false)
  const [preview,  setPreview]  = useState(null)
  const [vases, setVases] = useState([])
  const [loading, setLoading] = useState(true)
  const sortRef = useRef(null)

  useEffect(() => {
    const h = e => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

// Fetch vases from API
  useEffect(() => {
    api.getVases()
      .then(data => {
        const transformed = data.map(v => {
          // find matching fallback for image + rating + reviews
          const fallback = ALL_VASES.find(f => f.name === v.name) || {}
          return {
            id: v.id,
            name: v.name,
            price: v.price || fallback.price || 0,
            original: v.original || fallback.original || (v.price * 1.2),
            rating: fallback.rating || 4.5,
            reviews: fallback.reviews || 0,
            ribbon: fallback.ribbon || null,
            category: v.category || fallback.category || "Uncategorized",
            image: v.image_url || fallback.image || null,  // ← map image_url to image
            style: v.style,
            material: v.material,
            color: v.color,
            size: v.size,
          }
        })
        setVases(transformed)
      })
      .catch(() => {
        setVases(ALL_VASES)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleWishlist = id => setWishlist(p => p.includes(id) ? p.filter(i=>i!==id) : [...p,id])

  const filtered = (vases.length > 0 ? vases : ALL_VASES)
    .filter(v => category==="All" || v.category===category)
    .filter(v => v.price>=priceRange[0] && v.price<=priceRange[1])
    .sort((a,b) => {
      if (sortBy==="price-asc")  return a.price-b.price
      if (sortBy==="price-desc") return b.price-a.price
      if (sortBy==="rating")     return b.rating-a.rating
      if (sortBy==="newest")     return b.id-a.id
      return 0
    })

  const gridStyle = {
    list:  { display:"flex", flexDirection:"column", gap:12 },
    grid2: { display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:16 },
    grid3: { display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:16 },
    grid4: { display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:16 },
  }

  const sideBtn = (active, onClick, label) => (
    <button key={label} onClick={onClick}
      className="text-left px-3 py-2 rounded-lg text-sm transition-all"
      style={{ fontWeight:active?600:400, color:active?"white":"#4b5563", backgroundColor:active?G:"transparent" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor="#f3f4f6" }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor="transparent" }}>
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title — same style as Shop would have */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <button onClick={()=>onNavigate?.("shop")} className="hover:text-green-700 transition-colors" style={{ background:"none",border:"none",cursor:"pointer",padding:0,color:"inherit" }}>Shop</button>
            <span>/</span>
            <span className="font-medium text-gray-600">Vases & Containers</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vases & Containers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Curated vessels to complement every arrangement.</p>
        </div>

        <div className="flex gap-8">

          {/* ── Sidebar ── */}
          <aside className="w-52 flex-shrink-0 hidden lg:block">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Collection</p>
              <div className="flex flex-col gap-0.5">
                {dynamicCategories.map(cat => sideBtn(category===cat, ()=>setCategory(cat), cat))}
              </div>
            </div>

            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Price Range</p>
              <div className="flex flex-col gap-0.5">
                {PRICE_RANGES.map(([min,max]) =>
                  sideBtn(
                    priceRange[0]===min && priceRange[1]===max,
                    ()=>setPriceRange([min,max]),
                    `₱${min.toLocaleString()} – ₱${max.toLocaleString()}`
                  )
                )}
                {sideBtn(
                  priceRange[0]===0 && priceRange[1]===2000,
                  ()=>setPriceRange([0,2000]),
                  "All Prices"
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Availability</p>
              <label className="flex items-center gap-2 cursor-pointer px-1">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5" style={{ accentColor:G }}/>
                <span className="text-sm text-gray-600">In Stock</span>
              </label>
            </div>
          </aside>

          {/* ── Main ── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom:"1px solid #f0f0f0" }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">View As</span>
                <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor:"#e5e7eb" }}>
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

            {/* Product grid / list */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm mb-3">No vases match your filters.</p>
                <button onClick={() => { setCategory("All"); setPriceRange([0,2000]) }}
                  className="text-sm font-semibold hover:underline" style={{ color:G }}>Clear filters</button>
              </div>
            ) : (
              <div style={gridStyle[viewAs]}>
                {filtered.map(vase =>
                  viewAs==="list"
                    ? <ListCard key={vase.id} vase={vase} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreview}/>
                    : <GridCard key={vase.id} vase={vase} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreview}/>
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