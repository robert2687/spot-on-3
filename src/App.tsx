import React from 'react';
import { SpotOnProvider, useSpotOn } from './context/SpotOnContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { HomeScreen } from './components/screens/HomeScreen';
import { TimelineScreen } from './components/screens/TimelineScreen';
import { InsightsScreen } from './components/screens/InsightsScreen';
import { ExportScreen } from './components/screens/ExportScreen';
import { AddPurchaseModal } from './components/screens/AddPurchaseModal';
import { SettingsModal } from './components/screens/SettingsModal';
import { OnboardingModal } from './components/screens/OnboardingModal';
import { PinLockScreen } from './components/screens/PinLockScreen';
import { GoogleAuthModal } from './components/GoogleAuthModal';

const MainApp: React.FC = () => {
  const { activeTab, isLocked } = useSpotOn();

  if (isLocked) {
    return <PinLockScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-blue-600 selection:text-white flex flex-col items-center">
      {/* Mobile-First Centered Container */}
      <div className="w-full max-w-lg min-h-screen flex flex-col bg-white dark:bg-slate-950 shadow-2xl sm:border-x sm:border-slate-200/90 dark:sm:border-slate-800/80 relative">
        {/* Header */}
        <Header />

        {/* Dynamic Screen Views */}
        <main className="flex-1 px-4 pt-4">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'timeline' && <TimelineScreen />}
          {activeTab === 'insights' && <InsightsScreen />}
          {activeTab === 'export' && <ExportScreen />}
        </main>

        {/* Bottom Navigation with Centered Floating Action Button */}
        <BottomNav />

        {/* Modals & Overlays */}
        <AddPurchaseModal />
        <SettingsModal />
        <OnboardingModal />
        <GoogleAuthModal />
        <Toast />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SpotOnProvider>
      <MainApp />
    </SpotOnProvider>
  );
}
