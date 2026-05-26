import { useState, useEffect } from "react"
import { api } from "../../services/api.js"

import HeroCarousel      from "../../components/HeroCarousel.jsx"
import OccasionsStrip    from "../../components/OccasionsStrip.jsx"
import DynamicFeaturedSection from "../../components/DynamicFeaturedSection.jsx";
import FeaturedFuneral   from "../../components/FeaturedFuneral.jsx"
import CustomizeSection  from "../../components/CustomizeSection.jsx"
import Testimonials      from "../../components/Testimonials.jsx"
import HomeFAQ           from "../../components/HomeFAQ.jsx"
import Footer            from "../../components/Footer.jsx"
import FallingRoses      from "../../components/FallingRoses.jsx"

export default function Home({ onNavigate, isCustomizationEnabled }) {
  const [homepageLayout, setHomepageLayout] = useState(null)
  const [liveProducts, setLiveProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        // Fetch layout and products simultaneously for speed
        const [layoutData, productsData] = await Promise.all([
          api.get("/products/admin/settings/homepage"),
          api.get("/products/")
        ]);

        if (layoutData && layoutData.bouquets) {
          setHomepageLayout(layoutData);
        }
        if (productsData) {
          setLiveProducts(productsData);
        }
      } catch (err) {
        console.error("Failed to load live homepage:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <svg className="w-10 h-10 text-[#2E8B34] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Arranging fresh blooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden">
        <FallingRoses />
        <HeroCarousel onNavigate={onNavigate} />
      </div>

      <OccasionsStrip onNavigate={onNavigate} />

      {/* 🚀 Render the Live Database Sections! */}
      {homepageLayout && (
        <>
          <DynamicFeaturedSection 
            data={homepageLayout.bouquets} 
            products={liveProducts} 
            onNavigate={onNavigate} 
          />
          <DynamicFeaturedSection 
            data={homepageLayout.nonFloral} 
            products={liveProducts} 
            onNavigate={onNavigate} 
          />
        </>
      )}

      <FeaturedFuneral onNavigate={onNavigate} />
      <CustomizeSection onNavigate={onNavigate} isCustomizationEnabled={isCustomizationEnabled} />
      <Testimonials />
      <HomeFAQ onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />
    </div>
  )
}