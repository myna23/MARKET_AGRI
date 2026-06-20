from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from ..database import get_db
from ..models.order import Order

router = APIRouter(prefix="/payments", tags=["Payments"])


class PaymentInitiate(BaseModel):
    order_id: int
    phone_number: str  # MTN MoMo / Vodafone Cash number
    network: str = "MTN"  # MTN, Vodafone, AirtelTigo


class PaymentCallback(BaseModel):
    reference: str
    status: str  # Success, Failed


@router.post("/initiate")
def initiate_payment(data: PaymentInitiate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    reference = f"AGM-{uuid.uuid4().hex[:10].upper()}"
    order.payment_reference = reference
    db.commit()

    # In production: call Africa's Talking Mobile Money API here
    # import africastalking
    # africastalking.initialize(username, api_key)
    # payment = africastalking.Payment
    # payment.mobile_checkout(productName, phoneNumber, currencyCode, amount, metadata)

    return {
        "reference": reference,
        "amount": order.total_price,
        "currency": "GHS",
        "phone": data.phone_number,
        "network": data.network,
        "order_id": data.order_id,
        "message": f"Payment request of GHS {order.total_price} sent to {data.phone_number}. Approve on your phone.",
        "sandbox_mode": True,
    }


@router.post("/callback")
def payment_callback(data: PaymentCallback, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.payment_reference == data.reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for reference")

    if data.status == "Success":
        order.payment_status = "paid"
        order.status = "confirmed"
    else:
        order.payment_status = "unpaid"

    db.commit()
    return {"order_id": order.id, "payment_status": order.payment_status, "order_status": order.status}


@router.post("/simulate-success/{order_id}")
def simulate_payment_success(order_id: int, db: Session = Depends(get_db)):
    """Demo endpoint to simulate a successful mobile money payment."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.payment_status = "paid"
    order.status = "confirmed"
    if not order.payment_reference:
        order.payment_reference = f"AGM-SIM-{uuid.uuid4().hex[:8].upper()}"
    db.commit()
    return {
        "order_id": order_id,
        "payment_status": "paid",
        "order_status": "confirmed",
        "reference": order.payment_reference,
    }
