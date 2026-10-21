import React, { useState } from 'react';
import clsx from 'clsx';
import { ArrowLeftRight, CalendarDays, Clock, Gauge, RefreshCw, TriangleAlert, Users } from 'lucide-react';
import { usePublicoMetrics } from '../../hooks/usePublicoMetrics';
import type { PublicoMetrics } from '../../hooks/usePublicoMetrics';
import { simularAcumuladoPorDia, simularEntradasSaidas } from '../../mocks/publicoMock';
import { LIMITE_ALERTA_OCUPACAO, corDeCalor, intensidadeDeCalor } from '../../utils/heatmap';
import { formatarDuracao } from '../../utils/publico';
import { HeatmapCard } from './HeatmapCard';
import { KpiCard } from './KpiCard';
import { SeloSimulado } from './SeloSimulado';
import { PublicoHeatmap } from '../PublicoHeatmap';

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

// Barra de ocupação com marca no limite de alerta.
const BarraOcupacao: React.FC<{ pct: number }> = ({ pct }) => {
  const largura = Math.min(100, Math.max(0, pct));
  return (
    <div className="mt-3">
      <div
        role="progressbar"
        aria-label="Ocupação estimada do estande"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(largura)}
        className="relative h-2 rounded-full bg-[#0B0F19] border border-[#1E293B]"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${largura}%`, backgroundColor: corDeCalor(intensidadeDeCalor(pct)) }}
        />
        <span
          className="absolute top-[-3px] h-3.5 w-px bg-gray-400"
          style={{ left: `${LIMITE_ALERTA_OCUPACAO}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 text-[10px] text-gray-500">
        {pct >= LIMITE_ALERTA_OCUPACAO
          ? `Acima do limite de alerta (${LIMITE_ALERTA_OCUPACAO}%)`
          : `Alerta a partir de ${LIMITE_ALERTA_OCUPACAO}%`}
      </p>
    </div>
  );
};

type PublicoOverviewViewProps = PublicoMetrics;

// Parte visual: recebe os dados prontos (fácil de reutilizar e de testar).
export const PublicoOverviewView: React.FC<PublicoOverviewViewProps> = ({
  zonas,
  global,
  acumulado,
  loading,
  error,
  atualizadoEm,
  refetch,
}) => {
  const capacidadeTotal = zonas.reduce((soma, z) => soma + z.capacidade, 0);
  const presentes = global?.pessoas_presentes ?? null;
  const acumuladoTotal = acumulado?.publico_acumulado ?? null;

  const entradasSaidas = presentes !== null ? simularEntradasSaidas(presentes) : null;
  const porDia = simularAcumuladoPorDia(acumuladoTotal);
  const maiorDia = Math.max(1, ...porDia.map((d) => d.visitas));

  const semDados = global === null && zonas.length === 0;
  const [modoHeatmap, setModoHeatmap] = useState<'3d' | '2d'>('3d');

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-100">Visão Geral</h2>
          <p className="text-xs text-gray-500">Público, ocupação e permanência no estande</p>
        </div>
        <div className="flex items-center gap-3">
          {atualizadoEm && (
            <span className="font-mono text-[11px] text-gray-500">
              Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            type="button"
            onClick={refetch}
            title="Atualizar agora"
            aria-label="Atualizar agora"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          <TriangleAlert size={16} className="shrink-0" aria-hidden="true" />
          <span className="flex-1 min-w-0">
            {error}
            {!semDados && ' Os dados abaixo podem estar desatualizados.'}
          </span>
          <button
            type="button"
            onClick={refetch}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-500/20 hover:bg-rose-500/30 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Pessoas presentes"
          icone={Users}
          valor={presentes !== null ? numero.format(presentes) : '—'}
          detalhe={capacidadeTotal > 0 ? `Capacidade somada das zonas: ${numero.format(capacidadeTotal)}` : undefined}
          carregando={loading}
        />
        <KpiCard
          titulo="Ocupação estimada"
          icone={Gauge}
          valor={global ? `${numero.format(global.ocupacao_estimada_pct)}%` : '—'}
          carregando={loading}
        >
          {global && <BarraOcupacao pct={global.ocupacao_estimada_pct} />}
        </KpiCard>
        <KpiCard
          titulo="Permanência média"
          icone={Clock}
          valor={global ? formatarDuracao(global.permanencia_media_seg) : '—'}
          detalhe="Tempo médio no estande"
          carregando={loading}
        />
        <KpiCard
          titulo="Público acumulado"
          icone={Users}
          valor={acumuladoTotal !== null ? numero.format(acumuladoTotal) : '—'}
          detalhe="Acessos ao estande, incluindo possíveis retornos"
          carregando={loading}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <KpiCard
          titulo="Entradas / saídas"
          icone={ArrowLeftRight}
          simulated
          valor={entradasSaidas ? `${numero.format(entradasSaidas.entradas)} / ${numero.format(entradasSaidas.saidas)}` : '—'}
          detalhe="Valores fictícios: a API ainda não fornece entradas e saídas."
          carregando={loading}
        />

        <div className="rounded-xl border border-[#1E293B] bg-[#131B2E] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-[#FFD600]" aria-hidden="true" />
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Acumulado por dia
              </h3>
            </div>
            <SeloSimulado detalhe="Divisão por dia fictícia: proporção do storyboard S10 aplicada ao total real da API." />
          </div>
          <ul className="mt-3 space-y-2">
            {porDia.map((d) => (
              <li key={d.dia} className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{d.dia}</span>
                <div className="h-2 rounded-full bg-[#0B0F19] border border-[#1E293B]">
                  <div
                    className="h-full rounded-full bg-[#FFD600]"
                    style={{ width: `${(d.visitas / maiorDia) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-sm text-gray-100 text-right">{numero.format(d.visitas)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-gray-500">
            Total real vem da API; a divisão entre os dias é simulada.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Visualização Espacial do Estande
            </span>
          </div>
          <div className="flex items-center bg-[#131B2E] p-1 rounded-lg border border-[#1E293B] text-xs">
            <button
              type="button"
              onClick={() => setModoHeatmap('3d')}
              className={clsx(
                'px-3 py-1 rounded font-medium transition-colors',
                modoHeatmap === '3d'
                  ? 'bg-[#FFD600] text-[#0B0F19] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Mapa de Calor 3D (RAIZ)
            </button>
            <button
              type="button"
              onClick={() => setModoHeatmap('2d')}
              className={clsx(
                'px-3 py-1 rounded font-medium transition-colors',
                modoHeatmap === '2d'
                  ? 'bg-[#FFD600] text-[#0B0F19] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Planta Esquemática 2D
            </button>
          </div>
        </div>

        {modoHeatmap === '3d' ? (
          <PublicoHeatmap
            zonas={zonas}
            global={global}
            simulated={zonas.length === 0}
          />
        ) : (
          <HeatmapCard zonas={zonas} global={global} loading={loading && semDados} />
        )}
      </div>
    </div>
  );
};

// Componente usado pelo App: busca os dados e entrega para a parte visual.
export const PublicoOverview: React.FC = () => {
  const metrics = usePublicoMetrics();
  return <PublicoOverviewView {...metrics} />;
};
