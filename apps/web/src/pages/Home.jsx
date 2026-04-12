import { useState, useEffect } from "react"

const NAV_LINKS = ["Valentines", "Occasions", "Best Sellers", "Make it Personal"]

const PRODUCTS = [
  { id: 1, name: "Product Name Here", price: 599, original: 799, sold: 120, rating: 4.8, badge: "Best Seller" },
  { id: 2, name: "Product Name Here", price: 450, original: 600, sold: 89, rating: 4.7, badge: "New" },
  { id: 3, name: "Product Name Here", price: 999, original: 1299, sold: 54, rating: 4.9, badge: "Limited" },
  { id: 4, name: "Product Name Here", price: 350, original: 450, sold: 210, rating: 4.6, badge: null },
  { id: 5, name: "Product Name Here", price: 750, original: 950, sold: 73, rating: 4.8, badge: "Best Seller" },
  { id: 6, name: "Product Name Here", price: 1200, original: 1500, sold: 31, rating: 5.0, badge: "Premium" },
  { id: 7, name: "Product Name Here", price: 280, original: 380, sold: 145, rating: 4.5, badge: null },
  { id: 8, name: "Product Name Here", price: 650, original: 800, sold: 67, rating: 4.7, badge: "Sale" },
]

const BADGE_COLORS = {
  "Best Seller": "bg-orange-100 text-orange-600",
  "New": "bg-emerald-100 text-emerald-600",
  "Limited": "bg-red-100 text-red-600",
  "Premium": "bg-purple-100 text-purple-600",
  "Sale": "bg-rose-100 text-rose-600",
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.floor(rating) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-400 ml-1">{rating}</span>
    </div>
  )
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ h: 48, m: 31, s: 59 })
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) { h = 0; m = 0; s = 0 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = n => String(n).padStart(2, "0")
  const toggleWishlist = (id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const discount = (orig, price) => Math.round((1 - price / orig) * 100)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 text-sm px-8 py-2 flex items-center justify-between">
        <div className="flex gap-6 text-gray-500">
          <a href="#" className="hover:text-gray-800 transition-colors">About us</a>
          <a href="#" className="hover:text-gray-800 transition-colors">FAQ</a>
          <a href="#" className="hover:text-gray-800 transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded">LIMITED TIME</span>
          <span className="text-gray-600 font-medium">FREE DELIVERY on all orders</span>
          <div className="flex items-center gap-1 ml-2">
            {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((val, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-gray-800 text-white text-xs font-mono px-1.5 py-0.5 rounded">{val}</span>
                {i < 2 && <span className="text-gray-400 font-bold">:</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          <span>Logged in as <span className="text-gray-800 font-medium">Juan dela Cruz</span></span>
          <a href="#" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">Sign out</a>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-white px-8 py-4 flex items-center justify-between border-b border-gray-100">
        <div>
          <div className="text-2xl font-bold text-emerald-700 italic" style={{ fontFamily: "Georgia, serif" }}>Esting's</div>
          <div className="text-[10px] tracking-widest text-gray-400 uppercase -mt-1">Flower International Inc.</div>
        </div>
        <div className="flex-1 mx-10">
          <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 max-w-sm mx-auto">
            <input type="text" placeholder="search" className="flex-1 text-sm outline-none bg-transparent text-gray-600 placeholder-gray-400" />
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-8">
          {NAV_LINKS.map((link, i) => (
            <div key={link} className="relative">
              <a href="#" className={`text-sm font-medium transition-colors ${i === NAV_LINKS.length - 1 ? "border-b-2 border-gray-800 text-gray-800 pb-0.5" : "text-gray-600 hover:text-gray-900"}`}>
                {link}
                {i === 0 && <span className="absolute -top-3 -right-2 text-[9px] bg-emerald-600 text-white px-1 py-0.5 rounded leading-none">LIMITED TIME</span>}
              </a>
            </div>
          ))}
          <button className="relative">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">2</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f0f4f0 0%, #e8f0e8 50%, #f5f0f0 100%)", minHeight: "520px" }}>
        <div className="max-w-7xl mx-auto px-8 py-16 flex items-center justify-between relative z-10">
          <div className="max-w-lg">
            <h1 className="text-gray-800 leading-tight mb-4">
              <span className="text-5xl font-normal" style={{ fontFamily: "Georgia, serif" }}>Make it</span>
              <br />
              <span className="text-7xl font-bold italic" style={{ fontFamily: "Georgia, serif" }}>Personal.</span>
            </h1>
            <p className="text-gray-500 text-base mb-8 leading-relaxed">
              Create a bouquet and make it special.<br />
              Two ways to start. Mix and match or describe your arrangement.
            </p>
            <div className="flex gap-4 mb-6">
              <button className="flex-1 bg-white rounded-2xl p-5 text-left hover:shadow-md transition-shadow border border-gray-100 group">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-7 h-7 text-purple-500" viewBox="0 0 32 32" fill="none">
                    <path d="M16 8C16 8 10 8 10 14C10 17 12 19 16 20C20 19 22 17 22 14C22 8 16 8 16 8Z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 22L16 28L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-gray-800 font-semibold text-base">Mix and Match</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Start picking your flowers</span>
                  <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
                </div>
              </button>
              <button className="flex-1 bg-white rounded-2xl p-5 text-left hover:shadow-md transition-shadow border-2 border-purple-200 group">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-7 h-7 text-purple-500" viewBox="0 0 32 32" fill="none">
                    <rect x="6" y="8" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 13H22M10 17H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-gray-800 font-semibold text-base">Describe your Arrangement</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 text-xs">Start writing your idea</span>
                  <span className="text-purple-400 group-hover:text-purple-600 transition-colors">→</span>
                </div>
              </button>
            </div>
            <p className="text-gray-400 text-xs">It only takes less than 2 minutes.</p>
          </div>

          <div className="relative flex-1 flex justify-end items-center" style={{ minHeight: "420px" }}>
            <div className="absolute top-8 right-80 bg-white rounded-2xl px-5 py-3 shadow-sm max-w-[200px] z-20">
              <p className="text-sm text-gray-700 leading-snug">"<span className="font-semibold text-gray-900">Show some love</span> with a bouquet made your way."</p>
            </div>
            <div className="absolute top-32 right-4 bg-white rounded-2xl px-5 py-3 shadow-sm max-w-[200px] z-20">
              <p className="text-sm text-gray-700 leading-snug">"<span className="font-semibold text-gray-900">Say more</span> with personalized flowers.."</p>
            </div>
            <div className="relative z-10 w-96 h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
              <div className="text-center text-rose-300">
                <svg className="w-24 h-24 mx-auto mb-2" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="35" r="15" fill="currentColor" opacity="0.4"/>
                  <circle cx="30" cy="50" r="12" fill="currentColor" opacity="0.3"/>
                  <circle cx="70" cy="50" r="12" fill="currentColor" opacity="0.3"/>
                  <rect x="45" y="75" width="10" height="20" rx="5" fill="currentColor" opacity="0.3"/>
                </svg>
                <p className="text-sm font-medium opacity-60">Add your bouquet image here</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-gray-900 text-white rounded-xl px-3 py-2 flex items-center gap-2 z-20">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2C10 2 6 4 6 8C6 10.2 7.8 12 10 12C12.2 12 14 10.2 14 8C14 4 10 2 10 2Z"/>
                </svg>
              </div>
              <div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider leading-none">Powered by</div>
                <div className="text-xs font-semibold leading-tight">pollinations.ai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Georgia, serif" }}>Our Products</h2>
            <p className="text-gray-400 text-sm mt-1">Fresh arrangements for every occasion.</p>
          </div>
          <div className="flex gap-2">
            {["All", "Bouquets", "Vases", "Accessories"].map((cat, i) => (
              <button key={cat} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${i === 0 ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {PRODUCTS.map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200 group cursor-pointer">
              {/* Image area — replace the inner div with <img src="..." /> when you have real images */}
              <div className="relative h-52 bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
                <div className="text-center text-rose-200">
                  <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="35" r="15" opacity="0.5"/>
                    <circle cx="30" cy="50" r="12" opacity="0.4"/>
                    <circle cx="70" cy="50" r="12" opacity="0.4"/>
                    <circle cx="40" cy="65" r="10" opacity="0.3"/>
                    <circle cx="60" cy="65" r="10" opacity="0.3"/>
                    <rect x="45" y="72" width="10" height="18" rx="5" opacity="0.3"/>
                  </svg>
                  <p className="text-xs mt-1 opacity-50">Product Image</p>
                </div>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <svg className={`w-4 h-4 ${wishlist.includes(product.id) ? "text-rose-500 fill-rose-500" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>

                {product.badge && (
                  <div className={`absolute top-3 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE_COLORS[product.badge]}`}>
                    {product.badge}
                  </div>
                )}

                <div className="absolute bottom-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  -{discount(product.original, product.price)}%
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-gray-800 font-medium text-sm mb-1 truncate group-hover:text-emerald-700 transition-colors">
                  {product.name}
                </p>
                <StarRating rating={product.rating} />
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold text-rose-500">₱{product.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 line-through">₱{product.original.toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-gray-400">{product.sold} sold</div>
                </div>
                <button className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-xl transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="border border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-800 rounded-full px-8 py-2.5 text-sm font-medium transition-colors">
            View all products →
          </button>
        </div>
      </section>

      {/* Chat button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="absolute -top-8 right-0 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600 shadow-sm whitespace-nowrap">
          Do you need help?
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">Chat</span>
        </button>
      </div>
    </div>
  )
}
