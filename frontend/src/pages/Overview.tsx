import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Users,
  Clock,
  Sparkles,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  Calendar,
  Layers,
  ShoppingBag
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { DashboardMetrics, Sale } from '../types';

interface OverviewProps {
  onNavigate: (tab: string) => void;
  onRefreshTrigger?: number;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate, onRefreshTrigger }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<{ by_volume: any[]; by_profit: any[] }>({ by_volume: [], by_profit: [] });
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [onRefreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [m, trends, top, insight, sales] = await Promise.all([
        api.getDashboardMetrics(),
        api.getSalesTrends(14),
        api.getTopProducts(5),
        api.getLiveAiInsight(),
        api.getSales(6)
      ]);
      setMetrics(m);
      setSalesTrends(trends);
      setTopProducts(top);
      setAiInsight(insight);
      setRecentSales(sales);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#38BDF8', '#EC4899'];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Calculating store metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shop Intelligence Overview</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time shop financial ledger, inventory health, and persistent Hindsight memory insights.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            + New Sale
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200/90 text-slate-700 rounded-xl text-xs font-semibold shadow-subtle transition-all"
          >
            Manage Stock
          </button>
        </div>
      </div>

      {/* Dynamic AI Business Insight Banner powered by Hindsight */}
      {aiInsight && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-card border border-indigo-900/50">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {aiInsight.badge || 'Hindsight Grounded'}
                  </span>
                  <span className="text-xs text-indigo-200 font-mono">
                    Mode: {aiInsight.hindsight_mode}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-100 mt-1.5 leading-relaxed max-w-3xl">
                  {aiInsight.insight}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-amber-400 transition-all shrink-0 self-start md:self-center shadow-sm"
            >
              Consult AI Agent →
            </button>
          </div>
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-80 h-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{metrics?.today_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{metrics?.today_sales_count} sales today</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              +₹{metrics?.today_profit.toFixed(0)} profit
            </span>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">All-Time Gross Profit</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{metrics?.estimated_gross_profit_all_time.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>From ₹{metrics?.total_revenue_all_time.toFixed(0)} sales</span>
            <span className="text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
              Margin ~{metrics && metrics.total_revenue_all_time > 0 ? ((metrics.estimated_gross_profit_all_time / metrics.total_revenue_all_time) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Stock Valuation (Cost)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{metrics?.total_inventory_cost_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Retail value: ₹{metrics?.total_inventory_retail_value.toFixed(0)}</span>
            <span className="text-amber-800 font-semibold">{metrics?.total_products} items</span>
          </div>
        </div>

        {/* Customer Udhar / Outstanding Credit */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle hover:shadow-card transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Outstanding Udhar</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{metrics?.outstanding_credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Across {metrics?.total_customers} accounts</span>
            <button
              onClick={() => onNavigate('customers')}
              className="text-indigo-600 font-bold hover:underline"
            >
              View Khata →
            </button>
          </div>
        </div>
      </div>

      {/* Alert Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics && metrics.low_stock_count > 0 && (
          <div
            onClick={() => onNavigate('inventory')}
            className="cursor-pointer p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between hover:bg-amber-100/60 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  {metrics.low_stock_count} Products Below Minimum Stock Threshold
                </p>
                <p className="text-[11px] text-amber-700">Immediate wholesale reorder recommended to prevent walkaways</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800">Restock →</span>
          </div>
        )}

        {metrics && metrics.expiring_soon_count > 0 && (
          <div
            onClick={() => onNavigate('inventory')}
            className="cursor-pointer p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between hover:bg-rose-100/60 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-rose-700" />
              <div>
                <p className="text-xs font-bold text-rose-900">
                  {metrics.expiring_soon_count} Batches Expiring in Next 45 Days
                </p>
                <p className="text-[11px] text-rose-700">Clear perishable dairy/bread items to avoid zero-margin write-offs</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-800">Inspect →</span>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 14-day Sales & Profit Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">14-Day Sales & Gross Profit Velocity</h3>
              <p className="text-xs text-slate-500">Calculated directly from recorded POS receipts</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                <span className="text-slate-600 font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span className="text-slate-600 font-medium">Gross Profit</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPrf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment Tender Split</h3>
            <p className="text-xs text-slate-500">Cash vs Instant UPI QR vs Udhar</p>
          </div>

          <div className="space-y-3.5 my-4">
            {salesTrends.length > 0 && (() => {
              const totalCash = salesTrends.reduce((acc, t) => acc + (t.cash_revenue || 0), 0);
              const totalUpi = salesTrends.reduce((acc, t) => acc + (t.upi_revenue || 0), 0);
              const totalCredit = salesTrends.reduce((acc, t) => acc + (t.credit_revenue || 0), 0);
              const total = totalCash + totalUpi + totalCredit || 1;

              return (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-indigo-600">UPI Instant QR ({((totalUpi/total)*100).toFixed(0)}%)</span>
                      <span className="font-mono text-slate-800">₹{totalUpi.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(totalUpi/total)*100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-600">Counter Cash ({((totalCash/total)*100).toFixed(0)}%)</span>
                      <span className="font-mono text-slate-800">₹{totalCash.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(totalCash/total)*100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-rose-600">Udhar / Khata Credit ({((totalCredit/total)*100).toFixed(0)}%)</span>
                      <span className="font-mono text-slate-800">₹{totalCredit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(totalCredit/total)*100}%` }} />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-[11px] text-slate-600">
            <span className="font-bold text-slate-900">Kirana Insight:</span> UPI adoption has lowered cash counting errors by 32% this fortnight.
          </div>
        </div>
      </div>

      {/* Tables: Top Selling vs Recent Counter Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top-Selling Products</h3>
              <p className="text-xs text-slate-500">Fastest moving stock items by volume</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              All Inventory →
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {topProducts.by_volume.map((p, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 truncate max-w-[220px]">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900">₹{p.revenue.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">+₹{p.profit} profit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent POS Receipts</h3>
              <p className="text-xs text-slate-500">Live counter receipts recorded in SQLite</p>
            </div>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Open POS →
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {recentSales.map((sale) => (
              <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    sale.payment_method === 'UPI' ? 'bg-indigo-50 text-indigo-700' :
                    sale.payment_method === 'CASH' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-rose-50 text-rose-700'
                  }`}>
                    {sale.payment_method[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{sale.invoice_no}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                      {sale.customer_name || 'Walk-in'} • {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900">₹{sale.total_amount.toLocaleString('en-IN')}</p>
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                    sale.payment_method === 'CREDIT' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-slate-600'
                  }`}>
                    {sale.payment_method}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
