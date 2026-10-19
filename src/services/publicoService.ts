import { api } from './api';
import type {
  AnalyticsSummaryResponse,
  PdvStatusResponse,
  ReadinessHeatmapResponse,
} from '../types/publico';

// Chamadas HTTP do módulo de Público. Usa a instância `api` já existente
// (baseURL vem de VITE_API_BASE_URL; o token Bearer é anexado automaticamente).
//
// O servidor gratuito do Render "dorme" e a primeira resposta pode levar ~1 min,
// por isso o timeout é generoso.
const TIMEOUT_MS = 60_000;

export async function getReadinessHeatmap(signal?: AbortSignal): Promise<ReadinessHeatmapResponse> {
  const { data } = await api.get<ReadinessHeatmapResponse>('/api/v1/venue/readiness-heatmap', {
    signal,
    timeout: TIMEOUT_MS,
  });
  return data;
}

export async function getPdvStatus(signal?: AbortSignal): Promise<PdvStatusResponse> {
  const { data } = await api.get<PdvStatusResponse>('/api/v1/pdv/status', {
    signal,
    timeout: TIMEOUT_MS,
  });
  return data;
}

export async function getDropoffSummary(signal?: AbortSignal): Promise<AnalyticsSummaryResponse> {
  const { data } = await api.get<AnalyticsSummaryResponse>('/api/v1/analytics/dropoff-summary', {
    signal,
    timeout: TIMEOUT_MS,
  });
  return data;
}
