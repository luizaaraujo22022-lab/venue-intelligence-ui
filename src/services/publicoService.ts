import { api } from './api';
import type {
  AnalyticsSummaryResponse,
  PdvStatusResponse,
  ReadinessHeatmapResponse,
} from '../types/publico';


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
