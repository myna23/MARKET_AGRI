from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
import shutil, os
from ..database import get_db
from ..models.farmer import Farmer
from ..schemas.farmer import FarmerCreate, FarmerLogin, FarmerOut

router = APIRouter(prefix="/farmers", tags=["Farmers"])

UPLOAD_DIR = "uploads/farmers"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register", response_model=FarmerOut)
def register_farmer(data: FarmerCreate, db: Session = Depends(get_db)):
    if db.query(Farmer).filter(Farmer.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    farmer = Farmer(
        name=data.name,
        phone=data.phone,
        email=data.email,
        password_hash=bcrypt.hash(data.password),
        village=data.village,
        district=data.district,
        latitude=data.latitude,
        longitude=data.longitude,
        farm_size_acres=data.farm_size_acres,
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer


@router.post("/login")
def login_farmer(data: FarmerLogin, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.phone == data.phone).first()
    if not farmer or not bcrypt.verify(data.password, farmer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"farmer_id": farmer.id, "name": farmer.name, "role": "farmer"}


@router.get("/", response_model=list[FarmerOut])
def list_farmers(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Farmer).offset(skip).limit(limit).all()


@router.get("/{farmer_id}", response_model=FarmerOut)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer


@router.post("/{farmer_id}/upload-image")
def upload_farmer_image(farmer_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    ext = file.filename.split(".")[-1]
    path = f"{UPLOAD_DIR}/{farmer_id}.{ext}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    farmer.profile_image = f"/static/{path}"
    db.commit()
    return {"image_url": farmer.profile_image}
