import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  IndianRupee,
  Layers,
  ArrowUpRight,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';

export const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<{ by_volume: any[]; by_profit: any[] }>({ by_volume: [], by_profit: [] });
  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<number>(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, t, cats, top, pm] = await Promise.all([
        api.getDashboardMetrics(),
        api.getSalesTrends(timeRange),
        api.getCategoryBreakdown(),
        api.getTopProducts(8),
        api.getPaymentMethods()
      ]);
      setMetrics(m);
      setTrends(t);
      setCategories(cats);
      setTopProducts(top);
      setPaymentMethods(pm);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ['#6366F1', '#10B981', '#F43F5E'];

  const paymentChartData = paymentMethods ? [
    { name: 'UPI QR', value: paymentMethods.UPI || 0 },
    { name: 'Counter Cash', value: paymentMethods.CASH || 0 },
    { name: 'Udhar (Credit)', value: paymentMethods.CREDIT || 0 },
  ] : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Retail Financial Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Exact profit calculations, inventory turnover, and sales velocity derived from real SQLite transaction records.
          </p>
        </div>

        {/* Date Filter Range */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-subtle self-start sm:self-auto">
          {[
            { label: '7 Days', days: 7 },
            { label: '14 Days', days: 14 },
            { label: '30 Days', days: 30 },
          ].map(r => (
            <button
              key={r.days}
              onClick={() => setTimeRange(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === r.days
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Total Net Revenue</p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            ₹{metrics?.total_revenue_all_time.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{metrics?.total_sales_count_all_time} total recorded bills</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Gross Profit (Real Margin)</p>
          <p className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            ₹{metrics?.estimated_gross_profit_all_time.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Average margin ~{metrics && metrics.total_revenue_all_time > 0 ? ((metrics.estimated_gross_profit_all_time / metrics.total_revenue_all_time) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Inventory At Cost</p>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            ₹{metrics?.total_inventory_cost_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Procurement capital committed</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Credit In Market (Udhar)</p>
          <p className="text-xl font-extrabold text-rose-600 font-mono mt-1">
            ₹{metrics?.outstanding_credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Customer receivables pending</p>
        </div>
      </div>

      {/* Main Charts: Category Valuation Bar Chart + Payment Method Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory Valuation by Category</h3>
              <p className="text-xs text-slate-500">Total working capital tied in stock per category</p>
            </div>
            <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
              {categories.length} Categories
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Stock Value']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="inventory_value" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Pie Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment Tender Share</h3>
            <p className="text-xs text-slate-500">Total volume split across payment modes</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {paymentChartData.map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                  <span className="text-slate-600 font-medium">{p.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  ₹{p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highest Gross Profit Products */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Highest Gross-Profit Products</h3>
            <p className="text-xs text-slate-500">Products that generated the most net profit for your shop</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
                <th className="py-2.5 px-3 text-right">Total Gross Profit</th>
                <th className="py-2.5 px-3 text-center">Profit Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {topProducts.by_profit.map((p, idx) => {
                const totalStoreProfit = metrics?.estimated_gross_profit_all_time || 1;
                const sharePct = ((p.profit / totalStoreProfit) * 100).toFixed(1);

                return (
                  <tr key={idx} className="hover:bg-stone-50/60">
                    <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{p.units}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{p.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700">
                      +₹{p.profit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                        {sharePct}% of total profit
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
