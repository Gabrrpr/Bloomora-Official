"""
Seed script to add vases and add-ons to the database.
Run with: python seed_products.py
"""
import uuid
import sys
from decimal import Decimal
from pathlib import Path

# Add the app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models.product import Product, Inventory, ProductStatusEnum
from app.models.arrangement import Vase, Wrapping, Accessory, Flower


# ── VASES DATA (from VasesPage.jsx) ───────────────────────────────────────────────
VASES = [
    {"name": "Black Gold Large Vase", "price": 580, "original": 750, "rating": 4.8, "reviews": 32, "ribbon": "Premium", "category": "Gold", "image": "BlackGoldLargeVase580.webp"},
    {"name": "Black Gold Regular Vase", "price": 280, "original": 360, "rating": 4.6, "reviews": 18, "ribbon": None, "category": "Gold", "image": "BlackGoldRegularVase280.webp"},
    {"name": "Green Fountain Vase", "price": 350, "original": 450, "rating": 4.7, "reviews": 24, "ribbon": None, "category": "Green", "image": "GreenFountainVase.webp"},
    {"name": "Green Grainy Curvy Vase", "price": 290, "original": 380, "rating": 4.5, "reviews": 15, "ribbon": None, "category": "Green", "image": "GreenGrainyCurvyVase.webp"},
    {"name": "Green Grainy Line Vase", "price": 290, "original": 380, "rating": 4.5, "reviews": 11, "ribbon": None, "category": "Green", "image": "GreenGrainyLineVase.webp"},
    {"name": "Green Grainy Vase", "price": 260, "original": 340, "rating": 4.4, "reviews": 9, "ribbon": None, "category": "Green", "image": "GreenGrainyVase.webp"},
    {"name": "Green Leaf Vase", "price": 310, "original": 400, "rating": 4.8, "reviews": 41, "ribbon": "Popular", "category": "Green", "image": "GreenLeafVase.webp"},
    {"name": "Green Rectangle Vase", "price": 270, "original": 350, "rating": 4.6, "reviews": 20, "ribbon": None, "category": "Green", "image": "GreenRectangleVase.webp"},
    {"name": "Green Tulip Vase", "price": 480, "original": 620, "rating": 4.9, "reviews": 58, "ribbon": "Best Seller", "category": "Green", "image": "GreenTulipVase480.webp"},
    {"name": "Marble Hexagon Vase", "price": 380, "original": 490, "rating": 4.8, "reviews": 36, "ribbon": "Popular", "category": "Marble", "image": "MarbleHexagonVase380.webp"},
    {"name": "Marble Line Vase", "price": 360, "original": 460, "rating": 4.7, "reviews": 22, "ribbon": None, "category": "Marble", "image": "MarbleLineVase.webp"},
    {"name": "Mint Green Simple Vase", "price": 220, "original": 290, "rating": 4.6, "reviews": 17, "ribbon": "New", "category": "Green", "image": "MintGreenSimpleVase.webp"},
    {"name": "Pink Abstract Vase", "price": 380, "original": 490, "rating": 4.7, "reviews": 29, "ribbon": None, "category": "Pink", "image": "PinkAbstractVase380.webp"},
    {"name": "Plastic Pot", "price": 120, "original": 160, "rating": 4.3, "reviews": 44, "ribbon": None, "category": "Pots", "image": "PlasticPot1.webp"},
    {"name": "White Abstract Vase", "price": 300, "original": 390, "rating": 4.7, "reviews": 31, "ribbon": None, "category": "White", "image": "WhiteAbstractVase300.webp"},
    {"name": "White Circular Vase S", "price": 80, "original": 110, "rating": 4.4, "reviews": 26, "ribbon": None, "category": "White", "image": "WhiteCircularVase80.webp"},
    {"name": "White Circular Vase L", "price": 1000, "original": 1280, "rating": 4.9, "reviews": 14, "ribbon": "Premium", "category": "White", "image": "WhiteCircularVase1000.webp"},
    {"name": "White Circular Vase XL", "price": 1350, "original": 1700, "rating": 5.0, "reviews": 8, "ribbon": "Premium", "category": "White", "image": "WhiteCircularVase1350.webp"},
    {"name": "White Hexagon Vase", "price": 80, "original": 110, "rating": 4.5, "reviews": 33, "ribbon": None, "category": "White", "image": "WhiteHexagonVase80.webp"},
    {"name": "White Tulip Vase", "price": 480, "original": 620, "rating": 4.9, "reviews": 47, "ribbon": "Best Seller", "category": "White", "image": "WhiteTulipVase480.webp"},
]

