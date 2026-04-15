import HeroCarousel from "../components/HeroCarousel.jsx"
import FeaturedProducts from "../components/FeaturedProducts.jsx"
import Testimonials from "../components/Testimonials.jsx"
import Footer from "../components/Footer.jsx"

export default function Home() {
  return (
    <div>
      <HeroCarousel />
      <FeaturedProducts />
      <Testimonials />
      <Footer />
    </div>
  )
}
