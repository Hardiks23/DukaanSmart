import React from 'react';
import { ShoppingCart, Search, Bell, AlertTriangle, ArrowUpRight, Zap } from 'lucide-react';

interface NavbarProps {
  onOpenPOS: () => void;
  onOpenAssistant: () => void;
  todayRevenue: number;
  lowStockCount: number;
  ownerName?: string;
  shopName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPOS,
  onOpenAssistant,
  todayRevenue,
  lowStockCount,
  ownerName = "Ramesh Sharma",
  shopName = "Sharma Kirana & General Store"
}) => {
  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-stone-200/90 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Quick search / context */}
      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500 hidden md:block">
          <span className="font-semibold text-slate-800">{shopName}</span>
          <span className="mx-2 text-stone-300">|</span>
          <span>Ameerpet, Hyderabad</span>
        </div>
      </div>

      {/* Right: Actions, Live Metrics, POS Button */}
      <div className="flex items-center gap-3.5">
        {/* Today's revenue ticker */}
        <div className="bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Today's Counter:</span>
          <span className="font-bold text-slate-900 font-mono text-sm">
            ₹{todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{lowStockCount} Low Stock</span>
          </div>
        )}

        {/* AI Copilot Quick Button */}
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
          <span>Ask AI Agent</span>
        </button>

        {/* POS Counter Button */}
        <button
          onClick={onOpenPOS}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm shadow-slate-300 transition-all active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
          <span>Open POS Counter</span>
        </button>

        {/* Owner Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-xs">
            {ownerName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{ownerName}</p>
            <p className="text-[10px] text-slate-400 font-medium">Kirana Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
};
