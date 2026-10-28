import axios from 'axios';
import { api } from './api';
import type { PdvStatusResponse, TelemetryReading } from '../types/publico';
import type {
  OperationalDispatchRequest,
  OperationalDispatchResponse,
  TelemetryAnalysisRequest,
} from '../types/ops';

// O servidor gratuito do Render "dorme" e pode levar cerca de 1 minuto para acordar.
const TIMEOUT_MS = 60_000;

/**
 * Token Bearer para as rotas protegidas (despacho, insumos, predições).
 * Vem do login (localStorage) ou, em desenvolvimento, de VITE_API_TOKEN no .env.local.
 */
function authHeaders(): Record<string, string> {
  const token =
    localStorage.getItem('@venue-intelligence:token') ||
    (import.meta.env.VITE_API_TOKEN as string | undefined);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Zonas do estande com a última leitura de telemetria de cada uma. */
export async function getPdvStatus(signal?: AbortSignal): Promise<PdvStatusResponse> {
  const { data } = await api.get<PdvStatusResponse>('/api/v1/pdv/status', {
    signal,
    timeout: TIMEOUT_MS,
  });
  return data;
}

/** Registra uma intervenção operacional humana (exige token). */
export async function postDespacho(
  body: OperationalDispatchRequest,
): Promise<OperationalDispatchResponse> {
  const { data } = await api.post<OperationalDispatchResponse>('/api/v1/ops/dispatch', body, {
    headers: authHeaders(),
    timeout: TIMEOUT_MS,
  });
  return data;
}

/** Envia uma leitura de telemetria (usada para registrar vendas do POS). */
export async function postTelemetria(
  body: TelemetryAnalysisRequest,
): Promise<{ sucesso: boolean; aviso_contingencia: string | null; leitura: TelemetryReading | null }> {
  const { data } = await api.post('/api/v1/telemetry/frame-analysis', body, {
    headers: authHeaders(),
    timeout: TIMEOUT_MS,
  });
  return data;
}

/** Traduz um erro de chamada à API para uma frase clara em português. */
export function mensagemDeErro(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return 'O servidor demorou para responder. Ele pode estar iniciando; tente de novo em instantes.';
    }
    if (err.response) {
      const { status } = err.response;
      if (status === 401) return 'Sem autorização: informe o token da API (VITE_API_TOKEN no .env.local).';
      if (status === 403) return 'Acesso negado para esta ação (permissão insuficiente).';
      if (status === 404) return 'Zona não encontrada na API.';
      if (status === 400) return 'A API recusou os dados enviados (contrato inválido).';
      return `O servidor respondeu com erro ${status}.`;
    }
    return 'Sem resposta do servidor. Verifique a internet, a URL da API (VITE_API_BASE_URL) e o CORS.';
  }
  return 'Erro inesperado ao falar com a API.';
}
