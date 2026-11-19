import { describe, expect, it } from 'vitest';
import { ADVANCED_MENTAL_TRIGGERS, TRIGGER_CONFLICTS, TRIGGER_FALLBACKS, TRIGGER_SYNERGIES } from '@/data/triggersAdvancedData';
import { COMPLETE_TRIGGER_CONFLICTS, COMPLETE_TRIGGER_SYNERGIES } from '@/data/triggerConflictsMatrix';
import {
  EXTENDED_TRIGGER_CONFLICTS,
  EXTENDED_TRIGGER_FALLBACKS,
  EXTENDED_TRIGGER_SYNERGIES,
} from '@/data/triggersExtendedData';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { ALTERNATIVAS, CONFLITOS, SINERGIAS } from '../useAdvancedTriggers';

/**
 * Trava a entrada das relações dos gatilhos estendidos no painel.
 *
 * `data/triggersExtendedData.ts` não era importado por ninguém: seus 14
 * conflitos, 13 sinergias e 4 árvores de alternativa ficavam fora do painel de
 * Gatilhos Avançados. A entrada tem de ser ADITIVA.
 */

const chaveDoPar = (a: string, b: string) => [a, b].sort().join('|');
const chaves = (lista: { trigger1: string; trigger2: string }[]) =>
  lista.map(item => chaveDoPar(item.trigger1, item.trigger2));

describe('relações dos gatilhos estendidos', () => {
  it('todo conflito estendido passa a ser detectado', () => {
    const emUso = new Set(chaves(CONFLITOS));
    for (const chave of chaves(EXTENDED_TRIGGER_CONFLICTS)) expect(emUso.has(chave)).toBe(true);
  });

  it('toda sinergia estendida passa a ser detectada', () => {
    const emUso = new Set(chaves(SINERGIAS));
    for (const chave of chaves(EXTENDED_TRIGGER_SYNERGIES)) expect(emUso.has(chave)).toBe(true);
  });

  it('não perde nem altera nenhuma relação que já estava em uso', () => {
    for (const original of TRIGGER_CONFLICTS) expect(CONFLITOS).toContain(original);
    for (const original of TRIGGER_SYNERGIES) expect(SINERGIAS).toContain(original);
    for (const original of TRIGGER_FALLBACKS) expect(ALTERNATIVAS).toContain(original);
    expect(chaves(CONFLITOS)).toEqual(expect.arrayContaining(chaves(COMPLETE_TRIGGER_CONFLICTS)));
    expect(chaves(SINERGIAS)).toEqual(expect.arrayContaining(chaves(COMPLETE_TRIGGER_SYNERGIES)));
  });

  it('não deixa par duplicado, nem com a ordem invertida', () => {
    for (const lista of [CONFLITOS, SINERGIAS]) {
      const todas = chaves(lista);
      expect(new Set(todas).size).toBe(todas.length);
    }
  });

  it('cada gatilho tem no máximo uma árvore de alternativas, e as 4 estendidas entram', () => {
    const primarios = ALTERNATIVAS.map(arvore => arvore.primaryTrigger);
    expect(new Set(primarios).size).toBe(primarios.length);
    for (const extra of EXTENDED_TRIGGER_FALLBACKS) expect(primarios).toContain(extra.primaryTrigger);
    expect(ALTERNATIVAS.length).toBe(TRIGGER_FALLBACKS.length + EXTENDED_TRIGGER_FALLBACKS.length);
  });

  it('toda relação aponta para gatilhos que existem no catálogo em uso', () => {
    const catalogo = new Set([...Object.keys(MENTAL_TRIGGERS), ...Object.keys(ADVANCED_MENTAL_TRIGGERS)]);
    for (const item of [...EXTENDED_TRIGGER_CONFLICTS, ...EXTENDED_TRIGGER_SYNERGIES]) {
      expect(catalogo.has(item.trigger1)).toBe(true);
      expect(catalogo.has(item.trigger2)).toBe(true);
    }
    for (const arvore of EXTENDED_TRIGGER_FALLBACKS) {
      expect(catalogo.has(arvore.primaryTrigger)).toBe(true);
      for (const passo of arvore.fallbackSequence) expect(catalogo.has(passo.trigger)).toBe(true);
    }
  });
});
