import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  IndianRupee,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  User,
  CheckCircle2,
  Printer,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Product, Customer, CartItem, Sale } from '../types';

interface POSProps {
  onSaleCompleted?: () => void;
}

export const POS: React.FC<POSProps> = ({ onSaleCompleted }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CREDIT'>('UPI');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Completed Sale & Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, custs, cats] = await Promise.all([
        api.getProducts(search, selectedCategory),
        api.getCustomers(),
        api.getProductCategories()
      ]);
      setProducts(prods);
      setCustomers(custs);
      setCategories(['All', ...cats]);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert(`Cannot add '${product.name}' — out of stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert(`Only ${product.quantity} units available in stock.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.quantity) {
              alert(`Only ${item.product.quantity} units available.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod('UPI');
    setCashTendered(0);
    setDiscountAmount(0);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const cashChange = cashTendered > grandTotal ? cashTendered - grandTotal : 0;

  // Credit limit validation
  const isCreditExceeded =
    paymentMethod === 'CREDIT' &&
    selectedCustomer &&
    (selectedCustomer.current_balance + grandTotal > selectedCustomer.credit_limit);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty.');
      return;
    }

    if (paymentMethod === 'CREDIT' && !selectedCustomer) {
      alert('Please select a customer for Credit (Udhar) sale.');
      return;
    }

    if (isCreditExceeded) {
      alert(`Credit limit exceeded for ${selectedCustomer?.name}. Available credit limit: ₹${(selectedCustomer!.credit_limit - selectedCustomer!.current_balance).toFixed(2)}`);
      return;
    }

    try {
      setProcessing(true);
      const salePayload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        customer_name: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        payment_method: paymentMethod,
        discount_amount: discountAmount,
        tax_amount: 0.0,
        notes: notes || `POS checkout via ${paymentMethod}`,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          discount: item.discount || 0
        }))
      };

      const sale = await api.createSale(salePayload);
      setCompletedSale(sale);
      setShowReceiptModal(true);

      // Trigger celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      clearCart();
      loadData();
      if (onSaleCompleted) onSaleCompleted();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>POS Billing Counter</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
              Live Counter Active
            </span>
          </h2>
          <p className="text-xs text-slate-500">Fast barcode lookup, instant UPI QR generation, and Khatabook Udhar linkage.</p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 font-bold hover:underline"
          >
            Clear Cart ({cart.length} items)
          </button>
        )}
      </div>

      {/* Main Grid: Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* LEFT: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-stone-200/80 shadow-subtle overflow-hidden">
          {/* Search & Category Header */}
          <div className="p-3.5 border-b border-stone-100 space-y-2.5 shrink-0 bg-stone-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by brand, name, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === c
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-stone-200/90 text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="p-3.5 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
            {products.map(p => {
              const inCart = cart.find(c => c.product.id === p.id);
              const isOut = p.quantity <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all select-none relative ${
                    isOut
                      ? 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                      : inCart
                      ? 'bg-indigo-50/50 border-indigo-300 shadow-xs cursor-pointer hover:border-indigo-400'
                      : 'bg-white border-stone-200/80 hover:border-slate-300 hover:shadow-subtle cursor-pointer'
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {inCart.quantity}
                    </span>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block truncate">{p.category}</span>
                    <p className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 mt-0.5">{p.name}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      ₹{p.selling_price.toFixed(0)}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      p.quantity <= 5 ? 'text-amber-600 font-bold' : 'text-slate-400'
                    }`}>
                      {p.quantity} {p.unit}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Cart Drawer & Checkout (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-stone-200/80 shadow-subtle overflow-hidden">
          {/* Customer Selection Khata Link */}
          <div className="p-3.5 border-b border-stone-100 bg-stone-50/70 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Customer / Khata Account
              </span>
              {selectedCustomer && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Clear (Walk-in)
                </button>
              )}
            </div>
            <select
              value={selectedCustomer ? selectedCustomer.id : ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                const found = customers.find(c => c.id === id) || null;
                setSelectedCustomer(found);
              }}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-slate-900 font-medium"
            >
              <option value="">Walk-in Cash Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) — Udhar: ₹{c.current_balance} / Limit: ₹{c.credit_limit}
                </option>
              ))}
            </select>

            {/* Selected Customer Credit Badge */}
            {selectedCustomer && (
              <div className="mt-2 p-2 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-indigo-900">{selectedCustomer.name}</span>
                  <span className="text-indigo-600 block text-[10px]">
                    Current Udhar: ₹{selectedCustomer.current_balance.toFixed(2)} (Limit: ₹{selectedCustomer.credit_limit.toFixed(2)})
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  selectedCustomer.trust_tier === 'Trusted' ? 'bg-emerald-100 text-emerald-800' :
                  selectedCustomer.trust_tier === 'Caution' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                }`}>
                  {selectedCustomer.trust_tier}
                </span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-3.5 overflow-y-auto flex-1 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <ShoppingCart className="w-8 h-8 text-stone-300 mb-2 stroke-1" />
                <p className="font-medium">Counter cart is empty.</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Click products on the left or scan barcode to add.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      ₹{item.product.selling_price.toFixed(2)} × {item.quantity} = ₹{(item.product.selling_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-6 h-6 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector & Order Summary */}
          <div className="p-4 border-t border-stone-200/90 bg-stone-50/70 space-y-3 shrink-0">
            {/* Payment Method Tabs */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>UPI QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'CREDIT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Udhar</span>
                </button>
              </div>
            </div>

            {/* UPI QR Visualizer */}
            {paymentMethod === 'UPI' && grandTotal > 0 && (
              <div className="p-3 bg-white border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-900">Scan UPI QR to Pay</p>
                  <p className="text-[10px] text-indigo-600 font-mono">dukaansmart@upi</p>
                </div>
                {/* Simulated dynamic QR code preview */}
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white p-1">
                  <QrCode className="w-full h-full text-white" />
                </div>
              </div>
            )}

            {/* Cash Tendered Input */}
            {paymentMethod === 'CASH' && grandTotal > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cash Received (₹)</label>
                  <input
                    type="number"
                    value={cashTendered || ''}
                    placeholder={`Min ₹${grandTotal}`}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Change to Return</label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-stone-100 font-mono font-bold text-slate-800">
                    ₹{cashChange.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Udhar Credit Exceeded Warning */}
            {isCreditExceeded && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-[11px] text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Credit Limit Exceeded!</p>
                  <p>Customer balance will reach ₹{(selectedCustomer!.current_balance + grandTotal).toFixed(2)}, which exceeds their approved limit of ₹{selectedCustomer!.credit_limit.toFixed(2)}.</p>
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="pt-2 border-t border-stone-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Store Discount</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-stone-200">
                <span>Total Bill Amount</span>
                <span className="font-mono text-base text-indigo-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              disabled={cart.length === 0 || processing || Boolean(isCreditExceeded)}
              onClick={handleCheckout}
              className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                cart.length === 0 || Boolean(isCreditExceeded)
                  ? 'bg-stone-300 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
              }`}
            >
              {processing ? (
                <span>Generating Receipt...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Complete Checkout (₹{grandTotal.toFixed(0)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* COMPLETED SALE & PRINTABLE THERMAL RECEIPT MODAL */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sale Successfully Recorded!</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {/* Printable Thermal Receipt Box */}
            <div id="printable-receipt" className="my-4 p-4 bg-stone-50 rounded-xl border border-stone-200 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-stone-300">
                <h4 className="font-extrabold text-sm uppercase">Sharma Kirana Store</h4>
                <p className="text-[10px] text-slate-500">Shop #14, Main Market, Ameerpet, Hyd</p>
                <p className="text-[10px] text-slate-500">GSTIN: 36AAAAA0000A1Z5 • Ph: 9876543210</p>
              </div>

              <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-stone-300">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-bold">{completedSale.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedSale.customer_name || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="font-bold">{completedSale.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{new Date(completedSale.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1 py-1 text-[11px]">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[170px]">{it.quantity}x {it.product_name}</span>
                    <span>₹{it.total_amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-stone-300 text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{completedSale.subtotal.toFixed(2)}</span>
                </div>
                {completedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{completedSale.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-stone-300">
                  <span>TOTAL PAID:</span>
                  <span>₹{completedSale.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                <p>Thank You For Shopping At Sharma Kirana!</p>
                <p className="font-bold text-slate-600">Powered by DukaanSmart & Hindsight AI</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Bill</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-slate-700 text-xs font-semibold hover:bg-stone-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
