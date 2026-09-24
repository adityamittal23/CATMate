import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { SafetyView } from './views/SafetyView';
import { MaintenanceView } from './views/MaintenanceView';
import { PredictView } from './views/PredictView';
import { AnomalyView } from './views/AnomalyView';
import { TrainingView } from './views/TrainingView';

const MainContent: React.FC = () => {
  const { activeTab, site, machineId, telemetry } = useApp();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'safety' && <SafetyView />}
        {activeTab === 'maintenance' && <MaintenanceView />}
        {activeTab === 'predict' && <PredictView />}
        {activeTab === 'anomaly' && <AnomalyView />}
        {activeTab === 'training' && <TrainingView />}
      </main>

      {/* Industrial In-Cab Status Footer */}
      <footer className="border-t border-neutral-800 bg-[#111111] py-2 px-4 text-[11px] text-slate-400 font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            CAN-bus Telematics Synced
          </span>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <span className="text-slate-400">Site: <strong className="text-white">{site}</strong></span>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <span className="text-slate-400">Machine: <strong className="text-[#FFCD11]">{machineId}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span>CAT IQ Copilot v1.0 • Caterpillar Heavy Equipment Division</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
