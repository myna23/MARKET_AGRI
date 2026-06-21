from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.review import Review
from ..models.farmer import Farmer

router = APIRouter(prefix="/reviews", tags=["Reviews"])


class ReviewCreate(BaseModel):
    farmer_id: int
    buyer_id: int
    order_id: Optional[int] = None
    rating: float        # 1-5
    comment: Optional[str] = None


@router.post("/")
def submit_review(data: ReviewCreate, db: Session = Depends(get_db)):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = Review(
        reviewer_type="buyer",
        reviewer_id=data.buyer_id,
        farmer_id=data.farmer_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)

    # Update the subject's average rating
    if data.farmer_id:
        farmer = db.query(Farmer).filter(Farmer.id == data.farmer_id).first()
        if farmer:
            all_reviews = db.query(Review).filter(Review.farmer_id == data.farmer_id).all()
            total = sum(r.rating for r in all_reviews) + data.rating
            count = len(all_reviews) + 1
            farmer.rating = round(total / count, 1)
            farmer.total_reviews = count

    db.commit()
    return {"message": "Review submitted", "rating": data.rating}


@router.get("/farmer/{farmer_id}")
def get_farmer_reviews(farmer_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.farmer_id == farmer_id).order_by(Review.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "reviewer_type": r.reviewer_type,
            "created_at": r.created_at,
        }
        for r in reviews
    ]
