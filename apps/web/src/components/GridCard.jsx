import FallbackImage from "./FallbackImage.jsx";

const G  = "#2E8B34";
const DG = "#0C573E";

const discount = (orig, price) => Math.round((1 - price / orig) * 100);

function Stars({ rating, size = "sm" }) {
  const dim = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={dim} fill={i <= Math.floor(rating) ? "#f59e0b" : "#e5e7eb"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function WishlistBtn({ id, wishlist, toggleWishlist, small }) {
  const wishlisted = wishlist?.includes(id);
  const sz = small ? "w-7 h-7" : "w-8 h-8";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleWishlist(id); }}
      className={`${sz} flex items-center justify-center rounded-lg transition-all flex-shrink-0`}
      style={{ backgroundColor: wishlisted ? "#fef2f2" : "#f3f4f6", border: wishlisted ? "1px solid #fecaca" : "1px solid #e5e7eb" }}
    >
      <svg className="w-3.5 h-3.5" fill={wishlisted ? "#e11d48" : "none"} stroke={wishlisted ? "#e11d48" : "#9ca3af"} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}

export default function GridCard({ product, wishlist, toggleWishlist, onPreview }) {
  const currentPrice = Number(product.price) || 0;
  const oldPrice = Number(product.original_price || product.original) || 0;
  const isDiscounted = oldPrice > currentPrice;

  return (
    <div
      className="bg-white group hover:shadow-lg transition-shadow duration-200"
      style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", cursor: "pointer" }}
      onClick={() => onPreview(product)}
    >
      <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: "1/1" }}>
        <FallbackImage
          src={product.image || product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {isDiscounted && (
          <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5" style={{ backgroundColor: DG, borderRadius: "4px" }}>
            -{discount(oldPrice, currentPrice)}%
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold" style={{ color: G }}>₱{currentPrice.toLocaleString()}</span>
            {isDiscounted && (
              <span className="text-xs text-gray-400 line-through">₱{oldPrice.toLocaleString()}</span>
            )}
          </div>
          <WishlistBtn id={product.id} wishlist={wishlist} toggleWishlist={toggleWishlist} small />
        </div>
        <p className="text-sm font-medium text-gray-800 leading-snug mb-1.5 line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-1 mb-3">
          <Stars rating={product.rating || 5} />
          <span className="text-xs text-gray-400">{product.rating || 5} ({product.reviews || 0})</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(product); }}
          className="w-full text-sm font-semibold py-2 text-white transition-all flex items-center justify-center gap-1.5"
          style={{ backgroundColor: G, borderRadius: "6px", border: "none", cursor: "pointer" }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}