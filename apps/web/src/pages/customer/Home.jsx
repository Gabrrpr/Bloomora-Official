import { useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import HeroCarousel      from "../../components/HeroCarousel.jsx"
import OccasionsStrip    from "../../components/OccasionsStrip.jsx"
import ChooseYourBloom from "../../components/ChooseYourBloom.jsx"
import DynamicFeaturedSections from "../../components/DynamicFeaturedSection.jsx" 
import CustomizeSection  from "../../components/CustomizeSection.jsx"
import Testimonials      from "../../components/Testimonials.jsx"
import HomeFAQ           from "../../components/HomeFAQ.jsx"
import Footer            from "../../components/Footer.jsx"
import FallingRoses      from "../../components/FallingRoses.jsx"
import FeaturesBar from "../../components/FeaturesBar.jsx"
import BackToTop from "../../components/BackToTop.jsx"

// 🚀 1. Import the modal
import ProductPreviewModal from "../../components/ProductPreviewModal.jsx" 

export default function Home({ onNavigate, isCustomizationEnabled }) {
  const { isDark } = useTheme()

  // 🚀 2. Create the state to hold the currently clicked product
  const [previewProduct, setPreviewProduct] = useState(null)

  return (
    <div style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
      <div className="relative overflow-hidden">
        <FallingRoses />
        <HeroCarousel onNavigate={onNavigate} />
      </div>
      <FeaturesBar />
      <OccasionsStrip onNavigate={onNavigate} />
      <ChooseYourBloom onNavigate={onNavigate} />
      

      {/* 🚀 3. Pass "setPreviewProduct" down as a prop called "onPreview" */}
      <DynamicFeaturedSections 
        onNavigate={onNavigate} 
        onPreview={setPreviewProduct} 
      />

      <CustomizeSection onNavigate={onNavigate} isCustomizationEnabled={isCustomizationEnabled} />
      <Testimonials />
      <HomeFAQ onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />

      {/* 🚀 4. Render the modal if a product is selected */}
      {previewProduct && (
        <ProductPreviewModal 
          product={previewProduct} 
          onClose={() => setPreviewProduct(null)} 
          onNavigate={onNavigate}
        />
      )}

            {/* 🚀 4. Render the modal if a product is selected */}
      {previewProduct && (
        <ProductPreviewModal 
          product={previewProduct} 
          onClose={() => setPreviewProduct(null)} 
          onNavigate={onNavigate}
        />
      )}

      {/* Floating scroll-to-top button (left side) */}
      <BackToTop />
      
      

    </div>
  )
}