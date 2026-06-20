from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrderCreate(BaseModel):
    product_id: int
    quantity_kg: float
    delivery_address: Optional[str] = None
    notes: Optional[str] = None


class OrderOut(BaseModel):
    id: int
    buyer_id: int
    product_id: int
    quantity_kg: float
    total_price: float
    status: str
    payment_status: str
    payment_reference: Optional[str]
    delivery_address: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
