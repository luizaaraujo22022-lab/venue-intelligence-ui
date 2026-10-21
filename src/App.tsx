import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PublicoOverview } from './components/publico/PublicoOverview';
import { BalcaoFilasView } from './components/balcao/BalcaoFilasView';
import { AutosservicoZonasView } from './components/autosservico/AutosservicoZonasView';

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col font-sans antialiased text-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && <PublicoOverview />}
          {activeTab === 'balcao' && <BalcaoFilasView />}
          {activeTab === 'autosservico' && <AutosservicoZonasView />}
          {activeTab === 'sintese' && (
            <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-8 text-center text-gray-400">
              <h3 className="text-base font-bold text-gray-200">Síntese Consolidada D1–D3</h3>
              <p className="text-xs text-gray-500 mt-1">
                Relatórios acumulados de fluxo e comparação multidiária do estande RAIZ.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}