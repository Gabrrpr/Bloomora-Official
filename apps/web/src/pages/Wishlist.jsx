const MOCK_WISHLIST = [
  { id: 1, name: "Premium Rose Bouquet", price: "₱1,200", originalPrice: "₱1,500", tag: "20% off", emoji: "🌹", inStock: true },
  { id: 2, name: "Lavender Dreams", price: "₱890", originalPrice: null, tag: "New", emoji: "💜", inStock: true },
  { id: 3, name: "Sunflower Sunshine", price: "₱750", originalPrice: null, tag: null, emoji: "🌻", inStock: false },
  { id: 4, name: "Tulip Royale Bundle", price: "₱1,100", originalPrice: "₱1,350", tag: "Sale", emoji: "🌷", inStock: true },
]

export default function Wishlist({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
            <p className="text-sm text-gray-400 mt-0.5">{MOCK_WISHLIST.length} saved items</p>
          </div>
          <button className="text-sm text-red-400 hover:text-red-600 transition font-medium">Clear all</button>
        </div>

        {MOCK_WISHLIST.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🤍</div>
            <h3 className="font-semibold text-gray-700 mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-gray-400 mb-5">Save your favorite arrangements here to buy later.</p>
            <button onClick={() => onNavigate("home")} className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ backgroundColor: "#2E8B34" }}>Explore Flowers</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_WISHLIST.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-40 bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center text-5xl">
                  {item.emoji}
                  {item.tag && (
                    <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: item.tag === "Sale" || item.tag.includes("%") ? "#e11d48" : "#2E8B34" }}>{item.tag}</span>
                  )}
                  <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition">
                    <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                  </button>
                  {!item.inStock && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-full">Out of Stock</span></div>}
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 truncate">{item.name}</h3>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-sm font-bold text-gray-800">{item.price}</span>
                    {item.originalPrice && <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>}
                  </div>
                  <button
                    disabled={!item.inStock}
                    className="w-full py-2 text-xs font-bold text-white rounded-lg transition hover:opacity-90"
                    style={{ backgroundColor: item.inStock ? "#2E8B34" : "#d1d5db" }}
                  >
                    {item.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
