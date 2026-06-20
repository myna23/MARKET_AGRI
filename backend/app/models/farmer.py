from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=False)
    village = Column(String, nullable=False)
    district = Column(String, nullable=False, default="Northern Region")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    farm_size_acres = Column(Float, nullable=True)
    profile_image = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="farmer", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="farmer")
