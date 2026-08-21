import React from 'react';
import { Home, Clock, BarChart3, Download, Plus } from 'lucide-react';
import { useSpotOn } from '../context/SpotOnContext';
import { NavigationTab } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openAddModal, t } = useSpotOn();

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'timeline', label: t('navTimeline'), icon: Clock },
    { id: 'insights', label: t('navInsights'), icon: BarChart3 },
    { id: 'export', label: t('navExport'), icon: Download },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-lg mx-auto relative px-4 pb-safe">
        {/* Floating Action Button (FAB) Centered Above Nav */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-auto z-40">
          <button
            onClick={() => openAddModal(null)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full border-4 border-white dark:border-slate-900 shadow-xl shadow-blue-600/30 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            aria-label={t('addPurchase')}
          >
            <Plus className="w-8 h-8 stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-100 dark:border-slate-800/90 rounded-3xl shadow-xl shadow-slate-900/5 mb-3 px-2 py-2 flex items-center justify-between">
          {/* Left pair (Home, Timeline) */}
          <div className="flex items-center w-5/12 justify-around">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Spacer for FAB */}
          <div className="w-2/12" />

          {/* Right pair (Insights, Export) */}
          <div className="flex items-center w-5/12 justify-around">
            {navItems.slice(2, 4).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
