import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle2,
  X,
  IndianRupee,
  Phone,
  Copy
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';

export const CustomersCredit: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [paymentNotes, setPaymentNotes] = useState<string>('Counter payment received');

  const [reminderData, setReminderData] = useState<any>(null);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);

  // New Customer Form
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    address: '',
    credit_limit: 5000,
    initial_balance: 0,
    trust_tier: 'Standard' as const,
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
  }, [search, hasBalanceOnly]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers(search, undefined, hasBalanceOnly);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(newCust);
      setShowAddModal(false);
      setNewCust({
        name: '',
        phone: '',
        address: '',
        credit_limit: 5000,
        initial_balance: 0,
        trust_tier: 'Standard',
        notes: ''
      });
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Error creating customer');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    try {
      await api.recordCustomerPayment(
        paymentCustomer.id,
        paymentAmount,
        paymentMode,
        paymentNotes
      );
      setPaymentCustomer(null);
      loadCustomers();
      if (selectedLedgerCustomer && selectedLedgerCustomer.id === paymentCustomer.id) {
        // Refresh ledger view
        const refreshed = await api.getCustomer(paymentCustomer.id);
        setSelectedLedgerCustomer(refreshed);
      }
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  };

  const handleOpenReminder = async (customer: Customer) => {
    try {
      const rem = await api.getCustomerReminder(customer.id);
      setReminderData(rem);
    } catch (err) {
      alert('Failed to generate reminder');
    }
  };

  const handleViewLedger = async (customer: Customer) => {
    try {
      const full = await api.getCustomer(customer.id);
      setSelectedLedgerCustomer(full);
    } catch (err) {
      alert('Failed to load ledger history');
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + c.current_balance, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Udhar Khata & Credit Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">
            Indian Kirana credit bookkeeping with WhatsApp reminders, trust ratings, and Hindsight repayment tracking.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Khata Account</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Total Outstanding Udhar (Market Credit)</p>
          <p className="text-2xl font-extrabold text-rose-600 font-mono mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {customers.filter(c => c.current_balance > 0).length} active debtors</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Total Khata Accounts</p>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{customers.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {customers.filter(c => c.trust_tier === 'Trusted').length} Trusted • {customers.filter(c => c.trust_tier === 'Caution').length} Caution
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle">
          <p className="text-xs font-semibold text-slate-500">Credit Health & Recovery</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Hindsight Memory Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Repayment cycles automatically logged</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setHasBalanceOnly(!hasBalanceOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              hasBalanceOnly
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-stone-100 text-slate-600 hover:bg-stone-200/70'
            }`}
          >
            {hasBalanceOnly ? 'Showing: Pending Balance Only' : 'Show All Accounts'}
          </button>
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/90 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone & Address</th>
                <th className="py-3 px-4 text-center">Trust Tier</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Current Udhar (Balance)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading Khata accounts...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No customers found.</td>
                </tr>
              ) : (
                customers.map(c => {
                  const hasPending = c.current_balance > 0;
                  const limitUsagePct = Math.min(100, (c.current_balance / c.credit_limit) * 100);

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          {c.notes && (
                            <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">{c.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                        {c.address && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">{c.address}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.trust_tier === 'Trusted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          c.trust_tier === 'Caution' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                          'bg-stone-100 text-slate-700'
                        }`}>
                          {c.trust_tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-medium">
                        ₹{c.credit_limit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div>
                          <span className={`font-bold text-sm ${hasPending ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ₹{c.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          {hasPending && (
                            <div className="w-20 ml-auto bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  limitUsagePct > 80 ? 'bg-rose-500' : limitUsagePct > 50 ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${limitUsagePct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Payment (JAMA) */}
                          <button
                            onClick={() => {
                              setPaymentCustomer(c);
                              setPaymentAmount(c.current_balance);
                              setPaymentNotes('Cash settlement on counter');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 transition-all"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Jama</span>
                          </button>

                          {/* WhatsApp Reminder */}
                          {hasPending && (
                            <button
                              onClick={() => handleOpenReminder(c)}
                              title="Send WhatsApp Reminder"
                              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-[11px] flex items-center gap-1 transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Remind</span>
                            </button>
                          )}

                          {/* View Ledger History */}
                          <button
                            onClick={() => handleViewLedger(c)}
                            title="View Full Khata Ledger"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition-all"
                          >
                            <History className="w-4 h-4" />
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

      {/* RECORD PAYMENT (JAMA) MODAL */}
      {paymentCustomer && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Record Payment (Jama): {paymentCustomer.name}
              </h3>
              <button onClick={() => setPaymentCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pending Udhar Balance:</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  ₹{paymentCustomer.current_balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={paymentCustomer.current_balance}
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold text-slate-900 text-sm"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(paymentCustomer.current_balance)}
                    className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]"
                  >
                    Clear Full Balance (₹{paymentCustomer.current_balance})
                  </button>
                  {paymentCustomer.current_balance > 500 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(500)}
                      className="px-2 py-1 rounded bg-stone-100 text-slate-700 font-semibold text-[11px]"
                    >
                      ₹500 Partial
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {['UPI', 'CASH'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMode(m)}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        paymentMode === m
                          ? 'bg-slate-900 text-white'
                          : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Hindsight Memory Context</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-slate-600 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Confirm Jama (₹{paymentAmount.toFixed(0)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP REMINDER MODAL */}
      {reminderData && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Payment Reminder</span>
              </h3>
              <button onClick={() => setReminderData(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Generated Polite Reminder Message:</label>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-[11px]">
                  {reminderData.message}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={reminderData.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open in WhatsApp</span>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reminderData.message);
                    alert('Reminder copied to clipboard!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-slate-700 hover:bg-stone-50 flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER LEDGER HISTORY DRAWER / MODAL */}
      {selectedLedgerCustomer && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedLedgerCustomer.name}'s Khata Ledger
                </h3>
                <p className="text-[11px] text-slate-400">
                  Phone: {selectedLedgerCustomer.phone} • Limit: ₹{selectedLedgerCustomer.credit_limit}
                </p>
              </div>
              <button onClick={() => setSelectedLedgerCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3 p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-600 font-medium">Current Outstanding Balance:</span>
              <span className="font-mono font-extrabold text-rose-600 text-base">
                ₹{selectedLedgerCustomer.current_balance.toFixed(2)}
              </span>
            </div>

            {/* Ledger Transactions */}
            <div className="overflow-y-auto flex-1 divide-y divide-stone-100 pr-1 text-xs">
              {selectedLedgerCustomer.ledger_entries && selectedLedgerCustomer.ledger_entries.length > 0 ? (
                selectedLedgerCustomer.ledger_entries.map((entry) => (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        entry.transaction_type === 'UDHAR' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {entry.transaction_type === 'UDHAR' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {entry.transaction_type === 'UDHAR' ? 'Purchase on Udhar' : 'Payment Received (Jama)'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {entry.notes || entry.payment_mode} • {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${
                        entry.transaction_type === 'UDHAR' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {entry.transaction_type === 'UDHAR' ? '+' : '-'}₹{entry.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Bal: ₹{entry.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No prior transactions found in this ledger account.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 text-right shrink-0">
              <button
                onClick={() => setSelectedLedgerCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Open New Khata Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number (10 digits) *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="Flat #, Colony or Market stall"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCust.credit_limit}
                    onChange={(e) => setNewCust({ ...newCust, credit_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trust Rating</label>
                  <select
                    value={newCust.trust_tier}
                    onChange={(e: any) => setNewCust({ ...newCust, trust_tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-semibold"
                  >
                    <option value="Trusted">Trusted</option>
                    <option value="Standard">Standard</option>
                    <option value="Caution">Caution</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Regular neighbor, clears monthly"
                  value={newCust.notes}
                  onChange={(e) => setNewCust({ ...newCust, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
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
                  Open Khata Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
