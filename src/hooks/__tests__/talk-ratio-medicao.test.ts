import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCarnegieAnalysis } from '../useCarnegieAnalysis';

/**
 * Trava a medição de proporção de fala contra o texto real.
 *
 * Antes da correção, estes números não liam o texto: `speakerRatio` era
 * `isUserSpeaking ? 60 : 40`, `idealRatio` era 35, e as contagens por tipo de
 * pergunta saíam de frações fixas (`questionCount * 0.3`, `* 0.7`, `* 0.2`).
 * Os padrões que agora contam estão em `src/data/carnegieTalkRatio.ts`, que
 * era um módulo de 410 linhas que nenhum arquivo importava.
 */

function analisar(texto: string) {
  const { result } = renderHook(() => useCarnegieAnalysis(null));
  return result.current.analyzeTalkRatio(texto);
}

describe('analyzeTalkRatio', () => {
  it('não devolve proporção de fala: ela exige os dois lados da conversa', () => {
    const a = analisar('Como você chegou a essa conclusão? Entendo o que você diz.');
    expect(a.speakerRatio).toBeNull();
    expect(a.listenerRatio).toBeNull();
    expect(a.idealRatio).toBeNull();
    expect(a.deviation).toBeNull();
    expect(a.quality).toBeNull();
  });

  it('separa pergunta aberta de fechada pelos padrões do módulo', () => {
    const a = analisar('Como você chegou a essa conclusão? Você concorda?');
    expect(a.questionCount).toBe(2);
    expect(a.openEndedQuestions).toBe(1);
    expect(a.closedQuestions).toBe(1);
  });

  it('conta escuta ativa e reconhecimento a partir do texto', () => {
    const a = analisar('Entendo o que você está dizendo. Me conte mais. Vamos seguir.');
    expect(a.activeListeningIndicators).toBeGreaterThan(0);
    expect(a.acknowledgments).toBeGreaterThan(0);
  });

  it('marca interrupção quando o texto tem os marcadores', () => {
    const comInterrupcao = analisar('Mas isso não procede. Deixa eu explicar.');
    const semInterrupcao = analisar('Obrigado pelo retorno. Vou preparar a proposta.');
    expect(comInterrupcao.interruptionIndicators).toBeGreaterThan(0);
    expect(semInterrupcao.interruptionIndicators).toBe(0);
  });

  it('as contagens mudam com o texto — não são fração fixa do total', () => {
    const soAbertas = analisar('Como foi? Por que isso? O que você acha?');
    const soFechadas = analisar('Você viu? Está certo? Pode ser?');
    expect(soAbertas.openEndedQuestions).toBeGreaterThan(soFechadas.openEndedQuestions);
    expect(soFechadas.closedQuestions).toBeGreaterThan(soAbertas.closedQuestions);
    // A fórmula antiga daria sempre floor(3*0.3)=0 abertas e floor(3*0.7)=2 fechadas
    // para os DOIS textos, já que ambos têm 3 perguntas.
    expect(soAbertas.questionCount).toBe(soFechadas.questionCount);
    expect(soAbertas.openEndedQuestions).not.toBe(soFechadas.openEndedQuestions);
  });

  it('conta afirmações separadas de perguntas', () => {
    const a = analisar('Vou preparar a proposta. Você concorda?');
    expect(a.statementCount).toBe(1);
    expect(a.questionCount).toBe(1);
  });
});
