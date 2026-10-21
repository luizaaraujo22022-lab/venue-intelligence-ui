// Tipos do módulo de Balcão, Filas e Insumos (Módulo 2).
// Espelha o contrato OpenAPI v0.2.0 do Venue Intelligence Core (https://api-evento-ia.onrender.com).

export type StatusCor = 'VERDE' | 'AMARELO' | 'VERMELHO';
export type PdvTipo = 'BAR' | 'BANHEIRO' | 'CATRACA' | 'ESTANDE';
export type ModoLeitura =
  | 'TEMPO_REAL'
  | 'FALLBACK_502'
  | 'MEDIA_MOVEL_504'
  | 'CONTINGENCIA_503';
export type EstadoOperacional = 'NORMAL' | 'PRESSAO_MODERADA' | 'CRITICO';

/** Leitura de telemetria agregada e anônima */
export interface TelemetryReading {
  id: number;
  pdv_id: number;
  timestamp: string; // ISO 8601
  contagem_pessoas: number;
  tempo_espera_seg: number;
  densidade_m2: number;
  status_cor: StatusCor;
  confianca_ia: number; // 0..1
  alerta_ruptura_estoque: boolean;
  modo_leitura: ModoLeitura;
}

/** Item de GET /api/v1/pdv/status */
export interface PdvStatusItem {
  id: number;
  nome: string;
  tipo: PdvTipo;
  capacidade: number;
  localizacao_geo: string;
  area_m2: number;
  ultima_leitura: TelemetryReading | null;
  habilitar_redirecionamento_push: boolean;
}

export type PdvStatusResponse = PdvStatusItem[];

/** Insumos e Estoque (Produto 1: Métrica de Insumos) */
export type InsumoStatus = 'NORMAL' | 'ATENCAO' | 'DEFICIT_CRITICO';

export interface InsumoItem {
  item_id: string;
  nome: string;
  localizacao: string;
  quantidade_atual: number;
  quantidade_minima: number;
  status: InsumoStatus;
  deficit_estimado: number;
}

export interface InsumosStatusResponse {
  total_itens_monitorados: number;
  itens_em_deficit: number;
  insumos: InsumoItem[];
}

export type PrioridadeReabastecimento = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface ReabastecimentoRequest {
  item_id: string;
  quantidade_solicitada: number;
  prioridade: PrioridadeReabastecimento;
}

export interface ReabastecimentoResponse {
  protocolo_id: string;
  item_id: string;
  quantidade_solicitada: number;
  prioridade: string;
  status_pedido: 'SOLICITADO';
  timestamp: string;
}

/** Intervenções Operacionais / Staff (POST e GET /api/v1/ops/dispatch) */
export type NivelCritico = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO_PCD_CLIMA';
export type DispatchStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO';

export interface OperationalDispatchRequest {
  pdv_id: number;
  nivel_critico: NivelCritico;
  sugestao_acao: string;
}

export interface OperationalDispatchResponse {
  id: number;
  pdv_id: number;
  nivel_critico: NivelCritico;
  sugestao_acao: string;
  status: DispatchStatus;
  criado_em: string;
}

export type OperationalDispatchListResponse = OperationalDispatchResponse[];
