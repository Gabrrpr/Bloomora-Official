import { useState, useEffect, Fragment } from "react"
import { useTheme } from "../../context/ThemeContext"
import { useBranch } from "../../context/BranchContext" 
import { api } from "../../services/api.js"

import HeroCarousel from "../../components/HeroCarousel.jsx"
import OccasionsStrip from "../../components/OccasionsStrip.jsx"
import ChooseYourBloom from "../../components/ChooseYourBloom.jsx"
import DynamicFeaturedSections from "../../components/DynamicFeaturedSection.jsx" 
import RecommendedProducts from "../../components/Recommendations.jsx"
import CustomizeSection from "../../components/CustomizeSection.jsx"
import Testimonials from "../../components/Testimonials.jsx"
import HomeFAQ from "../../components/HomeFAQ.jsx"
import Footer from "../../components/Footer.jsx"
import FallingRoses from "../../components/FallingRoses.jsx"
import FeaturesBar from "../../components/FeaturesBar.jsx"
import BackToTop from "../../components/BackToTop.jsx"
import ProductPreviewModal from "../../components/ProductPreviewModal.jsx" 
import GridCard from "../../components/GridCard.jsx"

function FlashCountdown({ endTime, isDark }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = new Date(endTime) - now
  if (!endTime || isNaN(diff) || diff <= 0) return null

  const totalSec = Math.floor(diff / 1000)
  const days  = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins  = Math.floor((totalSec % 3600) / 60)
  const secs  = totalSec % 60

  const units = [
    ...(days > 0 ? [{ v: days, l: "Days" }] : []),
    { v: hours, l: "Hrs" },
    { v: mins,  l: "Min" },
    { v: secs,  l: "Sec" },
  ]

  const pad = n => String(n).padStart(2, "0")

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
        Ends in
      </span>
      <div className="flex items-center gap-1">
        {units.map((u, i) => (
          <Fragment key={u.l}>
            {i > 0 && <span className="text-sm font-bold" style={{ color: isDark ? "#f87171" : "#ef4444" }}>:</span>}
            <div className="flex flex-col items-center justify-center min-w-[38px] px-1.5 py-1 rounded-lg"
              style={{ backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#fff1f2", border: `1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}` }}>
              <span className="text-sm font-extrabold tabular-nums leading-none" style={{ color: isDark ? "#fca5a5" : "#dc2626" }}>{pad(u.v)}</span>
              <span className="text-[8px] font-bold uppercase tracking-wide mt-0.5" style={{ color: isDark ? "#94a3b8" : "#9ca3af" }}>{u.l}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export default function Home({ onNavigate, isCustomizationEnabled }) {
  const { isDark } = useTheme()
  const { branch = "Manila" } = useBranch() || {}

  console.log("📍 Home.jsx detected branch change:", branch)

  const [previewProduct, setPreviewProduct] = useState(null)
  const [flashSales, setFlashSales] = useState([])

  useEffect(() => {
    api.get("/products/flash-sales")
      .then(data => setFlashSales(data))
      .catch(err => console.error("Error loading flash sales", err))
  }, [])

  const branchFlashSales = flashSales.filter(product =>
    product.branches?.includes(branch)
  )

  const flashEndsAt = branchFlashSales
    .map(p => p.limited_end_at)
    .filter(Boolean)
    .map(d => new Date(d))
    .filter(d => !isNaN(d) && d > new Date())
    .sort((a, b) => a - b)[0] || null

  const toggleWishlist = (id) => console.log("Toggle wishlist", id)

  // Handles category-aware navigation from featured sections.
  // Format: "shop:bouquet", "shop:vase", "shop:funeral", etc.
  // Plain targets like "shop" or "make-it-personal" pass through unchanged.
  const handleNavigate = (target) => {
    if (target && typeof target === "string" && target.startsWith("shop:")) {
      const category = target.replace("shop:", "").trim()
      localStorage.setItem("bloomora_active_category", category)
      onNavigate("shop")
      return
    }
    onNavigate(target)
  }

  return (
    <div style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
      <div className="relative overflow-hidden">
        <FallingRoses />
        <HeroCarousel onNavigate={onNavigate} />
      </div>

      <FeaturesBar />

      {branchFlashSales.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
          <div className="relative overflow-hidden rounded-2xl px-4 py-6 sm:px-6 sm:py-7"
            style={{
              background: isDark
                ? "linear-gradient(135deg,#2a1512 0%,#1f1b16 50%,#1e293b 100%)"
                : "linear-gradient(135deg,#fff7ed 0%,#ffffff 48%,#fef2f2 100%)",
              border: `1px solid ${isDark ? "rgba(251,146,60,0.24)" : "#fed7aa"}`,
              boxShadow: isDark ? "0 18px 40px rgba(0,0,0,0.35)" : "0 18px 42px rgba(239,68,68,0.08)",
            }}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-2"
                  style={{
                    backgroundColor: isDark ? "rgba(251,146,60,0.14)" : "#ffedd5",
                    color: isDark ? "#fdba74" : "#c2410c",
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? "#fdba74" : "#f97316" }} />
                  Limited-time deals
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: isDark ? "#f8fafc" : "#111827" }}>
                    Flash Sale
                  </h2>
                  <p className="text-sm mt-1 max-w-xl" style={{ color: isDark ? "#cbd5e1" : "#64748b" }}>
                    Branch-ready deals with live markdowns and fresh availability.
                  </p>
                </div>
              </div>
              {flashEndsAt && <FlashCountdown endTime={flashEndsAt} isDark={isDark} />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {branchFlashSales.map(product => (
                <div key={product.id} className="min-w-0">
                  <GridCard
                    product={product}
                    wishlist={[]}
                    toggleWishlist={toggleWishlist}
                    onPreview={setPreviewProduct}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecommendedProducts
          onPreview={setPreviewProduct}
          toggleWishlist={toggleWishlist}
          wishlist={[]}
        />
      </section>

      <OccasionsStrip onNavigate={onNavigate} />

      <ChooseYourBloom
        key={`carousel-${branch}`}
        branch={branch}
        onNavigate={onNavigate}
      />

      <DynamicFeaturedSections
        key={`featured-${branch}`}
        branch={branch}
        onNavigate={handleNavigate}
        onPreview={setPreviewProduct}
      />

      <CustomizeSection onNavigate={onNavigate} isCustomizationEnabled={isCustomizationEnabled} />
      <Testimonials />
      <HomeFAQ onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />

      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onNavigate={onNavigate}
        />
      )}

      <BackToTop />
    </div>
  )
}