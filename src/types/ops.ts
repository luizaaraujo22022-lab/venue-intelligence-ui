// Tipos das ações operacionais da API (despacho e telemetria de venda).
// Espelham o contrato OpenAPI: nomes em snake_case, como a API envia.

export type NivelCritico = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO_PCD_CLIMA';
export type DispatchStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO';

export interface OperationalDispatchRequest {
  pdv_id: number;
  nivel_critico: NivelCritico;
  /** Entre 5 e 500 caracteres. */
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

export interface Coordinate {
  x: number;
  y: number;
}

export type SensorStatus = 'ONLINE' | 'OFFLINE';

export interface TelemetryAnalysisRequest {
  pdv_id: number;
  sensor_status: SensorStatus;
  coordenadas_simuladas: Coordinate[];
  transacoes_pos_ultimos_3m: number;
  /** 0 a 100. Se omitido, a API assume 100. */
  estoque_percentual?: number;
}