# ── ADD-ONS DATA (from AddonsPage.jsx) ──────────────────────────────────────────────
ADDONS = [
    {"name": "Cadbury Fruit & Nut", "price": 169, "original": 220, "rating": 4.8, "reviews": 94, "ribbon": "Popular", "brand": "Cadbury", "weight": "90g", "image": "CadburyFruit&Nut.webp"},
    {"name": "Cadbury Milk Chocolate", "price": 149, "original": 195, "rating": 4.9, "reviews": 142, "ribbon": "Best Seller", "brand": "Cadbury", "weight": "90g", "image": "CadburyMilkChoc.webp"},
    {"name": "Ferrero Rocher 8pcs", "price": 199, "original": 260, "rating": 4.9, "reviews": 218, "ribbon": "Best Seller", "brand": "Ferrero", "weight": "100g", "image": "ferrero8pcs.webp"},
    {"name": "Ferrero Rocher 12pcs", "price": 349, "original": 450, "rating": 4.9, "reviews": 183, "ribbon": "Popular", "brand": "Ferrero", "weight": "150g", "image": "ferrero12pcs.webp"},
    {"name": "Ferrero Rocher 24pcs", "price": 599, "original": 780, "rating": 5.0, "reviews": 97, "ribbon": "Premium", "brand": "Ferrero", "weight": "300g", "image": "ferrero24pcs.webp"},
    {"name": "Hershey's Cookies & Cream", "price": 149, "original": 195, "rating": 4.7, "reviews": 76, "ribbon": None, "brand": "Hershey's", "weight": "40g", "image": "hersheyCnC.webp"},
    {"name": "Hershey's Milk Chocolate", "price": 149, "original": 195, "rating": 4.8, "reviews": 88, "ribbon": None, "brand": "Hershey's", "weight": "40g", "image": "hersheyOriginal.webp"},
    {"name": "M&M's Milk Chocolate", "price": 179, "original": 230, "rating": 4.7, "reviews": 61, "ribbon": None, "brand": "M&M's", "weight": "100g", "image": "M&MsMilkChoc.webp"},
    {"name": "M&M's Peanut", "price": 179, "original": 230, "rating": 4.8, "reviews": 74, "ribbon": "Popular", "brand": "M&M's", "weight": "100g", "image": "M&MsPeanut.webp"},
    {"name": "Snickers", "price": 149, "original": 195, "rating": 4.6, "reviews": 52, "ribbon": None, "brand": "Mars", "weight": "50g", "image": "Snickers.webp"},
    {"name": "Toblerone", "price": 199, "original": 260, "rating": 4.9, "reviews": 109, "ribbon": "Popular", "brand": "Toblerone", "weight": "100g", "image": "Toblerone.webp"},
    {"name": "Twix", "price": 149, "original": 195, "rating": 4.7, "reviews": 48, "ribbon": None, "brand": "Mars", "weight": "50g", "image": "twix.webp"},
]

# ── WRAPPING DATA ──────────────────────────────────────────────────────────────
WRAPPINGS = [
    {"name": "Classic White Wrapping Paper", "price": 80, "style": "Classic", "color": "White", "image": "wrapping_white.webp"},
    {"name": "Kraft Brown Wrapping Paper", "price": 70, "style": "Rustic", "color": "Brown", "image": "wrapping_brown.webp"},
    {"name": "Pink Matte Wrapping Paper", "price": 90, "style": "Matte", "color": "Pink", "image": "wrapping_pink.webp"},
    {"name": "Black Elegant Wrapping Paper", "price": 100, "style": "Elegant", "color": "Black", "image": "wrapping_black.webp"},
    {"name": "Gold Foil Wrapping Paper", "price": 120, "style": "Foil", "color": "Gold", "image": "wrapping_gold.webp"},
]

