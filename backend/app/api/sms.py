from fastapi import APIRouter, Form, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.farmer import Farmer
from ..models.product import Product

router = APIRouter(prefix="/sms", tags=["SMS"])

# Africa's Talking SMS callback
# Farmers text commands to update their listings without internet:
#
# ADD tomatoes 200 6.5          → add/update a tomatoes listing (200kg @ GHS6.5/kg)
# UPDATE [product_id] 150 7.0   → update specific product qty and price
# LIST                          → get a list of your current products
# STATUS                        → get account status


@router.post("/callback")
async def sms_callback(
    from_: str = Form(..., alias="from"),
    to: str = Form(...),
    text: str = Form(...),
    date: str = Form(default=""),
    db: Session = Depends(get_db),
):
    phone = from_.replace("+233", "0").replace("+", "")
    if not phone.startswith("0"):
        phone = "0" + phone

    farmer = db.query(Farmer).filter(Farmer.phone == phone).first()
    if not farmer:
        return _sms_reply(to_number=from_, message="Sorry, your number is not registered. Visit our website to sign up.")

    parts = text.strip().split()
    cmd = parts[0].upper() if parts else ""

    if cmd == "LIST":
        products = db.query(Product).filter(Product.farmer_id == farmer.id, Product.is_available == True).all()
        if not products:
            return _sms_reply(from_, "You have no active listings.")
        lines = [f"Your listings:"]
        for p in products[:5]:
            lines.append(f"ID{p.id}: {p.name} {p.quantity_kg}kg GHS{p.price_per_kg}/kg")
        return _sms_reply(from_, "\n".join(lines))

    if cmd == "STATUS":
        products = db.query(Product).filter(Product.farmer_id == farmer.id).count()
        return _sms_reply(from_, f"Hi {farmer.name}! You have {products} listings. Text LIST to see them.")

    if cmd == "ADD" and len(parts) >= 4:
        # ADD tomatoes 200 6.5
        name = parts[1].replace("_", " ").title()
        try:
            qty = float(parts[2])
            price = float(parts[3])
        except ValueError:
            return _sms_reply(from_, "Format: ADD [crop] [qty_kg] [price_per_kg]\nExample: ADD tomatoes 200 6.5")

        cat = _guess_category(name)
        product = Product(
            farmer_id=farmer.id,
            name=name,
            category=cat,
            quantity_kg=qty,
            price_per_kg=price,
            min_order_kg=1.0,
            expiry_days=7,
        )
        db.add(product)
        db.commit()
        return _sms_reply(from_, f"Listed: {name} {qty}kg @ GHS{price}/kg. Buyers can now find your produce!")

    if cmd == "UPDATE" and len(parts) >= 4:
        # UPDATE [id] [qty] [price]
        try:
            pid = int(parts[1].replace("ID", "").replace("id", ""))
            qty = float(parts[2])
            price = float(parts[3])
        except ValueError:
            return _sms_reply(from_, "Format: UPDATE [ID] [qty_kg] [price]\nExample: UPDATE 5 150 7.0")

        product = db.query(Product).filter(Product.id == pid, Product.farmer_id == farmer.id).first()
        if not product:
            return _sms_reply(from_, f"Product ID{pid} not found. Text LIST to see your IDs.")
        product.quantity_kg = qty
        product.price_per_kg = price
        product.is_available = qty > 0
        db.commit()
        return _sms_reply(from_, f"Updated {product.name}: {qty}kg @ GHS{price}/kg")

    if cmd == "SOLD" and len(parts) >= 2:
        # SOLD [id] — mark product as sold/unavailable
        try:
            pid = int(parts[1].replace("ID", ""))
        except ValueError:
            return _sms_reply(from_, "Format: SOLD [ID]\nExample: SOLD 5")
        product = db.query(Product).filter(Product.id == pid, Product.farmer_id == farmer.id).first()
        if not product:
            return _sms_reply(from_, f"Product ID{pid} not found.")
        product.is_available = False
        db.commit()
        return _sms_reply(from_, f"{product.name} marked as sold out.")

    # Help message
    return _sms_reply(from_,
        "AgriMarket SMS commands:\n"
        "LIST - see your products\n"
        "ADD tomatoes 200 6.5\n"
        "UPDATE 3 150 7.0\n"
        "SOLD 3\n"
        "STATUS - account info"
    )


def _sms_reply(to_number: str, message: str):
    # In production this sends via Africa's Talking SDK
    # For demo, we just return the response as JSON
    return {"to": to_number, "message": message}


def _guess_category(name: str) -> str:
    n = name.lower()
    if "tomato" in n: return "tomatoes"
    if "pepper" in n or "chilli" in n: return "peppers"
    if "garden egg" in n or "eggplant" in n: return "garden_eggs"
    if "okra" in n: return "okra"
    if "spinach" in n or "kontomire" in n or "leafy" in n: return "leafy_greens"
    if "onion" in n: return "onions"
    if "yam" in n: return "yams"
    if "maize" in n or "corn" in n: return "maize"
    if "millet" in n: return "millet"
    if "rice" in n: return "rice"
    return "other"
