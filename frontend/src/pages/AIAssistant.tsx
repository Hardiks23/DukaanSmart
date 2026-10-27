import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Database,
  BrainCircuit,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, MemoryCitation } from '../types';

interface AIAssistantProps {
  onNavigate?: (tab: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Namaste! I am your DukaanSmart Retail Intelligence Copilot, powered by Hindsight AI's long-term memory system.\n\n" +
        "Unlike generic chatbots, I remember your shop's previous events, supplier price shifts, festival stockouts, and customer Udhar repayment patterns.\n\n" +
        "Ask me anything about credit risk, seasonal stocking, or pricing decisions below!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<any[]>([]);
  const [activeMemoryDetail, setActiveMemoryDetail] = useState<MemoryCitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadPrompts = async () => {
    try {
      const p = await api.getSuggestedPrompts();
      setSuggestedPrompts(p);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.sendChatMessage(textToSend, history);

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recalled_memories: res.recalled_memories,
        reasoning_summary: res.reasoning_summary,
        actions_suggested: res.actions_suggested,
        hindsight_mode: res.hindsight_mode
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error communicating with AI agent: ${err.message || 'Please check backend logs.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-600" />
            <span>AI Retail Intelligence Agent</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono font-semibold">
              Powered by Hindsight
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Remembers previous shop sales, festival surges, customer udhar payments, and supplier price changes.
          </p>
        </div>
        <button
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Main Container: Chat Thread (Left) + Memory Inspection Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Chat Thread */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-stone-200/80 shadow-subtle overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-subtle ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-stone-50/80 border border-stone-200/80 text-slate-900 rounded-tl-xs'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans text-[13px] space-y-2">
                    {msg.content}
                  </div>

                  {/* Recalled Memories Provenance Pills (For Assistant Messages) */}
                  {msg.recalled_memories && msg.recalled_memories.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-200/90">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2">
                        <Database className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Hindsight Memories Recalled ({msg.recalled_memories.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.recalled_memories.map((mem) => (
                          <div
                            key={mem.id}
                            onClick={() => setActiveMemoryDetail(mem)}
                            className="p-2 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer text-left"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono font-bold text-indigo-700">#{mem.id}</span>
                              <span className="font-semibold text-slate-500 bg-stone-100 px-1.5 py-0.2 rounded">
                                {mem.strategy_used}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 font-medium mt-1 line-clamp-2">
                              {mem.text}
                            </p>
                            <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                              Influence: {mem.influence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Actions */}
                  {msg.actions_suggested && msg.actions_suggested.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 self-center">Actions:</span>
                      {msg.actions_suggested.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (act.includes('Khata') && onNavigate) onNavigate('customers');
                            else if (act.includes('Stock') && onNavigate) onNavigate('inventory');
                            else if (act.includes('Analytics') && onNavigate) onNavigate('analytics');
                            else handleSend(act);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-indigo-300 text-indigo-700 font-bold text-[10px] shadow-xs transition-all"
                        >
                          {act} →
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[9px] mt-2 font-mono ${
                      msg.role === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-xs justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>Recalling past memories & reasoning across shop ledger...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="p-3 border-t border-stone-100 bg-stone-50/50 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Quick Kirana Queries (Grounded in Hindsight):
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {suggestedPrompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSend(p.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium whitespace-nowrap shadow-xs transition-all"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-stone-200/80 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask about restocking, customer credit reliability, or margin trends..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                input.trim() && !loading
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                  : 'bg-stone-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* RIGHT: Memory Inspection Panel */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-stone-200/80 shadow-subtle p-5 overflow-y-auto">
          <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm mb-3">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span>Hindsight Agent Architecture</span>
          </div>

          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
              <p className="font-bold text-slate-900 text-xs">Why Hindsight beats traditional RAG:</p>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">4-Strategy Fusion</strong>: Semantic vector, BM25 exact keyword, Entity Graph links, and Temporal decay.</li>
                <li><strong className="text-slate-800">Fact Extraction</strong>: Automatically distills structured knowledge from raw shop events.</li>
                <li><strong className="text-slate-800">No Hallucinations</strong>: Decisions are anchored in documented past customer behavior and sales numbers.</li>
              </ul>
            </div>

            {/* Active Memory Inspection Card */}
            {activeMemoryDetail ? (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-900 text-xs">
                    Memory #{activeMemoryDetail.id}
                  </span>
                  <span className="text-[10px] font-bold bg-white text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                    Score: {(activeMemoryDetail.relevance_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-900 italic">
                  "{activeMemoryDetail.text}"
                </p>
                <div className="pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-900">
                  <p><strong>Retrieval Strategy:</strong> {activeMemoryDetail.strategy_used}</p>
                  <p className="mt-1"><strong>Agentic Influence:</strong> {activeMemoryDetail.influence}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-center text-slate-400 text-[11px]">
                Click on any memory provenance pill in the chat to inspect its exact Hindsight recall details here.
              </div>
            )}

            {/* Quick Hindsight Navigation Link */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('hindsight')}
                className="w-full py-2.5 rounded-xl border border-stone-200 hover:border-indigo-300 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-indigo-50/50"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Open Hindsight Memory Bank Explorer →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
