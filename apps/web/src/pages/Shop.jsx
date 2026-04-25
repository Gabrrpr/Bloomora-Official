import { useState, useEffect, useRef } from "react"
import Footer from "../components/Footer"

import SpringFlowers_PurpleWrapper from "../assets/products/SpringFlowers_PurpleWrapper.png"
import SpringFlowers_PinkWrapper   from "../assets/products/SpringFlowers_PinkWrapper.png"
import SpringFlowers_GreenWrapper  from "../assets/products/SpringFlowers_GreenWrapper.png"
import RainbowEquadorRoses         from "../assets/products/RainbowEquadorRoses.png"
import MixTulips                   from "../assets/products/MixTulips.png"
import Dozen_YellowChinaRoses      from "../assets/products/Dozen_YellowChinaRoses.png"
import Dozen_RedEquadorRoses       from "../assets/products/Dozen_RedEquadorRoses.png"
import Dozen_RedChinaRoses         from "../assets/products/Dozen_RedChinaRoses.png"
import Dozen_PinkChinaRoses        from "../assets/products/Dozen_PinkChinaRoses.png"
import Dozen_OrangeChinaRoses      from "../assets/products/Dozen_OrangeChinaRoses.png"
import Roses_24pcs_Red             from "../assets/products/24pcs_RedEquadorRoses.png"
import Roses_10pcs_Blue            from "../assets/products/10pcs_BlueChinaRoses.png"
import Roses_6pcs_White            from "../assets/products/6pcs_WhiteEquadorRoses.png"
import Roses_6pcs_Purple           from "../assets/products/6pcs_PurpleChinaRoses.png"
import Sunflower_3pcs              from "../assets/products/3pcs_Sunflower.png"
import Tulips_3pc_Pink             from "../assets/products/3pc_PinkTulips.png"

const G  = "#2E8B34"
const DG = "#0C573E"

const ALL_PRODUCTS = [
  { id: 1,  name: "Spring Flowers Purple Wrapper", image: SpringFlowers_PurpleWrapper, price: 850,  original: 1100, rating: 4.9, reviews: 124, ribbon: "Best Seller", category: "Bouquets" },
  { id: 2,  name: "Spring Flowers Pink Wrapper",   image: SpringFlowers_PinkWrapper,   price: 850,  original: 1100, rating: 4.8, reviews: 98,  ribbon: "Best Seller", category: "Bouquets" },
  { id: 3,  name: "Spring Flowers Green Wrapper",  image: SpringFlowers_GreenWrapper,  price: 850,  original: 1100, rating: 4.7, reviews: 76,  ribbon: null,          category: "Bouquets" },
  { id: 4,  name: "Rainbow Ecuador Roses",         image: RainbowEquadorRoses,         price: 1299, original: 1599, rating: 5.0, reviews: 210, ribbon: "Top Pick",    category: "Roses" },
  { id: 5,  name: "Mix Tulips",                    image: MixTulips,                   price: 750,  original: 950,  rating: 4.8, reviews: 88,  ribbon: "New",         category: "Tulips" },
  { id: 6,  name: "Dozen Yellow China Roses",      image: Dozen_YellowChinaRoses,      price: 699,  original: 899,  rating: 4.6, reviews: 57,  ribbon: null,          category: "Roses" },
  { id: 7,  name: "Dozen Red Ecuador Roses",       image: Dozen_RedEquadorRoses,       price: 999,  original: 1299, rating: 4.9, reviews: 183, ribbon: "Best Seller", category: "Roses" },
  { id: 8,  name: "Dozen Red China Roses",         image: Dozen_RedChinaRoses,         price: 699,  original: 899,  rating: 4.7, reviews: 65,  ribbon: null,          category: "Roses" },
  { id: 9,  name: "Dozen Pink China Roses",        image: Dozen_PinkChinaRoses,        price: 699,  original: 899,  rating: 4.8, reviews: 91,  ribbon: "Popular",     category: "Roses" },
  { id: 10, name: "Dozen Orange China Roses",      image: Dozen_OrangeChinaRoses,      price: 699,  original: 899,  rating: 4.6, reviews: 44,  ribbon: null,          category: "Roses" },
  { id: 11, name: "24pcs Red Ecuador Roses",       image: Roses_24pcs_Red,             price: 1799, original: 2199, rating: 5.0, reviews: 156, ribbon: "Premium",     category: "Roses" },
  { id: 12, name: "10pcs Blue China Roses",        image: Roses_10pcs_Blue,            price: 599,  original: 799,  rating: 4.7, reviews: 38,  ribbon: "Rare Find",   category: "Roses" },
  { id: 13, name: "6pcs White Ecuador Roses",      image: Roses_6pcs_White,            price: 499,  original: 649,  rating: 4.8, reviews: 72,  ribbon: null,          category: "Roses" },
  { id: 14, name: "6pcs Purple China Roses",       image: Roses_6pcs_Purple,           price: 499,  original: 649,  rating: 4.9, reviews: 61,  ribbon: "Popular",     category: "Roses" },
  { id: 15, name: "3pcs Sunflower",                image: Sunflower_3pcs,              price: 350,  original: 450,  rating: 4.9, reviews: 203, ribbon: "Best Seller", category: "Arrangements" },
  { id: 16, name: "3pcs Pink Tulips",              image: Tulips_3pc_Pink,             price: 350,  original: 450,  rating: 4.7, reviews: 49,  ribbon: "New",         category: "Tulips" },
]

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34",
  "Top Pick":    "#0C573E",
  "New":         "#3b82f6",
  "Popular":     "#f59e0b",
  "Premium":     "#7c3aed",
  "Rare Find":   "#ec4899",
}

