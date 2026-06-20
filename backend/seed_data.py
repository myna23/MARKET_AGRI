"""Run: python seed_data.py  (from the backend/ directory)"""
import sys
sys.path.insert(0, ".")

from app.database import SessionLocal, engine, Base
from app import models
from app.models.farmer import Farmer
from app.models.buyer import Buyer
from app.models.product import Product
from app.models.transport import TransportProvider, TransportRequest
from passlib.hash import bcrypt
from datetime import datetime

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Always refresh products so the demo always has stock.
# Accounts (farmers/buyers/drivers) are only created once.
db.query(TransportRequest).delete()
db.query(Product).delete()
db.commit()
print("Products cleared — re-seeding fresh stock...")

# ─── Farmers ────────────────────────────────────────────────────────────────
farmers_data = [
    dict(name="Alhassan Ibrahim", phone="0241001001", village="Tolon", district="Tolon", latitude=9.4200, longitude=-1.0300, farm_size_acres=4.5),
    dict(name="Fati Mahama", phone="0241001002", village="Savelugu", district="Savelugu", latitude=9.6250, longitude=-0.8278, farm_size_acres=3.0),
    dict(name="Yakubu Aliu", phone="0241001003", village="Kumbungu", district="Kumbungu", latitude=9.5500, longitude=-1.0200, farm_size_acres=6.0),
    dict(name="Amina Sulemana", phone="0241001004", village="Sagnarigu", district="Sagnarigu", latitude=9.4456, longitude=-0.8333, farm_size_acres=2.5),
    dict(name="Abdul Razak", phone="0241001005", village="Nanton", district="Nanton", latitude=9.5800, longitude=-0.9000, farm_size_acres=5.0),
    dict(name="Mariama Seidu", phone="0241001006", village="Tamale", district="Tamale Metro", latitude=9.4008, longitude=-0.8393, farm_size_acres=3.5),
    dict(name="Ibrahim Dauda", phone="0241001007", village="Gushegu", district="Gushegu", latitude=10.1700, longitude=-0.4000, farm_size_acres=7.0),
    dict(name="Hajia Ramatu", phone="0241001008", village="Karaga", district="Karaga", latitude=10.0000, longitude=-0.4300, farm_size_acres=4.0),
]

for fd in farmers_data:
    if not db.query(Farmer).filter(Farmer.phone == fd["phone"]).first():
        f = Farmer(password_hash=bcrypt.hash("farmer123"), rating=4.2, total_reviews=12, **fd)
        db.add(f)

db.commit()

# ─── Buyers ─────────────────────────────────────────────────────────────────
buyers_data = [
    dict(name="Hajia Zenabu", phone="0271001001", buyer_type="retailer", city="Tamale", district="Tamale Metro", latitude=9.4008, longitude=-0.8393),
    dict(name="Kofi Mensah Foods", phone="0271001002", buyer_type="restaurant", city="Tamale", district="Tamale Metro", latitude=9.4050, longitude=-0.8400),
    dict(name="Northern Exports Ltd", phone="0271001003", buyer_type="exporter", city="Tamale", district="Tamale Metro", latitude=9.4020, longitude=-0.8350),
    dict(name="Afua Asante", phone="0271001004", buyer_type="household", city="Savelugu", district="Savelugu", latitude=9.6250, longitude=-0.8278),
    dict(name="GhanaBridge Processors", phone="0271001005", buyer_type="processor", city="Tamale", district="Tamale Metro", latitude=9.3980, longitude=-0.8420),
]

for bd in buyers_data:
    if not db.query(Buyer).filter(Buyer.phone == bd["phone"]).first():
        b = Buyer(password_hash=bcrypt.hash("buyer123"), rating=4.0, total_reviews=8, **bd)
        db.add(b)

db.commit()

# ─── Products (one pass only — table was cleared above) ─────────────────────
farmers_db = {f.phone: f for f in db.query(Farmer).all()}

