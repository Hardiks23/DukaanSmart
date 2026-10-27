import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    barcode = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    purchase_cost = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    quantity = Column(Integer, nullable=False, default=0)
    min_threshold = Column(Integer, nullable=False, default=5)
    unit = Column(String(20), nullable=False, default="packet")
    supplier = Column(String(200), nullable=True)
    expiry_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    sale_items = relationship("SaleItem", back_populates="product")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    phone = Column(String(20), nullable=False, unique=True, index=True)
    address = Column(String(300), nullable=True)
    credit_limit = Column(Float, nullable=False, default=5000.0)
    current_balance = Column(Float, nullable=False, default=0.0)  # Outstanding credit
    trust_tier = Column(String(50), nullable=False, default="Standard")  # Trusted, Standard, Caution
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sales = relationship("Sale", back_populates="customer")
    ledger_entries = relationship("CreditLedger", back_populates="customer", cascade="all, delete-orphan")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(200), nullable=True)
    payment_method = Column(String(50), nullable=False, default="CASH")  # CASH, UPI, CREDIT
    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    total_cost = Column(Float, nullable=False, default=0.0)
    gross_profit = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(200), nullable=False)
    sku = Column(String(100), nullable=False)
    unit = Column(String(20), nullable=False, default="packet")
    unit_cost = Column(Float, nullable=False, default=0.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    quantity = Column(Integer, nullable=False, default=1)
    total_amount = Column(Float, nullable=False, default=0.0)
    total_profit = Column(Float, nullable=False, default=0.0)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")

class CreditLedger(Base):
    __tablename__ = "credit_ledger"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # UDHAR (Debit) or JAMA (Payment Credit)
    amount = Column(Float, nullable=False, default=0.0)
    balance_after = Column(Float, nullable=False, default=0.0)
    reference_sale_id = Column(Integer, nullable=True)
    payment_mode = Column(String(50), nullable=False, default="CASH")  # CASH, UPI, CREDIT_SALE
    notes = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="ledger_entries")

class MemoryAudit(Base):
    """
    Persistent log and audit of memories stored, retrieved, and reflected via Hindsight.
    Provides complete transparency into what Hindsight has retained and recalled.
    """
    __tablename__ = "memory_audits"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(String(100), nullable=False, index=True)
    action = Column(String(20), nullable=False)  # RETAIN, RECALL, REFLECT
    content_or_query = Column(Text, nullable=False)
    result_summary = Column(Text, nullable=True)
    retrieval_strategy = Column(String(150), default="Multi-Strategy (BM25 + Semantic + Graph + Temporal)")
    entities = Column(Text, nullable=True)  # JSON string
    tags = Column(Text, nullable=True)      # JSON string
    scores = Column(Text, nullable=True)    # JSON string
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ShopProfile(Base):
    __tablename__ = "shop_profile"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String(200), default="Sharma Kirana & General Store")
    tagline = Column(String(200), default="A clearer way to run the everyday shop.")
    owner_name = Column(String(200), default="Ramesh Sharma")
    phone = Column(String(50), default="+91 98765 43210")
    address = Column(String(300), default="Shop #14, Main Market, Ameerpet, Hyderabad")
    upi_id = Column(String(100), default="dukaansmart@upi")
    gstin = Column(String(50), default="36AAAAA0000A1Z5")
    hindsight_bank_id = Column(String(100), default="dukaansmart-store-1")
    hindsight_api_key = Column(String(255), default="")
    hindsight_base_url = Column(String(255), default="https://api.hindsight.vectorize.io")
    groq_api_key = Column(String(255), default="")
    llm_model = Column(String(100), default="llama-3.3-70b-versatile")
    is_live_hindsight = Column(Boolean, default=False)
