from fastapi import APIRouter, Form
from sqlalchemy.orm import Session
from fastapi import Depends
from ..database import get_db
from ..models.farmer import Farmer
from ..models.product import Product
from ..models.order import Order
from ..models.buyer import Buyer
from passlib.hash import bcrypt

router = APIRouter(prefix="/ussd", tags=["USSD"])

# Africa's Talking USSD callback format
# sessionId, serviceCode, phoneNumber, text

MENU_MAIN = "CON Welcome to AgriMarket Ghana\n1. I am a Farmer\n2. I am a Buyer\n3. Check Market Prices\n4. Exit"
MENU_FARMER = "CON Farmer Menu\n1. List my produce\n2. View my orders\n3. Update availability\n4. Back"
MENU_BUYER = "CON Buyer Menu\n1. Search produce\n2. My orders\n3. Back"
MENU_PRICES = "CON Select crop:\n1. Tomatoes\n2. Peppers\n3. Garden Eggs\n4. Okra\n5. Back"

CATEGORY_MAP = {"1": "tomatoes", "2": "peppers", "3": "garden_eggs", "4": "okra"}


@router.post("/callback")
async def ussd_callback(
    sessionId: str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...),
    text: str = Form(""),
    db: Session = Depends(get_db),
):
    parts = [p for p in text.split("*") if p] if text else []
    depth = len(parts)

    if depth == 0:
        return MENU_MAIN

    level1 = parts[0]

    # --- Farmer flow ---
    if level1 == "1":
        if depth == 1:
            return MENU_FARMER
        level2 = parts[1]

        if level2 == "1":  # List produce
            if depth == 2:
                return "CON Enter produce name (e.g. Tomatoes):"
            if depth == 3:
                return "CON Enter quantity in kg:"
            if depth == 4:
                return "CON Enter price per kg (GHS):"
            if depth == 5:
                farmer = db.query(Farmer).filter(Farmer.phone == phoneNumber).first()
                if not farmer:
                    return "END Please register on the web app first."
                name = parts[2]
                qty = float(parts[3])
                price = float(parts[4])
                cat = _guess_category(name)
                product = Product(
                    farmer_id=farmer.id,
                    name=name,
                    category=cat,
                    quantity_kg=qty,
                    price_per_kg=price,
                )
                db.add(product)
                db.commit()
                return f"END Your {name} ({qty}kg at GHS {price}/kg) has been listed. Thank you!"

        if level2 == "2":  # View orders
            farmer = db.query(Farmer).filter(Farmer.phone == phoneNumber).first()
            if not farmer:
                return "END Register on the web app first."
            orders = db.query(Order).join(Product).filter(Product.farmer_id == farmer.id).limit(3).all()
            if not orders:
                return "END You have no orders yet."
            lines = ["END Your recent orders:"]
            for o in orders:
                pname = o.product.name if o.product else "?"
                lines.append(f"- {pname} {o.quantity_kg}kg [{o.status}]")
            return "\n".join(lines)

        if level2 == "3":  # Update availability
            if depth == 2:
                return "CON Enter your phone number to verify:"
            farmer = db.query(Farmer).filter(Farmer.phone == phoneNumber).first()
            if not farmer:
                return "END Not registered."
            products = db.query(Product).filter(Product.farmer_id == farmer.id, Product.is_available == True).limit(3).all()
            if not products:
                return "END No active listings."
            lines = ["END Active listings (update via web app for full control):"]
            for p in products:
                lines.append(f"- {p.name}: {p.quantity_kg}kg @ GHS{p.price_per_kg}/kg")
            return "\n".join(lines)

        return "END Invalid option."

    # --- Buyer flow ---
    if level1 == "2":
        if depth == 1:
            return MENU_BUYER
        level2 = parts[1]

        if level2 == "1":  # Search
            if depth == 2:
                return MENU_PRICES
            cat_key = parts[2]
            cat = CATEGORY_MAP.get(cat_key)
            if not cat:
                return "END Invalid crop selection."
            products = db.query(Product).filter(Product.category == cat, Product.is_available == True).limit(3).all()
            if not products:
                return f"END No {cat} listings available right now."
            lines = [f"END {cat.replace('_',' ').title()} available:"]
            for p in products:
                lines.append(f"- {p.quantity_kg}kg @ GHS{p.price_per_kg}/kg ({p.farmer.village if p.farmer else ''})")
            return "\n".join(lines)

        if level2 == "2":  # Orders
            buyer = db.query(Buyer).filter(Buyer.phone == phoneNumber).first()
            if not buyer:
                return "END Register on the web app first."
            orders = db.query(Order).filter(Order.buyer_id == buyer.id).limit(3).all()
            if not orders:
                return "END No orders yet."
            lines = ["END Your orders:"]
            for o in orders:
                pname = o.product.name if o.product else "?"
                lines.append(f"- {pname} {o.quantity_kg}kg GHS{o.total_price} [{o.status}]")
            return "\n".join(lines)

    # --- Market prices ---
    if level1 == "3":
        if depth == 1:
            return MENU_PRICES
        cat_key = parts[1]
        cat = CATEGORY_MAP.get(cat_key)
        if not cat:
            return "END Invalid selection."
        products = db.query(Product).filter(Product.category == cat, Product.is_available == True).all()
        if not products:
            return f"END No {cat} data available."
        prices = [p.price_per_kg for p in products]
        avg = round(sum(prices) / len(prices), 2)
        return f"END {cat.replace('_',' ').title()} prices:\nAvg: GHS {avg}/kg\nMin: GHS {min(prices)}/kg\nMax: GHS {max(prices)}/kg\nListings: {len(products)}"

    if level1 == "4":
        return "END Thank you for using AgriMarket Ghana!"

    return "END Invalid selection."


def _guess_category(name: str) -> str:
    name = name.lower()
    if "tomato" in name:
        return "tomatoes"
    if "pepper" in name:
        return "peppers"
    if "garden egg" in name or "aubergine" in name:
        return "garden_eggs"
    if "okra" in name:
        return "okra"
    if "leafy" in name or "spinach" in name or "kontomire" in name:
        return "leafy_greens"
    if "onion" in name:
        return "onions"
    if "yam" in name:
        return "yams"
    if "maize" in name or "corn" in name:
        return "maize"
    return "other"
