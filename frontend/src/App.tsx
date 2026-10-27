import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { CustomersCredit } from './pages/CustomersCredit';
import { AIAssistant } from './pages/AIAssistant';
import { HindsightExplorer } from './pages/HindsightExplorer';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import { HindsightStatus, DashboardMetrics, ShopProfile } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [hindsightStatus, setHindsightStatus] = useState<HindsightStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  useEffect(() => {
    loadAppHeaderData();
  }, [refreshCounter]);

  const loadAppHeaderData = async () => {
    try {
      const [st, m, prof] = await Promise.all([
        api.getHindsightStatus(),
        api.getDashboardMetrics(),
        api.getSettings()
      ]);
      setHindsightStatus(st);
      setMetrics(m);
      setProfile(prof);
    } catch (err) {
      console.error('Error loading header state:', err);
    }
  };

  const triggerGlobalRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5] text-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hindsightStatus={hindsightStatus}
        shopName={profile?.shop_name}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenPOS={() => setCurrentTab('pos')}
          onOpenAssistant={() => setCurrentTab('assistant')}
          todayRevenue={metrics?.today_revenue || 0}
          lowStockCount={metrics?.low_stock_count || 0}
          ownerName={profile?.owner_name}
          shopName={profile?.shop_name}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && (
            <Overview
              onNavigate={setCurrentTab}
              onRefreshTrigger={refreshCounter}
            />
          )}

          {currentTab === 'inventory' && <Inventory />}

          {currentTab === 'pos' && (
            <POS onSaleCompleted={triggerGlobalRefresh} />
          )}

          {currentTab === 'customers' && <CustomersCredit />}

          {currentTab === 'assistant' && (
            <AIAssistant onNavigate={setCurrentTab} />
          )}

          {currentTab === 'hindsight' && <HindsightExplorer />}

          {currentTab === 'analytics' && <Analytics />}

          {currentTab === 'settings' && (
            <Settings onProfileUpdated={triggerGlobalRefresh} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
