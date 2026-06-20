from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from ..database import get_db
from ..models.buyer import Buyer
from ..schemas.buyer import BuyerCreate, BuyerLogin, BuyerOut

router = APIRouter(prefix="/buyers", tags=["Buyers"])


@router.post("/register", response_model=BuyerOut)
def register_buyer(data: BuyerCreate, db: Session = Depends(get_db)):
    if db.query(Buyer).filter(Buyer.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    buyer = Buyer(
        name=data.name,
        phone=data.phone,
        email=data.email,
        password_hash=bcrypt.hash(data.password),
        buyer_type=data.buyer_type,
        city=data.city,
        district=data.district,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer


@router.post("/login")
def login_buyer(data: BuyerLogin, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.phone == data.phone).first()
    if not buyer or not bcrypt.verify(data.password, buyer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"buyer_id": buyer.id, "name": buyer.name, "role": "buyer"}


@router.get("/", response_model=list[BuyerOut])
def list_buyers(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Buyer).offset(skip).limit(limit).all()


@router.get("/{buyer_id}", response_model=BuyerOut)
def get_buyer(buyer_id: int, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    return buyer
