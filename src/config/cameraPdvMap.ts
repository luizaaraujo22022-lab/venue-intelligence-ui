// Liga cada câmera de hardware (HARDWARE_CAMERAS) à zona (pdv_id) da API que a representa.
//
// ATENÇÃO: este mapa é PROVISÓRIO. A API não conhece "câmeras": ela mede por zona (pdv).
// Hoje ela tem 6 zonas: 1 Z1 Balcão de Drinks, 2 Z2 Autosserviço, 3 Z3 Lounge,
// 4 Z5 Instagramável, 5 Sanitários e 6 Catraca de Entrada.
// Confirme com o time (Luíza/Guilherme) qual câmera cobre qual zona e ajuste aqui.
// Câmera sem zona (null) mostra os valores fictícios do hardware, com selo "Simulado".

export const CAMERA_PDV_MAP: Record<string, number | null> = {
  // As 4 câmeras de entrada olham para a mesma zona da API (Catraca de Entrada).
  'cam-ent-01': 6,
  'cam-ent-02': 6,
  'cam-ent-03': 6,
  'cam-ent-04': 6,
  // Câmeras de F&B.
  'cam-fb-01': 1, // Balcão Principal de Drinks
  'cam-fb-02': 2, // Autosserviço Lateral
  'cam-fb-03': null, // sem zona equivalente na API
};

/** Zona da API usada pelos totens de autosserviço (Venda Express): Z2 | Autosserviço Lateral. */
export const PDV_AUTOSSERVICO = 2;
