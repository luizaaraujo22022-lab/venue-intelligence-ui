import React, { useState, useEffect, useMemo, useId } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import type {
  InsumoItem,
  InsumoStatus,
  PrioridadeReabastecimento,
  ReabastecimentoResponse,
} from '../types/balcao';
import { getInsumosStatus, solicitarReabastecimento } from '../services/balcaoService';

interface EstoqueProgressProps {
  /** Insumos externos opcionais (se não fornecidos, o componente busca via API) */
  initialInsumos?: InsumoItem[];
  /** Permite compactar a visualização se embutido dentro de outro card */
  compact?: boolean;
  /** Callback opcional quando um reabastecimento for solicitado */
  onReabastecerSuccess?: (res: ReabastecimentoResponse) => void;
}

export const EstoqueProgress: React.FC<EstoqueProgressProps> = ({
  initialInsumos,
  compact = false,
  onReabastecerSuccess,
}) => {
  const [insumos, setInsumos] = useState<InsumoItem[]>(initialInsumos || []);
  const [loading, setLoading] = useState<boolean>(!initialInsumos);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | InsumoStatus>('TODOS');
  const [atualizadoEm, setAtualizadoEm] = useState<Date>(new Date());

  // Estado do Modal de Reabastecimento
  const [selectedItem, setSelectedItem] = useState<InsumoItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockPriority, setRestockPriority] = useState<PrioridadeReabastecimento>('ALTA');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<ReabastecimentoResponse | null>(null);

  const searchInputId = useId();
  const restockQtyInputId = useId();
  const restockPrioritySelectId = useId();

  // Carrega dados da API se não passados via props
  const carregarInsumos = async () => {
    setLoading(true);
    try {
      const res = await getInsumosStatus();
      setInsumos(res.data.insumos);
      setIsSimulated(res.isMock);
      setAtualizadoEm(new Date());
    } catch (err) {
      console.error('Erro ao carregar insumos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialInsumos) {
      carregarInsumos();
    } else {
      setInsumos(initialInsumos);
    }
  }, [initialInsumos]);

  // Cálculos de métricas consolidadas
  const totalItens = insumos.length;
  const itensCriticos = insumos.filter((i) => i.status === 'DEFICIT_CRITICO').length;
  const itensAtencao = insumos.filter((i) => i.status === 'ATENCAO').length;
  const nivelMedioPct = useMemo(() => {
    if (totalItens === 0) return 100;
    const soma = insumos.reduce((acc, item) => {
      const ratio = item.quantidade_minima > 0
        ? Math.min(100, Math.round((item.quantidade_atual / item.quantidade_minima) * 100))
        : 100;
      return acc + ratio;
    }, 0);
    return Math.round(soma / totalItens);
  }, [insumos, totalItens]);

  // Filtro de insumos
  const insumosFiltrados = useMemo(() => {
    return insumos.filter((item) => {
      const matchSearch =
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.localizacao.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'TODOS' || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [insumos, searchTerm, statusFilter]);

  // Abrir modal de reabastecimento
  const handleOpenRestock = (item: InsumoItem) => {
    setSelectedItem(item);
    setRestockQty(item.deficit_estimado > 0 ? item.deficit_estimado : 10);
    setRestockPriority(item.status === 'DEFICIT_CRITICO' ? 'URGENTE' : 'ALTA');
    setSuccessFeedback(null);
  };

  // Submeter solicitação de reabastecimento
  const handleSubmitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const res = await solicitarReabastecimento({
        item_id: selectedItem.item_id,
        quantidade_solicitada: Number(restockQty),
        prioridade: restockPriority,
      });

      setSuccessFeedback(res);
      if (onReabastecerSuccess) {
        onReabastecerSuccess(res);
      }

      setInsumos((prev) =>
        prev.map((i) => {
          if (i.item_id === selectedItem.item_id) {
            const novaQtd = i.quantidade_atual + Number(restockQty);
            const novoDeficit = Math.max(0, i.quantidade_minima - novaQtd);
            let novoStatus: InsumoStatus = 'NORMAL';
            if (novoDeficit > 0) {
              novoStatus = novaQtd <= i.quantidade_minima * 0.4 ? 'DEFICIT_CRITICO' : 'ATENCAO';
            }
            return {
              ...i,
              quantidade_atual: novaQtd,
              deficit_estimado: novoDeficit,
              status: novoStatus,
            };
          }
          return i;
        })
      );

      setTimeout(() => {
        setSelectedItem(null);
        setSuccessFeedback(null);
      }, 1800);
    } catch (err) {
      console.error('Falha ao solicitar reabastecimento:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyles = (status: InsumoStatus) => {
    switch (status) {
      case 'DEFICIT_CRITICO':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          text: 'text-rose-400',
          bar: 'bg-rose-500',
          track: 'bg-rose-950/40',
          label: 'Déficit Crítico',
          icon: AlertTriangle,
        };
      case 'ATENCAO':
        return {
          badge: 'bg-[#FFD600]/20 text-[#FFD600] border-[#FFD600]/40',
          text: 'text-[#FFD600]',
          bar: 'bg-[#FFD600]',
          track: 'bg-amber-950/30',
          label: 'Atenção / Repor',
          icon: Clock,
        };
      case 'NORMAL':
      default:
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          text: 'text-emerald-400',
          bar: 'bg-emerald-400',
          track: 'bg-[#0B0F19]',
          label: 'Estoque Seguro',
          icon: CheckCircle2,
        };
    }
  };

  return (
    <div className="space-y-4 font-sans text-gray-100">
      {/* Header do Módulo de Estoque */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#FFD600]/10 border border-[#FFD600]/30 text-[#FFD600]">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-100 tracking-wide flex items-center gap-2">
                Níveis de Estoque & Insumos dos Bares
                {isSimulated && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                    Modo Contingência
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">
                Monitoramento preditivo de rupturas de chopp, destilados e insumos operacionais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-gray-500">
              Sincronizado: {atualizadoEm.toLocaleTimeString('pt-BR')}
            </span>
            <button
              onClick={carregarInsumos}
              disabled={loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Recarregar Estoque"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#FFD600]' : ''} />
            </button>
          </div>
        </div>
      )}

      {/* Cards de Métricas de Insumos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#131B2E] border border-[#1E293B] p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400">Itens Monitorados</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{totalItens}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Categorias de bar e apoio</p>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-800/60 border border-[#1E293B] text-gray-300">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#1E293B] p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400">Déficits Críticos</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-xl font-bold font-mono ${itensCriticos > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {itensCriticos}
              </span>
              {itensAtencao > 0 && (
                <span className="text-xs font-mono text-[#FFD600]">
                  +{itensAtencao} em atenção
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {itensCriticos > 0 ? 'Exigem reposição lateral urgente' : 'Nenhuma ruptura detectada'}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg border ${itensCriticos > 0 ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}>
            {itensCriticos > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#1E293B] p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400">Nível Médio de Segurança</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-[#FFD600]">
                {nivelMedioPct}%
              </span>
              <span className="text-[10px] text-gray-400">buffer tático</span>
            </div>
            <div className="w-28 bg-[#0B0F19] h-1.5 rounded-full mt-1.5 border border-[#1E293B] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${nivelMedioPct < 60 ? 'bg-rose-500' : nivelMedioPct < 80 ? 'bg-[#FFD600]' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, Math.max(5, nivelMedioPct))}%` }}
              />
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#FFD600]/10 border border-[#FFD600]/30 text-[#FFD600]">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#131B2E] p-2.5 rounded-xl border border-[#1E293B]">
        <div className="relative flex-1">
          <label htmlFor={searchInputId} className="sr-only">
            Buscar por insumo, código ou bar
          </label>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            id={searchInputId}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por insumo, código (ex: BAR-83) ou bar..."
            className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#FFD600] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1 mr-1">
            <Filter size={11} /> Filtro:
          </span>
          {(['TODOS', 'DEFICIT_CRITICO', 'ATENCAO', 'NORMAL'] as const).map((st) => {
            const isSelected = statusFilter === st;
            const labelMap = {
              TODOS: 'Todos',
              DEFICIT_CRITICO: 'Críticos',
              ATENCAO: 'Atenção',
              NORMAL: 'Normais',
            };
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#FFD600] text-[#0B0F19] font-bold shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {labelMap[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Insumos com Barra de Progresso */}
      <div className="space-y-3">
        {insumosFiltrados.length === 0 ? (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-xl p-8 text-center text-gray-400">
            <Package size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Nenhum insumo encontrado</p>
            <p className="text-xs text-gray-500 mt-1">Verifique o termo buscado ou remova os filtros.</p>
          </div>
        ) : (
          insumosFiltrados.map((item) => {
            const style = getStatusStyles(item.status);
            const StatusIcon = style.icon;

            const baseTeto = Math.max(item.quantidade_minima * 2, item.quantidade_atual * 1.25, 1);
            const percentualAtual = Math.min(100, Math.round((item.quantidade_atual / baseTeto) * 100));
            const pontoMinimoPct = Math.min(100, Math.round((item.quantidade_minima / baseTeto) * 100));

            return (
              <div
                key={item.item_id}
                className={`bg-[#131B2E] border rounded-xl p-4 transition-all duration-200 hover:border-gray-700 ${
                  item.status === 'DEFICIT_CRITICO'
                    ? 'border-rose-500/40 shadow-sm shadow-rose-950/30'
                    : 'border-[#1E293B]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-[#FFD600] bg-[#FFD600]/10 px-2 py-0.5 rounded border border-[#FFD600]/20 font-bold">
                        {item.item_id}
                      </span>
                      <h4 className="font-semibold text-sm text-white truncate">{item.nome}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${style.badge}`}>
                        <StatusIcon size={11} />
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                      Local: <span className="text-gray-300 font-medium">{item.localizacao}</span>
                    </p>
                  </div>

                  {/* Ação de Reabastecimento */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenRestock(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                        item.status === 'DEFICIT_CRITICO'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-[#1E293B]'
                      }`}
                    >
                      <ArrowUpRight size={14} />
                      <span>{item.status === 'DEFICIT_CRITICO' ? 'Reposição Urgente' : 'Reabastecer'}</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso com Marcador de Segurança */}
                <div className="mt-3">
                  <div className="flex justify-between items-baseline text-xs mb-1 font-mono">
                    <span className="text-gray-400 flex items-center gap-1">
                      Nível Atual: <strong className="text-white text-sm">{item.quantidade_atual}</strong> un
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Mínimo de Segurança: <strong className="text-gray-300">{item.quantidade_minima}</strong> un
                    </span>
                    {item.deficit_estimado > 0 && (
                      <span className="text-rose-400 font-bold text-[11px]">
                        Déficit: -{item.deficit_estimado} un
                      </span>
                    )}
                  </div>

                  <div className="relative h-2.5 rounded-full bg-[#0B0F19] border border-[#1E293B] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                      style={{ width: `${percentualAtual}%` }}
                    />

                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10"
                      style={{ left: `${pontoMinimoPct}%` }}
                      title={`Mínimo: ${item.quantidade_minima}`}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 font-mono">
                    <span>0 un</span>
                    <span className="text-gray-400">| Marca de Segurança ({item.quantidade_minima})</span>
                    <span>Teto ideal (~{Math.round(baseTeto)})</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Diálogo Tático de Reabastecimento */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/30 text-[#FFD600]">
                <Package size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Solicitar Reabastecimento</h3>
                <p className="text-xs text-gray-400 font-mono">POST /api/v1/insumos/reabastecimento</p>
              </div>
            </div>

            {successFeedback ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 animate-bounce" />
                <h4 className="font-bold text-sm text-emerald-300">Solicitação Registrada com Sucesso!</h4>
                <p className="font-mono text-xs text-gray-300">
                  Protocolo: <span className="text-[#FFD600] font-bold">{successFeedback.protocolo_id}</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  Status: <span className="text-emerald-400 font-semibold">{successFeedback.status_pedido}</span> | Staff volante acionado.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRestock} className="space-y-4">
                <div className="bg-[#0B0F19] p-3 rounded-xl border border-[#1E293B] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] text-[#FFD600]">{selectedItem.item_id}</span>
                    <span className="text-[10px] text-gray-400">{selectedItem.localizacao}</span>
                  </div>
                  <p className="font-semibold text-sm text-white">{selectedItem.nome}</p>
                  <p className="text-xs text-gray-400">
                    Estoque Atual: <strong className="text-white">{selectedItem.quantidade_atual}</strong> | Mínimo: {selectedItem.quantidade_minima}
                  </p>
                </div>

                <div>
                  <label htmlFor={restockQtyInputId} className="block text-xs font-mono text-gray-300 uppercase mb-1.5">
                    Quantidade Solicitada (Unidades)
                  </label>
                  <input
                    id={restockQtyInputId}
                    type="number"
                    min="1"
                    max="1000"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#FFD600]"
                  />
                  {selectedItem.deficit_estimado > 0 && (
                    <p className="text-[11px] text-[#FFD600] mt-1 font-mono">
                      Déficit recomendado para equalização: {selectedItem.deficit_estimado} un
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={restockPrioritySelectId} className="block text-xs font-mono text-gray-300 uppercase mb-1.5">
                    Prioridade Logística
                  </label>
                  <select
                    id={restockPrioritySelectId}
                    value={restockPriority}
                    onChange={(e) => setRestockPriority(e.target.value as PrioridadeReabastecimento)}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#FFD600]"
                  >
                    <option value="URGENTE">URGENTE (Ruptura Iminente / Pico de Demanda)</option>
                    <option value="ALTA">ALTA (Prioridade Tática)</option>
                    <option value="MEDIA">MEDIA (Reposição Programada)</option>
                    <option value="BAIXA">BAIXA (Buffer Preventivo)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FFD600] text-[#0B0F19] font-bold px-4 py-2 rounded-lg text-xs hover:bg-[#ffe142] transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Confirmar Envio
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

export default EstoqueProgress;
