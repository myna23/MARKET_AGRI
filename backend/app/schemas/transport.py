from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TransportProviderCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    vehicle_type: str
    vehicle_capacity_kg: float
    license_plate: Optional[str] = None
    base_district: str = "Northern Region"
    price_per_km: float = 5.0


class TransportProviderOut(BaseModel):
    id: int
    name: str
    phone: str
    vehicle_type: str
    vehicle_capacity_kg: float
    license_plate: Optional[str]
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    base_district: str
    is_available: bool
    rating: float
    total_reviews: int
    price_per_km: float
    created_at: datetime

    model_config = {"from_attributes": True}


class TransportRequestCreate(BaseModel):
    pickup_address: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    dropoff_address: str
    dropoff_latitude: Optional[float] = None
    dropoff_longitude: Optional[float] = None
    cargo_description: Optional[str] = None
    cargo_weight_kg: Optional[float] = None
    scheduled_pickup: Optional[datetime] = None


class TransportRequestOut(BaseModel):
    id: int
    farmer_id: Optional[int]
    buyer_id: Optional[int]
    provider_id: Optional[int]
    pickup_address: str
    dropoff_address: str
    distance_km: Optional[float]
    estimated_cost: Optional[float]
    cargo_weight_kg: Optional[float]
    status: str
    scheduled_pickup: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
