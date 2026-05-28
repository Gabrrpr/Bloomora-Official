import { useState, useEffect, useRef } from "react"
import { useTheme } from "../context/ThemeContext"
import { api } from "../services/api"
import ProductPreviewModal from "./ProductPreviewModal.jsx"

import MassCard       from "../assets/products/funeral/MassCard.png"
import Candle         from "../assets/products/funeral/Candle.png"
import FuneralPlaceholder from "../assets/products/funeral/FuneralFlower1.png" 

const G  = "#2E8B34"
const DG = "#0C573E"

const RIBBON_COLORS = {
  "Tribute":  "#6b7280",
  "Classic":  "#0C573E",
  "Premium":  "#7c3aed",
  "Comfort":  "#9d174d",
  "Sympathy": "#1d4ed8",
}

// ─── Default Fallback Settings ───────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  banner: {
    eyebrow: "With Sympathy",
    heading: "Honoring Lives, Beautifully Remembered",
    description: "Thoughtful candles, mass cards, and funeral flowers to express your deepest condolences with grace.",
    ctaLabel: "Shop Funeral Flowers",
    ctaTarget: "funeral-flowers",
  },
  categories: [
    { label: "Memorial Candles",  tag: "Remembrance", image: Candle,             nav: "candles"         },
    { label: "Mass Cards",        tag: "Sympathy",    image: MassCard,           nav: "masscards"       },
    { label: "Funeral Flowers",   tag: "Tribute",     image: FuneralPlaceholder, nav: "funeral-flowers" },
  ],
  sectionHeading: "Funeral Arrangements",
  sectionEyebrow: "Featured Tributes",
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────
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

