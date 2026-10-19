// DADOS FICTÍCIOS do módulo de Público.
//
// Este arquivo existe só para o que a API ainda NÃO entrega:
//   - entradas e saídas do estande;
//   - acumulado de público dividido por dia (D1, D2, D3).
// Tudo o que sai daqui deve aparecer na tela com o selo "Simulado".
// Quando a API passar a fornecer esses dados, apague este arquivo e use o serviço.
//
// Fonte dos números: storyboards do PDF "PARÂMETROS_ESTUDO_ESTANDE_VENUE"
// (S05: saídas 28; S10: D1 240, D2 320, D3 400 = 960).

export interface EntradasSaidas {
  entradas: number;
  saidas: number;
}

export interface AcumuladoDia {
  dia: 'D1' | 'D2' | 'D3';
  visitas: number;
}

/** Saídas usadas na simulação (storyboard S05). */
const SAIDAS_SIMULADAS = 28;

/** Mantém a conta coerente com o dado real: presentes = entradas − saídas. */
export function simularEntradasSaidas(pessoasPresentes: number): EntradasSaidas {
  return { entradas: pessoasPresentes + SAIDAS_SIMULADAS, saidas: SAIDAS_SIMULADAS };
}

// Peso de cada dia no storyboard S10 (240 + 320 + 400 = 960).
const PESOS_DIARIOS = { D1: 240, D2: 320, D3: 400 } as const;
const TOTAL_PESOS = PESOS_DIARIOS.D1 + PESOS_DIARIOS.D2 + PESOS_DIARIOS.D3;

/**
 * Reparte o total acumulado REAL (da API) entre os dias, na proporção do storyboard.
 * Sem total real, usa o total do storyboard (960).
 */
export function simularAcumuladoPorDia(totalReal: number | null): AcumuladoDia[] {
  const total = totalReal ?? TOTAL_PESOS;
  const d1 = Math.round((total * PESOS_DIARIOS.D1) / TOTAL_PESOS);
  const d2 = Math.round((total * PESOS_DIARIOS.D2) / TOTAL_PESOS);
  const d3 = Math.max(0, total - d1 - d2);
  return [
    { dia: 'D1', visitas: d1 },
    { dia: 'D2', visitas: d2 },
    { dia: 'D3', visitas: d3 },
  ];
}
