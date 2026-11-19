import { describe, expect, it } from 'vitest';
import { confiancaDosMetaprogramas, direcaoEConfianca } from '../useMetaprogramAnalysis';

/**
 * Trava a confiança dos metaprogramas contra os scores reais.
 *
 * `useNLPAutoAnalysis` gravava `confidence: 75` fixo no `metaprogram_profile`
 * do contato e usava `+ 50` fixo no cálculo da confiança geral — nenhum dos
 * dois olhava o texto. A conta real já existia dentro de
 * `getContactMetaprogramProfile`, presa a uma função que só lê o histórico
 * do banco; agora está exportada e é usada nos dois pontos.
 */

const zerado = {
  toward: 0, awayFrom: 0, internal: 0, external: 0,
  options: 0, procedures: 0, general: 0, specific: 0,
  proactive: 0, reactive: 0, sameness: 0, difference: 0,
};

describe('direcaoEConfianca', () => {
  it('sem sinal nenhum, confiança é zero', () => {
    expect(direcaoEConfianca(0, 0)).toEqual({ direction: 'balanced', confidence: 0 });
  });

  it('empate técnico fica equilibrado em 50', () => {
    expect(direcaoEConfianca(10, 9)).toEqual({ direction: 'balanced', confidence: 50 });
  });

  it('margem decidida aponta a direção e eleva a confiança', () => {
    const r = direcaoEConfianca(10, 0);
    expect(r.direction).toBe('first');
    expect(r.confidence).toBeGreaterThan(50);
    expect(r.confidence).toBeLessThanOrEqual(95);
  });

  it('a direção acompanha quem tem mais score', () => {
    expect(direcaoEConfianca(2, 10).direction).toBe('second');
  });
});

describe('confiancaDosMetaprogramas', () => {
  it('texto sem nenhum marcador não produz confiança', () => {
    expect(confiancaDosMetaprogramas(zerado)).toBe(0);
  });

  it('muda conforme os scores — não é constante', () => {
    const decidido = confiancaDosMetaprogramas({ ...zerado, toward: 10, internal: 8, options: 6 });
    const indeciso = confiancaDosMetaprogramas({ ...zerado, toward: 5, awayFrom: 5 });
    expect(decidido).not.toBe(indeciso);
    expect(decidido).toBeGreaterThan(indeciso);
  });

  it('nunca devolve o 75 fixo que estava no código para um perfil zerado', () => {
    expect(confiancaDosMetaprogramas(zerado)).not.toBe(75);
  });

  it('fica dentro de 0 a 95', () => {
    const cheio = confiancaDosMetaprogramas({
      ...zerado, toward: 20, internal: 20, options: 20, general: 20, proactive: 20, sameness: 20,
    });
    expect(cheio).toBeGreaterThanOrEqual(0);
    expect(cheio).toBeLessThanOrEqual(95);
  });
});
