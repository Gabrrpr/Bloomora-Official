import { useState, useEffect } from "react";
import { api } from "../services/api";
import GridCard from "./GridCard";
import { useTheme } from "../context/ThemeContext.jsx";

// NOTE: This file is used by the UI; keep imports stable for Vite.

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
        className="relative overflow-hidden rounded-2xl px-4 py-6 sm:px-6 sm:py-7"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#102019 0%,#172a22 52%,#1e293b 100%)"
            : "linear-gradient(135deg,#f0fdf4 0%,#ffffff 48%,#fff7ed 100%)",
          border: `1px solid ${isDark ? "rgba(74,222,128,0.18)" : "#d9f99d"}`,
          boxShadow: isDark ? "0 18px 40px rgba(0,0,0,0.35)" : "0 18px 42px rgba(12,87,62,0.08)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{
                backgroundColor: isDark ? "rgba(74,222,128,0.12)" : "#dcfce7",
                color: isDark ? "#86efac" : "#0C573E",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? "#86efac" : "#2E8B34" }} />
              Based on your taste
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: isDark ? "#f8fafc" : "#111827" }}>
              Recommended For You
            </h2>
            <p className="text-sm mt-1 max-w-xl" style={{ color: isDark ? "#cbd5e1" : "#64748b" }}>
              Fresh picks shaped by your activity and previous orders.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <span className="w-8 h-px" style={{ backgroundColor: isDark ? "#334155" : "#bbf7d0" }} />
            Personal picks
          </div>
        </div>

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
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: isDark ? "#d9f99d" : "#0C573E" }}>
                    {rowLabel(row, rowIndex)}
                  </h3>
                  <span className="h-px flex-1" style={{ backgroundColor: isDark ? "rgba(148,163,184,0.18)" : "#dbeafe" }} />
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
    </section>
  );
}
