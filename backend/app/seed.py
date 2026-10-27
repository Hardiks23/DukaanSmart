import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import Product, Customer, Sale, SaleItem, CreditLedger, ShopProfile, MemoryAudit
from .services.hindsight_service import hindsight_service

def seed_database(db: Session):
    # Check if products already exist
    if db.query(Product).first():
        print("Database already contains data. Skipping initial seeding.")
        return

    print("Seeding DukaanSmart database with authentic Indian Kirana dataset...")

    # 1. Shop Profile
    profile = ShopProfile(
        shop_name="Sharma Kirana & General Store",
        tagline="A clearer way to run the everyday shop.",
        owner_name="Ramesh Sharma",
        phone="+91 98765 43210",
        address="Shop #14, Main Market, Ameerpet, Hyderabad - 500016",
        upi_id="sharmakirana@upi",
        gstin="36AAAAA0000A1Z5",
        hindsight_bank_id="dukaansmart-store-1",
        hindsight_api_key="",
        hindsight_base_url="https://api.hindsight.vectorize.io",
        groq_api_key="",
        llm_model="llama-3.3-70b-versatile",
        is_live_hindsight=False
    )
    db.add(profile)
    db.commit()

    # 2. Products Catalog
    now = datetime.utcnow()
    products_data = [
        # Staples & Grains
        {
            "name": "Aashirvaad Shudh Chakki Atta 10kg",
            "sku": "STP-ATT-001",
            "barcode": "8901030383123",
            "category": "Staples & Grains",
            "purchase_cost": 410.0,
            "selling_price": 450.0,
            "quantity": 28,
            "min_threshold": 10,
            "unit": "bag",
            "supplier": "Laxmi Traders Wholesale",
            "expiry_date": (now + timedelta(days=120)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Fortune Sunlite Refined Sunflower Oil 1L",
            "sku": "OIL-SUN-002",
            "barcode": "8906007281014",
            "category": "Oils & Ghee",
            "purchase_cost": 122.0,
            "selling_price": 138.0,
            "quantity": 35,
            "min_threshold": 12,
            "unit": "pouch",
            "supplier": "Balaji Wholesalers",
            "expiry_date": (now + timedelta(days=180)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Fortune Kachi Ghani Mustard Oil 1L",
            "sku": "OIL-MUS-003",
            "barcode": "8906007281021",
            "category": "Oils & Ghee",
            "purchase_cost": 140.0,
            "selling_price": 160.0,
            "quantity": 18,
            "min_threshold": 8,
            "unit": "bottle",
            "supplier": "Balaji Wholesalers",
            "expiry_date": (now + timedelta(days=210)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Tata Salt Vacuum Evaporated 1kg",
            "sku": "STP-SLT-004",
            "barcode": "8901058852331",
            "category": "Staples & Grains",
            "purchase_cost": 24.0,
            "selling_price": 28.0,
            "quantity": 60,
            "min_threshold": 20,
            "unit": "packet",
            "supplier": "Laxmi Traders Wholesale",
            "expiry_date": (now + timedelta(days=360)).strftime("%Y-%m-%d"),
        },
        {
            "name": "India Gate Basmati Rice Feast Rozzana 5kg",
            "sku": "STP-RIC-005",
            "barcode": "8901149010041",
            "category": "Staples & Grains",
            "purchase_cost": 375.0,
            "selling_price": 435.0,
            "quantity": 14,
            "min_threshold": 6,
            "unit": "bag",
            "supplier": "Laxmi Traders Wholesale",
            "expiry_date": (now + timedelta(days=300)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Madhur Pure & Hygienic Sugar 5kg",
            "sku": "STP-SGR-006",
            "barcode": "8906014410100",
            "category": "Staples & Grains",
            "purchase_cost": 220.0,
            "selling_price": 245.0,
            "quantity": 4,  # LOW STOCK
            "min_threshold": 8,
            "unit": "bag",
            "supplier": "Laxmi Traders Wholesale",
            "expiry_date": (now + timedelta(days=365)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Tata Sampann Unpolished Toor Dal 1kg",
            "sku": "PUL-TOR-007",
            "barcode": "8901058863016",
            "category": "Staples & Grains",
            "purchase_cost": 158.0,
            "selling_price": 180.0,
            "quantity": 22,
            "min_threshold": 10,
            "unit": "packet",
            "supplier": "Balaji Wholesalers",
            "expiry_date": (now + timedelta(days=240)).strftime("%Y-%m-%d"),
        },
        # Dairy & Bakery
        {
            "name": "Amul Pasteurised Butter 500g",
            "sku": "DRY-BUT-008",
            "barcode": "8901262010012",
            "category": "Dairy & Bread",
            "purchase_cost": 248.0,
            "selling_price": 275.0,
            "quantity": 12,
            "min_threshold": 5,
            "unit": "pack",
            "supplier": "Amul City Agency",
            "expiry_date": (now + timedelta(days=25)).strftime("%Y-%m-%d"),  # EXPIRING SOON
        },
        {
            "name": "Amul Taaza Homogenised Toned Milk 1L",
            "sku": "DRY-MLK-009",
            "barcode": "8901262011033",
            "category": "Dairy & Bread",
            "purchase_cost": 64.0,
            "selling_price": 72.0,
            "quantity": 30,
            "min_threshold": 15,
            "unit": "tetrapack",
            "supplier": "Amul City Agency",
            "expiry_date": (now + timedelta(days=40)).strftime("%Y-%m-%d"),  # EXPIRING SOON
        },
        {
            "name": "Britannia 100% Whole Wheat Bread 400g",
            "sku": "BKR-BRD-010",
            "barcode": "8901063012010",
            "category": "Dairy & Bread",
            "purchase_cost": 42.0,
            "selling_price": 50.0,
            "quantity": 8,
            "min_threshold": 6,
            "unit": "loaf",
            "supplier": "Britannia Route Van",
            "expiry_date": (now + timedelta(days=4)).strftime("%Y-%m-%d"),  # EXPIRING VERY SOON
        },
        # Snacks & Biscuits
        {
            "name": "Maggi 2-Minute Masala Instant Noodles 280g (Pack of 4)",
            "sku": "SNK-MGI-011",
            "barcode": "8901058857725",
            "category": "Snacks & Biscuits",
            "purchase_cost": 50.0,
            "selling_price": 58.0,
            "quantity": 45,
            "min_threshold": 15,
            "unit": "pack",
            "supplier": "Nestle Distributor",
            "expiry_date": (now + timedelta(days=150)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Parle-G Gluco Biscuits 800g Super Saver",
            "sku": "SNK-PRL-012",
            "barcode": "8901719101019",
            "category": "Snacks & Biscuits",
            "purchase_cost": 72.0,
            "selling_price": 85.0,
            "quantity": 25,
            "min_threshold": 10,
            "unit": "family pack",
            "supplier": "Balaji Wholesalers",
            "expiry_date": (now + timedelta(days=180)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Haldiram's Nagpur Aloo Bhujia 400g",
            "sku": "SNK-HLD-013",
            "barcode": "8904063201402",
            "category": "Snacks & Biscuits",
            "purchase_cost": 96.0,
            "selling_price": 115.0,
            "quantity": 3,  # LOW STOCK
            "min_threshold": 8,
            "unit": "pouch",
            "supplier": "Haldiram Distribution",
            "expiry_date": (now + timedelta(days=120)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Kurkure Masala Munch Crispy Namkeen 90g",
            "sku": "SNK-KRK-014",
            "barcode": "8901491101235",
            "category": "Snacks & Biscuits",
            "purchase_cost": 17.0,
            "selling_price": 20.0,
            "quantity": 50,
            "min_threshold": 15,
            "unit": "pack",
            "supplier": "PepsiCo Foods Agency",
            "expiry_date": (now + timedelta(days=90)).strftime("%Y-%m-%d"),
        },
        # Spices & Masalas
        {
            "name": "Everest Garam Masala 100g Carton",
            "sku": "SPC-EVR-015",
            "barcode": "8901786101110",
            "category": "Spices & Masalas",
            "purchase_cost": 78.0,
            "selling_price": 94.0,
            "quantity": 16,
            "min_threshold": 6,
            "unit": "box",
            "supplier": "Everest Spices Hub",
            "expiry_date": (now + timedelta(days=365)).strftime("%Y-%m-%d"),
        },
        {
            "name": "MDH Deggi Mirch Red Pepper Powder 100g",
            "sku": "SPC-MDH-016",
            "barcode": "8902167000109",
            "category": "Spices & Masalas",
            "purchase_cost": 76.0,
            "selling_price": 92.0,
            "quantity": 19,
            "min_threshold": 6,
            "unit": "box",
            "supplier": "Everest Spices Hub",
            "expiry_date": (now + timedelta(days=365)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Tata Tea Gold Fine Blend 500g",
            "sku": "BEV-TTG-017",
            "barcode": "8901058842103",
            "category": "Beverages",
            "purchase_cost": 290.0,
            "selling_price": 335.0,
            "quantity": 14,
            "min_threshold": 5,
            "unit": "pack",
            "supplier": "Tata Consumer Wholesale",
            "expiry_date": (now + timedelta(days=270)).strftime("%Y-%m-%d"),
        },
        # Cleaning & Personal Care
        {
            "name": "Surf Excel Easy Wash Detergent Powder 1kg",
            "sku": "CLN-SRF-018",
            "barcode": "8901030733010",
            "category": "Personal & Home Care",
            "purchase_cost": 132.0,
            "selling_price": 150.0,
            "quantity": 20,
            "min_threshold": 8,
            "unit": "pouch",
            "supplier": "HUL Depot Agency",
            "expiry_date": (now + timedelta(days=730)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Vim Lemon Dishwash Gel 500ml",
            "sku": "CLN-VIM-019",
            "barcode": "8901030800101",
            "category": "Personal & Home Care",
            "purchase_cost": 105.0,
            "selling_price": 125.0,
            "quantity": 15,
            "min_threshold": 6,
            "unit": "bottle",
            "supplier": "HUL Depot Agency",
            "expiry_date": (now + timedelta(days=540)).strftime("%Y-%m-%d"),
        },
        {
            "name": "Dettol Original Germ Protection Soap 125g (Pack of 3)",
            "sku": "PRS-DTL-020",
            "barcode": "8901396340128",
            "category": "Personal & Home Care",
            "purchase_cost": 145.0,
            "selling_price": 170.0,
            "quantity": 2,  # LOW STOCK
            "min_threshold": 6,
            "unit": "pack",
            "supplier": "Reckitt Benckiser Hub",
            "expiry_date": (now + timedelta(days=500)).strftime("%Y-%m-%d"),
        },
    ]

    created_products = []
    for p_data in products_data:
        p = Product(**p_data)
        db.add(p)
        created_products.append(p)
    db.commit()

    # 3. Customers (Udhar Khata Accounts)
    customers_data = [
        {
            "name": "Ramesh Kumar",
            "phone": "9876543210",
            "address": "Flat 203, Shanti Niketan Apts",
            "credit_limit": 5000.0,
            "current_balance": 1450.0,
            "trust_tier": "Trusted",
            "notes": "Regular neighbor customer. Always clears balance before month-end."
        },
        {
            "name": "Sharma Ji (Teacher)",
            "phone": "9876543211",
            "address": "H.No 4-12, Near Shiv Mandir",
            "credit_limit": 10000.0,
            "current_balance": 820.0,
            "trust_tier": "Trusted",
            "notes": "Government school headmaster. High credit limit approved."
        },
        {
            "name": "Gupta Sweets & Catering",
            "phone": "9876543212",
            "address": "Shop #8, Sweets Lane",
            "credit_limit": 15000.0,
            "current_balance": 3800.0,
            "trust_tier": "Standard",
            "notes": "Bulk sugar & maida buyer. Pays strictly between 8th to 12th of each month."
        },
        {
            "name": "Pooja Patel",
            "phone": "9876543213",
            "address": "Plot 45, Green Park Colony",
            "credit_limit": 4000.0,
            "current_balance": 0.0,
            "trust_tier": "Trusted",
            "notes": "Zero pending balance. Pays instantly via UPI QR."
        },
        {
            "name": "Vikram Singh",
            "phone": "9876543214",
            "address": "Room 12, Chawl #3",
            "credit_limit": 2500.0,
            "current_balance": 2400.0,
            "trust_tier": "Caution",
            "notes": "Delayed payment by 40+ days last season. Restrict further credit."
        },
        {
            "name": "Sunil Verma (Auto Driver)",
            "phone": "9876543215",
            "address": "Quarter 18, Transport Nagar",
            "credit_limit": 3000.0,
            "current_balance": 650.0,
            "trust_tier": "Standard",
            "notes": "Pays in weekly installments of Rs 200 - 300 in cash."
        },
        {
            "name": "Anil Yadav (Hostel PG)",
            "phone": "9876543216",
            "address": "Sai Boys Hostel, 3rd Floor",
            "credit_limit": 4000.0,
            "current_balance": 1950.0,
            "trust_tier": "Standard",
            "notes": "Student room credit. Settles balance when parental allowance arrives."
        }
    ]

    created_customers = []
    for c_data in customers_data:
        c = Customer(**c_data)
        db.add(c)
        created_customers.append(c)
    db.commit()

    # 4. Initial Credit Ledger Entries for Customers with balances
    for cust in created_customers:
        if cust.current_balance > 0:
            ledger = CreditLedger(
                customer_id=cust.id,
                transaction_type="UDHAR",
                amount=cust.current_balance,
                balance_after=cust.current_balance,
                payment_mode="CREDIT_SALE",
                notes="Initial monthly grocery purchases",
                created_at=now - timedelta(days=random.randint(2, 10))
            )
            db.add(ledger)
    db.commit()

    # 5. Realistic Past Sales (Last 14 Days)
    payment_methods = ["UPI", "CASH", "UPI", "UPI", "CASH", "CREDIT"]
    total_sales_created = 0

    for day_offset in range(14, -1, -1):
        sale_date = now - timedelta(days=day_offset, hours=random.randint(1, 8), minutes=random.randint(10, 50))
        sales_today = random.randint(3, 6)

        for s_idx in range(sales_today):
            inv_no = f"INV-{(1000 + total_sales_created):05d}"
            pm = random.choice(payment_methods)
            selected_customer = None

            if pm == "CREDIT":
                selected_customer = random.choice([c for c in created_customers if c.name in ["Ramesh Kumar", "Sharma Ji (Teacher)", "Gupta Sweets & Catering"]])
                cust_name = selected_customer.name
                cust_id = selected_customer.id
            else:
                cust_name = random.choice(["Walk-in Customer", "Local Resident", "Office Commuter", "Student PG"])
                cust_id = None

            # Pick 1 to 4 items
            chosen_products = random.sample(created_products, k=random.randint(1, 3))
            subtotal = 0.0
            total_cost = 0.0
            items_to_add = []

            for cp in chosen_products:
                qty = random.randint(1, 2)
                item_tot = cp.selling_price * qty
                item_cst = cp.purchase_cost * qty
                item_prf = item_tot - item_cst
                subtotal += item_tot
                total_cost += item_cst

                items_to_add.append({
                    "product_id": cp.id,
                    "product_name": cp.name,
                    "sku": cp.sku,
                    "unit": cp.unit,
                    "unit_cost": cp.purchase_cost,
                    "unit_price": cp.selling_price,
                    "quantity": qty,
                    "total_amount": item_tot,
                    "total_profit": item_prf
                })

            gross_profit = subtotal - total_cost

            sale = Sale(
                invoice_no=inv_no,
                customer_id=cust_id,
                customer_name=cust_name,
                payment_method=pm,
                subtotal=round(subtotal, 2),
                discount_amount=0.0,
                tax_amount=0.0,
                total_amount=round(subtotal, 2),
                total_cost=round(total_cost, 2),
                gross_profit=round(gross_profit, 2),
                notes=f"Counter checkout via {pm}",
                created_at=sale_date
            )
            db.add(sale)
            db.flush()

            for itm in items_to_add:
                s_item = SaleItem(sale_id=sale.id, **itm)
                db.add(s_item)

            total_sales_created += 1

    db.commit()

    # 6. Pre-seed Hindsight Memory Bank
    print("Pre-seeding Hindsight Long-Term Memory Bank...")
    hindsight_memories = [
        {
            "content": "Customer Ramesh Kumar was granted Rs 1,800 festival credit on Dhanteras; he cleared the entire balance in cash within 4 days before Bhai Dooj without requiring any reminder.",
            "tags": ["credit", "customer_repayment", "festival", "ramesh_kumar"],
            "context": "Customer Credit History"
        },
        {
            "content": "Aashirvaad Atta 10kg experienced a severe stockout 3 days prior to Diwali last year when 40 bags sold out in 48 hours; Laxmi Traders wholesale took 5 days to deliver the emergency restock leading to Rs 18,000 lost sales.",
            "tags": ["stockout", "demand_surge", "atta", "supplier_delay", "festival"],
            "context": "Inventory Replenishment Milestone"
        },
        {
            "content": "Wholesaler Balaji Wholesale increased Fortune Sunflower Oil purchase cost from Rs 112 to Rs 124 per litre during the monsoon port supply delay; shop selling price was adjusted to Rs 138 maintaining a 10.1% margin without customer resistance.",
            "tags": ["supplier_pricing", "sunflower_oil", "margin_protection", "inflation"],
            "context": "Procurement & Pricing Strategy"
        },
        {
            "content": "Customer Vikram Singh delayed his Rs 2,400 udhar payment by 42 days citing personal emergency; required 3 WhatsApp reminders and personal follow-up before paying 50% partial amount. Credit limit capped at Rs 2,500.",
            "tags": ["credit_risk", "udhar_default", "vikram_singh", "caution"],
            "context": "Credit Risk Assessment"
        },
        {
            "content": "Haldiram Bhujia 400g and Kurkure sales doubled during cricket match weekends; counter placement directly next to the billing desk boosted impulse purchases by 42%.",
            "tags": ["merchandising", "snacks", "impulse_sales", "weekend_trend"],
            "context": "Merchandising & Sales Velocity"
        },
        {
            "content": "Britannia Whole Wheat bread batches delivered on Thursday evenings had higher return rates (12%) due to weekend closing of nearby PG hostels; reduced Thursday reorder from 30 loaves to 18 loaves eliminating waste.",
            "tags": ["perishable", "bread", "waste_reduction", "pg_hostels"],
            "context": "Expiry & Perishable Inventory"
        },
        {
            "content": "Gupta Sweets & Catering purchases 50kg Sugar and 10kg Maida on monthly credit around the 1st of every month and pays strictly via UPI on the 10th after their catering client invoices clear.",
            "tags": ["b2b_customer", "gupta_sweets", "sugar", "upi_settlement"],
            "context": "Institutional Customer Cycle"
        },
        {
            "content": "During intense summer heat in May, demand for Amul Masti Dahi and cold beverages surged by 65%; refrigerator showcase cooling capacity had to be maximized to avoid curd spoiling.",
            "tags": ["seasonal_surge", "dairy", "dahi", "refrigeration"],
            "context": "Seasonal Climate Impact"
        }
    ]

    for mem in hindsight_memories:
        res = hindsight_service.retain(
            content=mem["content"],
            bank_id="dukaansmart-store-1",
            tags=mem["tags"],
            context=mem["context"]
        )
        # Log to memory audit
        audit = MemoryAudit(
            bank_id="dukaansmart-store-1",
            action="RETAIN",
            content_or_query=mem["content"],
            result_summary="Initial seed memory stored in Hindsight bank",
            tags=str(mem["tags"]),
            retrieval_strategy="Multi-Strategy (BM25 + Semantic + Graph + Temporal)"
        )
        db.add(audit)

    db.commit()
    print("Database and Hindsight Memory seeding completed successfully!")
