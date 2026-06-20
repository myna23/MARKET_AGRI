from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    quantity_kg: float
    price_per_kg: float
    min_order_kg: float = 1.0
    expiry_days: int = 7
    harvest_date: Optional[datetime] = None


class ProductUpdate(BaseModel):
    quantity_kg: Optional[float] = None
    price_per_kg: Optional[float] = None
    is_available: Optional[bool] = None
    description: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    farmer_id: int
    name: str
    category: str
    description: Optional[str]
    quantity_kg: float
    price_per_kg: float
    min_order_kg: float
    image_url: Optional[str]
    is_available: bool
    expiry_days: int
    harvest_date: Optional[datetime]
    created_at: datetime
    farmer: Optional[dict] = None

    model_config = {"from_attributes": True}
