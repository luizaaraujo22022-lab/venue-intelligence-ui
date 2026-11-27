import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Radio,
  Plus,
  Bot,
  Compass,
  Camera,
  X
} from 'lucide-react';
import { InstagramavelCard } from './components/InstagramavelCard';
import { Venue3DScene } from './components/Venue3DScene';
import { SinteseAcumulada } from './components/SinteseAcumulada';
import { TerminalCLI } from './components/TerminalCLI';
import { CameraTelemetryPanel } from './components/camera/CameraTelemetryPanel';
import { ApiToast } from './components/ui/ApiToast';
import { useOpsActions } from './hooks/useOpsActions';
import { useHistoricoTelemetria } from './hooks/useHistoricoTelemetria';
import { toZonaPublico } from './utils/publico';
import { gerarAlertasPreditivos } from './utils/predicao';
import { PredicaoGargalosView } from './components/predicao/PredicaoGargalosView';

import { INITIAL_AUTOSSERVICO, INITIAL_INSTAGRAMAVEL, computeSinteseAcumulada } from './data/mockData';
import type { AutosservicoItem, InstagramavelItem } from './types/venue';

export interface ZoneData {
  id: string;
  name: string;
  x: number;
  z: number;
  occupancy: number; 
  pessoas: number;
}

export const ZONES_DATA: ZoneData[] = [
  { id: 'Z1', name: 'Balcão Principal', x: -1.5, z: 2.0, occupancy: 86, pessoas: 16 },
  { id: 'Z2', name: 'Lounge Poltronas', x: -3.0, z: 0.5, occupancy: 70, pessoas: 7 },
  { id: 'Z3', name: 'Entrada & Circulação', x: 0.0, z: 2.5, occupancy: 100, pessoas: 15 },
  { id: 'Z4', name: 'Mesas Café & Network', x: 2.0, z: 1.5, occupancy: 68, pessoas: 7 },
  { id: 'Z5', name: 'Espaço Autosserviço', x: 3.2, z: -0.5, occupancy: 25, pessoas: 2 },
  { id: 'Z6', name: 'Área de Apoio / Staff', x: 1.0, z: -1.5, occupancy: 17, pessoas: 1 },
];

export function getHeatmapColor(occupancy: number): string {
  if (occupancy >= 85) return '#ef4444'; 
  if (occupancy >= 50) return '#f59e0b'; 
  return '#10b981';                     
}

