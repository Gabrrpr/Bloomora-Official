import HeroCarousel      from "../../components/HeroCarousel.jsx"
import OccasionsStrip    from "../../components/OccasionsStrip.jsx"
import DynamicFeaturedSections from "../../components/DynamicFeaturedSection.jsx" // 🚀 The new Master Component
import CustomizeSection  from "../../components/CustomizeSection.jsx"
import Testimonials      from "../../components/Testimonials.jsx"
import HomeFAQ           from "../../components/HomeFAQ.jsx"
import Footer            from "../../components/Footer.jsx"
import FallingRoses      from "../../components/FallingRoses.jsx"

export default function Home({ onNavigate, isCustomizationEnabled }) {
  return (
    <div>
      <div className="relative overflow-hidden">
        <FallingRoses />
        <HeroCarousel onNavigate={onNavigate} />
      </div>

      <OccasionsStrip onNavigate={onNavigate} />

      {/* 🚀 This single component now dynamically renders EVERY section you created in the Admin Panel */}
      <DynamicFeaturedSections onNavigate={onNavigate} />

      <CustomizeSection onNavigate={onNavigate} isCustomizationEnabled={isCustomizationEnabled} />
      <Testimonials />
      <HomeFAQ onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />
    </div>
  )
}