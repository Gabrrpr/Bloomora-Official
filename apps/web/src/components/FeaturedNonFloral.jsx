import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"
import ProductPreviewModal from "./ProductPreviewModal.jsx"

import GreenLeafVase      from "../assets/products/vases/GreenLeafVase.webp"
import PinkAbstractVase   from "../assets/products/vases/PinkAbstractVase380.webp"
import GreenTulipVase     from "../assets/products/vases/GreenTulipVase480.webp"
import BlackGoldLargeVase from "../assets/products/vases/BlackGoldLargeVase580.webp"
import GreenGrainyLineVase  from "../assets/products/vases/GreenGrainyLineVase.webp"
import MarbleLineVase  from "../assets/products/vases/MarbleLineVase.webp"

const G  = "#2E8B34"
const DG = "#0C573E"

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34", "Top Pick": "#0C573E",
  "New": "#3b82f6", "Popular": "#f59e0b",
  "Premium": "#7c3aed", "Rare Find": "#ec4899",
}

const CATEGORIES = [
  { label:"Black Gold Vases",  image:BlackGoldLargeVase, nav:"vases" },
  { label:"Green Collection",  image:GreenGrainyLineVase,  nav:"vases" },
  { label:"Marble Series",     image:MarbleLineVase,  nav:"vases" },
]

const FEATURED = [
  { id:7,  name:"Green Leaf Vase",       image:GreenLeafVase,      price:390, original:520, rating:4.8, reviews:33, ribbon:"Popular",     category:"Vases" },
  { id:13, name:"Pink Abstract Vase",    image:PinkAbstractVase,   price:380, original:499, rating:4.7, reviews:19, ribbon:"Rare Find",   category:"Vases" },
  { id:9,  name:"Green Tulip Vase",      image:GreenTulipVase,     price:480, original:620, rating:4.8, reviews:41, ribbon:"Top Pick",    category:"Vases" },
  { id:1,  name:"Black Gold Large Vase", image:BlackGoldLargeVase, price:580, original:750, rating:4.9, reviews:43, ribbon:"Best Seller", category:"Vases" },
]

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])
  return w
}

