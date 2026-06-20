from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


PRODUCE_CATEGORIES = ["tomatoes", "peppers", "garden_eggs", "okra", "leafy_greens", "onions", "yams", "maize", "other"]


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Float, nullable=False)
    min_order_kg = Column(Float, default=1.0)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    harvest_date = Column(DateTime, nullable=True)
    expiry_days = Column(Integer, default=7)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="products")
    order_items = relationship("Order", back_populates="product")
