import HeroCarousel      from "../../components/HeroCarousel.jsx"

import OccasionsStrip    from "../../components/OccasionsStrip.jsx"
import FeaturedFlowers   from "../../components/FeaturedFlowers.jsx"
import FeaturedNonFloral from "../../components/FeaturedNonFloral.jsx"
import CustomizeSection  from "../../components/CustomizeSection.jsx"
import Testimonials      from "../../components/Testimonials.jsx"

import HomeFAQ           from "../../components/HomeFAQ.jsx"
import Footer            from "../../components/Footer.jsx"
import FallingRoses      from "../../components/FallingRoses.jsx"

// Updated Home.jsx snippet — Add the incoming prop argument
export default function Home({ onNavigate, isCustomizationEnabled }) {
  return (
    <div>
      <div className="relative overflow-hidden">
        <FallingRoses />
        <HeroCarousel onNavigate={onNavigate} />
      </div>

      <OccasionsStrip onNavigate={onNavigate} />
      <FeaturedFlowers onNavigate={onNavigate} />
      <FeaturedNonFloral onNavigate={onNavigate} />
      
      {/* 🚀 Pass down the lock state to the dashboard element block */}
      <CustomizeSection onNavigate={onNavigate} isCustomizationEnabled={isCustomizationEnabled} />
      
      <Testimonials />
      <HomeFAQ onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />
    </div>
  )
}