function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Stars({ rating, isDark }) {
  return (
    <div style={{ display:"flex", gap:"1px" }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11"
          fill={i <= Math.floor(rating) ? "#f59e0b" : (isDark ? "#374151" : "#e0e0e0")}
          viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

function Ribbon({ label }) {
  const color = RIBBON_COLORS[label]
  if (!color) return null
  return (
    <div style={{ position:"absolute", top:10, left:0, zIndex:10 }}>
      <div style={{ fontSize:"9px", fontWeight:700, color:"#fff", backgroundColor:color, clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)", padding:"3px 14px 3px 8px" }}>
        {label}
      </div>
    </div>
  )
}

function ProductCard({ product, index, wishlist, toggleWishlist, onPreview, isDark }) {
  const [ref, visible] = useScrollReveal(0.04)
  const [hov, setHov]  = useState(false)
  const wishlisted = wishlist.includes(product.id)
  const disc = Math.round((1 - product.price / product.original) * 100)

  const cardBg    = isDark ? "#1a2332" : "#ffffff"
  const cardBdr   = hov ? (isDark ? "#2d5a38" : "#b0d8b0") : (isDark ? "#2d3748" : "#e8e8e8")
  const imgBg     = isDark ? "#0f172a" : "#f6f8f6"
  const priceTxt  = isDark ? "#4ade80" : G
  const strikeTxt = isDark ? "#6b7280" : "#b8b8b8"
  const nameTxt   = isDark ? "#e2e8f0" : "#374151"
  const rateTxt   = isDark ? "#6b7280" : "#9ca3af"
  const heartBg   = wishlisted ? "#fef2f2" : (isDark ? "#1e2a3a" : "#f4f7f4")
  const heartBdr  = wishlisted ? "#fecaca" : (isDark ? "#2d3748" : "#dde8dd")

  return (
    <div
      ref={ref}
      onClick={() => onPreview(product)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor:cardBg,
        border:`1px solid ${cardBdr}`,
        borderRadius:"10px", overflow:"hidden", cursor:"pointer",
        opacity:visible?1:0, transform:visible?"none":"translateY(18px)",
        transition:"opacity 0.5s ease, transform 0.5s ease, box-shadow 0.22s, border-color 0.22s",
        transitionDelay:`${index*70}ms`,
        boxShadow:hov?(isDark?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.09)"):"none",
      }}
    >
      <div style={{ position:"relative", aspectRatio:"1/1", overflow:"hidden", backgroundColor:imgBg }}>
        <img src={product.image} alt={product.name}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform 0.55s ease", transform:hov?"scale(1.07)":"scale(1)" }}/>
        {product.ribbon && <Ribbon label={product.ribbon}/>}
        <div style={{ position:"absolute", top:8, right:8, backgroundColor:DG, color:"#fff", fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"4px" }}>
          -{disc}%
        </div>
      </div>

      <div style={{ padding:"11px 13px 13px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"5px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"5px" }}>
            <span style={{ fontSize:"14px", fontWeight:700, color:priceTxt }}>₱{product.price.toLocaleString()}</span>
            <span style={{ fontSize:"10px", textDecoration:"line-through", color:strikeTxt }}>₱{product.original.toLocaleString()}</span>
          </div>
          <button onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
            style={{ width:26, height:26, borderRadius:6, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:heartBg, border:`1px solid ${heartBdr}`, cursor:"pointer" }}>
            <svg width="12" height="12" fill={wishlisted?"#e11d48":"none"} stroke={wishlisted?"#e11d48":(isDark?"#6b7280":"#aaa")} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>

        <p style={{ fontSize:"12px", fontWeight:600, color:nameTxt, lineHeight:1.3, marginBottom:"5px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>
          {product.name}
        </p>

        <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"10px" }}>
          <Stars rating={product.rating} isDark={isDark}/>
          <span style={{ fontSize:"10px", color:rateTxt }}>{product.rating} ({product.reviews})</span>
        </div>

        <button onClick={e => { e.stopPropagation(); onPreview(product) }}
          style={{ width:"100%", fontSize:"12px", fontWeight:600, color:"#fff", backgroundColor:hov?DG:G, padding:"8px 0", borderRadius:"6px", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", transition:"background-color 0.2s" }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Details
        </button>
      </div>
    </div>
  )
}

export default function FeaturedNonFloral({ onNavigate }) {
  const { isDark } = useTheme()
  const w = useWidth()
  const [wishlist, setWishlist]             = useState([])
  const [previewProduct, setPreviewProduct] = useState(null)
  const [bannerRef, bannerVisible]          = useScrollReveal(0.06)
  const [gridRef, gridVisible]              = useScrollReveal(0.06)

  const toggleWishlist = id =>
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const isDesk     = w >= 900
  const isMid      = w >= 580
  const sideLayout = isMid
  const leftW      = isDesk ? 230 : 185
  const prodCols   = isDesk ? 4 : 2
  const prodGap    = isDesk ? 18 : 12
  const padH       = isDesk ? 28 : 16
  const padV       = isDesk ? 48 : isMid ? 38 : 28

  const accentG    = isDark ? "#4ade80"  : G
  const headingC   = isDark ? "#f3f4f6"  : "#1f2937"
  const subC       = isDark ? "#9ca3af"  : "#6b7280"
  const tileLabelC = isDark ? "#e2e8f0"  : "#1f2937"
  const tileLinkC  = isDark ? "#4ade80"  : G
  const tileBdrC   = isDark ? "#1e3a28"  : "#deeede"
  const sectionBg  = isDark ? "#111827"  : "#ffffff"
  const secHdrC    = isDark ? "#f3f4f6"  : "#1f2937"
  const bannerBg   = isDark
    ? "linear-gradient(160deg,#0a1208,#0e1c10)"
    : "linear-gradient(160deg,#f4fbf4,#ecf5ec)"
  const bannerBdr  = isDark ? "#1a3323"  : "#cce8cc"

  return (
    <>
      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <section style={{ background:bannerBg, borderBottom:`1px solid ${bannerBdr}` }}>
        <div
          ref={bannerRef}
          style={{
            maxWidth:1320, margin:"0 auto", padding:`${padV}px ${padH}px`,
            display:"flex", flexDirection:sideLayout?"row":"column",
            gap:sideLayout?(isDesk?44:24):20,
            alignItems:sideLayout?"center":"stretch",
            opacity:bannerVisible?1:0, transform:bannerVisible?"none":"translateY(22px)",
            transition:"opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {/* ── Left text ── */}
          <div style={{ flexShrink:0, width:sideLayout?leftW:"100%", textAlign:sideLayout?"left":"center" }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color:accentG }}>
              Elegantly Crafted
            </p>
            <h2 className="text-2xl font-bold mb-3" style={{ color:headingC }}>
              Our Curated Vase Collection
            </h2>
            <p className="text-sm mb-5" style={{ color:subC }}>
              A good vase makes every bouquet better. Shop our range in different styles, sizes, and finishes.
            </p>
            <div style={{ display:"flex", justifyContent:sideLayout?"flex-start":"center" }}>
              <button
                onClick={() => onNavigate?.("vases")}
                style={{ display:"inline-flex", alignItems:"center", gap:7, backgroundColor:DG, color:"#fff", fontSize:"13px", fontWeight:600, padding:"10px 22px", borderRadius:"8px", border:"none", cursor:"pointer", transition:"all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor=G; e.currentTarget.style.boxShadow="0 5px 16px rgba(46,139,52,0.28)" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor=DG; e.currentTarget.style.boxShadow="none" }}>
                Shop All Vases
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Right: 3 square tiles ── */}
          <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:isDesk?14:10 }}>
            {CATEGORIES.map((cat, i) => (
              <div key={cat.label} onClick={() => onNavigate?.(cat.nav)}
                style={{ cursor:"pointer", opacity:bannerVisible?1:0, transform:bannerVisible?"none":"translateY(12px)", transition:`opacity 0.5s ease ${i*80+180}ms, transform 0.5s ease ${i*80+180}ms` }}>
                <div
                  style={{ aspectRatio:"1/1", borderRadius:"10px", overflow:"hidden", border:`1px solid ${tileBdrC}`, boxShadow:isDark?"0 3px 12px rgba(0,0,0,0.5)":"0 3px 12px rgba(0,0,0,0.07)", transition:"box-shadow 0.25s, transform 0.25s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow=isDark?"0 8px 24px rgba(0,0,0,0.65)":"0 8px 24px rgba(0,0,0,0.13)"; e.currentTarget.style.transform="translateY(-3px)" }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow=isDark?"0 3px 12px rgba(0,0,0,0.5)":"0 3px 12px rgba(0,0,0,0.07)"; e.currentTarget.style.transform="none" }}
                >
                  <img src={cat.image} alt={cat.label}
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform 0.6s ease" }}
                    onMouseEnter={e => e.currentTarget.style.transform="scale(1.08)"}
                    onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}/>
                </div>
                <p className="text-sm font-semibold mt-2" style={{ color:tileLabelC, textAlign:sideLayout?"left":"center" }}>{cat.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color:tileLinkC, textAlign:sideLayout?"left":"center" }}>Shop Now &rarr;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Vases ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor:sectionBg }}>
        <div
          ref={gridRef}
          style={{
            maxWidth:1320, margin:"0 auto",
            padding:`${isDesk?40:28}px ${padH}px ${isDesk?52:40}px`,
            opacity:gridVisible?1:0, transform:gridVisible?"none":"translateY(18px)",
            transition:"opacity 0.65s ease, transform 0.65s ease",
          }}
        >
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:3, height:24, backgroundColor:G, borderRadius:2, flexShrink:0 }}/>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color:accentG }}>Staff Favorites</p>
                <h3 className="text-xl font-bold" style={{ color:secHdrC }}>Featured Vases</h3>
              </div>
            </div>
            <button onClick={() => onNavigate?.("vases")} className="text-xs font-semibold"
              style={{ color:accentG, background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>
              View All &rarr;
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:`repeat(${prodCols},minmax(0,1fr))`, gap:prodGap }}>
            {FEATURED.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} wishlist={wishlist} toggleWishlist={toggleWishlist} onPreview={setPreviewProduct} isDark={isDark}/>
            ))}
          </div>
        </div>
      </section>

      {previewProduct && (
        <ProductPreviewModal
          product={{ ...previewProduct, _ribbonColor:RIBBON_COLORS[previewProduct.ribbon] }}
          onClose={() => setPreviewProduct(null)}
          onNavigate={onNavigate}
        />
      )}
    </>
  )
}