export default function App() {
  const [autos, setAutos] = useState<AutosservicoItem[]>(INITIAL_AUTOSSERVICO);
  const [instas, setInstas] = useState<InstagramavelItem[]>(INITIAL_INSTAGRAMAVEL);
  const [activeTab, setActiveTab] = useState<'tudo' | 'sintese' | 'instagramavel' | 'predicao' | 'mapa'>('tudo');
  const [show3DMap, setShow3DMap] = useState(true);
  const [selectedAtracaoId, setSelectedAtracaoId] = useState<string | null>(null);
  const [filtroSetor, setFiltroSetor] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('10s');
  const [lastUpdate, setLastUpdate] = useState('04:15:40');
  const [pingLatency, setPingLatency] = useState(431);
  const { ocupado, feedback, despachoOps, limparFeedback } = useOpsActions();

  const [novoTipo, setNovoTipo] = useState<'autosservico' | 'instagramavel'>('autosservico');
  const [formNome, setFormNome] = useState('');
  const [formSetor, setFormSetor] = useState('Arena Principal');
  const [formInsumoOuPatrocinador, setFormInsumoOuPatrocinador] = useState('');

  // '5s' | '10s' | '30s' -> milissegundos (o select "Auto" agora controla o intervalo)
  const intervaloMs = (parseInt(autoRefreshInterval, 10) || 10) * 1000;

  // Passo 6: Sincronização e Busca de Dados Reais do Backend
  useEffect(() => {
    const fetchDadosBackend = async () => {
      const startTime = performance.now();
      try {
        const response = await fetch('https://api-evento-ia.onrender.com/status-pdvs');
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        
        // Processa os dados recebidos utilizando a função toZonaPublico
        if (Array.isArray(data) && data.length > 0) {
          const dadosProcessados: AutosservicoItem[] = data.map((item, index) => {
            const zonaPub = toZonaPublico(item);
            const baseMock = INITIAL_AUTOSSERVICO[index] || INITIAL_AUTOSSERVICO[0];

            return {
              ...baseMock,
              id: item.id || baseMock.id,
              nome: item.nome || (zonaPub as any).nome || baseMock.nome,
              pessoasNaFila: zonaPub.pessoas || baseMock.pessoasNaFila,
              tempoEstimadoEsperaMin: (zonaPub as any).tempoEstimadoEsperaMin ?? baseMock.tempoEstimadoEsperaMin,
              nivelAtualInsumo: zonaPub.ocupacaoPct !== undefined ? Math.max(0, baseMock.capacidadeTotalInsumo * (1 - zonaPub.ocupacaoPct / 100)) : baseMock.nivelAtualInsumo,
            };
          });

          setAutos(dadosProcessados);
        }

        const endTime = performance.now();
        setPingLatency(Math.round(endTime - startTime + 400));
        setLastUpdate(new Date().toTimeString().split(' ')[0]);
      } catch (error) {
        console.error('Falha ao sincronizar com backend da IA, mantendo estado atual:', error);
        setPingLatency(Math.floor(450 + Math.random() * 50));
      }
    };

    fetchDadosBackend();
    const timerInterval = setInterval(fetchDadosBackend, intervaloMs);

    return () => clearInterval(timerInterval);
  }, [intervaloMs]);

  // Histórico do tempo de espera por atração, usado pela IA preditiva
  const metricasEspera = useMemo(() => {
    const m: Record<string, number> = {};
    autos.forEach((a) => { m[a.id] = a.tempoEstimadoEsperaMin; });
    instas.forEach((i) => { m[i.id] = i.tempoEsperaMin; });
    return m;
  }, [autos, instas]);

  const { historico, versao } = useHistoricoTelemetria(metricasEspera, intervaloMs);

  // `versao` muda a cada nova amostra; é ela que faz a previsão ser recalculada,
  // porque `historico` é um Map mutável (mesma referência entre renders).
  const alertasPreditivos = useMemo(
    () => gerarAlertasPreditivos(autos, instas, historico),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autos, instas, historico, versao],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastUpdate(now.toTimeString().split(' ')[0]);
      setPingLatency(Math.floor(410 + Math.random() * 40));
    }, intervaloMs);
    return () => clearInterval(timer);
  }, [intervaloMs]);

  const sinteseBase = computeSinteseAcumulada(autos, instas);
  const idsAutosservico = new Set(autos.map((auto) => auto.id));
  const alertasFocadosEmFluxo = [...alertasPreditivos, ...sinteseBase.principaisAlertas].filter((alerta) => {
    const atracaoId = alerta.atracaoId ?? '';
    const ligadoAUmTotem = idsAutosservico.has(atracaoId) || atracaoId.startsWith('aut-');
    const previsaoDeTotem = alerta.id.startsWith('pred-aut-');
    return !ligadoAUmTotem && !previsaoDeTotem;
  });
  const sinteseData = {
    ...sinteseBase,
    principaisAlertas: alertasFocadosEmFluxo,
  };
  const handleReabastecer = (id: string) => {
    setAutos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          nivelAtualInsumo: item.capacidadeTotalInsumo,
          nivelCopos: item.capacidadeCopos,
          status: 'operacional',
          pessoasNaFila: Math.max(1, Math.floor(item.pessoasNaFila / 2)),
          tempoEstimadoEsperaMin: Number(
            ((Math.max(1, Math.floor(item.pessoasNaFila / 2)) * item.tempoMedioAtendimentoSegundos) / 60).toFixed(1),
          ),
          ultimoAbastecimento: 'Agora mesmo',
        };
      })
    );
  };

  const handleRegistrarCaptura = (id: string) => {
    setInstas((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const novasCapturas = item.capturasTotais + 1;
        const novosShares = item.compartilhamentosSociaisEstimados + 1;
        const novoAlcance = item.alcanceEstimadoRedes + 120;
        return {
          ...item,
          capturasTotais: novasCapturas,
          compartilhamentosSociaisEstimados: novosShares,
          alcanceEstimadoRedes: novoAlcance,
          status: item.pessoasNaFila > 12 ? 'alta_procura' : item.status,
        };
      })
    );
  };

  const handleMudarModoLuz = (id: string, modo: InstagramavelItem['iluminacaoCenica']['modo']) => {
    setInstas((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const cores: Record<string, string> = {
          'Neon Pulsar': '#10b981',
          'Cyber Glow': '#ef4444',
          'Golden Hour': '#f59e0b',
          'Studio Spotlight': '#a855f7',
        };
        return {
          ...item,
          iluminacaoCenica: {
            ...item.iluminacaoCenica,
            modo,
            corPrincipal: cores[modo] || item.iluminacaoCenica.corPrincipal,
          },
        };
      })
    );
  };

  const handleAlternarStatusInsta = (id: string) => {
    setInstas((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          status: item.status === 'pausado' ? 'ativo' : 'pausado',
        };
      })
    );
  };

  const handleSimularPicoDeFluxo = () => {
    setAutos((prev) =>
      prev.map((a) => {
        const novaFila = a.pessoasNaFila + 4;
        return {
          ...a,
          transacoesAcumuladas: a.transacoesAcumuladas + 25,
          receitaTotal: a.receitaTotal + 25 * a.ticketMedio,
          nivelAtualInsumo: Math.max(10, a.nivelAtualInsumo - 12),
          pessoasNaFila: novaFila,
          tempoEstimadoEsperaMin: Number(((novaFila * a.tempoMedioAtendimentoSegundos) / 60).toFixed(1)),
        };
      })
    );
    setInstas((prev) =>
      prev.map((i) => {
        const novaFila = i.pessoasNaFila + 5;
        const minPorPessoa = i.pessoasNaFila > 0 ? i.tempoEsperaMin / i.pessoasNaFila : 0.6;
        return {
          ...i,
          capturasTotais: i.capturasTotais + 40,
          compartilhamentosSociaisEstimados: i.compartilhamentosSociaisEstimados + 32,
          alcanceEstimadoRedes: i.alcanceEstimadoRedes + 5400,
          pessoasNaFila: novaFila,
          tempoEsperaMin: Number((novaFila * minPorPessoa).toFixed(1)),
          status: 'alta_procura',
        };
      })
    );
  };

  const handleExecutarAcaoSugerida = (alertaId: string, atracaoId?: string) => {
    if (alertaId.startsWith('pred-')) {
      if (atracaoId?.startsWith('aut-')) {
        handleReabastecer(atracaoId);
      } else if (atracaoId) {
        setInstas((prev) =>
          prev.map((i) =>
            i.id === atracaoId
              ? {
                  ...i,
                  pessoasNaFila: Math.max(1, Math.floor(i.pessoasNaFila / 2)),
                  tempoEsperaMin: Number(Math.max(1, i.tempoEsperaMin / 2).toFixed(1)),
                  status: 'ativo',
                }
              : i
          )
        );
      }
      return;
    }

    if (alertaId === 'al-1' || atracaoId === 'aut-02') {
      handleReabastecer('aut-02');
    } else if (alertaId === 'al-2' || atracaoId === 'inst-01') {
      setInstas((prev) =>
        prev.map((i) =>
          i.id === 'inst-01'
            ? { ...i, pessoasNaFila: 6, tempoEsperaMin: 3.2, status: 'ativo' }
            : i
        )
      );
    }
  };

  const handleCriarAtracao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    if (novoTipo === 'autosservico') {
      const novoAuto: AutosservicoItem = {
        id: `aut-${Date.now()}`,
        codigo: `AUT-${autos.length + 1}`,
        nome: formNome,
        tipoInsumo: formInsumoOuPatrocinador || 'Chopp Artesanal',
        setor: formSetor,
        status: 'operacional',
        capacidadeTotalInsumo: 300,
        nivelAtualInsumo: 300,
        unidadeMedida: 'L',
        capacidadeCopos: 400,
        nivelCopos: 400,
        transacoesAcumuladas: 0,
        receitaTotal: 0,
        ticketMedio: 35.0,
        tempoMedioAtendimentoSegundos: 25,
        pessoasNaFila: 1,
        tempoEstimadoEsperaMin: 0.5,
        temperaturaC: 2.5,
        pressaoPsi: 13.5,
        posicao3D: [autos.length * 2 - 4, 0, autos.length * 2 - 3],
        ultimoAbastecimento: 'Agora',
        consumoPorHora: [
          { hora: '20h', transacoes: 0, receita: 0 },
          { hora: '21h', transacoes: 0, receita: 0 },
          { hora: '22h', transacoes: 0, receita: 0 },
        ],
      };
      setAutos([...autos, novoAuto]);
    } else {
      const novoInsta: InstagramavelItem = {
        id: `inst-${Date.now()}`,
        codigo: `INSTA-${instas.length + 1}`,
        nome: formNome,
        patrocinador: formInsumoOuPatrocinador || 'Marca Parceira',
        categoriaCenario: 'Instalação Visual Iluminada',
        setor: formSetor,
        status: 'ativo',
        capturasTotais: 0,
        compartilhamentosSociaisEstimados: 0,
        alcanceEstimadoRedes: 0,
        tempoPermanenciaMedioSegundos: 75,
        avaliacaoMedia: 5.0,
        npsScore: 92,
        pessoasNaFila: 0,
        tempoEsperaMin: 0,
        iluminacaoCenica: {
          modo: 'Neon Pulsar',
          corPrincipal: '#ec4899',
          intensidadePct: 90,
        },
        posicao3D: [instas.length * 2 - 3, 0, -(instas.length * 2 - 2)],
        hashtagsPrincipais: ['#Festival2026', `#${formNome.replace(/\s+/g, '')}`],
        fotosRecentes: [],
      };
      setInstas([...instas, novoInsta]);
    }

    setFormNome('');
    setFormInsumoOuPatrocinador('');
    setShowAddModal(false);
  };

  const filteredInstas = filtroSetor ? instas.filter((i) => i.setor === filtroSetor) : instas;

  return (
    <div className="min-h-screen bg-raiz-dark text-raiz-text-light font-sans antialiased pb-16 selection:bg-raiz-accent selection:text-raiz-text-dark">
      {/* 1. TOP HEADER BAR */}
      <header className="bg-raiz-section border-b border-raiz-border-dark sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-raiz-accent/10 border border-raiz-accent/40 flex items-center justify-center text-raiz-accent shrink-0 shadow-lg shadow-raiz-accent/10">
              <Activity className="w-5 h-5 text-raiz-accent" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-raiz-text-light tracking-tight">
                  Venue Intelligence Core
                </h1>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-raiz-accent/10 border border-raiz-accent/40 text-raiz-accent">
                  RAÍZ
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-raiz-accent/10 border border-raiz-accent/40 text-raiz-accent">
                  <span className="w-2 h-2 rounded-full bg-raiz-accent inline-block animate-pulse" />
                  <span>NORMAL</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-raiz-text-light/75 font-mono mt-0.5 flex-wrap">
                <span>Gateway: api-evento-ia.onrender.com</span>
                <span className="text-raiz-text-light/55">·</span>
                <span className="text-raiz-accent font-bold">{pingLatency}ms</span>
                <span className="text-raiz-text-light/55">·</span>
                <span>Atualizado às {lastUpdate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-raiz-section border border-raiz-border-dark text-xs text-raiz-text-light/75 font-mono">
              <span className="text-raiz-text-light/75 mr-1">Auto:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(e.target.value)}
                className="bg-transparent text-raiz-text-light font-bold focus:outline-none cursor-pointer"
              >
                <option value="5s" className="bg-raiz-dark">5s</option>
                <option value="10s" className="bg-raiz-dark">10s</option>
                <option value="30s" className="bg-raiz-dark">30s</option>
              </select>
            </div>

            <button
              onClick={() => {
                setLastUpdate(new Date().toTimeString().split(' ')[0]);
                setPingLatency(Math.floor(410 + Math.random() * 30));
              }}
              className="p-2 rounded-lg bg-raiz-section border border-raiz-border-dark text-raiz-text-light/75 hover:text-raiz-text-light transition-colors"
              title="Sincronizar telemetria"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => void despachoOps()}
              disabled={ocupado === 'despacho'}
              title="Registra uma intervenção na API para a zona mais crítica"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/60 text-rose-300 text-xs font-semibold hover:bg-rose-900/40 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-wait"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Despacho Ops</span>
            </button>

            <button
              onClick={() => setShowTerminal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-raiz-accent hover:bg-raiz-accent/90 text-raiz-text-dark text-xs font-black transition-all shadow-md shadow-raiz-accent/20 active:scale-95"
            >
              <span className="font-mono">{'>_'}</span>
              <span>Terminal CLI</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-raiz-section border border-raiz-accent/40 text-raiz-accent text-xs font-bold hover:bg-raiz-section transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Atração</span>
            </button>
          </div>
        </div>

        {/* 2. SUB-HEADER HORIZONTAL NAVIGATION BAR */}
        <div className="bg-raiz-dark border-t border-b border-raiz-border-dark px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto py-2">
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-xs">
              <button
                onClick={() => setActiveTab('tudo')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${activeTab === 'tudo' ? 'text-raiz-accent font-bold bg-raiz-section border border-raiz-accent/40' : 'text-raiz-text-light/75 hover:text-raiz-text-light'
                  }`}
              >
                <span>Mapa & Arena</span>
              </button>

              <button
                onClick={() => setActiveTab('instagramavel')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${activeTab === 'instagramavel' ? 'text-raiz-accent font-bold bg-raiz-accent/10 border border-raiz-accent/40' : 'text-raiz-text-light/75 hover:text-raiz-text-light'
                  }`}
              >
                <Bot className="w-3.5 h-3.5 text-raiz-accent" />
                <span>Predições de Gargalos (IA)</span>
              </button>

              <button
                onClick={() => setActiveTab('instagramavel')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${
                  activeTab === 'instagramavel' ? 'text-raiz-accent font-bold bg-raiz-accent/10 border border-raiz-accent/40' : 'text-raiz-text-light/75 hover:text-raiz-text-light'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-raiz-accent" />
                <span>Instagramáveis</span>
              </button>

              <button
                onClick={() => setActiveTab('sintese')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${activeTab === 'sintese' ? 'text-raiz-accent font-bold bg-raiz-section border border-raiz-accent/40' : 'text-raiz-text-light/75 hover:text-raiz-text-light'
                  }`}
              >
                <span>Síntese Acumulada</span>
              </button>
            </div>

            <button
              onClick={() => setShowTerminal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-raiz-section border border-raiz-accent/40 text-raiz-accent text-xs font-mono font-bold hover:bg-raiz-accent/10 transition-colors shrink-0"
            >
              <span className="text-raiz-accent">{'>_'}</span>
              <span>Terminal de Execução</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <ApiToast feedback={feedback} onClose={limparFeedback} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-raiz-border-dark">
          <div>
            <h2 className="text-base sm:text-lg font-mono font-bold text-raiz-accent flex items-center gap-2">
              <span>{'>_'}</span>
              <span>Terminal Operacional & Execução de Diagnóstico</span>
            </h2>
            <p className="text-xs text-raiz-text-light/75 mt-0.5">
              Execução direta do script CLI com exibição detalhada de telemetria, integridade e logs em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShow3DMap(!show3DMap)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-raiz-accent bg-raiz-section border border-raiz-border-dark hover:bg-raiz-section rounded-lg transition-colors whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-raiz-accent" />
              <span>{show3DMap ? 'Ocultar Arena 3D' : 'Exibir Arena 3D'}</span>
            </button>
          </div>
        </div>

        {/* 3D Scene Viewport */}
        {show3DMap && (
          <div className="animate-in fade-in duration-300">
            <Venue3DScene
              autos={autos}
              instas={instas}
              selectedId={selectedAtracaoId}
              onSelectAtracao={(id) => setSelectedAtracaoId(id)}
            />
          </div>
        )}

        {/* Telemetria das 7 câmeras (dados da API) */}
        {activeTab === 'tudo' && (
          <div className="animate-in fade-in duration-200">
            <CameraTelemetryPanel />
          </div>
        )}

        {/* Seção 1: Síntese Acumulada */}
        {(activeTab === 'tudo' || activeTab === 'sintese') && (
          <div className="animate-in fade-in duration-200">
            <SinteseAcumulada
              data={sinteseData}
              setorAtivo={filtroSetor}
              onFiltrarSetor={(s) => setFiltroSetor(s)}
              onSimularPicoDeFluxo={handleSimularPicoDeFluxo}
              onExecutarAcaoSugerida={handleExecutarAcaoSugerida}
            />
          </div>
        )}

        {/* Seção: Predição de Gargalos (IA) */}
        {activeTab === 'predicao' && (
          <div className="animate-in fade-in duration-200">
            <PredicaoGargalosView autos={autos} instas={instas} historico={historico} />
          </div>
        )}

        {/* Seção 3: Pontos Instagramáveis */}
        {(activeTab === 'tudo' || activeTab === 'instagramavel') && (
          <section className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-raiz-text-light flex items-center gap-2">
                  <Camera className="w-5 h-5 text-raiz-accent" />
                  <span>Pontos Instagramáveis & Ativações de Marca</span>
                </h2>
                <p className="text-xs text-raiz-text-light/75">
                  Engajamento social, contagem de fotos, controle de iluminação cenográfica e satisfação.
                </p>
              </div>
              <span className="text-xs text-raiz-accent font-mono font-bold">
                {filteredInstas.length} de {instas.length} ativações ativas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInstas.map((item) => (
                <InstagramavelCard
                  key={item.id}
                  item={item}
                  isSelected={selectedAtracaoId === item.id}
                  onRegistrarCaptura={handleRegistrarCaptura}
                  onMudarModoLuz={handleMudarModoLuz}
                  onAlternarStatus={handleAlternarStatusInsta}
                  onSelectIn3D={(id) => {
                    setSelectedAtracaoId(id);
                    setShow3DMap(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Terminal CLI Modal */}
      <TerminalCLI
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
        onRunAction={(action) => {
          if (action === 'repor-tudo') {
            autos.forEach((a) => handleReabastecer(a.id));
          } else if (action === 'aliviar-filas') {
            handleExecutarAcaoSugerida('al-2');
          } else if (action === 'pico') {
            handleSimularPicoDeFluxo();
          }
        }}
      />

      {/* Modal para Cadastro de Nova Atração */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-raiz-dark rounded-2xl border border-raiz-accent/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-raiz-border-dark">
              <h3 className="text-base font-bold text-raiz-text-light">
                Cadastrar Nova Atração no Venue
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-raiz-text-light/75 hover:text-raiz-text-light rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarAtracao} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-raiz-text-light/75 block mb-1.5">
                  Tipo de Atração
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoTipo('autosservico')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${novoTipo === 'autosservico'
                        ? 'border-raiz-accent/40 bg-raiz-accent/10 text-raiz-accent'
                        : 'border-raiz-border-dark text-raiz-text-light/75 hover:bg-raiz-dark'
                      }`}
                  >
                    Totem Autosserviço
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoTipo('instagramavel')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors ${novoTipo === 'instagramavel'
                        ? 'border-raiz-accent/40 bg-raiz-accent/10 text-raiz-accent'
                        : 'border-raiz-border-dark text-raiz-text-light/75 hover:bg-raiz-dark'
                      }`}
                  >
                    Ponto Instagramável
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-raiz-text-light/75 block mb-1">
                  Nome da Atração
                </label>
                <input
                  type="text"
                  required
                  placeholder={novoTipo === 'autosservico' ? 'Ex: Beer Wall 05 - Pilsen Express' : 'Ex: Espelho de Neon Red Bull'}
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-raiz-border-dark bg-raiz-dark text-raiz-text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-raiz-accent/30 focus:border-raiz-accent/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-raiz-text-light/75 block mb-1">
                  Setor / Localização na Arena
                </label>
                <select
                  value={formSetor}
                  onChange={(e) => setFormSetor(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-raiz-border-dark bg-raiz-dark text-raiz-text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-raiz-accent/30 focus:border-raiz-accent/40"
                >
                  <option value="Arena Principal">Arena Principal</option>
                  <option value="Palco Sunset">Palco Sunset</option>
                  <option value="Camarote VIP">Camarote VIP</option>
                  <option value="Vila das Marcas">Vila das Marcas</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-raiz-text-light/75 block mb-1">
                  {novoTipo === 'autosservico' ? 'Tipo de Insumo / Produto' : 'Marca / Patrocinador Vinculado'}
                </label>
                <input
                  type="text"
                  placeholder={novoTipo === 'autosservico' ? 'Ex: Chopp IPA 500ml' : 'Ex: Spotify, Itaú, Heineken'}
                  value={formInsumoOuPatrocinador}
                  onChange={(e) => setFormInsumoOuPatrocinador(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-raiz-border-dark bg-raiz-dark text-raiz-text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-raiz-accent/30 focus:border-raiz-accent/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-raiz-border-dark">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-raiz-text-light/75 hover:text-raiz-text-light transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-raiz-text-dark bg-raiz-accent hover:bg-raiz-accent/90 rounded-lg transition-colors shadow-lg shadow-raiz-accent/20"
                >
                  Salvar e Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}