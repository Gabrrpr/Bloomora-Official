import { useState, useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"
import { api } from "../../services/api.js"

// 1. All Imports
import HeroCarousel from "../../components/HeroCarousel.jsx"
import OccasionsStrip from "../../components/OccasionsStrip.jsx"
import ChooseYourBloom from "../../components/ChooseYourBloom.jsx"
import DynamicFeaturedSections from "../../components/DynamicFeaturedSection.jsx" 
import CustomizeSection from "../../components/CustomizeSection.jsx"
import Testimonials from "../../components/Testimonials.jsx"
import HomeFAQ from "../../components/HomeFAQ.jsx"
import Footer from "../../components/Footer.jsx"
import FallingRoses from "../../components/FallingRoses.jsx"
import FeaturesBar from "../../components/FeaturesBar.jsx"
import BackToTop from "../../components/BackToTop.jsx"
import ProductPreviewModal from "../../components/ProductPreviewModal.jsx" 
import AdPopup from "../../components/AdPopup.jsx" 
import GridCard from "../../components/GridCard.jsx"

export default function Home({ onNavigate, isCustomizationEnabled }) {
  const { isDark } = useTheme()
  const [previewProduct, setPreviewProduct] = useState(null)
  const [showAd, setShowAd] = useState(true)
  
  // 🚀 New state for flash sales
  const [flashSales, setFlashSales] = useState([])

  // 🚀 Fetch flash sales
  useEffect(() => {
    api.get("/products/flash-sales")
       .then(data => {
         console.log("DEBUG: Flash sales received from API:", data); // Check this log
         setFlashSales(data);
       })
       .catch(err => console.error("Error loading flash sales", err));
  }, []);

  // Dummy functions to satisfy GridCard props if you don't have global state for these
  const toggleWishlist = (id) => console.log("Toggle wishlist", id);

  return (
    <div style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
      {showAd && <AdPopup onClose={() => setShowAd(false)} />}

      <div className="relative overflow-hidden">
        <FallingRoses />
        <HeroCarousel onNavigate={onNavigate} />
      </div>

      <FeaturesBar />
      {flashSales.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: isDark ? "#f1f5f9" : "#111827" }}>
              Flash Sale
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {flashSales.map(product => (
              <GridCard 
                key={product.id} 
                product={product} 
                wishlist={[]} // Pass your wishlist state here
                toggleWishlist={toggleWishlist} 
                onPreview={setPreviewProduct}
              />
            ))}
          </div>
        </section>
      )}

      <OccasionsStrip onNavigate={onNavigate} />
      <ChooseYourBloom onNavigate={onNavigate} />

      <DynamicFeaturedSections 
        onNavigate={onNavigate} 
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