const CATEGORIES  = ["All", "Roses", "Bouquets", "Tulips", "Arrangements"]
const SORT_OPTIONS = [
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc",    label: "Price: Low to High" },
  { value: "price-desc",   label: "Price: High to Low" },
  { value: "rating",       label: "Top Rated" },
  { value: "newest",       label: "Newest" },
]

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className="w-3 h-3" fill={i <= Math.floor(rating) ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

const discount = (orig, price) => Math.round((1 - price / orig) * 100)

// ── List card — matches reference: image left, ribbon on image, details right ──
function ListCard({ product, wishlist, toggleWishlist, addedToCart, handleAddToCart }) {
  return (
    <div className="bg-white flex gap-0 group hover:shadow-md transition-shadow duration-200"
      style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>

      {/* Image — fixed size, ribbon sits on top */}
      <div className="relative flex-shrink-0" style={{ width: "160px", minHeight: "160px", backgroundColor: "#f9fafb" }}>
        <img src={product.image} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ aspectRatio: "1/1" }} />
        {/* Ribbon — top-left corner of image */}
        {product.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white px-2.5 py-1 shadow-sm"
              style={{
                backgroundColor: RIBBON_COLORS[product.ribbon],
                clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)",
                paddingRight: "14px",
              }}>
              {product.ribbon}
            </div>
          </div>
        )}
        {/* Discount badge — top-right */}
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: DG }}>
          -{discount(product.original, product.price)}%
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-base font-semibold text-gray-800 mb-1.5 leading-snug">{product.name}</p>
          <div className="flex items-center gap-1.5 mb-3">
            <Stars rating={product.rating} />
            <span className="text-xs text-gray-400">{product.rating} ({product.reviews})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: G }}>₱{product.price.toLocaleString()}</span>
            <span className="text-sm text-gray-400 line-through">₱{product.original.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-white px-1.5 py-0.5 rounded"
              style={{ backgroundColor: DG }}>-{discount(product.original, product.price)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => handleAddToCart(product.id)}
            className="px-5 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90"
            style={{ backgroundColor: addedToCart.includes(product.id) ? DG : G }}>
            {addedToCart.includes(product.id) ? "Added!" : "Add to Cart"}
          </button>
          <button onClick={() => toggleWishlist(product.id)}
            className="w-9 h-9 flex items-center justify-center rounded-md border transition-all hover:bg-gray-50"
            style={{ borderColor: "#e5e7eb" }}>
            <svg className="w-4 h-4"
              fill={wishlist.includes(product.id) ? "#e11d48" : "none"}
              stroke={wishlist.includes(product.id) ? "#e11d48" : "#9ca3af"}
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function GridCard({ product, wishlist, toggleWishlist, addedToCart, handleAddToCart }) {
  return (
    <div className="bg-white group cursor-pointer hover:shadow-lg transition-shadow duration-200"
      style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: "1/1" }}>
        <img src={product.image} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.ribbon && (
          <div className="absolute top-3 left-0 z-10">
            <div className="text-[10px] font-bold text-white px-3 py-1 shadow-sm"
              style={{ backgroundColor: RIBBON_COLORS[product.ribbon], clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)", paddingRight: "16px" }}>
              {product.ribbon}
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5"
          style={{ backgroundColor: DG, borderRadius: "4px" }}>
          -{discount(product.original, product.price)}%
        </div>
        <button onClick={() => toggleWishlist(product.id)}
          className="absolute bottom-2 left-2 w-7 h-7 bg-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ borderRadius: "4px", border: "1px solid #e5e7eb" }}>
          <svg className="w-4 h-4"
            fill={wishlist.includes(product.id) ? "#e11d48" : "none"}
            stroke={wishlist.includes(product.id) ? "#e11d48" : "#9ca3af"}
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-base font-bold" style={{ color: G }}>₱{product.price.toLocaleString()}</span>
          <span className="text-xs text-gray-400 line-through">₱{product.original.toLocaleString()}</span>
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug mb-1.5 line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-1 mb-3">
          <Stars rating={product.rating} />
          <span className="text-xs text-gray-400">{product.rating} ({product.reviews})</span>
        </div>
        <button onClick={() => handleAddToCart(product.id)}
          className="w-full text-sm font-medium py-2 text-white transition-all duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: addedToCart.includes(product.id) ? DG : G, borderRadius: "6px" }}>
          {addedToCart.includes(product.id)
            ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Added!</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>Add to Cart</>
          }
        </button>
      </div>
    </div>
  )
}

// VIEW AS icon buttons
const VIEW_OPTIONS = [
  { key: "list",  icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>) },
  { key: "grid2", icon: (<svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1" /><rect x="9" y="0" width="7" height="7" rx="1" /><rect x="0" y="9" width="7" height="7" rx="1" /><rect x="9" y="9" width="7" height="7" rx="1" /></svg>) },
  { key: "grid3", icon: (<svg className="w-4 h-4" viewBox="0 0 15 15" fill="currentColor"><rect x="0"  y="0" width="4" height="6" rx="0.8" /><rect x="5.5" y="0" width="4" height="6" rx="0.8" /><rect x="11" y="0" width="4" height="6" rx="0.8" /><rect x="0"  y="8" width="4" height="7" rx="0.8" /><rect x="5.5" y="8" width="4" height="7" rx="0.8" /><rect x="11" y="8" width="4" height="7" rx="0.8" /></svg>) },
  { key: "grid4", icon: (<svg className="w-4 h-4" viewBox="0 0 18 15" fill="currentColor"><rect x="0"   y="0" width="3.5" height="6" rx="0.6" /><rect x="4.8" y="0" width="3.5" height="6" rx="0.6" /><rect x="9.6" y="0" width="3.5" height="6" rx="0.6" /><rect x="14.5" y="0" width="3.5" height="6" rx="0.6" /><rect x="0"   y="8" width="3.5" height="7" rx="0.6" /><rect x="4.8" y="8" width="3.5" height="7" rx="0.6" /><rect x="9.6" y="8" width="3.5" height="7" rx="0.6" /><rect x="14.5" y="8" width="3.5" height="7" rx="0.6" /></svg>) },
]

export default function Shop({ onNavigate }) {
  const [viewAs, setViewAs]               = useState("grid3")
  const [sortBy, setSortBy]               = useState("best-selling")
  const [activeCategory, setActiveCategory] = useState("All")
  const [priceRange, setPriceRange]       = useState([0, 2500])
  const [wishlist, setWishlist]           = useState([])
  const [addedToCart, setAddedToCart]     = useState([])
  const [sortOpen, setSortOpen]           = useState(false)
  const sortRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const toggleWishlist  = (id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const handleAddToCart = (id) => {
    setAddedToCart(prev => [...prev, id])
    setTimeout(() => setAddedToCart(prev => prev.filter(i => i !== id)), 1500)
  }

  const filtered = ALL_PRODUCTS
    .filter(p => activeCategory === "All" || p.category === activeCategory)
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === "price-asc")  return a.price - b.price
      if (sortBy === "price-desc") return b.price - a.price
      if (sortBy === "rating")     return b.rating - a.rating
      if (sortBy === "newest")     return b.id - a.id
      return b.reviews - a.reviews
    })

  // Grid columns via inline style (not Tailwind) so 4-col always works
  const gridStyle = {
    list:  { display: "flex", flexDirection: "column", gap: "12px" },
    grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" },
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Best Selling"

  return (
    <div className="min-h-screen bg-white">
      {/* NO hero heading — go straight to content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ── Sidebar ── */}
          <aside className="w-52 flex-shrink-0 hidden lg:block">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Category</p>
              <div className="flex flex-col gap-0.5">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      fontWeight: activeCategory === cat ? 600 : 400,
                      color: activeCategory === cat ? "white" : "#4b5563",
                      backgroundColor: activeCategory === cat ? G : "transparent",
                    }}
                    onMouseEnter={e => { if (activeCategory !== cat) e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                    onMouseLeave={e => { if (activeCategory !== cat) e.currentTarget.style.backgroundColor = "transparent"; }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Price Range</p>
              <div className="flex flex-col gap-0.5">
                {[[0, 500], [500, 1000], [1000, 1500], [1500, 2500]].map(([min, max]) => (
                  <button key={`${min}-${max}`} onClick={() => setPriceRange([min, max])}
                    className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      fontWeight: priceRange[0] === min && priceRange[1] === max ? 600 : 400,
                      color: priceRange[0] === min && priceRange[1] === max ? "white" : "#4b5563",
                      backgroundColor: priceRange[0] === min && priceRange[1] === max ? G : "transparent",
                    }}
                    onMouseEnter={e => { if (priceRange[0] !== min || priceRange[1] !== max) e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                    onMouseLeave={e => { if (priceRange[0] !== min || priceRange[1] !== max) e.currentTarget.style.backgroundColor = "transparent"; }}>
                    ₱{min.toLocaleString()} – ₱{max.toLocaleString()}
                  </button>
                ))}
                <button onClick={() => setPriceRange([0, 2500])}
                  className="text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    fontWeight: priceRange[0] === 0 && priceRange[1] === 2500 ? 600 : 400,
                    color: priceRange[0] === 0 && priceRange[1] === 2500 ? "white" : "#4b5563",
                    backgroundColor: priceRange[0] === 0 && priceRange[1] === 2500 ? G : "transparent",
                  }}
                  onMouseEnter={e => { if (priceRange[0] !== 0 || priceRange[1] !== 2500) e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                  onMouseLeave={e => { if (priceRange[0] !== 0 || priceRange[1] !== 2500) e.currentTarget.style.backgroundColor = "transparent"; }}>
                  All Prices
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Availability</p>
              <label className="flex items-center gap-2 cursor-pointer px-1">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5" style={{ accentColor: G }} />
                <span className="text-sm text-gray-600">In Stock</span>
              </label>
            </div>
          </aside>

          {/* ── Main area ── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom: "1px solid #f0f0f0" }}>

              {/* VIEW AS */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">View As</span>
                <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                  {VIEW_OPTIONS.map(({ key, icon }, idx) => (
                    <button key={key} onClick={() => setViewAs(key)}
                      className="flex items-center justify-center w-8 h-8 transition-all"
                      style={{
                        backgroundColor: viewAs === key ? G : "white",
                        color: viewAs === key ? "white" : "#6b7280",
                        borderRight: idx < VIEW_OPTIONS.length - 1 ? "1px solid #e5e7eb" : "none",
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-1">{filtered.length} products</span>
              </div>

              {/* SORT BY */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sort By</span>
                <div className="relative" ref={sortRef}>
                  <button onClick={() => setSortOpen(p => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm text-gray-700 transition-all hover:border-green-400"
                    style={{ borderColor: sortOpen ? G : "#e5e7eb", minWidth: "160px", justifyContent: "space-between" }}>
                    <span>{currentSortLabel}</span>
                    <svg className="w-3.5 h-3.5 text-gray-400 transition-transform" style={{ transform: sortOpen ? "rotate(180deg)" : "rotate(0)" }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {sortOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white z-30 w-48 overflow-hidden shadow-lg"
                      style={{ border: "1px solid #e5e7eb", borderRadius: "10px" }}>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-all"
                          style={{
                            color: sortBy === opt.value ? G : "#4b5563",
                            fontWeight: sortBy === opt.value ? 600 : 400,
                            backgroundColor: sortBy === opt.value ? "#f0fdf4" : "white",
                          }}
                          onMouseEnter={e => { if (sortBy !== opt.value) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                          onMouseLeave={e => { if (sortBy !== opt.value) e.currentTarget.style.backgroundColor = "white"; }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products — use inline style gridStyle so 4-col always works */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-sm mb-3">No products match your filters.</p>
                <button onClick={() => { setActiveCategory("All"); setPriceRange([0, 2500]); }}
                  className="text-sm font-semibold hover:underline" style={{ color: G }}>Clear filters</button>
              </div>
            ) : (
              <div style={gridStyle[viewAs]}>
                {filtered.map(product =>
                  viewAs === "list"
                    ? <ListCard key={product.id} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} addedToCart={addedToCart} handleAddToCart={handleAddToCart} />
                    : <GridCard key={product.id} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} addedToCart={addedToCart} handleAddToCart={handleAddToCart} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}
