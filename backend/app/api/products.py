from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
import shutil, os
from ..database import get_db
from ..models.product import Product
from ..models.farmer import Farmer
from ..schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_DIR = "uploads/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=ProductOut)
def create_product(farmer_id: int, data: ProductCreate, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    product = Product(farmer_id=farmer_id, **data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=list[dict])
def list_products(
    category: Optional[str] = None,
    district: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    available_only: bool = True,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(Product).options(joinedload(Product.farmer))
    if available_only:
        q = q.filter(Product.is_available == True)
    if category:
        q = q.filter(Product.category == category)
    if min_price is not None:
        q = q.filter(Product.price_per_kg >= min_price)
    if max_price is not None:
        q = q.filter(Product.price_per_kg <= max_price)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    if district:
        q = q.join(Farmer).filter(Farmer.district == district)

    products = q.offset(skip).limit(limit).all()
    result = []
    for p in products:
        d = {
            "id": p.id,
            "farmer_id": p.farmer_id,
            "name": p.name,
            "category": p.category,
            "description": p.description,
            "quantity_kg": p.quantity_kg,
            "price_per_kg": p.price_per_kg,
            "min_order_kg": p.min_order_kg,
            "image_url": p.image_url,
            "is_available": p.is_available,
            "expiry_days": p.expiry_days,
            "created_at": p.created_at,
            "farmer": {
                "id": p.farmer.id,
                "name": p.farmer.name,
                "village": p.farmer.village,
                "district": p.farmer.district,
                "latitude": p.farmer.latitude,
                "longitude": p.farmer.longitude,
                "rating": p.farmer.rating,
            } if p.farmer else None,
        }
        result.append(d)
    return result


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).options(joinedload(Product.farmer)).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": p.id,
        "farmer_id": p.farmer_id,
        "name": p.name,
        "category": p.category,
        "description": p.description,
        "quantity_kg": p.quantity_kg,
        "price_per_kg": p.price_per_kg,
        "min_order_kg": p.min_order_kg,
        "image_url": p.image_url,
        "is_available": p.is_available,
        "expiry_days": p.expiry_days,
        "created_at": p.created_at,
        "farmer": {
            "id": p.farmer.id,
            "name": p.farmer.name,
            "village": p.farmer.village,
            "district": p.farmer.district,
            "latitude": p.farmer.latitude,
            "longitude": p.farmer.longitude,
            "rating": p.farmer.rating,
            "phone": p.farmer.phone,
        } if p.farmer else None,
    }


@router.put("/{product_id}")
def update_product(product_id: int, farmer_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.farmer_id == farmer_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not owned by farmer")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.post("/{product_id}/upload-image")
def upload_product_image(product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    ext = file.filename.split(".")[-1]
    path = f"{UPLOAD_DIR}/{product_id}.{ext}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    product.image_url = f"/static/{path}"
    db.commit()
    return {"image_url": product.image_url}


@router.get("/farmer/{farmer_id}", response_model=list[ProductOut])
def get_farmer_products(farmer_id: int, db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.farmer_id == farmer_id).all()
