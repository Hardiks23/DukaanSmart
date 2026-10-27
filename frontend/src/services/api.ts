import {
  Product,
  Customer,
  Sale,
  DashboardMetrics,
  HindsightStatus,
  MemoryItem,
  ShopProfile,
  ChatMessage
} from '../types';
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const api = {
  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async getSalesTrends(days: number = 14) {
    const res = await fetch(`${API_BASE}/dashboard/sales-trends?days=${days}`);
    if (!res.ok) throw new Error('Failed to load sales trends');
    return res.json();
  },

  async getTopProducts(limit: number = 6) {
    const res = await fetch(`${API_BASE}/dashboard/top-products?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load top products');
    return res.json();
  },

  async getCategoryBreakdown() {
    const res = await fetch(`${API_BASE}/dashboard/category-breakdown`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  async getPaymentMethods() {
    const res = await fetch(`${API_BASE}/dashboard/payment-methods`);
    if (!res.ok) throw new Error('Failed to load payment methods');
    return res.json();
  },

  async getLiveAiInsight() {
    const res = await fetch(`${API_BASE}/dashboard/ai-insight`);
    if (!res.ok) throw new Error('Failed to load AI insight');
    return res.json();
  },

  // Products
  async getProducts(search?: string, category?: string, filter_type?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    if (filter_type && filter_type !== 'all') params.append('filter_type', filter_type);

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  async getProductCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/products/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update product');
    }
    return res.json();
  },

  async adjustStock(id: number, adjustment: number, reason: string) {
    const res = await fetch(`${API_BASE}/products/${id}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustment, reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to adjust stock');
    }
    return res.json();
  },

  async deleteProduct(id: number) {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  // Sales & POS
  async getSales(limit: number = 30): Promise<Sale[]> {
    const res = await fetch(`${API_BASE}/sales?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load sales');
    return res.json();
  },

  async createSale(saleData: any): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to process checkout');
    }
    return res.json();
  },

  // Customers & Credit
  async getCustomers(search?: string, trust_tier?: string, has_balance_only?: boolean): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (trust_tier && trust_tier !== 'All') params.append('trust_tier', trust_tier);
    if (has_balance_only) params.append('has_balance_only', 'true');

    const res = await fetch(`${API_BASE}/customers?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load customers');
    return res.json();
  },

  async getCustomer(id: number): Promise<Customer> {
    const res = await fetch(`${API_BASE}/customers/${id}`);
    if (!res.ok) throw new Error('Failed to load customer');
    return res.json();
  },

  async createCustomer(data: any): Promise<Customer> {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create customer');
    }
    return res.json();
  },

  async recordCustomerPayment(id: number, amount: number, payment_mode: string, notes?: string): Promise<Customer> {
    const res = await fetch(`${API_BASE}/customers/${id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, payment_mode, notes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to record payment');
    }
    return res.json();
  },

  async getCustomerReminder(id: number) {
    const res = await fetch(`${API_BASE}/customers/${id}/reminder-template`);
    if (!res.ok) throw new Error('Failed to generate reminder');
    return res.json();
  },

  // Hindsight Memory
  async getHindsightStatus(): Promise<HindsightStatus> {
    const res = await fetch(`${API_BASE}/hindsight/status`);
    if (!res.ok) throw new Error('Failed to check Hindsight status');
    return res.json();
  },

  async getHindsightMemories(): Promise<MemoryItem[]> {
    const res = await fetch(`${API_BASE}/hindsight/memories`);
    if (!res.ok) throw new Error('Failed to load memories');
    return res.json();
  },

  async retainMemory(content: string, context?: string, tags?: string[]) {
    const res = await fetch(`${API_BASE}/hindsight/retain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, context, tags })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to retain memory');
    }
    return res.json();
  },

  async recallMemories(query: string, budget: string = 'mid') {
    const res = await fetch(`${API_BASE}/hindsight/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, budget })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to recall memories');
    }
    return res.json();
  },

  async reflectMemories(query: string, budget: string = 'low') {
    const res = await fetch(`${API_BASE}/hindsight/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, budget })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to run reflection');
    }
    return res.json();
  },

  async getMemoryAudits() {
    const res = await fetch(`${API_BASE}/hindsight/audits`);
    if (!res.ok) throw new Error('Failed to load audits');
    return res.json();
  },

  // AI Assistant
  async sendChatMessage(message: string, history: { role: string; content: string }[]) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, include_hindsight: true })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to communicate with AI agent');
    }
    return res.json();
  },

  async getSuggestedPrompts() {
    const res = await fetch(`${API_BASE}/ai/suggested-prompts`);
    if (!res.ok) throw new Error('Failed to load suggested prompts');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<ShopProfile> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(data: Partial<ShopProfile>): Promise<ShopProfile> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update settings');
    }
    return res.json();
  },

  async testHindsightConnection() {
    const res = await fetch(`${API_BASE}/settings/test-hindsight`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to test connection');
    return res.json();
  },

  async resetDemoDatabase() {
    const res = await fetch(`${API_BASE}/settings/reset-database`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  }
};
