// Regras de cor do mapa de calor. Funções puras, sem React.
//
// O "calor" de uma zona é a sua OCUPAÇÃO: pessoas ÷ capacidade.
// Isso permite comparar zonas de tamanhos diferentes e usa a regra de alerta
// já prevista no projeto (Backlog 3.1 e PDF de viabilidade): 85% da capacidade.

/** Ocupação (%) a partir da qual uma zona entra em alerta. */
export const LIMITE_ALERTA_OCUPACAO = 85;

type Rgb = readonly [number, number, number];

// Rampa de cor: baixa concentração (azul) -> média (verde/amarelo) -> alta (vermelho).
const PARADAS: ReadonlyArray<{ t: number; rgb: Rgb }> = [
  { t: 0, rgb: [37, 99, 235] },
  { t: 0.33, rgb: [16, 185, 129] },
  { t: 0.66, rgb: [250, 204, 21] },
  { t: 1, rgb: [239, 68, 68] },
];

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

function misturar(a: number, b: number, fator: number): number {
  return Math.round(a + (b - a) * fator);
}

/** Converte a ocupação (%) em intensidade de 0 a 1 (1 = limite de alerta ou mais). */
export function intensidadeDeCalor(ocupacaoPct: number): number {
  return limitar(ocupacaoPct / LIMITE_ALERTA_OCUPACAO, 0, 1);
}

/** Devolve a cor "rgb(r, g, b)" para uma intensidade de 0 a 1. */
export function corDeCalor(intensidade: number): string {
  const t = limitar(intensidade, 0, 1);
  for (let i = 1; i < PARADAS.length; i++) {
    const anterior = PARADAS[i - 1];
    const proxima = PARADAS[i];
    if (t <= proxima.t) {
      const fator = (t - anterior.t) / (proxima.t - anterior.t);
      const [r, g, b] = anterior.rgb.map((c, k) => misturar(c, proxima.rgb[k], fator));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  const [r, g, b] = PARADAS[PARADAS.length - 1].rgb;
  return `rgb(${r}, ${g}, ${b})`;
}

/** Gradiente CSS usado na legenda (mesma rampa do mapa). */
export const GRADIENTE_LEGENDA = `linear-gradient(to right, ${PARADAS.map(
  (p) => `${corDeCalor(p.t)} ${Math.round(p.t * 100)}%`,
).join(', ')})`;