FLOWERS = [
    {"name": "Red Roses", "price": 120, "color": "Red", "style": "Premium", "image": "RedRoses.webp"},
    {"name": "White Roses", "price": 130, "color": "White", "style": "Premium", "image": "WhiteRoses.webp"},
    {"name": "Pink Roses", "price": 120, "color": "Pink", "style": "Premium", "image": "PinkRoses.webp"},
    {"name": "Yellow Roses", "price": 110, "color": "Yellow", "style": "Premium", "image": "YellowRoses.webp"},
    {"name": "Red Tulips", "price": 100, "color": "Red", "style": "Deluxe", "image": "RedTulips.webp"},
    {"name": "Pink Tulips", "price": 100, "color": "Pink", "style": "Deluxe", "image": "PinkTulips.webp"},
    {"name": "Yellow Tulips", "price": 95, "color": "Yellow", "style": "Deluxe", "image": "YellowTulips.webp"},
    {"name": "Sunflowers", "price": 90, "color": "Yellow", "style": "Classic", "image": "Sunflowers.webp"},
    {"name": "Pink Carnations", "price": 80, "color": "Pink", "style": "Classic", "image": "PinkCarnations.webp"},
    {"name": "White Carnations", "price": 75, "color": "White", "style": "Classic", "image": "WhiteCarnations.webp"},
    {"name": "White Lilies", "price": 150, "color": "White", "style": "Premium", "image": "WhiteLilies.webp"},
    {"name": "Pink Peonies", "price": 180, "color": "Pink", "style": "Luxury", "image": "PinkPeonies.webp"},
    {"name": "White Orchids", "price": 200, "color": "White", "style": "Luxury", "image": "WhiteOrchids.webp"},
    {"name": "Baby's Breath", "price": 60, "color": "White", "style": "Filler", "image": "BabysBreath.webp"},
    {"name": "Green Leaves", "price": 40, "color": "Green", "style": "Foliage", "image": "GreenLeaves.webp"},
]

FILLERS = [
    {"name": "Baby's Breath", "price": 60, "color": "White", "style": "Filler", "image": "BabysBreath.webp"},
    {"name": "Green Leaves", "price": 40, "color": "Green", "style": "Foliage", "image": "GreenLeaves.webp"},
    {"name": "Eucalyptus", "price": 70, "color": "Green", "style": "Filler", "image": "Eucalyptus.webp"},
    {"name": "Dried Grass", "price": 50, "color": "Tan", "style": "Filler", "image": "DriedGrass.webp"},
]


