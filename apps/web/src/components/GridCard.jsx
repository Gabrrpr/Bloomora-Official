import FallbackImage from "./FallbackImage.jsx";
import { useCurrency } from "../context/CuurencyContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const G  = "#2E8B34";
const DG = "#0C573E";

const discount = (orig, price) => Math.round((1 - price / orig) * 100);

function Stars({ rating, size = "sm", isDark }) {
  const dim = size === "md" ? "w-4 h-4" : "w-3 h-3";
  const empty = isDark ? "#334155" : "#e5e7eb";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={dim} fill={i <= Math.floor(rating) ? "#f59e0b" : empty} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function WishlistBtn({ id, wishlist, toggleWishlist, small, isDark }) {
  const wishlisted = wishlist?.includes(id);
  const sz = small ? "w-7 h-7" : "w-8 h-8";
  const idleBg  = isDark ? "#0f172a" : "#f3f4f6";
  const idleBdr = isDark ? "#334155" : "#e5e7eb";
  const onBg    = isDark ? "rgba(225,29,72,0.15)" : "#fef2f2";
  const onBdr   = isDark ? "rgba(225,29,72,0.45)" : "#fecaca";
  const idleStroke = isDark ? "#94a3b8" : "#9ca3af";
  return (
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        // Prevent the card click (onPreview) from firing.
        e.preventDefault();
        e.stopPropagation();
        // Ensure toggleWishlist only receives the product id
        toggleWishlist(String(id));
      }}
      className={`${sz} flex items-center justify-center rounded-lg transition-all flex-shrink-0 cursor-pointer`}
      style={{ backgroundColor: wishlisted ? onBg : idleBg, border: wishlisted ? `1px solid ${onBdr}` : `1px solid ${idleBdr}` }}
    >
      <svg className="w-3.5 h-3.5" fill={wishlisted ? "#e11d48" : "none"} stroke={wishlisted ? "#e11d48" : idleStroke} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}

export default function GridCard({ product, wishlist, toggleWishlist, onPreview }) {
  const { formatPrice } = useCurrency() || {};
  const { isDark } = useTheme();
  const currentPrice = Number(product.price) || 0;
  const oldPrice = Number(product.original_price || product.original) || 0;
  const isDiscounted = oldPrice > currentPrice;
  const displayPrice = formatPrice || ((price) => new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PHP",
  }).format(Number(price || 0)));

  const hasStockValue = product.stock !== undefined && product.stock !== null;
  const isOutOfStock = (hasStockValue && Number(product.stock) <= 0) || product.is_available === false || product.status === "inactive";

  // Theme tokens
  const cardBg  = isDark ? "#1a2332" : "#ffffff";
  const cardBdr = isDark ? "#2d3748" : "#e5e7eb";
  const imgBg   = isDark ? "#162032" : "#f9fafb";
  const nameC   = isDark ? "#e5e7eb" : "#1f2937";
  const mutedC  = isDark ? "#94a3b8" : "#9ca3af";
  const priceC  = isDark ? "#4ade80" : G;
  const overlayBg = isDark ? "rgba(15,23,42,0.45)" : "rgba(255,255,255,0.3)";

  return (
    <div
      className={`group transition-all duration-200 relative flex flex-col h-full ${
        isOutOfStock ? "grayscale opacity-75 cursor-not-allowed" : "hover:shadow-lg cursor-pointer"
      }`}
      style={{ backgroundColor: cardBg, border: `1px solid ${cardBdr}`, borderRadius: "8px", overflow: "hidden" }}
      onClick={() => !isOutOfStock && onPreview(product)}
    >
      {isOutOfStock && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[1px]" style={{ backgroundColor: overlayBg }}>
          <span className="bg-gray-900 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded shadow tracking-widest uppercase">
            Out of Stock
          </span>
        </div>
      )}

      <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: "1/1", backgroundColor: imgBg }}>
        <FallbackImage
          src={product.image || product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {product.sold_count > 10 && !isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm z-10 tracking-wide">
            🔥 BEST SELLER
          </div>
        )}

        {isDiscounted && !isOutOfStock && (
          <div className="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5" style={{ backgroundColor: DG, borderRadius: "4px" }}>
            -{discount(oldPrice, currentPrice)}%
          </div>
        )}
      </div>

      {/* 🚀 THE LAYOUT FIX: Added 'flex flex-col flex-1' to keep spacing identical */}
      <div className="p-3 relative z-10 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold" style={{ color: priceC }}>{displayPrice(currentPrice)}</span>
            {isDiscounted && (
              <span className="text-xs line-through" style={{ color: mutedC }}>{displayPrice(oldPrice)}</span>
            )}
          </div>
          <WishlistBtn id={product.id} wishlist={wishlist} toggleWishlist={toggleWishlist} small isDark={isDark} />
        </div>

        {/* Enforced a strict height constraint for exactly 2 lines maximum */}
        <p className="text-sm font-medium leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem]" style={{ color: nameC }}>
          {product.name}
        </p>

        <div className="flex items-center gap-1 mb-3">
          <Stars rating={product.rating || 5} isDark={isDark} />
          <span className="text-xs" style={{ color: mutedC }}>{product.rating || 5} ({product.reviews || 0})</span>
        </div>

        {/* 🚀 THE ANCHOR FIX: 'mt-auto' forces this button to dock at the absolute bottom of the card */}
        <button
          disabled={isOutOfStock}
          onClick={(e) => { e.stopPropagation(); onPreview(product); }}
          className="w-full text-sm font-semibold py-2 text-white transition-all flex items-center justify-center gap-1.5 mt-auto"
          style={{ backgroundColor: isOutOfStock ? "#9ca3af" : G, borderRadius: "6px", border: "none", cursor: isOutOfStock ? "not-allowed" : "pointer" }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
