from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.order import Order
from ..models.product import Product
from ..models.buyer import Buyer
from ..schemas.order import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderOut)
def create_order(buyer_id: int, data: OrderCreate, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.is_available:
        raise HTTPException(status_code=400, detail="Product is not available")
    if data.quantity_kg < product.min_order_kg:
        raise HTTPException(status_code=400, detail=f"Minimum order is {product.min_order_kg} kg")
    if data.quantity_kg > product.quantity_kg:
        raise HTTPException(status_code=400, detail=f"Only {product.quantity_kg} kg available")

    total = round(data.quantity_kg * product.price_per_kg, 2)
    order = Order(
        buyer_id=buyer_id,
        product_id=data.product_id,
        quantity_kg=data.quantity_kg,
        total_price=total,
        delivery_address=data.delivery_address,
        notes=data.notes,
    )
    db.add(order)
    product.quantity_kg -= data.quantity_kg
    if product.quantity_kg <= 0:
        product.is_available = False
    db.commit()
    db.refresh(order)
    return order


@router.get("/buyer/{buyer_id}", response_model=list[OrderOut])
def get_buyer_orders(buyer_id: int, db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.buyer_id == buyer_id).all()


@router.get("/farmer/{farmer_id}")
def get_farmer_orders(farmer_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .join(Product)
        .filter(Product.farmer_id == farmer_id)
        .all()
    )
    return [
        {
            "id": o.id,
            "buyer_id": o.buyer_id,
            "product_id": o.product_id,
            "product_name": o.product.name if o.product else "",
            "quantity_kg": o.quantity_kg,
            "total_price": o.total_price,
            "status": o.status,
            "payment_status": o.payment_status,
            "delivery_address": o.delivery_address,
            "created_at": o.created_at,
        }
        for o in orders
    ]


@router.put("/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    valid = {"pending", "confirmed", "in_transit", "delivered", "cancelled"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    return {"order_id": order_id, "status": status}


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
