import { useState, useEffect } from "react";
import { api } from "../services/api";
import GridCard from "./GridCard";

// NOTE: This file is used by the UI; keep imports stable for Vite.


export default function RecommendedProducts({ onPreview, wishlist = [], toggleWishlist }) {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
// 🚀 Pass the limit explicitly in the params object
const data = await api.get("/recommendations/home?limit=5");
        
        // If your api wrapper only takes params object, you can use:
        // const data = await api.get("/recommendations/home", { params: { limit: 5 } });
        
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

  return (
    <div className="mb-12 mt-4">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-2 h-8 bg-green-600 rounded-full"></div>
        <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-slate-100">
          Recommended For You
        </h2>
        <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1 ml-4"></div>
      </div>

      {loading ? (
        <div className="flex flex-wrap justify-center gap-4 animate-pulse">
          {/* 🚀 CHANGED: Added a 5th placeholder for the loading skeleton */}
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="w-[calc(50%-0.5rem)] sm:w-[230px] h-[340px] bg-gray-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {recommended.map(product => (
            <div key={product.id} className="w-[calc(50%-0.5rem)] sm:w-[230px]">
              <GridCard
                product={product}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                onPreview={onPreview}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}