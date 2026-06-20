from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BuyerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    buyer_type: str
    city: str
    district: str = "Northern Region"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class BuyerLogin(BaseModel):
    phone: str
    password: str


class BuyerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    buyer_type: str
    city: str
    district: str
    latitude: Optional[float]
    longitude: Optional[float]
    is_verified: bool
    rating: float
    total_reviews: int
    created_at: datetime

    model_config = {"from_attributes": True}
