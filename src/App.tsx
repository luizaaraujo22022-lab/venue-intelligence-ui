import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PublicoOverview } from './components/publico/PublicoOverview';

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col font-sans antialiased text-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && <PublicoOverview />}
          {activeTab === 'balcao' && (
            <div className="border-2 border-dashed border-[#1E293B] rounded-xl p-8 text-center text-gray-500">
              Área do Módulo 2: Balcão & Filas (Colega 3)
            </div>
          )}
          {activeTab === 'autosservico' && (
            <div className="border-2 border-dashed border-[#1E293B] rounded-xl p-8 text-center text-gray-500">
              Área do Módulo 3: Autosserviço & Instagramável (Colega 4)
            </div>
          )}
          {activeTab === 'sintese' && (
            <div className="border-2 border-dashed border-[#1E293B] rounded-xl p-8 text-center text-gray-500">
              Área da Síntese D1-D3
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