products_data = [
    # Tomatoes
    dict(farmer_phone="0241001001", name="Roma Tomatoes", category="tomatoes", description="Fresh Roma tomatoes from Tolon, ideal for cooking", quantity_kg=500, price_per_kg=6.5, min_order_kg=5),
    dict(farmer_phone="0241001003", name="Beefsteak Tomatoes", category="tomatoes", description="Large beefsteak tomatoes, great for slicing", quantity_kg=800, price_per_kg=5.5, min_order_kg=10),
    dict(farmer_phone="0241001006", name="Cherry Tomatoes", category="tomatoes", description="Sweet cherry tomatoes for restaurants", quantity_kg=100, price_per_kg=12.0, min_order_kg=2),

    # Peppers
    dict(farmer_phone="0241001002", name="Red Scotch Bonnet", category="peppers", description="Hot scotch bonnet from Savelugu", quantity_kg=150, price_per_kg=14.0, min_order_kg=1),
    dict(farmer_phone="0241001005", name="Yellow Chilli Peppers", category="peppers", description="Mild yellow chilli, great for soups", quantity_kg=90, price_per_kg=12.0, min_order_kg=1),
    dict(farmer_phone="0241001003", name="Green Bell Peppers", category="peppers", description="Sweet green bell peppers", quantity_kg=120, price_per_kg=9.0, min_order_kg=1),
    dict(farmer_phone="0241001007", name="Dried Chilli Pepper", category="peppers", description="Sun-dried chilli, extra hot", quantity_kg=60, price_per_kg=20.0, min_order_kg=0.5),

    # Garden eggs
    dict(farmer_phone="0241001001", name="Garden Eggs", category="garden_eggs", description="Purple garden eggs, freshly harvested", quantity_kg=200, price_per_kg=8.0, min_order_kg=2),
    dict(farmer_phone="0241001004", name="White Garden Eggs", category="garden_eggs", description="Small white garden eggs, less bitter", quantity_kg=150, price_per_kg=9.5, min_order_kg=1),

    # Okra
    dict(farmer_phone="0241001002", name="Fresh Okra", category="okra", description="Tender okra pods, market ready", quantity_kg=180, price_per_kg=10.0, min_order_kg=2),
    dict(farmer_phone="0241001005", name="Premium Okra (Export)", category="okra", description="Export-grade okra, uniform size", quantity_kg=250, price_per_kg=13.0, min_order_kg=5),

    # Leafy greens
    dict(farmer_phone="0241001004", name="Kontomire Leaves", category="leafy_greens", description="Fresh cocoyam leaves, picked daily", quantity_kg=80, price_per_kg=5.0, min_order_kg=1),
    dict(farmer_phone="0241001006", name="Spring Onions", category="leafy_greens", description="Fresh spring onions from Tamale", quantity_kg=60, price_per_kg=6.0, min_order_kg=1),
    dict(farmer_phone="0241001008", name="Spinach (Alefu)", category="leafy_greens", description="Local spinach, excellent for soups", quantity_kg=70, price_per_kg=4.5, min_order_kg=1),

    # Onions
    dict(farmer_phone="0241001004", name="Brown Onions", category="onions", description="Dry brown onions from Sagnarigu", quantity_kg=400, price_per_kg=7.0, min_order_kg=5),
    dict(farmer_phone="0241001007", name="Red Onions", category="onions", description="Red shallot onions, sweet flavour", quantity_kg=300, price_per_kg=8.5, min_order_kg=3),

    # Yams
    dict(farmer_phone="0241001003", name="White Yam", category="yams", description="Large white yam tubers from Kumbungu", quantity_kg=600, price_per_kg=4.0, min_order_kg=10),
    dict(farmer_phone="0241001007", name="Water Yam", category="yams", description="Water yam, ideal for pounding", quantity_kg=400, price_per_kg=3.5, min_order_kg=5),

    # Maize
    dict(farmer_phone="0241001001", name="Dry Maize (Corn)", category="maize", description="Dried yellow maize for milling", quantity_kg=1000, price_per_kg=2.5, min_order_kg=20),
    dict(farmer_phone="0241001008", name="White Maize", category="maize", description="White maize, suitable for TZ and porridge", quantity_kg=800, price_per_kg=2.2, min_order_kg=20),

    # Millet
    dict(farmer_phone="0241001007", name="Pearl Millet", category="millet", description="Dried pearl millet, staple grain of Northern Ghana", quantity_kg=500, price_per_kg=3.0, min_order_kg=10),
    dict(farmer_phone="0241001008", name="Finger Millet", category="millet", description="Nutrient-rich finger millet", quantity_kg=300, price_per_kg=3.8, min_order_kg=5),

    # Rice
    dict(farmer_phone="0241001002", name="Local Brown Rice", category="rice", description="Locally grown brown rice from Savelugu", quantity_kg=400, price_per_kg=7.5, min_order_kg=10),
    dict(farmer_phone="0241001005", name="Parboiled Rice", category="rice", description="Parboiled white rice, ready for market", quantity_kg=600, price_per_kg=6.5, min_order_kg=10),
]

for pd in products_data:
    farmer = farmers_db.get(pd.pop("farmer_phone"))
    if farmer:
        p = Product(farmer_id=farmer.id, expiry_days=7, harvest_date=datetime.utcnow(), **pd)
        db.add(p)

db.commit()

# ─── Transport providers ─────────────────────────────────────────────────────
transport_data = [
    dict(name="Issah Tampuri", phone="0261001001", vehicle_type="pickup", vehicle_capacity_kg=1000, license_plate="NT-1234-21", base_district="Tamale Metro", price_per_km=4.5, current_latitude=9.4008, current_longitude=-0.8393),
    dict(name="Razak Drives", phone="0261001002", vehicle_type="tricycle", vehicle_capacity_kg=300, license_plate="NT-5678-22", base_district="Savelugu", price_per_km=3.0, current_latitude=9.6250, current_longitude=-0.8278),
    dict(name="Northern Freight Ltd", phone="0261001003", vehicle_type="truck", vehicle_capacity_kg=5000, license_plate="NT-9012-20", base_district="Tamale Metro", price_per_km=8.0, current_latitude=9.4020, current_longitude=-0.8380),
    dict(name="Fuseini Motors", phone="0261001004", vehicle_type="motorcycle", vehicle_capacity_kg=100, license_plate="NT-3456-23", base_district="Tolon", price_per_km=2.0, current_latitude=9.4200, current_longitude=-1.0300),
    dict(name="Kpema Express", phone="0261001005", vehicle_type="pickup", vehicle_capacity_kg=800, license_plate="NT-7890-22", base_district="Gushegu", price_per_km=5.0, current_latitude=10.1700, current_longitude=-0.4000),
]

for td in transport_data:
    if not db.query(TransportProvider).filter(TransportProvider.phone == td["phone"]).first():
        t = TransportProvider(password_hash=bcrypt.hash("driver123"), rating=4.3, total_reviews=20, **td)
        db.add(t)

db.commit()
db.close()

print("✅ Seed data loaded — 24 products across 8 categories, no duplicates.")
print("   Farmers : phone 0241001001–0241001008 / password: farmer123")
print("   Buyers  : phone 0271001001–0271001005 / password: buyer123")
print("   Drivers : phone 0261001001–0261001005 / password: driver123")
