from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .database import engine, Base
from . import models  # ensure all models are registered
from .api import farmers, buyers, products, orders, transport, ai_match, ussd, payments, reviews, sms

Base.metadata.create_all(bind=engine)

os.makedirs("uploads/farmers", exist_ok=True)
os.makedirs("uploads/products", exist_ok=True)

app = FastAPI(
    title="AgriMarket Ghana API",
    description="Farmer-to-Buyer Digital Marketplace — Northern Ghana",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.include_router(farmers.router)
app.include_router(buyers.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(transport.router)
app.include_router(ai_match.router)
app.include_router(ussd.router)
app.include_router(payments.router)
app.include_router(reviews.router)
app.include_router(sms.router)


@app.get("/")
def root():
    return {
        "name": "AgriMarket Ghana",
        "tagline": "Connecting Northern Ghana farmers directly to buyers",
        "docs": "/docs",
        "region": "Northern Region, Ghana",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
