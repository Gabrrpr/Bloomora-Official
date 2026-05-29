import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { api } from "../services/api"

const G  = "#2E8B34"
const DG = "#0C573E"

const RIBBON_COLORS = {
  "Best Seller": "#2E8B34", "Top Pick": "#0C573E",
  "New": "#3b82f6", "Popular": "#f59e0b",
  "Premium": "#7c3aed", "Rare Find": "#ec4899",
  "Tribute": "#6b7280", "Classic": "#0C573E",
  "Comfort": "#9d174d", "Sympathy": "#1d4ed8",
}

// ─── 1. Your Beautiful Single Section Layout ─────────────────────────────────
function SectionBlock({ data, products, onNavigate, isDark }) {
  if (!data) return null;

  const accentG  = isDark ? "#4ade80" : G
  const headingC = isDark ? "#f3f4f6" : "#1f2937"
  const subC     = isDark ? "#9ca3af" : "#6b7280"
  const bannerBg = isDark ? "#0b1410" : "#ffffff"
  const bannerBdr= isDark ? "#1a3323" : "#eef3ee"
  const tileBdr  = isDark ? "#1e3a28" : "#e6efe6"
  const tileBg   = isDark ? "#0f1a14" : "#f5faf5"
  const sectionBg= isDark ? "#111827" : "#fafafa"
  const secHdrC  = isDark ? "#f3f4f6" : "#1f2937"

  // Safely map products to slots based on Admin selections
  const slotProducts = (data.featured || []).map(slot => products.find(p => String(p.id) === String(slot.productId)))
  const tileProducts = (data.categories || []).map(cat => products.find(p => String(p.id) === String(cat.productId)))

  return (
    <div className="w-full">
      {/* ── Banner Area ── */}
      <section style={{ backgroundColor: bannerBg, borderBottom: `1px solid ${bannerBdr}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 items-center">
          <div className="text-center lg:text-left">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: accentG }}>
              {data.banner.eyebrow}
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight" style={{ color: headingC }}>
              {data.banner.heading}
            </h2>
            <div className="w-16 h-[3px] rounded-sm mx-auto lg:mx-0 mb-5" style={{ backgroundColor: G }} />
            <p className="text-base mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0" style={{ color: subC }}>
              {data.banner.description}
            </p>
            <div className="flex justify-center lg:justify-start">
              <button onClick={() => onNavigate(data.banner.ctaTarget)}
                className="inline-flex items-center gap-2 text-white text-sm font-bold px-8 py-3.5 rounded-full hover:opacity-90 transition-all shadow-lg shadow-green-900/20"
                style={{ backgroundColor: DG }}>
                {data.banner.ctaLabel}
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {data.categories.map((cat, i) => {
              const linked = tileProducts[i]
              return (
                <button key={i} onClick={() => onNavigate(cat.nav || "shop")}
                  className={`group relative aspect-square overflow-hidden rounded-2xl transition-transform hover:-translate-y-1 hover:shadow-xl ${i === 1 ? "lg:mt-8" : ""}`}
                  style={{ border: `1px solid ${tileBdr}`, backgroundColor: tileBg }}>
                  {linked?.image && (
                    <img src={linked.image} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4"
                    style={{ background: "linear-gradient(to top, rgba(12,87,62,0.85) 0%, rgba(12,87,62,0.1) 60%, transparent 100%)" }}>
                    <span className="text-[10px] sm:text-xs font-bold text-green-300 uppercase tracking-wider mb-0.5 transform translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {cat.tag}
                    </span>
                    <p className="text-white text-sm sm:text-base font-bold leading-tight w-full text-left">{cat.label}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Grid Area ── */}
      <section style={{ backgroundColor: sectionBg }} className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-[3px] h-8 rounded-sm shrink-0" style={{ backgroundColor: G }} />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: accentG }}>{data.sectionEyebrow}</p>
              <h3 className="text-2xl md:text-3xl font-extrabold" style={{ color: secHdrC }}>{data.sectionHeading}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {slotProducts.map((p, i) => {
              if (!p) return null;
              const ribbon = data.featured[i].ribbonOverride ?? p.ribbon
              const ribbonColor = RIBBON_COLORS[ribbon]
              return (
                <button key={i} onClick={() => onNavigate("product", { id: p.id })}
                  className="group flex flex-col text-left rounded-xl overflow-hidden transition-all hover:shadow-xl"
                  style={{ backgroundColor: isDark ? "#1a2332" : "#ffffff", border: `1px solid ${isDark ? "#2d3748" : "#f3f4f6"}` }}>
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {ribbon && ribbonColor && (
                      <div className="absolute top-3 left-0 z-10 shadow-sm">
                        <div className="text-[10px] font-bold text-white py-1 pr-3 pl-2.5" style={{ backgroundColor: ribbonColor, clipPath: "polygon(0 0,calc(100% - 6px) 0,100% 50%,calc(100% - 6px) 100%,0 100%)" }}>{ribbon}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: subC }}>{p.category}</p>
                    <p className="text-sm md:text-base font-bold leading-tight mb-2 line-clamp-2" style={{ color: headingC }}>{p.name}</p>
                    <p className="text-sm md:text-base font-extrabold mt-auto" style={{ color: accentG }}>₱{Number(p.price || 0).toLocaleString()}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── 2. Master Loop Component ────────────────────────────────────────────────
export default function DynamicFeaturedSections({ onNavigate }) {
  const { isDark } = useTheme()
  const [sectionsData, setSectionsData] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    
    const loadAllData = async () => {
      try {
        const [settingsData, productsData] = await Promise.all([
          api.get("/products/admin/settings/homepage").catch(() => null),
          api.get("/products/").catch(() => [])
        ]);

        if (!isMounted) return;

        // Normalize products
        const rawProducts = Array.isArray(productsData) ? productsData : (productsData?.products || productsData?.items || productsData?.data || []);
        const normalizedProducts = rawProducts.map(p => ({
          ...p,
          id: p.id,
          name: p.name || "Unnamed",
          price: Number(p.price) || 0,
          image: p.image || p.image_url || null,
        }));
        
        setAllProducts(normalizedProducts);

        // Convert the database object of sections into an ordered Array so we can map() it
        if (settingsData && Object.keys(settingsData).length > 0) {
           const sectionsArray = Object.keys(settingsData).map(key => ({
              id: key, // Keep the key (e.g. 'bouquets', 'funeral', 'section_173000') for React key prop
              ...settingsData[key]
           }));
           setSectionsData(sectionsArray);
        }
      } catch (err) {
        console.error("Failed to load sections data.", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllData();
    return () => { isMounted = false };
  }, []);

  if (loading) {
     return (
       <div className="py-24 text-center text-gray-500 animate-pulse">
         Loading Featured Collections...
       </div>
     )
  }

  return (
    <>
      {/* 🚀 This loop is the magic! It creates a block for EVERY section the Admin created */}
      {sectionsData.map((section) => (
         <SectionBlock 
            key={section.id} 
            data={section} 
            products={allProducts} 
            isDark={isDark} 
            onNavigate={onNavigate} 
         />
      ))}
    </>
  )
}