// ─── Stars ───────────────────────────────────────────────────────────────────
function Stars({ rating, isDark }) {
  return (
    <div className="flex gap-px">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 20 20"
          fill={i <= Math.floor(rating) ? "#f59e0b" : (isDark ? "#374151" : "#e0e0e0")}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

// ─── Ribbon ──────────────────────────────────────────────────────────────────
function Ribbon({ label }) {
  const color = RIBBON_COLORS[label]
  if (!color) return null
  return (
    <div className="absolute top-2.5 left-0 z-10">
      <div
        className="text-[9px] font-bold text-white py-[3px] pr-3.5 pl-2"
        style={{
          backgroundColor: color,
          clipPath: "polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)",
        }}
      >
        {label}
      </div>
    </div>
  )
}

// ─── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product, index, wishlist, toggleWishlist, onPreview, isDark }) {
  const [ref, visible] = useScrollReveal(0.04)
  const wishlisted = wishlist.includes(product.id)
  
  // Safe number conversions to prevent string math errors
  const currentPrice = Number(product.price) || 0;
  const originalPrice = Number(product.original) || currentPrice;
  const disc = originalPrice > currentPrice 
    ? Math.round((1 - currentPrice / originalPrice) * 100) 
    : null;

  // Ensure image string is valid, otherwise use placeholder
  const displayImage = product.image || FuneralPlaceholder;

  return (
    <div
      ref={ref}
      onClick={() => onPreview(product)}
      className="group rounded-[10px] overflow-hidden cursor-pointer transition-all duration-500 ease-out flex flex-col h-full"
      style={{
        backgroundColor: isDark ? "#1a2332" : "#ffffff",
        border: `1px solid ${isDark ? "#2d3748" : "#e8e8e8"}`,
        transitionDelay: `${index * 70}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(18px)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isDark ? "#2d5a38" : "#b0d8b0"
        e.currentTarget.style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.09)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDark ? "#2d3748" : "#e8e8e8"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div className="relative aspect-square overflow-hidden shrink-0" style={{ backgroundColor: isDark ? "#0f172a" : "#f4f8f4" }}>
        <img
          src={displayImage}
          alt={product.name || "Product"}
          className="w-full h-full object-cover block transition-transform duration-[550ms] ease-out group-hover:scale-[1.07]"
          onError={(e) => { 
            e.target.onerror = null; // Prevent infinite loop
            e.target.src = FuneralPlaceholder; // Replace broken link with fallback
          }}
        />
        {product.ribbon && <Ribbon label={product.ribbon} />}
        {disc > 0 && (
          <div className="absolute top-2 right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#0C573E" }}>
            -{disc}%
          </div>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-3.5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold" style={{ color: isDark ? "#4ade80" : G }}>
              ₱{currentPrice.toLocaleString()}
            </span>
            {originalPrice > currentPrice && (
              <span className="text-[10px] line-through" style={{ color: isDark ? "#6b7280" : "#b8b8b8" }}>
                ₱{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
            className="w-[26px] h-[26px] rounded-md shrink-0 flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: wishlisted ? "#fef2f2" : (isDark ? "#1e2a3a" : "#f4f7f4"),
              border: `1px solid ${wishlisted ? "#fecaca" : (isDark ? "#2d3748" : "#dde8dd")}`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" strokeWidth={2} fill={wishlisted ? "#e11d48" : "none"} stroke={wishlisted ? "#e11d48" : (isDark ? "#6b7280" : "#aaa")}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>

        <p className="text-xs font-semibold leading-snug mb-1.5 line-clamp-1" style={{ color: isDark ? "#e2e8f0" : "#374151" }}>
          {product.name}
        </p>

        <div className="flex items-center gap-1.5 mb-2.5">
          <Stars rating={product.rating || 5} isDark={isDark} />
          <span className="text-[10px]" style={{ color: isDark ? "#6b7280" : "#9ca3af" }}>
            {product.rating || 5} ({product.reviews || 0})
          </span>
        </div>

        <div className="mt-auto pt-2">
          <button
            onClick={e => { e.stopPropagation(); onPreview(product) }}
            className="w-full text-xs font-semibold text-white py-2 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-[#2E8B34] hover:bg-[#0C573E]"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

// ─── Main export ─────────────────────────────────────────────────────────────
export default function FeaturedFuneral({ onNavigate }) {
  const { isDark } = useTheme()
  const [wishlist, setWishlist]             = useState([])
  const [previewProduct, setPreviewProduct] = useState(null)
  const [bannerRef, bannerVisible]          = useScrollReveal(0.06)
  const [gridRef, gridVisible]              = useScrollReveal(0.06)
  
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const toggleWishlist = id =>
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [settingsData, productsData] = await Promise.all([
          api.get("/products/admin/settings/homepage").catch(() => null),
          api.get("/products/").catch(() => [])
        ]);

        if (!isMounted) return;

        // Extract raw data from API response
        const rawProducts = Array.isArray(productsData) 
          ? productsData 
          : (productsData?.products || productsData?.items || productsData?.data || []);

        // 🚀 SMART PARSER: Normalize identically to the admin side
        const allProducts = rawProducts.map(p => ({
          id: p.id,
          name: p.name || "Unnamed Product",
          price: Number(p.price) || 0,
          original: Number(p.original_price || p.original || p.price) || 0,
          image: p.image || p.image_url || null,
          category: p.category || null,
          ribbon: p.ribbon || null,
          rating: p.rating || 5,
          reviews: p.reviews || 0
        }));

        if (settingsData && settingsData.funeral) {
          const funeralSettings = settingsData.funeral;

          setSettings({
            banner: funeralSettings.banner || DEFAULT_SETTINGS.banner,
            categories: funeralSettings.categories || DEFAULT_SETTINGS.categories,
            sectionHeading: funeralSettings.sectionHeading || DEFAULT_SETTINGS.sectionHeading,
            sectionEyebrow: funeralSettings.sectionEyebrow || DEFAULT_SETTINGS.sectionEyebrow,
          });

          // Process Featured Slots
          const rawFeatured = funeralSettings.featured || [];
          const mappedFeatured = rawFeatured
            .filter(slot => slot && slot.productId)
            .map(slot => {
              const prod = allProducts.find(p => String(p.id) === String(slot.productId));
              if (!prod) return null;
              
              return { 
                ...prod, 
                ribbon: slot.ribbonOverride || prod.ribbon 
              };
            })
            .filter(Boolean);
            
          setFeaturedProducts(mappedFeatured);

          // Process Categories
          const mappedCategories = funeralSettings.categories.map((cat, i) => {
            if (!cat.productId) return { ...cat, image: DEFAULT_SETTINGS.categories[i].image };
            
            const prod = allProducts.find(p => String(p.id) === String(cat.productId));
            return {
              ...cat,
              image: prod?.image || DEFAULT_SETTINGS.categories[i].image
            };
          });
          
          setSettings(prev => ({ ...prev, categories: mappedCategories }));

        }
      } catch (err) {
        console.error("Failed to load funeral section data.", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false };
  }, []);

  const accentG   = isDark ? "#4ade80" : G
  const headingC  = isDark ? "#f3f4f6" : "#1f2937"
  const subC      = isDark ? "#9ca3af" : "#6b7280"
  const sectionBg = isDark ? "#111827" : "#ffffff"
  const secHdrC   = isDark ? "#f3f4f6" : "#1f2937"
  const bannerBg  = isDark ? "#0b1410" : "#ffffff"
  const bannerBdr = isDark ? "#1a3323" : "#eef3ee"
  const tileBdr   = isDark ? "#1e3a28" : "#e6efe6"
  const tileBg    = isDark ? "#0f1a14" : "#f5faf5"

  return (
    <>
      <section style={{ backgroundColor: bannerBg, borderBottom: `1px solid ${bannerBdr}` }}>
        <div
          ref={bannerRef}
          className="max-w-[1320px] mx-auto px-4 sm:px-7 py-[30px] sm:py-[42px] lg:py-14 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:gap-14 items-center transition-all duration-700 ease-out"
          style={{
            opacity: bannerVisible ? 1 : 0,
            transform: bannerVisible ? "none" : "translateY(22px)",
          }}
        >
          {/* Left text */}
          <div className="text-center lg:text-left">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentG }}>
              {settings.banner.eyebrow}
            </p>
            <h2 className="text-2xl font-bold mb-3 leading-[1.15]" style={{ color: headingC }}>
              {settings.banner.heading}
            </h2>
            <div className="w-14 h-[3px] rounded-sm mx-auto lg:mx-0 mb-[18px]" style={{ backgroundColor: G }} />
            <p className="text-sm mb-6 max-w-[420px] mx-auto lg:mx-0" style={{ color: subC }}>
              {settings.banner.description}
            </p>
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={() => onNavigate?.(settings.banner.ctaTarget)}
                className="inline-flex items-center gap-2 text-white text-[13px] font-semibold px-[26px] py-3 rounded-full border-none cursor-pointer transition-all duration-300 hover:-translate-y-px"
                style={{ backgroundColor: DG, boxShadow: "0 6px 18px rgba(12,87,62,0.22)" }}
              >
                {settings.banner.ctaLabel}
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Right: 3 category tiles */}
          <div className="grid grid-cols-3 gap-2.5 lg:gap-4">
            {settings.categories.map((cat, i) => (
              <div
                key={i}
                onClick={() => onNavigate?.(cat.nav)}
                className={`group cursor-pointer transition-all duration-700 ease-out ${i === 1 ? "lg:mt-9" : ""}`}
                style={{
                  opacity: bannerVisible ? 1 : 0,
                  transform: bannerVisible ? "none" : "translateY(14px)",
                  transitionDelay: `${i * 100 + 180}ms`,
                }}
              >
                <div
                  className="relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300"
                  style={{
                    border: `1px solid ${tileBdr}`,
                    backgroundColor: tileBg,
                    boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 18px rgba(12,87,62,0.08)",
                  }}
                >
                  <img
                    src={cat.image || FuneralPlaceholder}
                    alt={cat.label}
                    className="w-full h-full object-cover block transition-transform duration-[650ms] ease-out group-hover:scale-[1.08]"
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = FuneralPlaceholder; 
                    }}
                  />
                  <div className="hidden sm:block absolute top-2.5 left-2.5 text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full"
                    style={{ color: DG, backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)" }}>
                    {cat.tag}
                  </div>
                  <div className="absolute inset-0 opacity-85 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5 sm:p-3.5"
                    style={{ background: "linear-gradient(to top, rgba(12,87,62,0.78) 0%, rgba(12,87,62,0.05) 55%, rgba(12,87,62,0) 100%)" }}>
                    <div className="w-full flex items-center justify-center sm:justify-between gap-1.5">
                      <p className="text-white font-semibold m-0 text-[11px] sm:text-sm text-center sm:text-left leading-tight">
                        {cat.label}
                      </p>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(4px)" }}>
                        Shop
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured grid ─────────────────────────────────────────────────── */}
      {!loading && (
        <section style={{ backgroundColor: sectionBg }}>
          <div
            ref={gridRef}
            className="max-w-[1320px] mx-auto px-4 sm:px-7 pt-7 pb-10 lg:pt-10 lg:pb-[52px] transition-all duration-700 ease-out"
            style={{
              opacity: gridVisible ? 1 : 0,
              transform: gridVisible ? "none" : "translateY(18px)",
            }}
          >
            {/* The Header now ALWAYS renders */}
            <div className="flex items-end justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-6 rounded-sm shrink-0" style={{ backgroundColor: G }} />
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: accentG }}>
                    {settings.sectionEyebrow}
                  </p>
                  <h3 className="text-xl font-bold" style={{ color: secHdrC }}>
                    {settings.sectionHeading}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.("funeral-flowers")}
                className="text-xs font-semibold bg-transparent border-none cursor-pointer whitespace-nowrap"
                style={{ color: accentG }}
              >
                View All &rarr;
              </button>
            </div>

            {/* Render Grid if products exist, otherwise show empty state message */}
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-[18px]">
              {featuredProducts.map((p, i) => (
                <ProductCard
                  key={`${p.id}-${i}`} // 🚀 Makes the key unique even if the product is duplicated
                  product={p}
                  index={i}
                  wishlist={wishlist}
                  toggleWishlist={toggleWishlist}
                  onPreview={setPreviewProduct}
                  isDark={isDark}
                />
              ))}
            </div>
            ) : (
              <div className="py-12 border-t border-gray-100 dark:border-gray-800 mt-4">
                <div className="text-center text-sm" style={{ color: subC }}>
                   Funeral arrangements will be available soon.
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {previewProduct && (
        <ProductPreviewModal
          product={{ ...previewProduct, _ribbonColor: RIBBON_COLORS[previewProduct.ribbon] }}
          onClose={() => setPreviewProduct(null)}
          onNavigate={onNavigate}
        />
      )}
    </>
  )
}