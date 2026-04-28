import { useState, useEffect, useRef } from "react"
import ProductPreviewModal from "./ProductPreviewModal.jsx"

import SpringFlowers_PurpleWrapper from "../assets/products/SpringFlowers_PurpleWrapper.png"
import SpringFlowers_PinkWrapper from "../assets/products/SpringFlowers_PinkWrapper.png"
import SpringFlowers_GreenWrapper from "../assets/products/SpringFlowers_GreenWrapper.png"
import RainbowEquadorRoses from "../assets/products/RainbowEquadorRoses.png"
import MixTulips from "../assets/products/MixTulips.png"
import Dozen_YellowChinaRoses from "../assets/products/Dozen_YellowChinaRoses.png"
import Dozen_RedEquadorRoses from "../assets/products/Dozen_RedEquadorRoses.png"
import Dozen_RedChinaRoses from "../assets/products/Dozen_RedChinaRoses.png"
import Dozen_PinkChinaRoses from "../assets/products/Dozen_PinkChinaRoses.png"
import Dozen_OrangeChinaRoses from "../assets/products/Dozen_OrangeChinaRoses.png"
import Roses_24pcs_Red from "../assets/products/24pcs_RedEquadorRoses.png"
import Roses_10pcs_Blue from "../assets/products/10pcs_BlueChinaRoses.png"
import Roses_6pcs_White from "../assets/products/6pcs_WhiteEquadorRoses.png"
import Roses_6pcs_Purple from "../assets/products/6pcs_PurpleChinaRoses.png"
import Sunflower_3pcs from "../assets/products/3pcs_Sunflower.png"
import Tulips_3pc_Pink from "../assets/products/3pc_PinkTulips.png"

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34",
  "Top Pick":    "#0C573E",
  "New":         "#3b82f6",
  "Popular":     "#f59e0b",
  "Premium":     "#7c3aed",
  "Rare Find":   "#ec4899",
}

const PRODUCTS = [
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

function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, visible]
}

function StarRating({ rating, reviews }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className="w-3 h-3" fill={i <= Math.floor(rating) ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-400 leading-none">{rating} ({reviews})</span>
    </div>
  )
}

function Ribbon({ label }) {
  const color = RIBBON_COLORS[label]
  if (!color) return null
  return (
    <div className="absolute top-3 left-0 z-10">
      <div
        className="text-[10px] font-bold text-white px-3 py-1 shadow-sm"
        style={{
          backgroundColor: color,
          clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)",
          paddingRight: "16px",
        }}
      >
        {label}
      </div>
    </div>
  )
}

function ProductCard({ product, index, wishlist, toggleWishlist, discount, onPreview }) {
  const [ref, visible] = useScrollReveal(0.1)
  const wishlisted = wishlist.includes(product.id)

  return (
    <div
      ref={ref}
      className="bg-white group hover:shadow-lg"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${(index % 4) * 60}ms`,
        cursor: "pointer",
      }}
      onClick={() => onPreview(product)}
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: "1 / 1" }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.ribbon && <Ribbon label={product.ribbon} />}
        <div
          className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5"
          style={{ backgroundColor: "#0C573E", borderRadius: "4px" }}
        >
          -{discount(product.original, product.price)}%
        </div>


      </div>

      {/* ── Card body ── */}
      <div className="p-3">

        {/* Price row — with heart icon on the right */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold" style={{ color: "#2E8B34" }}>
              ₱{product.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 line-through">
              ₱{product.original.toLocaleString()}
            </span>
          </div>

          {/* Heart icon — always visible, never blocked by overlay */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id) }}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200"
            style={{
              backgroundColor: wishlisted ? "#fef2f2" : "#f9fafb",
              border: wishlisted ? "1px solid #fecaca" : "1px solid #e5e7eb",
            }}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              className="w-4 h-4 transition-all duration-200"
              fill={wishlisted ? "#e11d48" : "none"}
              stroke={wishlisted ? "#e11d48" : "#9ca3af"}
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <p className="text-sm font-medium text-gray-800 leading-snug mb-1.5 line-clamp-2">{product.name}</p>

        <div className="mb-3">
          <StarRating rating={product.rating} reviews={product.reviews} />
        </div>

        {/* View Details — full green filled button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(product) }}
          className="w-full text-sm font-medium py-2 text-white transition-all duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#2E8B34", borderRadius: "6px", border: "none" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#0C573E"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#2E8B34"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function FeaturedProducts({ onNavigate }) {
  const [wishlist, setWishlist]             = useState([])
  const [previewProduct, setPreviewProduct] = useState(null)
  const [headerRef, headerVisible]          = useScrollReveal(0.2)

  const toggleWishlist = (id) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const discount = (orig, price) => Math.round((1 - price / orig) * 100)

  return (
    <section className="py-12 px-8 bg-white">
      <div className="max-w-7xl mx-auto">

        <div
          ref={headerRef}
          className="text-center mb-10"
          style={{
            transition: "opacity 0.6s ease, transform 0.6s ease",
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#2E8B34" }}>
            Handpicked for You
          </p>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Products</h2>
          <p className="text-gray-400 text-sm">Our most-loved flowers, all in one place.</p>
          <div className="mt-4 w-12 h-0.5 mx-auto rounded-full" style={{ backgroundColor: "#2E8B34" }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              discount={discount}
              onPreview={setPreviewProduct}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            className="px-8 py-2.5 text-sm font-medium border transition-all duration-200 hover:shadow-sm"
            style={{ borderColor: "#2E8B34", color: "#2E8B34", borderRadius: "6px" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#2E8B34"; e.currentTarget.style.color = "white" }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#2E8B34" }}
            onClick={() => onNavigate?.("shop")}
          >
            View All Products →
          </button>
        </div>
      </div>

      {previewProduct && (
        <ProductPreviewModal
          product={{ ...previewProduct, _ribbonColor: RIBBON_COLORS[previewProduct.ribbon] }}
          onClose={() => setPreviewProduct(null)}
          onNavigate={onNavigate}
        />
      )}
    </section>
  )
}
