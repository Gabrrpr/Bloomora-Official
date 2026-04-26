import HeroCarousel from "../components/HeroCarousel.jsx"
import TrustBar from "../components/TrustBar.jsx"
import OccasionsStrip from "../components/OccasionsStrip.jsx"
import FeaturedProducts from "../components/FeaturedProducts.jsx"
import Testimonials from "../components/Testimonials.jsx"
import SocialFeed from "../components/SocialFeed.jsx"
import HomeFAQ from "../components/HomeFAQ.jsx"
import Footer from "../components/Footer.jsx"

export default function Home({ onNavigate }) {
  return (
    <div>
      <HeroCarousel onNavigate={onNavigate} />
      <TrustBar />
      <OccasionsStrip onNavigate={onNavigate} />
      <FeaturedProducts />
      <Testimonials />
      <SocialFeed />
      <HomeFAQ onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
