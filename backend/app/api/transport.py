from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
import math
from ..database import get_db
from ..models.transport import TransportProvider, TransportRequest
from ..schemas.transport import (
    TransportProviderCreate, TransportProviderOut,
    TransportRequestCreate, TransportRequestOut,
)

router = APIRouter(prefix="/transport", tags=["Transport"])


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.post("/providers/register", response_model=TransportProviderOut)
def register_provider(data: TransportProviderCreate, db: Session = Depends(get_db)):
    if db.query(TransportProvider).filter(TransportProvider.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    provider = TransportProvider(
        name=data.name,
        phone=data.phone,
        email=data.email,
        password_hash=bcrypt.hash(data.password),
        vehicle_type=data.vehicle_type,
        vehicle_capacity_kg=data.vehicle_capacity_kg,
        license_plate=data.license_plate,
        base_district=data.base_district,
        price_per_km=data.price_per_km,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


@router.get("/providers", response_model=list[TransportProviderOut])
def list_providers(available_only: bool = True, db: Session = Depends(get_db)):
    q = db.query(TransportProvider)
    if available_only:
        q = q.filter(TransportProvider.is_available == True)
    return q.all()


@router.put("/providers/{provider_id}/location")
def update_location(provider_id: int, lat: float, lon: float, db: Session = Depends(get_db)):
    provider = db.query(TransportProvider).filter(TransportProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider.current_latitude = lat
    provider.current_longitude = lon
    db.commit()
    return {"status": "updated"}


@router.put("/providers/{provider_id}/availability")
def set_availability(provider_id: int, available: bool, db: Session = Depends(get_db)):
    provider = db.query(TransportProvider).filter(TransportProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider.is_available = available
    db.commit()
    return {"status": "updated", "is_available": available}


@router.post("/requests", response_model=TransportRequestOut)
def create_transport_request(
    data: TransportRequestCreate,
    farmer_id: int = None,
    buyer_id: int = None,
    db: Session = Depends(get_db),
):
    dist_km = None
    cost = None
    if all([data.pickup_latitude, data.pickup_longitude, data.dropoff_latitude, data.dropoff_longitude]):
        dist_km = round(haversine_km(data.pickup_latitude, data.pickup_longitude, data.dropoff_latitude, data.dropoff_longitude), 2)

    req = TransportRequest(
        farmer_id=farmer_id,
        buyer_id=buyer_id,
        pickup_address=data.pickup_address,
        pickup_latitude=data.pickup_latitude,
        pickup_longitude=data.pickup_longitude,
        dropoff_address=data.dropoff_address,
        dropoff_latitude=data.dropoff_latitude,
        dropoff_longitude=data.dropoff_longitude,
        distance_km=dist_km,
        cargo_description=data.cargo_description,
        cargo_weight_kg=data.cargo_weight_kg,
        scheduled_pickup=data.scheduled_pickup,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.post("/requests/{request_id}/match")
def match_provider(request_id: int, db: Session = Depends(get_db)):
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    providers = db.query(TransportProvider).filter(TransportProvider.is_available == True).all()
    if not providers:
        raise HTTPException(status_code=404, detail="No available transport providers")

    best = None
    best_score = float("inf")
    for p in providers:
        if req.cargo_weight_kg and p.vehicle_capacity_kg < req.cargo_weight_kg:
            continue
        score = 0
        if req.pickup_latitude and p.current_latitude:
            d = haversine_km(req.pickup_latitude, req.pickup_longitude, p.current_latitude, p.current_longitude)
            score = d
        if best is None or score < best_score:
            best = p
            best_score = score

    if not best:
        raise HTTPException(status_code=404, detail="No suitable provider found for cargo weight")

    if req.distance_km:
        req.estimated_cost = round(req.distance_km * best.price_per_km, 2)
    req.provider_id = best.id
    req.status = "matched"
    db.commit()
    return {
        "request_id": request_id,
        "provider": {
            "id": best.id,
            "name": best.name,
            "phone": best.phone,
            "vehicle_type": best.vehicle_type,
            "vehicle_capacity_kg": best.vehicle_capacity_kg,
            "rating": best.rating,
            "price_per_km": best.price_per_km,
        },
        "estimated_cost": req.estimated_cost,
        "distance_km": req.distance_km,
    }


@router.put("/requests/{request_id}/status")
def update_request_status(request_id: int, status: str, db: Session = Depends(get_db)):
    valid = {"pending", "matched", "in_progress", "completed", "cancelled"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status")
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = status
    if status == "in_progress" and req.provider_id:
        provider = db.query(TransportProvider).filter(TransportProvider.id == req.provider_id).first()
        if provider:
            provider.is_available = False
    if status in ("completed", "cancelled") and req.provider_id:
        provider = db.query(TransportProvider).filter(TransportProvider.id == req.provider_id).first()
        if provider:
            provider.is_available = True
    db.commit()
    return {"request_id": request_id, "status": status}


@router.get("/requests/{request_id}", response_model=TransportRequestOut)
def get_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(TransportRequest).filter(TransportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    return req
