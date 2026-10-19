// Tipos do módulo de Público (Módulo 1).
//
// Os tipos "da API" espelham o contrato OpenAPI v0.2.0 do Venue Intelligence Core
// (https://api-evento-ia.onrender.com). Os nomes ficam em snake_case DE PROPÓSITO,
// para ficarem idênticos ao JSON recebido e evitar erros de mapeamento.

export type StatusCor = 'VERDE' | 'AMARELO' | 'VERMELHO';
export type PdvTipo = 'BAR' | 'BANHEIRO' | 'CATRACA' | 'ESTANDE';
export type ModoLeitura =
  | 'TEMPO_REAL'
  | 'FALLBACK_502'
  | 'MEDIA_MOVEL_504'
  | 'CONTINGENCIA_503';
export type EstadoOperacional = 'NORMAL' | 'PRESSAO_MODERADA' | 'CRITICO';

/** Leitura anônima e agregada de uma zona. */
export interface TelemetryReading {
  id: number;
  pdv_id: number;
  timestamp: string; // ISO 8601
  contagem_pessoas: number;
  tempo_espera_seg: number;
  densidade_m2: number; // pessoas/m²
  status_cor: StatusCor;
  confianca_ia: number; // 0..1
  alerta_ruptura_estoque: boolean;
  modo_leitura: ModoLeitura;
}

/** Item de GET /api/v1/pdv/status. */
export interface PdvStatusItem {
  id: number;
  nome: string; // ex.: "Z1 | Balcão Principal de Drinks / Brindes"
  tipo: PdvTipo;
  capacidade: number;
  localizacao_geo: string; // ex.: "RAIZ | Frente-Esquerda | planta(x:120,y:180)"
  area_m2: number;
  ultima_leitura: TelemetryReading | null;
  habilitar_redirecionamento_push: boolean;
}

export type PdvStatusResponse = PdvStatusItem[];

/** Parte "mapa_calor_global" de GET /api/v1/venue/readiness-heatmap. */
export interface MapaCalorGlobal {
  pessoas_presentes: number;
  ocupacao_estimada_pct: number;
  permanencia_media_seg: number;
  densidade_maxima_m2: number;
  velocidade_media_ms: number;
  zonas_atracao: number;
  pontos_criticos: number;
  estado_operacional: EstadoOperacional;
}

/** Parte "prontidao" de GET /api/v1/venue/readiness-heatmap. */
export interface Prontidao {
  sensores_ativos: number;
  fontes_online_str: string; // ex.: "6/6"
  estoque_inicial_ok: boolean;
  rota_livre_ok: boolean;
  motor_ia_online: boolean;
}

export interface ReadinessHeatmapResponse {
  prontidao: Prontidao;
  mapa_calor_global: MapaCalorGlobal;
}

export interface AcumuladoEvento {
  publico_acumulado: number;
  atendimentos_cortesia: number;
  bebidas_unidades: number;
  autosservico_retiradas: number;
  engajamento_interacoes: number;
}

/** GET /api/v1/analytics/dropoff-summary (só usamos o acumulado de público). */
export interface AnalyticsSummaryResponse {
  janela_tempo_min: number;
  tempo_medio_fila_min: number;
  ponto_densidade_atingido: boolean;
  taxa_abandono_estimada_pct: number;
  pontuacao_esforco_ces: number;
  acumulado_evento: AcumuladoEvento;
}

// ---------------------------------------------------------------------------
// Tipos de apresentação (view-models): é o que os componentes recebem.
// ---------------------------------------------------------------------------

/** Posição na planta do estande, em unidades 0..1000 (como a API usa). */
export interface PosicaoPlanta {
  x: number;
  y: number;
}

/** Zona já preparada para exibição (nomes em camelCase). */
export interface ZonaPublico {
  id: number;
  codigo: string; // "Z1", "Z2", "Sanitários"...
  titulo: string; // "Balcão Principal de Drinks / Brindes"
  tipo: PdvTipo;
  capacidade: number;
  areaM2: number;
  posicao: PosicaoPlanta | null; // null se a API não enviar coordenadas legíveis
  pessoas: number;
  densidadeM2: number;
  ocupacaoPct: number; // pessoas / capacidade, em %
  esperaSeg: number;
  statusCor: StatusCor | null; // null se ainda não há leitura
  modoLeitura: ModoLeitura | null;
  atualizadoEm: string | null; // ISO 8601
}
