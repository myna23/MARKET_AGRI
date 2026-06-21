from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.order import Order
from ..models.product import Product
from ..models.buyer import Buyer

router = APIRouter(prefix="/orders", tags=["Orders"])


class OrderCreate(BaseModel):
    product_id: int
    quantity_kg: float
    payment_method: str = "momo"   # cash, momo, card
    delivery_address: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lon: Optional[float] = None
    notes: Optional[str] = None


@router.post("/")
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
    if data.payment_method not in ("cash", "momo", "card"):
        raise HTTPException(status_code=400, detail="payment_method must be cash, momo or card")

    total = round(data.quantity_kg * product.price_per_kg, 2)
    order = Order(
        buyer_id=buyer_id,
        product_id=data.product_id,
        quantity_kg=data.quantity_kg,
        total_price=total,
        payment_method=data.payment_method,
        delivery_address=data.delivery_address,
        delivery_lat=data.delivery_lat,
        delivery_lon=data.delivery_lon,
        notes=data.notes,
    )
    # Cash orders are auto-confirmed
    if data.payment_method == "cash":
        order.status = "confirmed"
        order.payment_status = "unpaid"
        order.confirmed_at = datetime.utcnow()

    db.add(order)
    product.quantity_kg -= data.quantity_kg
    if product.quantity_kg <= 0:
        product.is_available = False
    db.commit()
    db.refresh(order)
    return _order_detail(order)


@router.get("/buyer/{buyer_id}")
def get_buyer_orders(buyer_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.product))
        .filter(Order.buyer_id == buyer_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_detail(o) for o in orders]


@router.get("/farmer/{farmer_id}")
def get_farmer_orders(farmer_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.product), joinedload(Order.buyer))
        .join(Product)
        .filter(Product.farmer_id == farmer_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        {
            **_order_detail(o),
            "buyer_name": o.buyer.name if o.buyer else "",
            "buyer_phone": o.buyer.phone if o.buyer else "",
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
    now = datetime.utcnow()
    if status == "confirmed":
        order.confirmed_at = now
    elif status == "in_transit":
        order.picked_up_at = now
    elif status == "delivered":
        order.delivered_at = now
    db.commit()
    return {"order_id": order_id, "status": status}


@router.get("/{order_id}/track")
def track_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.product),
        joinedload(Order.buyer),
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    steps = [
        {"step": "Order Placed", "status": "done", "time": order.created_at},
        {"step": "Confirmed by Farmer", "status": "done" if order.confirmed_at else ("active" if order.status == "pending" else "pending"), "time": order.confirmed_at},
        {"step": "Picked Up / In Transit", "status": "done" if order.picked_up_at else ("active" if order.status == "confirmed" else "pending"), "time": order.picked_up_at},
        {"step": "Delivered", "status": "done" if order.delivered_at else ("active" if order.status == "in_transit" else "pending"), "time": order.delivered_at},
    ]
    if order.status == "cancelled":
        steps = [{"step": "Order Cancelled", "status": "cancelled", "time": order.updated_at}]

    return {
        **_order_detail(order),
        "product_name": order.product.name if order.product else "",
        "farmer_id": order.product.farmer_id if order.product else None,
        "farmer_name": order.product.farmer.name if order.product and order.product.farmer else "",
        "farmer_phone": order.product.farmer.phone if order.product and order.product.farmer else "",
        "tracking_steps": steps,
    }


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_detail(order)


def _order_detail(o: Order) -> dict:
    return {
        "id": o.id,
        "buyer_id": o.buyer_id,
        "product_id": o.product_id,
        "product_name": o.product.name if o.product else "",
        "quantity_kg": o.quantity_kg,
        "total_price": o.total_price,
        "status": o.status,
        "payment_method": o.payment_method,
        "payment_status": o.payment_status,
        "payment_reference": o.payment_reference,
        "delivery_address": o.delivery_address,
        "delivery_lat": o.delivery_lat,
        "delivery_lon": o.delivery_lon,
        "confirmed_at": o.confirmed_at,
        "picked_up_at": o.picked_up_at,
        "delivered_at": o.delivered_at,
        "created_at": o.created_at,
        "notes": o.notes,
        "farmer_id": o.product.farmer_id if o.product else None,
    }
