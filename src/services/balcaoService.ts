import { api } from './api';
import type {
  PdvStatusResponse,
  PdvStatusItem,
  InsumosStatusResponse,
  ReabastecimentoRequest,
  ReabastecimentoResponse,
  OperationalDispatchRequest,
  OperationalDispatchResponse,
  OperationalDispatchListResponse,
} from '../types/balcao';

const TIMEOUT_MS = 10_000;

/** Bares e Balcões fictícios para contingência e testes locais */
export const mockPdvsBalcao: PdvStatusItem[] = [
  {
    id: 1,
    nome: 'Z1 | Balcão Principal de Drinks / Brindes',
    tipo: 'BAR',
    capacidade: 45,
    localizacao_geo: 'RAIZ | Frente-Esquerda | planta(x:120,y:180)',
    area_m2: 30.5,
    habilitar_redirecionamento_push: true,
    ultima_leitura: {
      id: 101,
      pdv_id: 1,
      timestamp: new Date().toISOString(),
      contagem_pessoas: 26,
      tempo_espera_seg: 215, // 3m 35s (> 180s dispara push)
      densidade_m2: 0.85,
      status_cor: 'AMARELO',
      confianca_ia: 0.94,
      alerta_ruptura_estoque: true,
      modo_leitura: 'TEMPO_REAL',
    },
  },
  {
    id: 2,
    nome: 'Z2 | Bar Norte Tap House (Chopp Artesanal)',
    tipo: 'BAR',
    capacidade: 35,
    localizacao_geo: 'RAIZ | Ala Norte | planta(x:340,y:120)',
    area_m2: 24.0,
    habilitar_redirecionamento_push: false,
    ultima_leitura: {
      id: 102,
      pdv_id: 2,
      timestamp: new Date().toISOString(),
      contagem_pessoas: 9,
      tempo_espera_seg: 85, // 1m 25s
      densidade_m2: 0.38,
      status_cor: 'VERDE',
      confianca_ia: 0.98,
      alerta_ruptura_estoque: false,
      modo_leitura: 'TEMPO_REAL',
    },
  },
  {
    id: 3,
    nome: 'Z3 | Balcão Sul Coquetelaria & Shots',
    tipo: 'BAR',
    capacidade: 40,
    localizacao_geo: 'RAIZ | Ala Sul | planta(x:420,y:520)',
    area_m2: 28.0,
    habilitar_redirecionamento_push: true,
    ultima_leitura: {
      id: 103,
      pdv_id: 3,
      timestamp: new Date().toISOString(),
      contagem_pessoas: 34,
      tempo_espera_seg: 790, // 13m 10s (> 720s crítico)
      densidade_m2: 1.21,
      status_cor: 'VERMELHO',
      confianca_ia: 0.88,
      alerta_ruptura_estoque: true,
      modo_leitura: 'MEDIA_MOVEL_504',
    },
  },
  {
    id: 4,
    nome: 'Z4 | Bar VIP Lounge & Degustação',
    tipo: 'BAR',
    capacidade: 20,
    localizacao_geo: 'RAIZ | Mezanino VIP | planta(x:680,y:210)',
    area_m2: 18.0,
    habilitar_redirecionamento_push: false,
    ultima_leitura: {
      id: 104,
      pdv_id: 4,
      timestamp: new Date().toISOString(),
      contagem_pessoas: 6,
      tempo_espera_seg: 60, // 1m 00s
      densidade_m2: 0.33,
      status_cor: 'VERDE',
      confianca_ia: 0.96,
      alerta_ruptura_estoque: false,
      modo_leitura: 'TEMPO_REAL',
    },
  },
  {
    id: 5,
    nome: 'Z5 | Ponto Express Chopp & Água',
    tipo: 'BAR',
    capacidade: 30,
    localizacao_geo: 'RAIZ | Arena Central | planta(x:510,y:380)',
    area_m2: 20.0,
    habilitar_redirecionamento_push: false,
    ultima_leitura: {
      id: 105,
      pdv_id: 5,
      timestamp: new Date().toISOString(),
      contagem_pessoas: 12,
      tempo_espera_seg: 130, // 2m 10s
      densidade_m2: 0.6,
      status_cor: 'VERDE',
      confianca_ia: 0.91,
      alerta_ruptura_estoque: false,
      modo_leitura: 'CONTINGENCIA_503',
    },
  },
];

