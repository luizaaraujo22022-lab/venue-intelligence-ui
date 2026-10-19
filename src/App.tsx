import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BalcaoStatus } from './components/BalcaoStatus';

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState('balcao');

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col font-sans antialiased text-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="border-2 border-dashed border-[#1E293B] rounded-xl p-8 text-center text-gray-500">
              Área do Módulo 1: Visão Geral & Métricas de Público (Colega 2)
            </div>
          )}
          {activeTab === 'balcao' && <BalcaoStatus />}
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