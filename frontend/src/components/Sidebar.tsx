import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Users,
  Sparkles,
  Database,
  BarChart3,
  Settings,
  Store,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight
} from 'lucide-react';
import { HindsightStatus } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  hindsightStatus?: HindsightStatus | null;
  shopName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  hindsightStatus,
  shopName = "Sharma Kirana & General Store"
}) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: 'Stock' },
    { id: 'pos', label: 'Sales & POS', icon: ShoppingCart, badge: 'Counter' },
    { id: 'customers', label: 'Customers & Credit', icon: Users, badge: 'Udhar' },
    { id: 'assistant', label: 'AI Business Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'hindsight', label: 'Hindsight Memory', icon: Database, badge: 'Memory' },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const isLive = hindsightStatus?.is_live ?? false;

  return (
    <aside className="w-64 bg-white border-r border-stone-200/90 flex flex-col justify-between shrink-0 select-none">
      {/* Top Branding Section */}
      <div>
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                Dukaan<span className="text-indigo-600 font-extrabold">Smart</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-none truncate max-w-[150px]">
                {shopName}
              </p>
            </div>
          </div>

          {/* Hindsight Status Banner */}
          <div className={`mt-3.5 px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs font-medium ${
            isLive
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800'
              : 'bg-amber-50/80 border-amber-200/80 text-amber-900'
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full animate-pulse ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold">
                {isLive ? 'Hindsight Cloud' : 'Local Hindsight Bank'}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-current font-mono">
              {hindsightStatus?.total_local_memories ?? 8} facts
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Retail Operations
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Hackathon & Team Credit */}
      <div className="p-4 border-t border-stone-100 bg-stone-50/60">
        <div className="bg-white p-3 rounded-xl border border-stone-200/70 shadow-subtle">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
            <Award className="w-4 h-4 text-amber-500" />
            <span>HackWithHyderabad 3.0</span>
          </div>
          <p className="text-[11px] text-slate-600 font-semibold mt-1">
            Team 404: <span className="text-slate-900 font-bold">COMPETITION NOT FOUND</span>
          </p>
          <div className="mt-2 text-[10px] text-slate-400 leading-relaxed border-t border-stone-100 pt-1.5 flex flex-wrap gap-x-1.5">
            <span>Hardik</span>•<span>Uday</span>•<span>Simardeep</span>•<span>Amit</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
