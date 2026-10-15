import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  BarChart3, 
  Terminal, 
  Activity, 
  Layers
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    tag: 'LIVE'
  },
  {
    id: 'queues',
    label: 'Balcão & Filas',
    icon: Users,
    tag: 'FLUXO'
  },
  {
    id: 'self-service',
    label: 'Autosserviço & Zonas',
    icon: QrCode,
    tag: 'KDS'
  },
  {
    id: 'synthesis',
    label: 'Síntese D1-D3',
    icon: BarChart3,
    tag: 'RELATÓRIOS'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <aside className="w-64 bg-brand-panel border-r border-brand-border flex flex-col justify-between h-[calc(100vh-4rem)] select-none shrink-0">
      {/* Secção de Navegação Principal */}
      <div className="p-4 space-y-6">
        {/* Título de secção tática */}
        <div className="flex items-center justify-between px-3 text-[11px] font-mono tracking-widest text-gray-400 uppercase">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-yellow" />
            MÓDULOS DE VENUE
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-ping"></span>
        </div>

        {/* Lista de Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer text-left group ${
                  isActive
                    ? 'bg-brand-dark/90 text-brand-yellow border-l-4 border-brand-yellow shadow-inner pl-3'
                    : 'text-gray-400 hover:text-white hover:bg-brand-dark/40 border-l-4 border-transparent pl-3'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 ${
                      isActive ? 'text-brand-yellow' : 'text-gray-400 group-hover:text-gray-200'
                    }`} 
                  />
                  <span className="tracking-wide">{item.label}</span>
                </div>

                {item.tag && (
                  <span 
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isActive 
                        ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/30' 
                        : 'bg-brand-dark text-gray-400 border-brand-border group-hover:border-gray-600'
                    }`}
                  >
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Painel Operacional / Rodapé da Sidebar */}
      <div className="p-4 border-t border-brand-border space-y-3">
        <div className="rounded-lg bg-brand-dark/80 p-3 border border-brand-border space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-brand-yellow" />
              TELEMETRIA DO HUB
            </span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-gray-300">
            <span>TAXA AMOSTRAGEM</span>
            <span className="text-white font-bold">2.4 GHz // SYNC</span>
          </div>

          {/* Barra de telemetria visual */}
          <div className="w-full bg-brand-panel h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-yellow h-full w-[88%] rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Rodapé institucional */}
        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-gray-400">
          <span>RAIZ CORE v2.4</span>
          <span className="flex items-center gap-1 text-gray-400">
            <Activity className="w-3 h-3 text-brand-yellow inline" />
            OPS PROTOCOL
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