/** Dados fictícios de Insumos e Estoque (Produto 1) */
export const mockInsumosStatus: InsumosStatusResponse = {
  total_itens_monitorados: 8,
  itens_em_deficit: 3,
  insumos: [
    {
      item_id: 'BAR-83-IPA',
      nome: 'Chopp IPA Raiz (Barril 50L)',
      localizacao: 'Bar Norte Tap House',
      quantidade_atual: 5,
      quantidade_minima: 20,
      status: 'DEFICIT_CRITICO',
      deficit_estimado: 15,
    },
    {
      item_id: 'BAR-05-GIN',
      nome: 'Gin Artesanal Especial 750ml',
      localizacao: 'Balcão Sul Coquetelaria',
      quantidade_atual: 3,
      quantidade_minima: 15,
      status: 'DEFICIT_CRITICO',
      deficit_estimado: 12,
    },
    {
      item_id: 'BAR-77-GELO',
      nome: 'Gelo Filtrado Especial (Saco 10kg)',
      localizacao: 'Balcão Sul Coquetelaria',
      quantidade_atual: 4,
      quantidade_minima: 18,
      status: 'DEFICIT_CRITICO',
      deficit_estimado: 14,
    },
    {
      item_id: 'BAR-12-PILSEN',
      nome: 'Chopp Pilsen Puro Malte (Barril 50L)',
      localizacao: 'Balcão Principal de Drinks',
      quantidade_atual: 19,
      quantidade_minima: 25,
      status: 'ATENCAO',
      deficit_estimado: 6,
    },
    {
      item_id: 'BAR-31-ENERGY',
      nome: 'Energético Tropical Lata 250ml',
      localizacao: 'Ponto Express Chopp & Água',
      quantidade_atual: 32,
      quantidade_minima: 50,
      status: 'ATENCAO',
      deficit_estimado: 18,
    },
    {
      item_id: 'BAR-09-TONICA',
      nome: 'Água Tônica Premium 350ml',
      localizacao: 'Balcão Principal de Drinks',
      quantidade_atual: 46,
      quantidade_minima: 40,
      status: 'NORMAL',
      deficit_estimado: 0,
    },
    {
      item_id: 'BAR-22-VODKA',
      nome: 'Vodka Ultra Destilada 1L',
      localizacao: 'Bar VIP Lounge',
      quantidade_atual: 15,
      quantidade_minima: 10,
      status: 'NORMAL',
      deficit_estimado: 0,
    },
    {
      item_id: 'BAR-40-COPO',
      nome: 'Copos Ecológicos Reutilizáveis 400ml',
      localizacao: 'Todos os Bares (Estoque Central)',
      quantidade_atual: 420,
      quantidade_minima: 250,
      status: 'NORMAL',
      deficit_estimado: 0,
    },
  ],
};

/** Dispatches fictícios para contingência */
export const mockDispatches: OperationalDispatchResponse[] = [
  {
    id: 1,
    pdv_id: 3,
    nivel_critico: 'ALTO',
    sugestao_acao: 'Acionar reposição lateral de gelo e gin no Z3 imediatamente.',
    status: 'EM_ANDAMENTO',
    criado_em: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 2,
    pdv_id: 1,
    nivel_critico: 'MEDIO',
    sugestao_acao: 'Ativar fila rápida para pedidos com app e redistribuir para o Z2.',
    status: 'PENDENTE',
    criado_em: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

export function simularPedidoReabastecimento(
  itemId: string,
  quantidade: number,
  prioridade: string
): ReabastecimentoResponse {
  return {
    protocolo_id: `REAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    item_id: itemId,
    quantidade_solicitada: quantidade,
    prioridade,
    status_pedido: 'SOLICITADO',
    timestamp: new Date().toISOString(),
  };
}

/** Busca status dos PDVs/Bares via API ou contingência */
export async function getBalcaoPdvs(signal?: AbortSignal): Promise<{ data: PdvStatusResponse; isMock: boolean }> {
  try {
    const res = await api.get<PdvStatusResponse>('/api/v1/pdv/status', {
      signal,
      timeout: TIMEOUT_MS,
    });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data, isMock: false };
    }
    return { data: mockPdvsBalcao, isMock: true };
  } catch (err) {
    console.warn('[balcaoService] Falha ao consultar /api/v1/pdv/status, usando contingência local.', err);
    return { data: mockPdvsBalcao, isMock: true };
  }
}

/** Busca status dos insumos (Produto 1: Métrica de Insumos) */
export async function getInsumosStatus(signal?: AbortSignal): Promise<{ data: InsumosStatusResponse; isMock: boolean }> {
  try {
    const res = await api.get<InsumosStatusResponse>('/api/v1/insumos/status', {
      signal,
      timeout: TIMEOUT_MS,
    });
    if (res.data && Array.isArray(res.data.insumos)) {
      return { data: res.data, isMock: false };
    }
    return { data: mockInsumosStatus, isMock: true };
  } catch (err) {
    console.warn('[balcaoService] Falha ao consultar /api/v1/insumos/status, usando contingência local.', err);
    return { data: mockInsumosStatus, isMock: true };
  }
}

/** Envia solicitação urgente de reabastecimento de insumos */
export async function solicitarReabastecimento(
  req: ReabastecimentoRequest,
  signal?: AbortSignal
): Promise<ReabastecimentoResponse> {
  try {
    const res = await api.post<ReabastecimentoResponse>('/api/v1/insumos/reabastecimento', req, {
      signal,
      timeout: TIMEOUT_MS,
    });
    return res.data;
  } catch (err) {
    console.warn('[balcaoService] Simulação de reabastecimento via contingência.', err);
    return simularPedidoReabastecimento(req.item_id, req.quantidade_solicitada, req.prioridade);
  }
}

/** Registra intervenção operacional / staff móvel */
export async function registrarDispatch(
  req: OperationalDispatchRequest,
  signal?: AbortSignal
): Promise<OperationalDispatchResponse> {
  try {
    const res = await api.post<OperationalDispatchResponse>('/api/v1/ops/dispatch', req, {
      signal,
      timeout: TIMEOUT_MS,
    });
    return res.data;
  } catch (err) {
    console.warn('[balcaoService] Simulação de dispatch de staff.', err);
    return {
      id: Math.floor(100 + Math.random() * 900),
      pdv_id: req.pdv_id,
      nivel_critico: req.nivel_critico,
      sugestao_acao: req.sugestao_acao,
      status: 'EM_ANDAMENTO',
      criado_em: new Date().toISOString(),
    };
  }
}

/** Lista intervenções operacionais */
export async function getDispatches(signal?: AbortSignal): Promise<OperationalDispatchListResponse> {
  try {
    const res = await api.get<OperationalDispatchListResponse>('/api/v1/ops/dispatch', {
      signal,
      timeout: TIMEOUT_MS,
    });
    return res.data;
  } catch {
    return mockDispatches;
  }
}
