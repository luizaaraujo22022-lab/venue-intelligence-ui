import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  getDropoffSummary,
  getPdvStatus,
  getReadinessHeatmap,
} from '../services/publicoService';
import { toZonaPublico } from '../utils/publico';
import type { AcumuladoEvento, MapaCalorGlobal, ZonaPublico } from '../types/publico';

/** Intervalo padrão entre atualizações. */
const INTERVALO_PADRAO_MS = 10_000;

export interface PublicoMetrics {
  zonas: ZonaPublico[];
  global: MapaCalorGlobal | null;
  acumulado: AcumuladoEvento | null;
  /** true só até a primeira resposta (depois, os dados antigos ficam na tela). */
  loading: boolean;
  /** Mensagem amigável da última falha, ou null se a última busca deu certo. */
  error: string | null;
  atualizadoEm: Date | null;
  /** Busca de novo agora (ex.: botão "tentar novamente"). */
  refetch: () => void;
}

function mensagemDeErro(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return 'O servidor demorou para responder. Ele pode estar iniciando; tente de novo em instantes.';
    }
    if (err.response) {
      return `O servidor respondeu com erro ${err.response.status}.`;
    }
    return 'Sem resposta do servidor. Verifique a internet, a URL da API (VITE_API_BASE_URL) e o CORS.';
  }
  return 'Erro inesperado ao buscar os dados.';
}

/**
 * Busca as métricas de público e repete a busca a cada `intervaloMs`.
 * - A busca para sozinha quando o componente sai da tela.
 * - Com a aba do navegador escondida, pula as atualizações.
 * - Se uma busca falha, mantém os últimos dados e informa o erro.
 */
export function usePublicoMetrics(intervaloMs: number = INTERVALO_PADRAO_MS): PublicoMetrics {
  const [zonas, setZonas] = useState<ZonaPublico[]>([]);
  const [global, setGlobal] = useState<MapaCalorGlobal | null>(null);
  const [acumulado, setAcumulado] = useState<AcumuladoEvento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const refetch = useCallback(() => setTentativa((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const agendar = () => {
      timer = setTimeout(() => {
        if (document.hidden) agendar();
        else void carregar();
      }, intervaloMs);
    };

    async function carregar() {
      const [heat, pdv, resumo] = await Promise.allSettled([
        getReadinessHeatmap(signal),
        getPdvStatus(signal),
        getDropoffSummary(signal),
      ]);
      if (signal.aborted) return;

      if (heat.status === 'fulfilled') setGlobal(heat.value.mapa_calor_global);
      if (pdv.status === 'fulfilled') setZonas(pdv.value.map(toZonaPublico));
      // O acumulado é complementar: se falhar, só fica sem valor.
      if (resumo.status === 'fulfilled') setAcumulado(resumo.value.acumulado_evento);
      if (heat.status === 'fulfilled' || pdv.status === 'fulfilled') setAtualizadoEm(new Date());

      const falha =
        heat.status === 'rejected' ? heat.reason : pdv.status === 'rejected' ? pdv.reason : null;
      setError(falha ? mensagemDeErro(falha) : null);
      setLoading(false);
      agendar();
    }

    void carregar();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [intervaloMs, tentativa]);

  return { zonas, global, acumulado, loading, error, atualizadoEm, refetch };
}
