from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_type = Column(String, nullable=False)  # buyer, farmer, transport
    reviewer_id = Column(Integer, nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    transport_id = Column(Integer, ForeignKey("transport_providers.id"), nullable=True)
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer", back_populates="reviews")
