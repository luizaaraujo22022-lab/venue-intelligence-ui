import { useCallback, useState } from 'react';
import { PDV_AUTOSSERVICO } from '../config/cameraPdvMap';
import { getPdvStatus, mensagemDeErro, postDespacho, postTelemetria } from '../services/venueApi';
import type { NivelCritico } from '../types/ops';
import type { PdvStatusItem } from '../types/publico';
import { parsePlanta, separarNome } from '../utils/publico';

export interface OpsFeedback {
  tipo: 'ok' | 'erro' | 'info';
  texto: string;
}

// Quanto pior a cor da zona, mais crítica a intervenção sugerida.
function nivelPorCor(zona: PdvStatusItem): NivelCritico {
  const cor = zona.ultima_leitura?.status_cor;
  if (cor === 'VERMELHO') return 'ALTO';
  // Acima de 180 s de espera a própria API manda redirecionar o público (regra do roteamento).
  if (cor === 'AMARELO' || zona.habilitar_redirecionamento_push) return 'MEDIO';
  return 'BAIXO';
}

// Escolhe a zona que mais precisa de ajuda: maior tempo de espera na última leitura.
function zonaMaisCritica(zonas: PdvStatusItem[]): PdvStatusItem | null {
  const comLeitura = zonas.filter((z) => z.ultima_leitura);
  if (comLeitura.length === 0) return null;
  return comLeitura.reduce((pior, z) =>
    (z.ultima_leitura?.tempo_espera_seg ?? 0) > (pior.ultima_leitura?.tempo_espera_seg ?? 0) ? z : pior,
  );
}

/** Gera N posições anônimas ao redor da zona, só para manter a contagem da leitura coerente. */
function posicoesAoRedor(zona: PdvStatusItem, quantidade: number) {
  const centro = parsePlanta(zona.localizacao_geo) ?? { x: 500, y: 500 };
  const cx = centro.x;
  const cy = centro.y;
  return Array.from({ length: quantidade }, (_, i) => {
    const ang = (i / Math.max(1, quantidade)) * Math.PI * 2;
    return { x: Math.round(cx + Math.cos(ang) * 20), y: Math.round(cy + Math.sin(ang) * 20) };
  });
}

/**
 * Ações operacionais que falam com a API de verdade:
 * - despachoOps: registra uma intervenção para a zona mais crítica (POST /ops/dispatch);
 * - vendaExpress: registra uma venda do POS na zona de autosserviço (POST /telemetry/frame-analysis).
 */
export function useOpsActions() {
  const [ocupado, setOcupado] = useState<'despacho' | 'venda' | null>(null);
  const [feedback, setFeedback] = useState<OpsFeedback | null>(null);

  const despachoOps = useCallback(async () => {
    setOcupado('despacho');
    setFeedback({ tipo: 'info', texto: 'Enviando despacho para a API...' });
    try {
      const zonas = await getPdvStatus();
      const alvo = zonaMaisCritica(zonas);
      if (!alvo) {
        setFeedback({ tipo: 'erro', texto: 'A API ainda não tem leituras de zonas para despachar.' });
        return;
      }
      const espera = alvo.ultima_leitura?.tempo_espera_seg ?? 0;
      const resposta = await postDespacho({
        pdv_id: alvo.id,
        nivel_critico: nivelPorCor(alvo),
        sugestao_acao: `Reforçar atendimento em ${alvo.nome} (espera de ${espera}s)`.slice(0, 500),
      });
      setFeedback({
        tipo: 'ok',
        texto: `Despacho #${resposta.id} registrado em ${separarNome(alvo.nome).codigo} (${resposta.status}).`,
      });
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: mensagemDeErro(err) });
    } finally {
      setOcupado(null);
    }
  }, []);

  const vendaExpress = useCallback(async () => {
    setOcupado('venda');
    setFeedback({ tipo: 'info', texto: 'Registrando venda na API...' });
    try {
      const zonas = await getPdvStatus();
      const zona = zonas.find((z) => z.id === PDV_AUTOSSERVICO);
      if (!zona) {
        setFeedback({ tipo: 'erro', texto: 'Zona de autosserviço não encontrada na API.' });
        return;
      }
      // Mantém a contagem de pessoas igual à última leitura, para a venda não distorcer o painel.
      const pessoas = zona.ultima_leitura?.contagem_pessoas ?? 0;
      const resposta = await postTelemetria({
        pdv_id: zona.id,
        sensor_status: 'ONLINE',
        coordenadas_simuladas: posicoesAoRedor(zona, pessoas),
        transacoes_pos_ultimos_3m: 1,
      });
      setFeedback({
        tipo: resposta.sucesso ? 'ok' : 'info',
        texto: resposta.sucesso
          ? 'Venda registrada na API (leitura em tempo real).'
          : (resposta.aviso_contingencia ?? 'Venda registrada em modo de contingência.'),
      });
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: mensagemDeErro(err) });
    } finally {
      setOcupado(null);
    }
  }, []);

  const limparFeedback = useCallback(() => setFeedback(null), []);

  return { ocupado, feedback, despachoOps, vendaExpress, limparFeedback };
}
