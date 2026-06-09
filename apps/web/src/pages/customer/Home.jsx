import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"

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
import AdPopup from "../../components/AdPopup.jsx" // Make sure this matches your file name!

export default function Home({ onNavigate, isCustomizationEnabled }) {
  const { isDark } = useTheme()
  const [previewProduct, setPreviewProduct] = useState(null)
  const [showAd, setShowAd] = useState(true)

  return (
    <div style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
      {/* Pop-up Ad */}
      {showAd && <AdPopup onClose={() => setShowAd(false)} />}

      <div className="relative overflow-hidden">
        <FallingRoses />
        <HeroCarousel onNavigate={onNavigate} />
      </div>

      <FeaturesBar />
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

      {/* Product Modal */}
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