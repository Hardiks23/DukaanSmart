from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    category: str
    purchase_cost: float = Field(ge=0.0)
    selling_price: float = Field(ge=0.0)
    quantity: int = Field(ge=0)
    min_threshold: int = Field(ge=0, default=5)
    unit: str = "packet"
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    purchase_cost: Optional[float] = None
    selling_price: Optional[float] = None
    quantity: Optional[int] = None
    min_threshold: Optional[int] = None
    unit: Optional[str] = None
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None
    is_active: Optional[bool] = None

class ProductStockAdjust(BaseModel):
    adjustment: int  # positive to add, negative to subtract
    reason: Optional[str] = "Manual inventory adjustment"

class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    margin_percentage: Optional[float] = None
    stock_value: Optional[float] = None

    class Config:
        from_attributes = True

# --- CUSTOMER & CREDIT SCHEMAS ---
class CustomerBase(BaseModel):
    name: str
    phone: str
    address: Optional[str] = None
    credit_limit: float = 5000.0
    trust_tier: str = "Standard"
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    initial_balance: Optional[float] = 0.0

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: Optional[float] = None
    trust_tier: Optional[str] = None
    notes: Optional[str] = None

class CreditPaymentCreate(BaseModel):
    amount: float = Field(gt=0.0)
    payment_mode: str = "CASH"  # CASH, UPI
    notes: Optional[str] = "Payment received"

class CreditLedgerResponse(BaseModel):
    id: int
    customer_id: int
    transaction_type: str
    amount: float
    balance_after: float
    reference_sale_id: Optional[int] = None
    payment_mode: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerResponse(CustomerBase):
    id: int
    current_balance: float
    created_at: datetime
    ledger_entries: Optional[List[CreditLedgerResponse]] = []

    class Config:
        from_attributes = True

# --- SALES & POS SCHEMAS ---
class CartItemInput(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    discount: Optional[float] = 0.0

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = "Walk-in Customer"
    payment_method: str = "CASH"  # CASH, UPI, CREDIT
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    notes: Optional[str] = None
    items: List[CartItemInput]

class SaleItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    sku: str
    unit: str
    unit_cost: float
    unit_price: float
    quantity: int
    total_amount: float
    total_profit: float

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: int
    invoice_no: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    payment_method: str
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    gross_profit: float
    notes: Optional[str] = None
    created_at: datetime
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True

# --- HINDSIGHT MEMORY SCHEMAS ---
class MemoryRetainRequest(BaseModel):
    bank_id: Optional[str] = None
    content: str
    context: Optional[str] = "Kirana Business Event"
    tags: Optional[List[str]] = []
    entities: Optional[List[Dict[str, str]]] = None

class MemoryRecallRequest(BaseModel):
    bank_id: Optional[str] = None
    query: str
    budget: Optional[str] = "mid"  # low, mid, high
    tags: Optional[List[str]] = None

class MemoryReflectRequest(BaseModel):
    bank_id: Optional[str] = None
    query: str
    budget: Optional[str] = "low"  # low, mid, high

class MemoryItemResponse(BaseModel):
    id: str
    text: str
    type: Optional[str] = "fact"
    score: Optional[float] = 1.0
    strategy: Optional[str] = "Semantic + BM25 + Graph + Temporal"
    timestamp: Optional[str] = None
    entities: Optional[List[str]] = []
    tags: Optional[List[str]] = []

class MemoryRecallResultResponse(BaseModel):
    query: str
    total_memories: int
    results: List[MemoryItemResponse]
    retrieval_strategies: List[str] = ["Semantic Similarity", "Keyword (BM25)", "Graph Traversal", "Temporal Reasoning"]
    source: str = "hindsight"

class MemoryAuditResponse(BaseModel):
    id: int
    bank_id: str
    action: str
    content_or_query: str
    result_summary: Optional[str] = None
    retrieval_strategy: Optional[str] = None
    entities: Optional[str] = None
    tags: Optional[str] = None
    scores: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# --- AI ASSISTANT SCHEMAS ---
class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    include_hindsight: bool = True
    bank_id: Optional[str] = None

class MemoryCitation(BaseModel):
    id: str
    text: str
    relevance_score: float
    strategy_used: str
    influence: str

class ChatResponse(BaseModel):
    reply: str
    recalled_memories: List[MemoryCitation] = []
    reasoning_summary: Optional[str] = None
    hindsight_mode: str = "local_engine"  # live_cloud or local_engine
    actions_suggested: Optional[List[str]] = []

# --- DASHBOARD SCHEMAS ---
class DashboardMetrics(BaseModel):
    today_revenue: float
    today_sales_count: int
    today_profit: float
    total_revenue_all_time: float
    total_sales_count_all_time: float
    estimated_gross_profit_all_time: float
    total_inventory_value: float
    low_stock_count: int
    expiring_soon_count: int
    outstanding_credit: float
    total_customers: int
    hindsight_memory_count: int
    hindsight_mode: str  # "live" or "local"

# --- SETTINGS SCHEMAS ---
class ShopProfileUpdate(BaseModel):
    shop_name: Optional[str] = None
    tagline: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    upi_id: Optional[str] = None
    gstin: Optional[str] = None
    hindsight_bank_id: Optional[str] = None
    hindsight_api_key: Optional[str] = None
    hindsight_base_url: Optional[str] = None
    groq_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    is_live_hindsight: Optional[bool] = None

class ShopProfileResponse(BaseModel):
    shop_name: str
    tagline: str
    owner_name: str
    phone: str
    address: str
    upi_id: str
    gstin: str
    hindsight_bank_id: str
    hindsight_api_key: Optional[str] = None
    hindsight_base_url: str
    groq_api_key: Optional[str] = None
    llm_model: str
    is_live_hindsight: bool

    class Config:
        from_attributes = True
