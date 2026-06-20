from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class TransportProvider(Base):
    __tablename__ = "transport_providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=False)
    vehicle_type = Column(String, nullable=False)  # motorcycle, tricycle, pickup, truck
    vehicle_capacity_kg = Column(Float, nullable=False)
    license_plate = Column(String, nullable=True)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    base_district = Column(String, nullable=False, default="Northern Region")
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    price_per_km = Column(Float, default=5.0)  # GHS per km
    created_at = Column(DateTime, default=datetime.utcnow)

    transport_requests = relationship("TransportRequest", back_populates="provider")


class TransportRequest(Base):
    __tablename__ = "transport_requests"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id"), nullable=True)
    provider_id = Column(Integer, ForeignKey("transport_providers.id"), nullable=True)
    pickup_address = Column(Text, nullable=False)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    dropoff_address = Column(Text, nullable=False)
    dropoff_latitude = Column(Float, nullable=True)
    dropoff_longitude = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    cargo_description = Column(Text, nullable=True)
    cargo_weight_kg = Column(Float, nullable=True)
    status = Column(String, default="pending")  # pending, matched, in_progress, completed, cancelled
    scheduled_pickup = Column(DateTime, nullable=True)
    actual_pickup = Column(DateTime, nullable=True)
    actual_dropoff = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("TransportProvider", back_populates="transport_requests")
    orders = relationship("Order", back_populates="transport_request")
