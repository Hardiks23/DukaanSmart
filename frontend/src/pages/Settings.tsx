import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Cpu,
  Store,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Key,
  ShieldAlert,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { ShopProfile } from '../types';

interface SettingsProps {
  onProfileUpdated?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; mode: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setSaving(true);
      const updated = await api.updateSettings(profile);
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestHindsight = async () => {
    try {
      setTesting(true);
      const res = await api.testHindsightConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        mode: 'Error',
        message: err.message || 'Failed to ping Hindsight API'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Reset database and re-seed fresh Kirana demo data? All current changes will be restored to initial sample state.')) {
      try {
        setResetting(true);
        await api.resetDemoDatabase();
        alert('Database and Hindsight memory bank successfully re-seeded!');
        loadSettings();
        if (onProfileUpdated) onProfileUpdated();
      } catch (err: any) {
        alert(err.message || 'Reset failed');
      } finally {
        setResetting(false);
      }
    }
  };

  if (loading || !profile) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading settings...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-700" />
          <span>System & Engine Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure live Hindsight cloud credentials, Groq LLM API keys, store identity, and reset demonstration data.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully saved and propagated to backend services!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. HINDSIGHT AI CONFIGURATION */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hindsight Long-Term Memory Configuration</h3>
                <p className="text-[11px] text-slate-500">Vectorize.io Hindsight SDK integration</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
              profile.is_live_hindsight
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {profile.is_live_hindsight ? '🟢 Live Cloud Active' : '🟡 Local Engine Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hindsight Base URL</label>
              <input
                type="text"
                value={profile.hindsight_base_url}
                onChange={(e) => setProfile({ ...profile, hindsight_base_url: e.target.value })}
                placeholder="https://api.hindsight.vectorize.io or http://localhost:8888"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Memory Bank ID</label>
              <input
                type="text"
                value={profile.hindsight_bank_id}
                onChange={(e) => setProfile({ ...profile, hindsight_bank_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hindsight API Key (Cloud)</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={profile.hindsight_api_key || ''}
                onChange={(e) => setProfile({ ...profile, hindsight_api_key: e.target.value })}
                placeholder="Paste Hindsight API key (leave empty to use high-fidelity Local Memory Engine)"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestHindsight}
              disabled={testing}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-1.5 transition-all self-start"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            {testResult && (
              <span className={`text-[11px] font-bold ${testResult.success ? 'text-emerald-700' : 'text-amber-800'}`}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>

        {/* 2. GROQ / LLM PROVIDER */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Groq LLM Intelligence Provider</h3>
              <p className="text-[11px] text-slate-500">Fast inference with LLaMA 3.3 for Indian Kirana advisory</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Groq API Key</label>
              <input
                type="password"
                value={profile.groq_api_key || ''}
                onChange={(e) => setProfile({ ...profile, groq_api_key: e.target.value })}
                placeholder="gsk_..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">If blank, DukaanSmart runs its built-in Kirana reasoning engine.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">LLM Model</label>
              <select
                value={profile.llm_model}
                onChange={(e) => setProfile({ ...profile, llm_model: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-semibold"
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Fast)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. STORE PROFILE */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kirana Store Identity</h3>
              <p className="text-[11px] text-slate-500">Printed on customer receipts and UPI payment messages</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Shop Name</label>
              <input
                type="text"
                value={profile.shop_name}
                onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Owner Name</label>
              <input
                type="text"
                value={profile.owner_name}
                onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Store UPI VPA</label>
              <input
                type="text"
                value={profile.upi_id}
                onChange={(e) => setProfile({ ...profile, upi_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Store Address</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
            />
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDatabase}
            disabled={resetting}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetting ? 'Resetting...' : 'Reset to Sample Kirana Data'}</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Hackathon Credential Card */}
      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-indigo-700 font-extrabold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>HackWithHyderabad 3.0 — AI Agents That Learn Using Hindsight</span>
        </div>
        <p className="font-semibold text-slate-800">
          Team: <span className="text-slate-900 font-extrabold">404 - "COMPETITION NOT FOUND"</span>
        </p>
        <p className="text-[11px] text-slate-500">
          Team Members: Hardik Sachdeva, Uday Narayan Dubey, Simardeep Singh Bhatia, Amit Kumar.
        </p>
      </div>
    </div>
  );
};
