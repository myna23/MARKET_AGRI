from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class FarmerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    village: str
    district: str = "Northern Region"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    farm_size_acres: Optional[float] = None


class FarmerLogin(BaseModel):
    phone: str
    password: str


class FarmerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    village: str
    district: str
    latitude: Optional[float]
    longitude: Optional[float]
    farm_size_acres: Optional[float]
    profile_image: Optional[str]
    is_verified: bool
    rating: float
    total_reviews: int
    created_at: datetime

    model_config = {"from_attributes": True}
