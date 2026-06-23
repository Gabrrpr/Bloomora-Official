import { useState, useEffect } from "react";
import { api } from "../../services/api.js";

// Make sure to adjust this path if your FallbackImage component is located elsewhere
import FallbackImage from "../../components/FallbackImage.jsx";

const PLACEHOLDER_IMAGE = new URL("../../assets/default-img/ImageNotFound.webp", import.meta.url).href;

export default function Wishlist({ onNavigate }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const data = await api.getWishlist();
      console.log("Raw Wishlist Data from Backend:", data); // 🚀 CHECK THIS IN CONSOLE
      
      // If 'data' is the array itself, use it. If it's an object, check for a 'wishlist' key.
      const list = Array.isArray(data) ? data : (data.wishlist || []);
      setWishlist(list);
    } catch (error) {
      console.error("Failed to load wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    // Optimistic UI update: instantly remove it from the screen
    setWishlist(prev => prev.filter(item => item.id !== id));
    
    try {
      // Tell the backend to toggle (remove) it
      await api.toggleWishlist(id);
    } catch (error) {
      console.error("Failed to remove item:", error);
      loadWishlist(); // Revert the UI if the API call fails
    }
  };

  const handleClearAll = async () => {
    if (wishlist.length === 0) return;
    if (!window.confirm("Are you sure you want to remove all items from your wishlist?")) return;
    
    const itemsToClear = [...wishlist];
    setWishlist([]); // Optimistically clear the UI
    
    try {
      // Loop through and remove them all from the database
      await Promise.all(itemsToClear.map(item => api.toggleWishlist(item.id)));
    } catch (error) {
      console.error("Failed to clear wishlist:", error);
      loadWishlist(); // Revert if something fails
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`@keyframes pageRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Back Button */}
        <button onClick={() => onNavigate("home")} style={{ animation:"pageRise 0.5s ease 0.05s both" }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6" style={{ animation:"pageRise 0.5s ease 0.14s both" }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? "Loading items..." : `${wishlist.length} saved item${wishlist.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {wishlist.length > 0 && (
            <button onClick={handleClearAll} className="text-sm text-red-400 hover:text-red-600 transition font-medium cursor-pointer">
              Clear all
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center" style={{ animation:"pageRise 0.5s ease 0.22s both" }}>
            <div className="w-10 h-10 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500 font-medium">Fetching your favorites...</p>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center" style={{ animation:"pageRise 0.5s ease 0.22s both" }}>
            <div className="text-5xl mb-4">🤍</div>
            <h3 className="font-semibold text-gray-700 mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-gray-400 mb-5">Save your favorite arrangements here to buy later.</p>
            <button onClick={() => onNavigate("shop")} className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 cursor-pointer" style={{ backgroundColor: "#2E8B34" }}>
              Explore Flowers
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {wishlist.map((item, i) => {
              const inStock = item.status === "active";

              return (
                <div key={item.id} style={{ animation:`pageRise 0.5s ease ${0.22 + i * 0.07}s both` }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  
                  {/* Image Section */}
                  <div className="relative h-44 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => onNavigate("shop")}>
                    <img 
                      src={item.image_url || PLACEHOLDER_IMAGE} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                    />
                    
                    {/* Remove Heart Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }} 
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-red-50 transition cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                    </button>

                    {!inStock && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold tracking-widest text-gray-700 bg-white px-3 py-1.5 rounded-md shadow-sm uppercase">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug">{item.name}</h3>
                    
                    <div className="flex items-center gap-1.5 mb-3 mt-auto pt-2">
                      <span className="text-sm font-bold text-gray-800">₱{(+item.price).toLocaleString()}</span>
                    </div>

                    {/* View in Shop Button */}
                    <button
                      onClick={() => onNavigate("shop")}
                      className="w-full py-2 text-xs font-bold text-white rounded-lg transition hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: inStock ? "#2E8B34" : "#9ca3af" }}
                    >
                      View in Shop
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}