def seed_products():
    """Seed vases, add-ons, wrapping materials, and their sub-table records."""
    db = SessionLocal()

    try:
        # 👇 UPDATED: Using strings instead of ProductCategoryEnum
        existing_vase_names = {p.name for p in db.query(Product).filter(Product.category == "vase").all()}
        existing_addon_names = {p.name for p in db.query(Product).filter(Product.category == "accessory").all()}

        # Add vases that don't exist yet
        vases_to_add = [v for v in VASES if v["name"] not in existing_vase_names]
        if vases_to_add:
            print(f"Seeding {len(vases_to_add)} new vases...")
            for vase_data in vases_to_add:
                product = Product(
                    id=uuid.uuid4(),
                    name=vase_data["name"],
                    description=f"Beautiful {vase_data['category']} vase - {vase_data['name']}",
                    price=Decimal(str(vase_data["price"])),
                    category="vase", # 👈 UPDATED
                    image_url=f"/assets/products/vases/{vase_data['image']}",
                    is_available=True,
                    status=ProductStatusEnum.active,
                )
                db.add(product)
                db.flush()

                # Add inventory
                inventory = Inventory(
                    product_id=product.id,
                    current_stock=50,  # Default stock
                    reorder_point=10,
                    unit_type="pieces",
                )
                db.add(inventory)

                # Add Vase record in vases table
                vase = Vase(
                    id=uuid.uuid4(),
                    product_id=product.id,
                    style=None,
                    material=vase_data.get("category"),
                    color=None,
                    size=None,
                    quantity=1,
                    unit_price=Decimal(str(vase_data["price"])),
                    original_price=Decimal(str(vase_data.get("original", vase_data["price"]))),
                    rating=Decimal(str(vase_data.get("rating", 0))),
                    reviews=vase_data.get("reviews", 0),
                    ribbon=vase_data.get("ribbon"),
                    category=vase_data.get("category"),
                )
                db.add(vase)

            db.commit()
            print(f"Added {len(vases_to_add)} vases to database")
        else:
            print("All vases already exist in database")

            # Check if vase records exist and create them if needed
            existing_vase_ids = {v.product_id for v in db.query(Vase).all()}
            vases_needing_records = db.query(Product).filter(
                Product.category == "vase", # 👈 UPDATED
                Product.id.notin_(existing_vase_ids)
            ).all()

            if vases_needing_records:
                print(f"Creating vase records for {len(vases_needing_records)} existing vase products...")
                for product in vases_needing_records:
                    matching_vase = next((v for v in VASES if v["name"] == product.name), None)
                    if matching_vase:
                        vase = Vase(
                            id=uuid.uuid4(),
                            product_id=product.id,
                            style=None,
                            material=matching_vase.get("category"),
                            color=None,
                            size=None,
                            quantity=1,
                            unit_price=product.price,
                            original_price=Decimal(str(matching_vase.get("original", matching_vase["price"]))),
                            rating=Decimal(str(matching_vase.get("rating", 0))),
                            reviews=matching_vase.get("reviews", 0),
                            ribbon=matching_vase.get("ribbon"),
                            category=matching_vase.get("category"),
                        )
                        db.add(vase)
                db.commit()
                print(f"Created vase records for {len(vases_needing_records)} vases")

        # Add add-ons that don't exist yet
        addons_to_add = [a for a in ADDONS if a["name"] not in existing_addon_names]
        if addons_to_add:
            print(f"Seeding {len(addons_to_add)} new add-ons...")
            for addon_data in addons_to_add:
                product = Product(
                    id=uuid.uuid4(),
                    name=addon_data["name"],
                    description=f"{addon_data['brand']} {addon_data['name']} - {addon_data['weight']}",
                    price=Decimal(str(addon_data["price"])),
                    category="accessory", # 👈 UPDATED
                    image_url=f"/assets/products/addons/{addon_data['image']}",
                    is_available=True,
                    status=ProductStatusEnum.active,
                )
                db.add(product)
                db.flush()

                # Add inventory
                inventory = Inventory(
                    product_id=product.id,
                    current_stock=100,
                    reorder_point=20,
                    unit_type="pieces",
                )
                db.add(inventory)

            db.commit()
            print(f"Added {len(addons_to_add)} add-ons to database")
        else:
            print("All add-ons already exist in database")

        # Ensure Accessory records exist for all accessory products
        existing_accessory_product_ids = {a.product_id for a in db.query(Accessory).all()}
        accessories_needing_records = db.query(Product).filter(
            Product.category == "accessory",
            Product.id.notin_(existing_accessory_product_ids)
        ).all()

        if accessories_needing_records:
            print(f"Creating Accessory records for {len(accessories_needing_records)} accessory products...")
            for product in accessories_needing_records:
                accessory = Accessory(
                    product_id=product.id,
                    name=product.name,
                    style=None,
                    color=None,
                    size=None,
                    quantity=1,
                    unit_price=product.price,
                )
                db.add(accessory)
            db.commit()
            print(f"Created Accessory records for {len(accessories_needing_records)} products")

        # Seed wrapping products
        existing_wrapping_names = {p.name for p in db.query(Product).filter(Product.category == "wrapping").all()}
        wrappings_to_add = [w for w in WRAPPINGS if w["name"] not in existing_wrapping_names]
        if wrappings_to_add:
            print(f"Seeding {len(wrappings_to_add)} new wrapping products...")
            for wrap_data in wrappings_to_add:
                product = Product(
                    id=uuid.uuid4(),
                    name=wrap_data["name"],
                    description=f"{wrap_data['style']} {wrap_data['color']} wrapping paper - {wrap_data['name']}",
                    price=Decimal(str(wrap_data["price"])),
                    category="wrapping",
                    image_url=f"/assets/products/wrapping/{wrap_data['image']}",
                    is_available=True,
                    status=ProductStatusEnum.active,
                )
                db.add(product)
                db.flush()

                inventory = Inventory(
                    product_id=product.id,
                    current_stock=100,
                    reorder_point=20,
                    unit_type="pieces",
                )
                db.add(inventory)

                wrapping = Wrapping(
                    product_id=product.id,
                    style=wrap_data["style"],
                    color=wrap_data["color"],
                    material="Paper",
                    size="Standard",
                    quantity=1,
                    unit_price=Decimal(str(wrap_data["price"])),
                )
                db.add(wrapping)

            db.commit()
            print(f"Added {len(wrappings_to_add)} wrapping products to database")
        else:
            print("All wrapping products already exist in database")

        # Summary
        total = db.query(Product).count()
        print(f"Total products in database: {total}")

        # Seed flower products
        existing_flower_names = {p.name for p in db.query(Product).filter(Product.category == "flower").all()}
        flowers_to_add = [f for f in FLOWERS if f["name"] not in existing_flower_names]
        if flowers_to_add:
            print(f"Seeding {len(flowers_to_add)} new flowers...")
            for flower_data in flowers_to_add:
                product = Product(
                    id=uuid.uuid4(),
                    name=flower_data["name"],
                    description=f"Beautiful {flower_data['color']} {flower_data['style']} flowers - {flower_data['name']}",
                    price=Decimal(str(flower_data["price"])),
                    category="flower",
                    product_type="flower",
                    product_group="floral",
                    image_url=f"/assets/products/flowers/{flower_data['image']}",
                    is_available=True,
                    status=ProductStatusEnum.active,
                )
                db.add(product)
                db.flush()

                inventory = Inventory(
                    product_id=product.id,
                    current_stock=50,
                    reorder_point=10,
                    unit_type="stems",
                )
                db.add(inventory)

                flower = Flower(
                    product_id=product.id,
                    color=flower_data["color"],
                    style=flower_data["style"],
                    size="Standard",
                    quantity=1,
                    unit_price=Decimal(str(flower_data["price"])),
                )
                db.add(flower)

            db.commit()
            print(f"Added {len(flowers_to_add)} flowers to database")
        else:
            print("All flowers already exist in database")

        # Seed filler products
        existing_filler_names = {p.name for p in db.query(Product).filter(Product.category == "filler").all()}
        fillers_to_add = [f for f in FILLERS if f["name"] not in existing_filler_names]
        if fillers_to_add:
            print(f"Seeding {len(fillers_to_add)} new fillers...")
            for filler_data in fillers_to_add:
                product = Product(
                    id=uuid.uuid4(),
                    name=filler_data["name"],
                    description=f"{filler_data['color']} {filler_data['style']} filler - {filler_data['name']}",
                    price=Decimal(str(filler_data["price"])),
                    category="filler",
                    product_type="filler",
                    product_group="floral",
                    image_url=f"/assets/products/fillers/{filler_data['image']}",
                    is_available=True,
                    status=ProductStatusEnum.active,
                )
                db.add(product)
                db.flush()

                inventory = Inventory(
                    product_id=product.id,
                    current_stock=50,
                    reorder_point=10,
                    unit_type="pieces",
                )
                db.add(inventory)

            db.commit()
            print(f"Added {len(fillers_to_add)} fillers to database")
        else:
            print("All fillers already exist in database")

    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
        raise
    finally:
        db.close()
