import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Share2, 
  Clock, 
  CheckCircle, 
  Download, 
  Zap, 
  Activity, 
  Layers, 
  AlertTriangle
} from 'lucide-react';
import type { SinteseAcumuladaData } from '../types/venue';

interface SinteseAcumuladaProps {
  data: SinteseAcumuladaData;
  setorAtivo?: string | null;
  onFiltrarSetor?: (setor: string | null) => void;
  onSimularPicoDeFluxo?: () => void;
  onExportarCSV?: () => void;
  onExecutarAcaoSugerida?: (alertaId: string, atracaoId?: string) => void;
}

export const SinteseAcumulada: React.FC<SinteseAcumuladaProps> = ({
  data,
  setorAtivo = null,
  onFiltrarSetor,
  onSimularPicoDeFluxo,
  onExportarCSV,
  onExecutarAcaoSugerida,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [alertaDismissed, setAlertaDismissed] = useState<Record<string, boolean>>({});
  const [alertasExecutados, setAlertasExecutados] = useState<Record<string, boolean>>({});

  const handleExecutarSugestao = (alertaId: string, atracaoId?: string) => {
    setAlertasExecutados((prev) => ({ ...prev, [alertaId]: true }));
    if (onExecutarAcaoSugerida) {
      onExecutarAcaoSugerida(alertaId, atracaoId);
    }
  };

  const handleExport = () => {
    setDownloading(true);
    if (onExportarCSV) {
      onExportarCSV();
    } else {
      const headers = ['Métrica', 'Valor'];
      const rows = [
        ['Evento', data.eventoNome],
        ['Data', data.dataEvento],
        ['Atendimentos Totais', data.totalAtendimentosGerais.toString()],
        ['Receita Autosserviço (R$)', data.receitaTotalAutosservico.toFixed(2)],
        ['Capturas Instagramáveis', data.totalCapturasInstagramavel.toString()],
        ['Alcance Social Estimado', data.alcanceTotalRedes.toString()],
        ['Ticket Médio (R$)', data.ticketMedioGeral.toFixed(2)],
        ['Vazão Média (atend/min)', data.vazaoMediaAtendimentosPorMin.toString()],
        ['Tempo Médio de Espera (min)', data.tempoMedioEsperaGlobalMin.toString()],
        ['Satisfação Média (NPS/Score)', data.satisfacaoGeralScore.toString()],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(';')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sintese_acumulada_evento_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => setDownloading(false), 800);
  };

  const maxFluxo = Math.max(...data.fluxoHorario.map((f) => f.autosservico + f.instagramavel), 1);

  return (
    <section className="space-y-6">
      {/* 1. DESTAQUE: CARD DE PREDIÇÃO DE GARGALOS */}
      <div className="space-y-4">
        {data.principaisAlertas
          .filter((a) => !alertaDismissed[a.id])
          .map((alerta) => {
            const isExecutado = alertasExecutados[alerta.id];
            return (
              <div 
                key={alerta.id}
                className="relative rounded-2xl border border-rose-600/80 bg-raiz-section p-5 sm:p-6 shadow-2xl shadow-rose-950/40 text-raiz-text-light"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 shadow-md">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    </div>

                    <span className="font-mono font-bold text-[11px] px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 tracking-wider">
                      PRODUTO 2 • IA MOTOR PREDITIVO
                    </span>

                    <span className="font-bold text-[11px] px-2.5 py-0.5 rounded bg-rose-600 text-raiz-text-light tracking-wider">
                      CRÍTICO
                    </span>

                    <span className="text-xs text-raiz-text-light/75 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-raiz-text-light/75" />
                      <span>Tempo p/ formação de fila: <strong className="text-raiz-text-light font-bold">03m 30s</strong></span>
                    </span>
                  </div>

                  <button
                    onClick={() => setAlertaDismissed({ ...alertaDismissed, [alerta.id]: true })}
                    className="text-raiz-text-light/75 hover:text-raiz-text-light text-xs font-mono self-end sm:self-auto"
                  >
                    Dispensar
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg sm:text-xl font-bold text-raiz-text-light tracking-tight">
                    Gargalo Detectado: {alerta.atracao}
                  </h3>
                  <p className="text-xs sm:text-sm text-raiz-text-light/75 mt-1">
                    Diagnóstico da IA: {alerta.mensagem}
                  </p>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-raiz-section border border-raiz-border-dark/80 text-xs text-amber-400 font-bold">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span>Ação Recomendada: {alerta.direcionamento}</span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleExecutarSugestao(alerta.id, alerta.atracaoId)}
                    disabled={isExecutado}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-raiz-text-light rounded-xl shadow-lg transition-all active:scale-95 ${
                      isExecutado
                        ? 'bg-raiz-accent text-raiz-text-dark cursor-default shadow-raiz-accent/20'
                        : 'bg-raiz-accent text-raiz-text-dark hover:bg-raiz-accent/90 shadow-raiz-accent/20'
                    }`}
                  >
                    {isExecutado ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Medida Preditiva Executada com Sucesso</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Executar Medida Preditiva ({alerta.acaoRapidaLabel || 'Acionar Filas'})</span>
                      </>
                    )}
                  </button>

                  {alerta.impactoEstimado && (
                    <span className="text-xs text-raiz-accent font-mono flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{alerta.impactoEstimado}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* 2. CONSOLIDAÇÃO EXECUTIVA DA SÍNTESE ACUMULADA */}
      <div className="rounded-2xl border border-raiz-border-dark bg-raiz-section p-5 sm:p-7 shadow-xl text-raiz-text-light">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-raiz-border-dark">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold text-raiz-accent px-2 py-0.5 rounded bg-raiz-accent/10 border border-raiz-accent/40 text-[10px]">
                RELATÓRIO ACUMULADO
              </span>
              <span className="text-raiz-text-light/55">·</span>
              <span className="text-raiz-text-light/75">{data.dataEvento}</span>
              <span className="text-raiz-text-light/55">·</span>
              <span className="text-raiz-accent font-mono">{data.tempoDecorridoHoras}h de operação contínua</span>
            </div>

            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-raiz-text-light flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-raiz-accent shrink-0" />
              <span>Síntese Acumulada de Inteligência do Evento</span>
            </h2>
            <p className="text-xs sm:text-sm text-raiz-text-light/75 mt-1 max-w-2xl">
              Consolidação analítica de telemetria de totens, público em tempo real, receita F&B e alcance de marcas parceiras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onSimularPicoDeFluxo && (
              <button
                onClick={onSimularPicoDeFluxo}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-600/50 hover:bg-amber-900/50 active:scale-95 rounded-lg transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Pico (+100 atendimentos)</span>
              </button>
            )}

            <button
              onClick={handleExport}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-raiz-text-dark bg-raiz-accent hover:bg-raiz-accent/90 active:scale-95 rounded-lg shadow-md shadow-raiz-accent/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Gerando CSV...' : 'Exportar Relatório'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs Macroeconômicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-raiz-border-dark">
          <div className="p-4 rounded-xl bg-raiz-dark border border-raiz-border-dark">
            <div className="flex items-center justify-between text-xs text-raiz-text-light/75 mb-1">
              <span>Público Atendido</span>
              <Users className="w-4 h-4 text-raiz-accent" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-raiz-text-light">
              {data.totalAtendimentosGerais.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-raiz-text-light/55 mt-1 flex items-center gap-1.5">
              <span className="text-raiz-accent font-bold font-mono">
                {((data.totalAtendimentosGerais / data.publicoTotalEstimadoVenue) * 100).toFixed(1)}%
              </span>
              <span>do público total na arena</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-raiz-dark border border-raiz-border-dark">
            <div className="flex items-center justify-between text-xs text-raiz-text-light/75 mb-1">
              <span>Receita Acumulada</span>
              <DollarSign className="w-4 h-4 text-raiz-accent" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-raiz-accent">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.receitaTotalAutosservico)}
            </div>
            <div className="text-xs text-raiz-text-light/55 mt-1 flex items-center gap-1.5">
              <span>Ticket médio:</span>
              <strong className="font-mono text-raiz-text-light">R$ {data.ticketMedioGeral.toFixed(2)}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-raiz-dark border border-raiz-border-dark">
            <div className="flex items-center justify-between text-xs text-raiz-text-light/75 mb-1">
              <span>Alcance das Marcas</span>
              <Share2 className="w-4 h-4 text-raiz-accent" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-raiz-accent">
              {(data.alcanceTotalRedes / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-raiz-text-light/55 mt-1 flex items-center gap-1.5">
              <strong className="font-mono text-raiz-text-light">{data.totalCapturasInstagramavel.toLocaleString('pt-BR')}</strong>
              <span>fotos capturadas</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-raiz-dark border border-raiz-border-dark">
            <div className="flex items-center justify-between text-xs text-raiz-text-light/75 mb-1">
              <span>Vazão & Agilidade</span>
              <Clock className="w-4 h-4 text-raiz-accent" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-raiz-text-light">
              {data.vazaoMediaAtendimentosPorMin} <span className="text-sm font-normal text-raiz-text-light/75">atend/min</span>
            </div>
            <div className="text-xs text-raiz-text-light/55 mt-1 flex items-center gap-1.5">
              <span>Espera média:</span>
              <strong className="font-mono text-amber-400">{data.tempoMedioEsperaGlobalMin} min</strong>
            </div>
          </div>
        </div>

        {/* Comparativo de Setor & Curva de Demanda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-raiz-text-light flex items-center gap-2">
                <Layers className="w-4 h-4 text-raiz-accent" />
                <span>Desempenho por Setor da Arena</span>
              </h3>

              {onFiltrarSetor && setorAtivo && (
                <button
                  onClick={() => onFiltrarSetor(null)}
                  className="text-xs text-raiz-accent font-medium hover:underline"
                >
                  Limpar Filtro ({setorAtivo})
                </button>
              )}
            </div>

            <div className="space-y-3">
              {data.faturamentoPorSetor.map((setor) => {
                const isFiltered = setorAtivo === setor.setor;
                return (
                  <div 
                    key={setor.setor}
                    onClick={() => onFiltrarSetor && onFiltrarSetor(isFiltered ? null : setor.setor)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isFiltered 
                        ? 'border-raiz-accent/40 bg-raiz-accent/10'
                        : 'border-raiz-border-dark bg-raiz-dark hover:border-raiz-border-dark'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-raiz-text-light">{setor.setor}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-raiz-text-light tabular-nums">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(setor.receita)}
                        </span>
                        <span className="text-raiz-accent font-mono text-[11px] tabular-nums">
                          {setor.pct}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-raiz-dark rounded-full overflow-hidden border border-raiz-border-dark">
                      <div 
                        className="h-full bg-raiz-accent rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, setor.pct)}%` }}
                      />
                    </div>

                    <div className="mt-1.5 flex justify-between text-[11px] text-raiz-text-light/55">
                      <span>{setor.volume} atendimentos</span>
                      <span className="text-raiz-accent font-medium">Isolar Setor</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-raiz-text-light flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-raiz-accent" />
                <span>Curva de Demanda & Fluxo Horário</span>
              </h3>
              <span className="text-xs text-raiz-text-light/55">Autosserviço vs Instagramável</span>
            </div>

            <div className="p-4 rounded-xl border border-raiz-border-dark bg-raiz-dark space-y-4">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-raiz-text-light/75">
                  <span className="w-3 h-3 rounded-xs bg-raiz-accent inline-block" />
                  <span>Autosserviço (Transações)</span>
                </span>
                <span className="flex items-center gap-1.5 text-raiz-text-light/75">
                  <span className="w-3 h-3 rounded-xs bg-raiz-light inline-block" />
                  <span>Instagramável (Fotos)</span>
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {data.fluxoHorario.map((item) => {
                  const totalItem = item.autosservico + item.instagramavel;
                  const pctTotal = (totalItem / maxFluxo) * 100;
                  const pctAuto = (item.autosservico / totalItem) * 100;

                  return (
                    <div key={item.hora} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-semibold text-raiz-text-light/75">{item.hora}</span>
                        <span className="text-raiz-text-light/75 tabular-nums">
                          {totalItem} atendimentos · R$ {item.receita.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-raiz-dark border border-raiz-border-dark rounded-sm overflow-hidden flex" style={{ width: `${Math.max(10, pctTotal)}%` }}>
                        <div 
                          className="h-full bg-raiz-accent transition-all duration-300"
                          style={{ width: `${pctAuto}%` }}
                          title={`Autosserviço: ${item.autosservico}`}
                        />
                        <div 
                          className="h-full bg-raiz-light transition-all duration-300"
                          style={{ width: `${100 - pctAuto}%` }}
                          title={`Instagramável: ${item.instagramavel}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};