import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  TrendingUp,
  X,
  Check,
  RotateCcw,
  PackagePlus,
  IndianRupee
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterType, setFilterType] = useState('all'); // all, low_stock, expiring, out_of_stock

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Wholesale delivery arrival');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Staples & Grains',
    purchase_cost: 0,
    selling_price: 0,
    quantity: 10,
    min_threshold: 5,
    unit: 'packet',
    supplier: '',
    expiry_date: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [search, selectedCategory, filterType]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(search, selectedCategory, filterType);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.getProductCategories();
      setCategories(['All', ...cats]);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    try {
      await api.adjustStock(adjustingProduct.id, adjustmentAmount, adjustmentReason);
      setAdjustingProduct(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate '${name}'?`)) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category,
      purchase_cost: p.purchase_cost,
      selling_price: p.selling_price,
      quantity: p.quantity,
      min_threshold: p.min_threshold,
      unit: p.unit,
      supplier: p.supplier || '',
      expiry_date: p.expiry_date || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: '',
      category: 'Staples & Grains',
      purchase_cost: 0,
      selling_price: 0,
      quantity: 10,
      min_threshold: 5,
      unit: 'packet',
      supplier: '',
      expiry_date: ''
    });
  };

  const totalStockValue = products.reduce((acc, p) => acc + (p.quantity * p.purchase_cost), 0);
  const totalRetailValue = products.reduce((acc, p) => acc + (p.quantity * p.selling_price), 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kirana Inventory Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete catalogue with batch expiry monitoring, margin tracking, and automated Hindsight restock logging.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingProduct(null); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Products Catalogued</p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">{products.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {categories.length - 1} categories</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Cost Valuation</p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            ₹{totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Procurement capital deployed</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Retail Potential</p>
          <p className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            ₹{totalRetailValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            +₹{(totalRetailValue - totalStockValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })} gross margin
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Attention Needed</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {products.filter(p => p.quantity <= p.min_threshold).length} Low Stock
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Safety buffers breached</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or barcode (e.g. Atta, Oil, 890103...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Stock Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'low_stock', label: '⚠️ Low Stock' },
              { id: 'expiring', label: '⏳ Expiring Soon' },
              { id: 'out_of_stock', label: 'Out of Stock' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-stone-100 text-slate-600 hover:bg-stone-200/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Category:</span>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === c
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/90 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4">Batch Expiry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading inventory records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products matched your search or filter.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.quantity <= p.min_threshold;
                  const isOut = p.quantity === 0;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {p.sku} {p.barcode ? `• Barcode: ${p.barcode}` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                        ₹{p.purchase_cost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{p.selling_price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (p.margin_percentage || 0) > 15 ? 'bg-emerald-50 text-emerald-700' :
                          (p.margin_percentage || 0) > 8 ? 'bg-indigo-50 text-indigo-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {p.margin_percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-bold text-xs ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {p.quantity} {p.unit}s
                          </span>
                          {isLow && (
                            <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 rounded mt-0.5">
                              Min {p.min_threshold}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.expiry_date ? (
                          <div className="text-[11px] text-slate-600">
                            <span>{p.expiry_date}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setAdjustingProduct(p); setAdjustmentAmount(10); }}
                            title="Adjust Stock / Record Delivery"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            title="Edit Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-100 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Deactivate"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200/90 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Kirana Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Brand & Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aashirvaad Shudh Chakki Atta 10kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode / EAN (Optional)</label>
                  <input
                    type="text"
                    placeholder="890103..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-medium"
                  >
                    <option value="Staples & Grains">Staples & Grains</option>
                    <option value="Oils & Ghee">Oils & Ghee</option>
                    <option value="Dairy & Bread">Dairy & Bread</option>
                    <option value="Snacks & Biscuits">Snacks & Biscuits</option>
                    <option value="Spices & Masalas">Spices & Masalas</option>
                    <option value="Personal & Home Care">Personal & Home Care</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-medium"
                  >
                    <option value="packet">Packet</option>
                    <option value="bag">Bag</option>
                    <option value="bottle">Bottle</option>
                    <option value="pouch">Pouch</option>
                    <option value="kg">Kg</option>
                    <option value="litre">Litre</option>
                    <option value="loaf">Loaf</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Threshold Alert</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier / Wholesaler</label>
                  <input
                    type="text"
                    placeholder="e.g. Laxmi Traders Wholesale"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-slate-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                Adjust Inventory Stock: {adjustingProduct.name}
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current On-Hand Stock:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {adjustingProduct.quantity} {adjustingProduct.unit}s
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Stock Change (Positive to add, Negative to deduct)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-500 font-medium">{adjustingProduct.unit}s</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {[+5, +10, +25, +50, -1].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustmentAmount(amt)}
                      className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-slate-700 font-mono text-[11px] font-semibold"
                    >
                      {amt > 0 ? `+${amt}` : amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Note for Hindsight</label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-slate-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm"
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
