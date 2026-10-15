import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  LogOut, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface HeaderProps {
  isCrisisMode?: boolean;
  onToggleCrisis?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isCrisisMode: externalCrisisMode, 
  onToggleCrisis: externalToggleCrisis 
}) => {
  const { user, logout } = useAuth();
  const [internalCrisisMode, setInternalCrisisMode] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Permite controle externo ou fallback para estado local
  const isCrisis = externalCrisisMode !== undefined ? externalCrisisMode : internalCrisisMode;
  const handleToggleCrisis = externalToggleCrisis || (() => setInternalCrisisMode(prev => !prev));

  // Relógio operacional em tempo real (HH:mm:ss)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitorização de conectividade em tempo real
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-16 w-full bg-brand-panel border-b border-brand-border px-6 flex items-center justify-between shadow-lg sticky top-0 z-30 select-none">
      {/* Logótipo Tático */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-dark border border-brand-yellow/30 text-brand-yellow shadow-[0_0_12px_rgba(255,214,0,0.15)]">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black tracking-widest text-lg text-white font-mono">
              RAIZ <span className="text-brand-yellow font-light">//</span>
            </span>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-dark/80 text-gray-300 border border-brand-border">
              Venue Intelligence
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-mono tracking-tight">
            TACTICAL COMMAND & VENUE TELEMETRY
          </p>
        </div>
      </div>

      {/* Indicadores Operacionais Centrais */}
      <div className="hidden md:flex items-center space-x-6">
        {/* Status de Conexão com API */}
        <div 
          className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-brand-dark/80 border border-brand-border text-xs font-mono"
          title={isOnline ? 'Conexão ativa com o Gateway da API' : 'Sem conexão de rede'}
        >
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold tracking-wide">API: ONLINE</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400 font-semibold tracking-wide">API: OFFLINE</span>
            </>
          )}
        </div>

        {/* Relógio Operacional */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-brand-dark/80 border border-brand-border text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-brand-yellow" />
          <span className="text-gray-400">OPS TIME:</span>
          <span className="text-white font-bold tracking-widest">{currentTime || '--:--:--'}</span>
        </div>
      </div>

      {/* Ações Táticas e Perfil */}
      <div className="flex items-center space-x-4">
        {/* Botão Alternar Modo Crise / Alerta */}
        <button
          type="button"
          onClick={handleToggleCrisis}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
            isCrisis
              ? 'bg-red-500/20 text-red-400 border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-pulse'
              : 'bg-brand-dark hover:bg-brand-dark/80 text-gray-300 border-brand-border hover:border-brand-yellow/50 hover:text-brand-yellow'
          }`}
          title={isCrisis ? 'Desativar protocolo de contingência e crise' : 'Ativar modo de alerta tático para incidente no venue'}
        >
          {isCrisis ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
              <span>MODO CRISE: ATIVO</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-gray-400 group-hover:text-brand-yellow" />
              <span>MODO CRISE</span>
            </>
          )}
        </button>

        {/* Divisor vertical */}
        <div className="h-6 w-px bg-brand-border" />

        {/* Informações do Utilizador & Logout */}
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-dark border border-brand-yellow/50 flex items-center justify-center text-brand-yellow font-bold text-xs uppercase shadow-inner">
                {user.name ? user.name.slice(0, 2) : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white tracking-wide leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-brand-yellow font-mono uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 inline text-brand-yellow" />
                  {user.role}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-md bg-brand-dark hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-brand-border hover:border-red-500/30 transition-colors cursor-pointer"
              title="Encerrar sessão tática"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>MODO CONVIDADO</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
