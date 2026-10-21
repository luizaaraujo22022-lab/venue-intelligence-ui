import React, { useState, useEffect, useMemo, useId } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  Radio,
  RefreshCw,
  Search,
  CheckCircle2,
  ShieldAlert,
  ArrowRightLeft,
  UserCheck,
  Send,
  X,
  Package,
} from 'lucide-react';
import type {
  PdvStatusItem,
  StatusCor,
  ModoLeitura,
  NivelCritico,
  OperationalDispatchResponse,
} from '../types/balcao';
import { getBalcaoPdvs, registrarDispatch, getDispatches } from '../services/balcaoService';
import { EstoqueProgress } from './EstoqueProgress';

/** Formata segundos em mm:ss */
function formatarTempoEspera(segundos: number): string {
  if (segundos <= 0) return '00m 00s';
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  if (min === 0) return `${seg}s`;
  return `${String(min).padStart(2, '0')}m ${String(seg).padStart(2, '0')}s`;
}

export const BalcaoStatus: React.FC = () => {
  const [pdvs, setPdvs] = useState<PdvStatusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date>(new Date());
  const [activeSubTab, setActiveSubTab] = useState<'BALCOES' | 'ESTOQUE' | 'INTERVENCOES'>('BALCOES');

  // Filtros de busca e status
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | StatusCor>('TODOS');
  const [somenteRuptura, setSomenteRuptura] = useState<boolean>(false);

  // Modal de Intervenção Operacional (Staff Móvel)
  const [selectedPdvForDispatch, setSelectedPdvForDispatch] = useState<PdvStatusItem | null>(null);
  const [dispatchNivel, setDispatchNivel] = useState<NivelCritico>('ALTO');
  const [dispatchAcao, setDispatchAcao] = useState<string>('');
  const [submittingDispatch, setSubmittingDispatch] = useState<boolean>(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<OperationalDispatchResponse | null>(null);
  const [dispatches, setDispatches] = useState<OperationalDispatchResponse[]>([]);

  const searchInputId = useId();
  const dispatchAcaoInputId = useId();
  const dispatchNivelSelectId = useId();

  // Carrega dados dos balcões e dispatches
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resPdvs, resDispatches] = await Promise.all([
        getBalcaoPdvs(),
        getDispatches(),
      ]);
      setPdvs(resPdvs.data);
      setIsSimulated(resPdvs.isMock);
      setDispatches(resDispatches);
      setAtualizadoEm(new Date());
    } catch (err) {
      console.error('Erro ao carregar status do balcão:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 20_000);
    return () => clearInterval(interval);
  }, []);

  const bares = useMemo(() => {
    return pdvs.filter((p) => p.tipo === 'BAR' || p.nome.toLowerCase().includes('bar') || p.nome.toLowerCase().includes('balcão'));
  }, [pdvs]);

  const totalBares = bares.length;
  const baresAmarelos = bares.filter((b) => b.ultima_leitura?.status_cor === 'AMARELO').length;
  const baresVermelhos = bares.filter((b) => b.ultima_leitura?.status_cor === 'VERMELHO').length;
  const totalRupturas = bares.filter((b) => b.ultima_leitura?.alerta_ruptura_estoque).length;
  const totalPessoasFila = bares.reduce((acc, b) => acc + (b.ultima_leitura?.contagem_pessoas || 0), 0);

  const tempoMedioGeralSeg = useMemo(() => {
    if (totalBares === 0) return 0;
    const soma = bares.reduce((acc, b) => acc + (b.ultima_leitura?.tempo_espera_seg || 0), 0);
    return Math.round(soma / totalBares);
  }, [bares, totalBares]);

  const baresFiltrados = useMemo(() => {
    return bares.filter((b) => {
      const matchSearch =
        b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.localizacao_geo.toLowerCase().includes(searchTerm.toLowerCase());

      const corAtual = b.ultima_leitura?.status_cor;
      const matchStatus = statusFilter === 'TODOS' || corAtual === statusFilter;

      const matchRuptura = !somenteRuptura || Boolean(b.ultima_leitura?.alerta_ruptura_estoque);

      return matchSearch && matchStatus && matchRuptura;
    });
  }, [bares, searchTerm, statusFilter, somenteRuptura]);

  const handleOpenDispatch = (pdv: PdvStatusItem) => {
    setSelectedPdvForDispatch(pdv);
    setDispatchNivel(pdv.ultima_leitura?.status_cor === 'VERMELHO' ? 'CRITICO_PCD_CLIMA' : 'ALTO');
    setDispatchAcao(
      pdv.ultima_leitura?.alerta_ruptura_estoque
        ? `Acionar reposição lateral urgente de estoque e balancear fluxo no ${pdv.nome.split('|')[0].trim()}`
        : `Reforçar staff de atendimento e orientar fila para aliviar espera no ${pdv.nome.split('|')[0].trim()}`
    );
    setDispatchFeedback(null);
  };

  const handleSubmitDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdvForDispatch) return;

    setSubmittingDispatch(true);
    try {
      const res = await registrarDispatch({
        pdv_id: selectedPdvForDispatch.id,
        nivel_critico: dispatchNivel,
        sugestao_acao: dispatchAcao,
      });

      setDispatchFeedback(res);
      setDispatches((prev) => [res, ...prev]);

      setTimeout(() => {
        setSelectedPdvForDispatch(null);
        setDispatchFeedback(null);
      }, 1800);
    } catch (err) {
      console.error('Erro ao enviar dispatch:', err);
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const getStatusCorBadge = (cor?: StatusCor) => {
    switch (cor) {
      case 'VERDE':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'FLUXO LIVRE (< 5 min)',
          descricao: 'Atendimento célere dentro da meta',
        };
      case 'AMARELO':
        return {
          bg: 'bg-[#FFD600]/15 text-[#FFD600] border-[#FFD600]/30',
          dot: 'bg-[#FFD600]',
          label: 'ATENÇÃO (5 a 12 min)',
          descricao: 'Pressão moderada na fila',
        };
      case 'VERMELHO':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
          dot: 'bg-rose-500',
          label: 'CRÍTICO (> 12 min)',
          descricao: 'Barreira psicológica de abandono excedida',
        };
      default:
        return {
          bg: 'bg-gray-800 text-gray-400 border-gray-700',
          dot: 'bg-gray-500',
          label: 'SEM LEITURA',
          descricao: 'Aguardando telemetria',
        };
    }
  };

  const getModoLeituraBadge = (modo?: ModoLeitura) => {
    switch (modo) {
      case 'TEMPO_REAL':
        return { label: 'TEMPO REAL', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'MEDIA_MOVEL_504':
        return { label: 'MÉDIA MÓVEL (504)', style: 'text-[#FFD600] bg-[#FFD600]/10 border-[#FFD600]/20' };
      case 'FALLBACK_502':
        return { label: 'FALLBACK (502)', style: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
      case 'CONTINGENCIA_503':
        return { label: 'CONTINGÊNCIA (503)', style: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      default:
        return { label: 'PADRÃO', style: 'text-gray-400 bg-gray-800 border-gray-700' };
    }
  };

  return (
    <div className="space-y-6 font-sans text-gray-100">
      {/* Cabeçalho do Módulo */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Balcão & Filas</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/30 font-semibold">
                MÓDULO 2
              </span>
            </h2>
            {isSimulated && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                Mock Contingência
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Telemetria semafórica, tempo de espera em filas e governança de estoque de bares em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gray-400 bg-[#0B0F19] px-2.5 py-1 rounded border border-[#1E293B]">
            Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR')}
          </span>
          <button
            onClick={carregarDados}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#131B2E] border border-[#1E293B] text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Sincronizar telemetria agora"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#FFD600]' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* Navegação Secundária do Módulo (Subtabs) */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2">
        <button
          onClick={() => setActiveSubTab('BALCOES')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'BALCOES'
              ? 'bg-[#FFD600] text-[#0B0F19] shadow-sm font-bold'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <Users size={15} />
          <span>Bares & Filas ({totalBares})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ESTOQUE')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'ESTOQUE'
              ? 'bg-[#FFD600] text-[#0B0F19] shadow-sm font-bold'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <Package size={15} />
          <span>Estoque & Insumos</span>
          {totalRupturas > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-mono font-bold">
              {totalRupturas}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('INTERVENCOES')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'INTERVENCOES'
              ? 'bg-[#FFD600] text-[#0B0F19] shadow-sm font-bold'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
        >
          <UserCheck size={15} />
          <span>Intervenções / Staff ({dispatches.length})</span>
        </button>
      </div>

      {activeSubTab === 'ESTOQUE' && (
        <EstoqueProgress />
      )}

      {activeSubTab === 'INTERVENCOES' && (
        <div className="space-y-4">
          <div className="bg-[#131B2E] border border-[#1E293B] p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Histórico de Intervenções Operacionais</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Staff móvel acionado para desobstrução de filas e reposição lateral de insumos (POST /api/v1/ops/dispatch)
              </p>
            </div>
            <span className="text-xs font-mono text-[#FFD600] bg-[#FFD600]/10 border border-[#FFD600]/20 px-2.5 py-1 rounded">
              {dispatches.length} Registros
            </span>
          </div>

          <div className="space-y-2.5">
            {dispatches.length === 0 ? (
              <div className="bg-[#131B2E] border border-[#1E293B] rounded-xl p-8 text-center text-gray-400">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium">Nenhuma intervenção registrada no momento</p>
                <p className="text-xs text-gray-500 mt-1">Todos os balcões estão operando dentro dos parâmetros de contingência.</p>
              </div>
            ) : (
              dispatches.map((disp) => {
                const pdvOrigem = pdvs.find((p) => p.id === disp.pdv_id);
                return (
                  <div
                    key={disp.id}
                    className="bg-[#131B2E] border border-[#1E293B] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#FFD600] bg-[#FFD600]/10 px-2 py-0.5 rounded border border-[#FFD600]/20">
                          #{disp.id}
                        </span>
                        <span className="font-semibold text-sm text-white">
                          {pdvOrigem?.nome || `PDV #${disp.pdv_id}`}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          disp.nivel_critico === 'CRITICO_PCD_CLIMA'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {disp.nivel_critico}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {disp.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">{disp.sugestao_acao}</p>
                    </div>
                    <div className="font-mono text-[11px] text-gray-500 shrink-0">
                      {new Date(disp.criado_em).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'BALCOES' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-[#131B2E] border border-[#1E293B] p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
                <span>BARES MONITORADOS</span>
                <Radio className="w-4 h-4 text-[#FFD600]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">{totalBares}</span>
                <span className="text-xs text-emerald-400 font-mono">100% ONLINE</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Capacidade somada: {bares.reduce((a, b) => a + b.capacidade, 0)} pessoas</p>
            </div>

            <div className="bg-[#131B2E] border border-[#1E293B] p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
                <span>TEMPO MÉDIO DE FILA</span>
                <Clock className="w-4 h-4 text-[#FFD600]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">
                  {formatarTempoEspera(tempoMedioGeralSeg)}
                </span>
                <span className={`text-xs font-mono ${tempoMedioGeralSeg <= 300 ? 'text-emerald-400' : 'text-[#FFD600]'}`}>
                  {tempoMedioGeralSeg <= 300 ? 'META OK' : 'PRESSÃO'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Limite aceitável: &lt; 05m 00s</p>
            </div>

            <div className="bg-[#131B2E] border border-[#1E293B] p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
                <span>PESSOAS EM ESPERA</span>
                <Users className="w-4 h-4 text-[#FFD600]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">{totalPessoasFila}</span>
                <span className="text-xs text-gray-400 font-mono">aguardando</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Somatório das filas em tempo real</p>
            </div>

            <div className="bg-[#131B2E] border border-[#1E293B] p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
                <span>SOBRECARGA & RUPTURAS</span>
                <AlertTriangle className={`w-4 h-4 ${baresVermelhos > 0 || totalRupturas > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black font-mono ${baresVermelhos > 0 ? 'text-rose-400' : 'text-white'}`}>
                  {baresVermelhos + baresAmarelos}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  ({baresVermelhos} crit / {totalRupturas} rupturas)
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                {totalRupturas > 0 ? 'Exigem reposição lateral rápida' : 'Nível de abastecimento estável'}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#131B2E] p-3 rounded-xl border border-[#1E293B]">
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">
                Filtrar balcão por nome ou zona
              </label>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id={searchInputId}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar balcão por nome (ex: Tap House, Z1, Sul)..."
                className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#FFD600] transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                {(['TODOS', 'VERDE', 'AMARELO', 'VERMELHO'] as const).map((cor) => {
                  const isSelected = statusFilter === cor;
                  const labelMap = {
                    TODOS: 'Todos',
                    VERDE: 'Livre',
                    AMARELO: 'Atenção',
                    VERMELHO: 'Crítico',
                  };
                  return (
                    <button
                      key={cor}
                      onClick={() => setStatusFilter(cor)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#FFD600] text-[#0B0F19] font-bold shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {labelMap[cor]}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setSomenteRuptura(!somenteRuptura)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 transition-colors ${
                  somenteRuptura
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                    : 'text-gray-400 border-[#1E293B] hover:text-white hover:bg-gray-800'
                }`}
              >
                <AlertTriangle size={12} />
                <span>Rupturas de Estoque</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {baresFiltrados.length === 0 ? (
              <div className="col-span-full bg-[#131B2E] border border-[#1E293B] rounded-xl p-10 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Nenhum bar encontrado com os filtros selecionados</p>
                <p className="text-xs text-gray-500 mt-1">Tente redefinir a busca ou mudar o filtro semafórico.</p>
              </div>
            ) : (
              baresFiltrados.map((bar) => {
                const leitura = bar.ultima_leitura;
                const corBadge = getStatusCorBadge(leitura?.status_cor);
                const modoBadge = getModoLeituraBadge(leitura?.modo_leitura);
                const pessoas = leitura?.contagem_pessoas ?? 0;
                const cap = bar.capacidade > 0 ? bar.capacidade : 30;
                const lotacaoPct = Math.min(100, Math.round((pessoas / cap) * 100));
                const densidade = leitura?.densidade_m2 ?? 0;
                const tempoEspera = leitura?.tempo_espera_seg ?? 0;
                const confianca = Math.round((leitura?.confianca_ia ?? 0.95) * 100);

                return (
                  <div
                    key={bar.id}
                    className={`bg-[#131B2E] border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-md relative overflow-hidden ${
                      leitura?.status_cor === 'VERMELHO'
                        ? 'border-rose-500/50 shadow-rose-950/40'
                        : bar.habilitar_redirecionamento_push
                        ? 'border-[#FFD600]/40'
                        : 'border-[#1E293B] hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                              PDV #{bar.id}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${corBadge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${corBadge.dot}`}></span>
                              {corBadge.label}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${modoBadge.style}`}>
                              {modoBadge.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-white">{bar.nome}</h3>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{bar.localizacao_geo}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-mono uppercase text-gray-400">Tempo na Fila</p>
                          <p className={`text-2xl font-black font-mono tracking-tight ${
                            tempoEspera > 720 ? 'text-rose-400' : tempoEspera > 300 ? 'text-[#FFD600]' : 'text-emerald-400'
                          }`}>
                            {formatarTempoEspera(tempoEspera)}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">IA: {confianca}% conf.</p>
                        </div>
                      </div>

                      {bar.habilitar_redirecionamento_push && (
                        <div className="my-3 p-2.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 flex items-center justify-between text-xs text-[#FFD600]">
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft size={16} className="shrink-0 animate-pulse" />
                            <div>
                              <strong className="font-semibold">Redirecionamento PUSH Ativo</strong>
                              <p className="text-[11px] text-gray-300">Tempo &gt; 3 min. Desviando fluxo no app para bares vizinhos.</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-[#FFD600]/20 px-2 py-0.5 rounded border border-[#FFD600]/30">
                            BALANÇO AUTO
                          </span>
                        </div>
                      )}

                      {leitura?.alerta_ruptura_estoque && (
                        <div className="my-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="shrink-0 text-rose-400 animate-bounce" />
                            <div>
                              <strong className="font-semibold text-rose-300">Alerta de Ruptura de Estoque!</strong>
                              <p className="text-[11px] text-rose-200/80">Estoque &lt; 45% ou fila sem giro de POS nos últimos 3 minutos.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveSubTab('ESTOQUE')}
                            className="text-[10px] font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded transition-colors shrink-0"
                          >
                            Ver Insumos
                          </button>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-[#1E293B]/70">
                        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                          <span className="text-gray-400">
                            Ocupação da Fila: <strong className="text-white">{pessoas}</strong> de {cap} pessoas
                          </span>
                          <span className={`font-bold ${lotacaoPct >= 90 ? 'text-rose-400' : lotacaoPct >= 70 ? 'text-[#FFD600]' : 'text-emerald-400'}`}>
                            {lotacaoPct}% capacidade
                          </span>
                        </div>

                        <div className="w-full bg-[#0B0F19] h-2 rounded-full border border-[#1E293B] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              lotacaoPct >= 90 ? 'bg-rose-500' : lotacaoPct >= 70 ? 'bg-[#FFD600]' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${lotacaoPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 text-[11px] font-mono text-gray-400 border-t border-[#1E293B]/40">
                        <div>
                          Densidade: <strong className="text-gray-200">{densidade.toFixed(2)} pess/m²</strong>
                        </div>
                        <div className="text-right">
                          Área: <strong className="text-gray-200">{bar.area_m2} m²</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-gray-500">
                        {leitura?.timestamp ? `Leitura: ${new Date(leitura.timestamp).toLocaleTimeString('pt-BR')}` : 'Sem telemetria'}
                      </span>

                      <button
                        onClick={() => handleOpenDispatch(bar)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-[#1E293B] hover:border-[#FFD600]/40 transition-colors"
                      >
                        <UserCheck size={13} className="text-[#FFD600]" />
                        <span>Acionar Staff</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {selectedPdvForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPdvForDispatch(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Acionar Staff Móvel</h3>
                <p className="text-xs text-gray-400 font-mono">POST /api/v1/ops/dispatch</p>
              </div>
            </div>

            {dispatchFeedback ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 animate-bounce" />
                <h4 className="font-bold text-sm text-emerald-300">Staff Despachado com Sucesso!</h4>
                <p className="font-mono text-xs text-gray-300">
                  ID Operação: <span className="text-[#FFD600] font-bold">#{dispatchFeedback.id}</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  Estado operacional atualizado para <span className="text-[#FFD600] font-semibold">{dispatchFeedback.status}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDispatch} className="space-y-4">
                <div className="bg-[#0B0F19] p-3 rounded-xl border border-[#1E293B] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] text-[#FFD600]">PDV #{selectedPdvForDispatch.id}</span>
                    <span className="text-[10px] text-gray-400">{selectedPdvForDispatch.localizacao_geo}</span>
                  </div>
                  <p className="font-semibold text-sm text-white">{selectedPdvForDispatch.nome}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    Espera Atual: <strong className="text-white">{formatarTempoEspera(selectedPdvForDispatch.ultima_leitura?.tempo_espera_seg || 0)}</strong> | Pessoas: {selectedPdvForDispatch.ultima_leitura?.contagem_pessoas || 0}
                  </p>
                </div>

                <div>
                  <label htmlFor={dispatchNivelSelectId} className="block text-xs font-mono text-gray-300 uppercase mb-1.5">
                    Nível de Criticidade da Ação
                  </label>
                  <select
                    id={dispatchNivelSelectId}
                    value={dispatchNivel}
                    onChange={(e) => setDispatchNivel(e.target.value as NivelCritico)}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#FFD600]"
                  >
                    <option value="CRITICO_PCD_CLIMA">CRÍTICO (Desobstrução Rota PCD / Pico Extremo)</option>
                    <option value="ALTO">ALTO (Fila em Saturação Vermelha)</option>
                    <option value="MEDIO">MÉDIO (Apoio Preventivo na Operação)</option>
                    <option value="BAIXO">BAIXO (Rotina de Alinhamento)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={dispatchAcaoInputId} className="block text-xs font-mono text-gray-300 uppercase mb-1.5">
                    Sugestão de Ação para a Equipe Volante
                  </label>
                  <textarea
                    id={dispatchAcaoInputId}
                    rows={3}
                    value={dispatchAcao}
                    onChange={(e) => setDispatchAcao(e.target.value)}
                    required
                    minLength={5}
                    placeholder="Instruções táticas para o staff móvel..."
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FFD600]"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Instrução tática que será transmitida aos rádios/terminais de campo.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPdvForDispatch(null)}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDispatch}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FFD600] text-[#0B0F19] font-bold px-4 py-2 rounded-lg text-xs hover:bg-[#ffe142] transition-colors disabled:opacity-50"
                  >
                    {submittingDispatch ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Confirmar Dispatch
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalcaoStatus;
