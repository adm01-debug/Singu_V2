import { describe, expect, it } from 'vitest';
import { TRIGGER_BUNDLES } from '@/data/triggerBundles';
import { montarRoteiro, nomeDoGatilho } from '../triggerPlaybook';

describe('montarRoteiro', () => {
  it('todo cenário tem roteiro, com um passo por gatilho do pacote', () => {
    for (const pacote of TRIGGER_BUNDLES) {
      const roteiro = montarRoteiro(pacote.scenario);
      expect(roteiro?.pacote.id).toBe(pacote.id);
      expect(roteiro?.trocadoPeloPerfil).toBe(false);
      expect(roteiro?.passos.map(passo => passo.gatilho)).toEqual(pacote.timing.map(t => t.trigger));
    }
  });

  it('todo gatilho dos roteiros tem nome em português no catálogo', () => {
    for (const pacote of TRIGGER_BUNDLES) {
      for (const gatilho of pacote.triggers) expect(nomeDoGatilho(gatilho)).not.toBe(gatilho);
    }
  });

  it('sem perfil escolhido não traz modelo de frase por perfil', () => {
    const roteiro = montarRoteiro('price_objection');
    expect(roteiro?.passos.every(passo => passo.modeloVak === null && passo.modeloMetaprograma === null)).toBe(true);
  });

  it('com sistema representacional escolhido traz o modelo daquele sistema', () => {
    const roteiro = montarRoteiro('price_objection', { vak: 'V' });
    const comModelo = roteiro?.passos.filter(passo => passo.modeloVak) ?? [];
    expect(comModelo.length).toBeGreaterThan(0);
    for (const passo of comModelo) {
      expect(passo.modeloVak?.vakType).toBe('V');
      expect(passo.modeloVak?.triggerId).toBe(passo.gatilho);
    }
  });

  it('com metaprograma escolhido traz o modelo daquele metaprograma', () => {
    const roteiro = montarRoteiro('price_objection', { metaprograma: 'away_from' });
    const comModelo = roteiro?.passos.filter(passo => passo.modeloMetaprograma) ?? [];
    expect(comModelo.length).toBeGreaterThan(0);
    for (const passo of comModelo) {
      expect(passo.modeloMetaprograma?.metaprogram).toBe('away_from');
      expect(passo.modeloMetaprograma?.triggerId).toBe(passo.gatilho);
    }
  });

  it('aponta o roteiro reserva quando o pacote define um', () => {
    expect(montarRoteiro('price_objection')?.reserva?.id).toBe('bundle-relationship-recovery');
    expect(montarRoteiro('general')?.reserva).toBeNull();
  });

  it('avisa quando o perfil DISC troca o pacote do cenário por outro', () => {
    for (const pacote of TRIGGER_BUNDLES) {
      for (const disc of ['D', 'I', 'S', 'C'] as const) {
        const roteiro = montarRoteiro(pacote.scenario, { disc });
        expect(roteiro).not.toBeNull();
        expect(roteiro?.trocadoPeloPerfil).toBe(roteiro?.pacote.scenario !== pacote.scenario);
        if (roteiro?.trocadoPeloPerfil) expect(roteiro.pacote.discProfiles).toContain(disc);
      }
    }
  });
});
