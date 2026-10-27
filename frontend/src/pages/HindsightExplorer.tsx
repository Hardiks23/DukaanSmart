import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Sparkles,
  Layers,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Cpu,
  Share2
} from 'lucide-react';
import { api } from '../services/api';
import { HindsightStatus, MemoryItem } from '../types';

export const HindsightExplorer: React.FC = () => {
  const [status, setStatus] = useState<HindsightStatus | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'memories' | 'recall' | 'reflect' | 'retain' | 'audits'>('memories');
  const [loading, setLoading] = useState(true);

  // Recall Sandbox State
  const [recallQuery, setRecallQuery] = useState('festival demand atta and rice surge');
  const [recallBudget, setRecallBudget] = useState('mid');
  const [recallResults, setRecallResults] = useState<any>(null);
  const [recalling, setRecalling] = useState(false);

  // Reflect Sandbox State
  const [reflectQuery, setReflectQuery] = useState('What are the main recurring financial risks on customer credit?');
  const [reflectBudget, setReflectBudget] = useState('low');
  const [reflectResponse, setReflectResponse] = useState<any>(null);
  const [reflecting, setReflecting] = useState(false);

  // Retain Sandbox State
  const [retainContent, setRetainContent] = useState('');
  const [retainContext, setRetainContext] = useState('Kirana Business Incident');
  const [retainTags, setRetainTags] = useState('supplier_discount, bulk_purchase');
  const [retaining, setRetaining] = useState(false);
  const [retainSuccess, setRetainSuccess] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [st, mems, auds] = await Promise.all([
        api.getHindsightStatus(),
        api.getHindsightMemories(),
        api.getMemoryAudits()
      ]);
      setStatus(st);
      setMemories(mems);
      setAudits(auds);
    } catch (err) {
      console.error('Failed to load Hindsight explorer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunRecall = async () => {
    if (!recallQuery.trim()) return;
    try {
      setRecalling(true);
      const res = await api.recallMemories(recallQuery, recallBudget);
      setRecallResults(res);
    } catch (err: any) {
      alert(err.message || 'Recall failed');
    } finally {
      setRecalling(false);
    }
  };

  const handleRunReflect = async () => {
    if (!reflectQuery.trim()) return;
    try {
      setReflecting(true);
      const res = await api.reflectMemories(reflectQuery, reflectBudget);
      setReflectResponse(res);
    } catch (err: any) {
      alert(err.message || 'Reflect failed');
    } finally {
      setReflecting(false);
    }
  };

  const handleRunRetain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retainContent.trim()) return;
    try {
      setRetaining(true);
      const tags = retainTags.split(',').map(t => t.trim()).filter(Boolean);
      await api.retainMemory(retainContent, retainContext, tags);
      setRetainSuccess(true);
      setRetainContent('');
      loadAll();
      setTimeout(() => setRetainSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Retain failed');
    } finally {
      setRetaining(false);
    }
  };

  const isLive = status?.is_live ?? false;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-600" />
            <span>Hindsight Long-Term Memory Explorer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official Vectorize Hindsight API sandbox for Retaining facts, Recalling with 4-strategy retrieval, and Reflecting on business outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://hindsight.vectorize.io/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-all shadow-subtle"
          >
            <span>Hindsight Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <button
            onClick={loadAll}
            className="p-2 rounded-xl border border-stone-200 bg-white text-slate-700 hover:bg-stone-50"
            title="Refresh Memory Bank"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Memory Bank Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-subtle grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Connection Engine</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <p className="font-extrabold text-slate-900 text-sm">
              {isLive ? 'Live Hindsight Cloud' : 'Local Hindsight Engine'}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">{status?.base_url}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Memory Bank ID</span>
          <p className="font-mono font-bold text-slate-900 text-sm mt-1">{status?.bank_id}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Isolated tenant memory space</p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Retained Memory Units</span>
          <p className="font-extrabold text-indigo-700 font-mono text-sm mt-1">
            {memories.length} Facts / Incidents
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Persistent across sessions</p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Python SDK Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900 text-xs font-mono">hindsight-client v1.1.0</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Official Vectorize Client</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-1">
        {[
          { id: 'memories', label: `Memory Units (${memories.length})` },
          { id: 'recall', label: '🔍 Test Recall (4-Strategy)' },
          { id: 'reflect', label: '🧠 Test Reflect (Agentic Loop)' },
          { id: 'retain', label: '+ Retain New Experience' },
          { id: 'audits', label: `Audit Log (${audits.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL MEMORIES LIST */}
      {activeTab === 'memories' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      #{mem.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {mem.timestamp ? new Date(mem.timestamp).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-900 leading-relaxed">
                    {mem.text}
                  </p>
                </div>

                {/* Tags and Entities Footer */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap gap-1.5 items-center">
                  {mem.tags && mem.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-stone-100 text-slate-600 px-2 py-0.5 rounded-full"
                    >
                      #{t}
                    </span>
                  ))}
                  {mem.entities && mem.entities.map((e, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TEST RECALL SANDBOX */}
      {activeTab === 'recall' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Multi-Strategy Recall Engine</h3>
            <p className="text-xs text-slate-500">
              Hindsight executes 4 retrieval strategies in parallel: 1. Semantic Similarity, 2. Keyword (BM25), 3. Graph Traversal, 4. Temporal Reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Natural Language Query</label>
              <input
                type="text"
                value={recallQuery}
                onChange={(e) => setRecallQuery(e.target.value)}
                placeholder="e.g. Can we trust Vikram Singh with more credit?"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Search Budget</label>
              <select
                value={recallBudget}
                onChange={(e) => setRecallBudget(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 font-semibold"
              >
                <option value="low">low (Fastest)</option>
                <option value="mid">mid (Multi-strategy)</option>
                <option value="high">high (Exhaustive graph)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Target Bank: <code className="font-bold text-slate-900">{status?.bank_id}</code></span>
            </div>
            <button
              onClick={handleRunRecall}
              disabled={recalling}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>{recalling ? 'Executing Recall...' : 'Run Recall Query'}</span>
            </button>
          </div>

          {/* Results Output */}
          {recallResults && (
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  Found {recallResults.total_memories} Matched Memory Units
                </span>
                <div className="flex gap-1.5">
                  {recallResults.retrieval_strategies.map((strat: string, idx: number) => (
                    <span key={idx} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                      {strat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden text-xs">
                {recallResults.results.map((r: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-stone-50/50 hover:bg-stone-50 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">#{r.id}</span>
                        <span className="text-[10px] font-bold bg-white text-slate-600 px-1.5 py-0.5 rounded border border-stone-200">
                          Strategy: {r.strategy}
                        </span>
                      </div>
                      <p className="text-slate-900 font-medium">{r.text}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-sm text-emerald-700">
                        {(r.score * 100).toFixed(0)}%
                      </span>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Relevance</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEST REFLECT SANDBOX */}
      {activeTab === 'reflect' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Agentic Reflection Loop (`reflect`)</h3>
            <p className="text-xs text-slate-500">
              Unlike raw fact retrieval, `reflect` triggers an autonomous agentic loop that gathers evidence across memory tiers and synthesizes reasoned business answers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Open-Ended Strategic Prompt</label>
              <input
                type="text"
                value={reflectQuery}
                onChange={(e) => setReflectQuery(e.target.value)}
                placeholder="e.g. Synthesize our historical supplier price volatility"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reflection Depth</label>
              <select
                value={reflectBudget}
                onChange={(e) => setReflectBudget(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 font-semibold"
              >
                <option value="low">low (Fast synthesis)</option>
                <option value="mid">mid (Deep exploration)</option>
                <option value="high">high (Full graph traversal)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunReflect}
              disabled={reflecting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{reflecting ? 'Reflecting across memory bank...' : 'Execute Hindsight Reflect'}</span>
            </button>
          </div>

          {reflectResponse && (
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Synthesized Hindsight Mental Reflection:
              </span>
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 font-sans text-xs text-slate-900 whitespace-pre-wrap leading-relaxed">
                {reflectResponse.reflection}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RETAIN NEW EXPERIENCE */}
      {activeTab === 'retain' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-subtle space-y-5 max-w-2xl">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Retain New Experience into Hindsight</h3>
            <p className="text-xs text-slate-500">
              Record a notable shop event, supplier price adjustment, customer behavior, or seasonal festival milestone.
            </p>
          </div>

          {retainSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Memory successfully retained into bank '{status?.bank_id}'!</span>
            </div>
          )}

          <form onSubmit={handleRunRetain} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Experience / Incident Description *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Wholesaler Laxmi Traders offered a 3% cash rebate on purchasing 20 bags of Basmati Rice for Eid."
                value={retainContent}
                onChange={(e) => setRetainContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Context Category</label>
                <input
                  type="text"
                  value={retainContext}
                  onChange={(e) => setRetainContext(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={retainTags}
                  onChange={(e) => setRetainTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={retaining || !retainContent.trim()}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm"
            >
              {retaining ? 'Retaining...' : 'Store Memory in Hindsight'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Query / Content</th>
                  <th className="py-3 px-4">Retrieval Strategy</th>
                  <th className="py-3 px-4">Result Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50/60">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        a.action === 'RETAIN' ? 'bg-indigo-50 text-indigo-700' :
                        a.action === 'RECALL' ? 'bg-amber-50 text-amber-800' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {a.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium truncate max-w-xs">
                      {a.content_or_query}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {a.retrieval_strategy || 'Multi-Strategy'}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600 truncate max-w-xs">
                      {a.result_summary || 'Completed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
