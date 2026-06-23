from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from pydantic import BaseModel
# Import your database session and models
from app.core.dependencies import get_db, get_current_user
from app.models import Product, Order, OrderItem, User

# NOTE: pandas and scikit-learn are imported lazily inside the function
# to avoid crashing the server at startup when they are not installed.

router = APIRouter(prefix="", tags=["Recommendations"])

class ProductSchema(BaseModel):
    id: str
    name: str
    category: str
    price: float
    image_url: str = None

@router.get("/home", response_model=List[dict])
async def get_homepage_recommendations(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Lazy-import heavy ML dependencies so the server starts even without them
        try:
            import pandas as pd
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="Recommendation engine unavailable: pandas/scikit-learn not installed.",
            )

        # 1. Fetch data
        past_orders = db.query(Order).filter(Order.user_id == current_user.id).all()
        active_products = (
            db.query(Product)
            .options(joinedload(Product.inventory))
            .filter(Product.is_available == True)
            .all()
        )
        
        if not active_products:
            return []

        # 2. BULLETPROOF DATA EXTRACTION
        catalog_data = []
        for p in active_products:
            inv = getattr(p, "inventory", None)
            image_url = str(getattr(p, "image_url", getattr(p, "image", "")) or "")
            catalog_data.append({
                "id": str(p.id),
                "name": str(getattr(p, "name", "") or ""),
                "category": str(getattr(p, "category_name", getattr(p, "category", "")) or ""),
                "price": float(getattr(p, "price", 0) or 0.0),
                "image_url": image_url,
                "image": image_url,
                "is_available": bool(getattr(p, "is_available", True)),
                "status": p.status.value if hasattr(p.status, "value") else str(getattr(p, "status", "active") or "active"),
                "stock": int(getattr(inv, "current_stock", 1) if inv else 1),
                "sold_count": int(getattr(p, "sold_count", 0) or 0),
                "original_price": float(p.original_price) if getattr(p, "original_price", None) else None,
            })
            
        df = pd.DataFrame(catalog_data)
        
        # 3. Create metadata soup safely
        df["name_clean"] = df["name"].fillna("").astype(str).str.lower()
        df["cat_clean"] = df["category"].fillna("").astype(str).str.lower()
        df["metadata_soup"] = df["name_clean"] + " " + df["cat_clean"]

        # 4. Build purchase history from both legacy single-product orders and current order items.
        bought_product_ids = {
            str(o.product_id)
            for o in past_orders
            if getattr(o, "product_id", None)
        }
        item_product_ids = (
            db.query(OrderItem.product_id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.user_id == current_user.id, OrderItem.product_id.isnot(None))
            .distinct()
            .all()
        )
        bought_product_ids.update(str(row.product_id) for row in item_product_ids if row.product_id)
        bought_product_ids = list(bought_product_ids)
        
        if not bought_product_ids:
            return df.head(limit).drop(columns=["metadata_soup", "name_clean", "cat_clean"]).to_dict(orient="records")

        # 5. Build Customer Taste Profile
        bought_items_df = df[df["id"].isin(bought_product_ids)]
        
        if bought_items_df.empty:
            return df.head(limit).drop(columns=["metadata_soup", "name_clean", "cat_clean"]).to_dict(orient="records")

        user_profile_string = " ".join(bought_items_df["metadata_soup"].tolist()).strip()

        if not user_profile_string:
            return df.head(limit).drop(columns=["metadata_soup", "name_clean", "cat_clean"]).to_dict(orient="records")

        # 6. TF-IDF and Cosine Similarity
        tfidf = TfidfVectorizer(stop_words="english")
        catalog_matrix = tfidf.fit_transform(df["metadata_soup"])
        user_vector = tfidf.transform([user_profile_string])
        cosine_sim = cosine_similarity(user_vector, catalog_matrix)

        # 7. Sort scores
        sim_scores = list(enumerate(cosine_sim[0]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # 8. Filter out items they already bought
        recommended_indices = []
        for score in sim_scores:
            idx = score[0]
            prod_id = df.iloc[idx]["id"]
            if prod_id not in bought_product_ids:
                recommended_indices.append(idx)
            if len(recommended_indices) == limit:
                break

        if len(recommended_indices) < limit:
            top_all = [score[0] for score in sim_scores[:limit]]
            recommended_indices = list(dict.fromkeys(recommended_indices + top_all))[:limit]

        # 9. Return results
        recommended_df = df.iloc[recommended_indices]
        return recommended_df.drop(columns=["metadata_soup", "name_clean", "cat_clean"]).to_dict(orient="records")

    except Exception as e:
        print("CRITICAL RECOMMENDATION ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Recommendation Engine Failed: {str(e)}")