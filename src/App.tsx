import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight,
  Lock,
  Mail,
  Loader2
} from 'lucide-react';
import type { LoginCredentials } from './types/auth';

/**
 * Componente de Formulário / Tela Tática de Autenticação
 */
const LoginScreen: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('operador@raiz.venue');
  const [password, setPassword] = useState('••••••••');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      console.warn('Backend indisponível ou credenciais inválidas:', err);
      setErrorMsg('Falha ao autenticar com o gateway (/api/v1/auth/login). Verifique o backend ou use o acesso rápido abaixo.');
    }
  };

  // Permite à equipa de front-end testar a UI imediatamente sem precisar de ligar o backend
  const handleBypassDemo = () => {
    const demoToken = 'demo-jwt-tactical-token-' + Date.now();
    const demoUser = {
      id: 'usr-tac-01',
      name: 'Comandante Operacional',
      email: 'ops@raiz.venue',
      role: 'supervisor'
    };
    localStorage.setItem('auth_token', demoToken);
    localStorage.setItem('auth_user', JSON.stringify(demoUser));
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-panel border border-brand-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
        {/* Detalhe estético tático no topo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-dark border border-brand-yellow/30 text-brand-yellow mb-3 shadow-[0_0_15px_rgba(255,214,0,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-mono text-white tracking-widest uppercase">
            RAIZ <span className="text-brand-yellow">//</span> VENUE INTELLIGENCE
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            TERMINAL DE CONTROLO OPERACIONAL E TELEMETRIA
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-1.5">
              Identificação / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@raiz.venue"
                className="w-full pl-9 pr-3 py-2.5 bg-brand-dark border border-brand-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider mb-1.5">
              Credencial / Chave Tática
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-brand-dark border border-brand-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow font-mono transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-lg bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold font-mono text-xs uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AUTENTICANDO...</span>
              </>
            ) : (
              <span>AUTORIZAR ACESSO</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-brand-border">
          <button
            type="button"
            onClick={handleBypassDemo}
            className="w-full py-2.5 px-3 rounded-lg bg-brand-dark hover:bg-brand-dark/70 text-gray-300 hover:text-white border border-brand-border hover:border-brand-yellow/40 text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-brand-yellow" />
            <span>Acesso Rápido de Desenvolvimento (Modo Demo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Área de Conteúdo Flexível - Pronta para a equipa acoplar os componentes reais
 */
const ContentArea: React.FC<{ activeTab: string; isCrisisMode: boolean }> = ({ activeTab, isCrisisMode }) => {
  return (
    <div className="space-y-6">
      {/* Banner de Modo Crise se ativado no Header */}
      {isCrisisMode && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-red-400 uppercase tracking-widest">
                PROTOCOLO DE CRISE OPERACIONAL ATIVO
              </h2>
              <p className="text-xs text-red-200/80">
                Atenção: Prioridade tática para redistribuição de fluxos e evacuação orientada das zonas de congestionamento.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 uppercase font-bold">
            LEVEL 1 ALERT
          </span>
        </div>
      )}

      {/* Cartões Táticos de Visão Geral / Telemetria Base */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-panel border border-brand-border p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
            <span>OCUPAÇÃO TOTAL DO VENUE</span>
            <Users className="w-4 h-4 text-brand-yellow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">18.420</span>
            <span className="text-xs text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <div className="w-full bg-brand-dark h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-brand-yellow h-full w-[78%]"></div>
          </div>
        </div>

        <div className="bg-brand-panel border border-brand-border p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
            <span>TEMPO MÉDIO DE FILA</span>
            <Clock className="w-4 h-4 text-brand-yellow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">03m 12s</span>
            <span className="text-xs text-emerald-400 font-mono">DENTRO DA META</span>
          </div>
          <div className="w-full bg-brand-dark h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-full w-[45%]"></div>
          </div>
        </div>

        <div className="bg-brand-panel border border-brand-border p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
            <span>TERMINAIS AUTOSSERVIÇO</span>
            <Zap className="w-4 h-4 text-brand-yellow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">42 / 44</span>
            <span className="text-xs text-emerald-400 font-mono">95.4% ATIVOS</span>
          </div>
          <div className="w-full bg-brand-dark h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-full w-[95%]"></div>
          </div>
        </div>

        <div className="bg-brand-panel border border-brand-border p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
            <span>VAZÃO ESTIMADA D1-D3</span>
            <TrendingUp className="w-4 h-4 text-brand-yellow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">1.840 p/h</span>
            <span className="text-xs text-brand-yellow font-mono">ESTÁVEL</span>
          </div>
          <div className="w-full bg-brand-dark h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-brand-yellow h-full w-[65%]"></div>
          </div>
        </div>
      </div>

      {/* Espaço modular dinâmico para a equipa renderizar cada visão */}
      <div className="bg-brand-panel border border-brand-border rounded-xl p-6 min-h-[420px] flex flex-col justify-center items-center text-center">
        <div className="max-w-md space-y-3">
          <div className="inline-flex p-3 rounded-xl bg-brand-dark border border-brand-border text-brand-yellow mb-1">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
            ÁREA DE CONTEÚDO MODULAR: <span className="text-brand-yellow">{activeTab.toUpperCase()}</span>
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Layout flexível configurado e pronto para rececionar os componentes da equipa para este módulo.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand-dark border border-brand-border text-xs font-mono text-gray-300">
            <span className="w-2 h-2 rounded-full bg-brand-yellow"></span>
            <span>Módulo Ativo: src/views/{activeTab}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Shell Principal da Aplicação
 */
const AppShell: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCrisisMode, setIsCrisisMode] = useState<boolean>(false);

  // Splash de Carregamento Tático
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-brand-dark flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-brand-panel border border-brand-yellow/30 flex items-center justify-center text-brand-yellow">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-mono text-white tracking-widest uppercase">
            RAIZ // INICIALIZANDO TELEMETRIA
          </p>
          <p className="text-[10px] font-mono text-gray-400 mt-1">
            CARREGANDO SESSÃO E CONEXÕES TÁTICAS...
          </p>
        </div>
      </div>
    );
  }

  // Se não autenticado, apresenta a tela tática de login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Aplicação Autenticada com Layout Completo (Header + Sidebar + Conteúdo Flexível)
  return (
    <div className="min-h-screen w-full bg-brand-dark text-white flex flex-col font-sans selection:bg-brand-yellow selection:text-brand-dark">
      <Header 
        isCrisisMode={isCrisisMode} 
        onToggleCrisis={() => setIsCrisisMode(prev => !prev)} 
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={setActiveTab} 
        />

        <main className="flex-1 overflow-y-auto p-6 bg-brand-dark/95">
          <ContentArea 
            activeTab={activeTab} 
            isCrisisMode={isCrisisMode} 
          />
        </main>
      </div>
    </div>
  );
};

/**
 * App raiz envelopado pelo AuthProvider
 */
export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
