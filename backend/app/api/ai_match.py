from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import math
from ..database import get_db
from ..models.product import Product
from ..models.farmer import Farmer
from ..models.buyer import Buyer
from ..models.order import Order

router = APIRouter(prefix="/ai", tags=["AI Matching"])

CATEGORY_PRICE_RANGES = {
    "tomatoes": (3, 12),
    "peppers": (5, 20),
    "garden_eggs": (4, 15),
    "okra": (4, 18),
    "leafy_greens": (2, 10),
    "onions": (3, 14),
    "yams": (2, 8),
    "maize": (1, 5),
    "millet": (2, 6),
    "rice": (4, 10),
    "other": (2, 15),
}


def score_product_for_buyer(product: Product, buyer: Buyer, buyer_history_categories: list[str]) -> float:
    score = 0.0

    # Availability freshness bonus
    if product.is_available:
        score += 30

    # Price competitiveness within category
    low, high = CATEGORY_PRICE_RANGES.get(product.category, (1, 20))
    mid = (low + high) / 2
    price_norm = 1 - abs(product.price_per_kg - mid) / (high - low + 0.01)
    score += price_norm * 20

    # Category preference from history
    if product.category in buyer_history_categories:
        score += 25

    # Farmer rating
    if product.farmer:
        score += product.farmer.rating * 4  # max 20 from a 5-star farmer

    # Proximity bonus (if coords available)
    if buyer.latitude and buyer.longitude and product.farmer and product.farmer.latitude:
        d = _haversine(buyer.latitude, buyer.longitude, product.farmer.latitude, product.farmer.longitude)
        proximity_score = max(0, 5 - d / 20)  # full 5 pts if <20 km, decays
        score += proximity_score

    return round(score, 2)


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/recommendations/{buyer_id}")
def get_recommendations(buyer_id: int, limit: int = 10, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    past_orders = db.query(Order).filter(Order.buyer_id == buyer_id).all()
    history_categories = []
    for o in past_orders:
        if o.product and o.product.category:
            history_categories.append(o.product.category)

    products = (
        db.query(Product)
        .join(Farmer)
        .filter(Product.is_available == True)
        .all()
    )

    scored = [(p, score_product_for_buyer(p, buyer, history_categories)) for p in products]
    scored.sort(key=lambda x: x[1], reverse=True)

    # Deduplicate: keep only the best-scored product per name to avoid repeats
    seen_names = set()
    top = []
    for p, s in scored:
        key = p.name.lower().strip()
        if key not in seen_names:
            seen_names.add(key)
            top.append((p, s))
        if len(top) >= limit:
            break

    return [
        {
            "product_id": p.id,
            "name": p.name,
            "category": p.category,
            "price_per_kg": p.price_per_kg,
            "quantity_kg": p.quantity_kg,
            "image_url": p.image_url,
            "match_score": s,
            "farmer": {
                "id": p.farmer.id,
                "name": p.farmer.name,
                "village": p.farmer.village,
                "district": p.farmer.district,
                "rating": p.farmer.rating,
            } if p.farmer else None,
        }
        for p, s in top
    ]


@router.get("/similar-products/{product_id}")
def similar_products(product_id: int, limit: int = 6, db: Session = Depends(get_db)):
    target = db.query(Product).filter(Product.id == product_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Product not found")

    others = (
        db.query(Product)
        .join(Farmer)
        .filter(Product.is_available == True, Product.id != product_id)
        .all()
    )

    def similarity(p):
        score = 0
        if p.category == target.category:
            score += 50
        price_diff = abs(p.price_per_kg - target.price_per_kg) / (target.price_per_kg + 0.01)
        score += max(0, 30 - price_diff * 30)
        if p.farmer:
            score += p.farmer.rating * 4
        return score

    ranked = sorted(others, key=similarity, reverse=True)[:limit]
    return [
        {
            "product_id": p.id,
            "name": p.name,
            "category": p.category,
            "price_per_kg": p.price_per_kg,
            "quantity_kg": p.quantity_kg,
            "image_url": p.image_url,
            "farmer_name": p.farmer.name if p.farmer else "",
            "farmer_village": p.farmer.village if p.farmer else "",
        }
        for p in ranked
    ]


@router.get("/market-insights")
def market_insights(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_available == True).all()
    if not products:
        return {"message": "No products available"}

    by_category = {}
    for p in products:
        cat = p.category
        if cat not in by_category:
            by_category[cat] = {"prices": [], "quantities": [], "count": 0}
        by_category[cat]["prices"].append(p.price_per_kg)
        by_category[cat]["quantities"].append(p.quantity_kg)
        by_category[cat]["count"] += 1

    insights = {}
    for cat, data in by_category.items():
        prices = data["prices"]
        insights[cat] = {
            "avg_price_per_kg": round(sum(prices) / len(prices), 2),
            "min_price": min(prices),
            "max_price": max(prices),
            "total_supply_kg": sum(data["quantities"]),
            "num_listings": data["count"],
        }

    orders = db.query(Order).all()
    order_by_category = {}
    for o in orders:
        if o.product:
            cat = o.product.category
            order_by_category[cat] = order_by_category.get(cat, 0) + 1

    return {
        "supply": insights,
        "demand": order_by_category,
        "total_farmers": db.query(Farmer).count(),
        "total_buyers": db.query(Buyer).count(),
        "total_listings": len(products),
    }
