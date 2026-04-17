import HeroCarousel from "../components/HeroCarousel.jsx"
import OccasionsStrip from "../components/OccasionsStrip.jsx"
import FeaturedProducts from "../components/FeaturedProducts.jsx"
import Testimonials from "../components/Testimonials.jsx"
import SocialFeed from "../components/SocialFeed.jsx"
import Footer from "../components/Footer.jsx"

export default function Home({ onNavigate }) {
  return (
    <div>
      <HeroCarousel />
      <OccasionsStrip onNavigate={onNavigate} />
      <FeaturedProducts />
      <Testimonials />
      <SocialFeed />
      <Footer />
    </div>
  )
}
