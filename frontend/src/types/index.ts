export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  purchase_cost: number;
  selling_price: number;
  quantity: number;
  min_threshold: number;
  unit: string;
  supplier?: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  margin_percentage?: number;
  stock_value?: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  credit_limit: number;
  current_balance: number;
  trust_tier: 'Trusted' | 'Standard' | 'Caution';
  notes?: string;
  created_at: string;
  ledger_entries?: CreditLedgerEntry[];
}

export interface CreditLedgerEntry {
  id: number;
  customer_id: number;
  transaction_type: 'UDHAR' | 'JAMA';
  amount: number;
  balance_after: number;
  reference_sale_id?: number;
  payment_mode: string;
  notes?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface SaleItem {
  id: number;
  product_id?: number;
  product_name: string;
  sku: string;
  unit: string;
  unit_cost: number;
  unit_price: number;
  quantity: number;
  total_amount: number;
  total_profit: number;
}

export interface Sale {
  id: number;
  invoice_no: string;
  customer_id?: number;
  customer_name?: string;
  payment_method: 'CASH' | 'UPI' | 'CREDIT';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  gross_profit: number;
  notes?: string;
  created_at: string;
  items: SaleItem[];
}

export interface DashboardMetrics {
  today_revenue: number;
  today_sales_count: number;
  today_profit: number;
  total_revenue_all_time: number;
  total_sales_count_all_time: number;
  estimated_gross_profit_all_time: number;
  total_inventory_cost_value: number;
  total_inventory_retail_value: number;
  low_stock_count: number;
  expiring_soon_count: number;
  outstanding_credit: number;
  total_customers: number;
  total_products: number;
  hindsight_memory_count: number;
  hindsight_mode: 'live' | 'local';
}

export interface MemoryCitation {
  id: string;
  text: string;
  relevance_score: number;
  strategy_used: string;
  influence: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recalled_memories?: MemoryCitation[];
  reasoning_summary?: string;
  actions_suggested?: string[];
  hindsight_mode?: string;
}

export interface HindsightStatus {
  sdk_installed: boolean;
  is_live: boolean;
  mode: string;
  base_url: string;
  bank_id: string;
  has_api_key: boolean;
  total_local_memories: number;
}

export interface MemoryItem {
  id: string;
  text: string;
  type?: string;
  score?: number;
  strategy?: string;
  timestamp?: string;
  entities?: string[];
  tags?: string[];
  context?: string;
}

export interface ShopProfile {
  shop_name: string;
  tagline: string;
  owner_name: string;
  phone: string;
  address: string;
  upi_id: string;
  gstin: string;
  hindsight_bank_id: string;
  hindsight_api_key?: string;
  hindsight_base_url: string;
  groq_api_key?: string;
  llm_model: string;
  is_live_hindsight: boolean;
}
