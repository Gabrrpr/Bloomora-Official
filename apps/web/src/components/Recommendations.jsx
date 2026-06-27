import { useState, useEffect } from "react";
import { api } from "../services/api";
import GridCard from "./GridCard";
import { useTheme } from "../context/ThemeContext.jsx";



function titleCase(value) {
  return String(value || "Recommended")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function rowLabel(products, index) {
  const counts = products.reduce((acc, product) => {
    const category = titleCase(product.category || product.product_group || "Recommended")
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})
  const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  if (index === 0) return topCategory ? `Because You Like ${topCategory}` : "Top Picks For You"
  if (index === 1) return topCategory ? `More ${topCategory} Picks` : "Similar Favorites"
  return topCategory ? `You May Also Like ${topCategory}` : "More For Your Style"
}

export default function RecommendedProducts({ onPreview, wishlist = [], toggleWishlist }) {
  const { isDark } = useTheme();
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await api.get("/recommendations/home?limit=15");
        setRecommended(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Could not load recommendations", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (!loading && recommended.length === 0) return null;
  const rows = [0, 1, 2].map(i => recommended.slice(i * 5, i * 5 + 5)).filter(row => row.length > 0);

  return (
    <section className="my-12">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #0f1a14 0%, #15241b 100%)"
            : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          border: `1px solid ${isDark ? "#24372a" : "#cdeccd"}`,
          boxShadow: isDark ? "0 8px 28px rgba(0,0,0,0.28)" : "0 10px 30px rgba(12,87,62,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #0C573E, #2E8B34)" }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.5a.56.56 0 011.04 0l2.12 5.11a.56.56 0 00.48.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.28 5.38a.56.56 0 01-.84.61l-4.72-2.88a.56.56 0 00-.59 0l-4.72 2.88a.56.56 0 01-.84-.61l1.28-5.38a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.48-.35L11.48 3.5z" /></svg>
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: isDark ? "#f0fdf4" : "#14532d" }}>
              Recommended For You
            </h2>
            <p className="text-xs mt-0.5" style={{ color: isDark ? "#86efac" : "#15803d" }}>
              Fresh picks shaped by your activity and previous orders.
            </p>
          </div>
        </div>
        {/* Divider */}
        <div className="h-px mx-5" style={{ backgroundColor: isDark ? "#24372a" : "#cdeccd" }} />

        {/* Body */}
        <div className="p-4 sm:p-5">

        {loading ? (
          <div className="space-y-8 animate-pulse">
            {[0, 1, 2].map(row => (
              <div key={row}>
                <div className="h-4 w-44 rounded mb-3" style={{ backgroundColor: isDark ? "#1e293b" : "#e5e7eb" }} />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="h-[330px] rounded-xl" style={{ backgroundColor: isDark ? "#1e293b" : "#e5e7eb" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex}>
                <div className="mb-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: isDark ? "#d9f99d" : "#0C573E" }}>
                    {rowLabel(row, rowIndex)}
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {row.map(product => (
                    <div key={product.id} className="min-w-0">
                      <GridCard
                        product={product}
                        wishlist={wishlist}
                        toggleWishlist={toggleWishlist}
                        onPreview={onPreview}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
