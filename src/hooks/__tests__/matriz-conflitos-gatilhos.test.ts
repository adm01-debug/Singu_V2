import { describe, expect, it } from 'vitest';
import { TRIGGER_CONFLICTS, TRIGGER_SYNERGIES } from '@/data/triggersAdvancedData';
import { COMPLETE_TRIGGER_CONFLICTS, COMPLETE_TRIGGER_SYNERGIES } from '@/data/triggerConflictsMatrix';

/**
 * Trava a união das matrizes de gatilhos.
 *
 * O painel de Gatilhos Avançados detectava conflito entre 6 pares e sinergia
 * entre 7. Ao lado, `data/triggerConflictsMatrix.ts` trazia 45 conflitos e
 * 33 sinergias que nenhum arquivo importava. A união tem de ser ADITIVA:
 * nenhum par que já funcionava pode sair ou mudar.
 */

const chaveDoPar = (a: string, b: string) => [a, b].sort().join('|');

function unir<T extends { trigger1: string; trigger2: string }>(emUso: T[], extras: T[]): T[] {
  const cobertos = new Set(emUso.map(i => chaveDoPar(i.trigger1, i.trigger2)));
  return [...emUso, ...extras.filter(i => !cobertos.has(chaveDoPar(i.trigger1, i.trigger2)))];
}

describe('união das matrizes de gatilhos', () => {
  it('não perde nenhum conflito que já estava em uso', () => {
    const unidos = unir(TRIGGER_CONFLICTS, COMPLETE_TRIGGER_CONFLICTS);
    for (const original of TRIGGER_CONFLICTS) {
      expect(unidos).toContain(original);
    }
  });

  it('não perde nenhuma sinergia que já estava em uso', () => {
    const unidas = unir(TRIGGER_SYNERGIES, COMPLETE_TRIGGER_SYNERGIES);
    for (const original of TRIGGER_SYNERGIES) {
      expect(unidas).toContain(original);
    }
  });

  it('amplia de fato a cobertura de conflitos', () => {
    const unidos = unir(TRIGGER_CONFLICTS, COMPLETE_TRIGGER_CONFLICTS);
    expect(unidos.length).toBeGreaterThan(TRIGGER_CONFLICTS.length);
  });

  it('amplia de fato a cobertura de sinergias', () => {
    const unidas = unir(TRIGGER_SYNERGIES, COMPLETE_TRIGGER_SYNERGIES);
    expect(unidas.length).toBeGreaterThan(TRIGGER_SYNERGIES.length);
  });

  it('não deixa par duplicado, nem com a ordem invertida', () => {
    for (const lista of [
      unir(TRIGGER_CONFLICTS, COMPLETE_TRIGGER_CONFLICTS),
      unir(TRIGGER_SYNERGIES, COMPLETE_TRIGGER_SYNERGIES),
    ]) {
      const chaves = lista.map(i => chaveDoPar(i.trigger1, i.trigger2));
      expect(new Set(chaves).size).toBe(chaves.length);
    }
  });

  it('o par urgência + empatia, que existe nas duas fontes, entra uma vez só', () => {
    const unidos = unir(TRIGGER_CONFLICTS, COMPLETE_TRIGGER_CONFLICTS);
    const ocorrencias = unidos.filter(
      c => chaveDoPar(c.trigger1, c.trigger2) === chaveDoPar('urgency', 'empathy'),
    );
    expect(ocorrencias).toHaveLength(1);
  });
});
