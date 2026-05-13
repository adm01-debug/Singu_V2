/**
 * Aplica overrides de simulação sobre profile/intelligence reais.
 * Função pura, zero side effects.
 */
import type { SimulationOverrides } from '@/stores/useSimulationStore';

interface ProfileShape {
  cadence_days?: number | null;
  last_contact_at?: string | null;
  sentiment?: string | null;
}

interface IntelligenceShape {
  sentiment?: string | null;
  best_channel?: string | null;
  best_time?: string | null;
}

export interface SimulationPreset {
  name: string;
  label: string;
  description: string;
  overrides: SimulationOverrides;
}

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    name: 'sentimento-negativo',
    label: 'Sentimento negativo',
    description: 'Última conversa azedou — rebaixa fator sentimento.',
    overrides: {
      cadence_days: null,
      last_contact_at_days_ago: null,
      sentiment: 'negativo',
      best_channel: null,
      best_time: null,
    },
  },
  {
    name: 'sem-cadencia',
    label: 'Sem cadência',
    description: 'Sem ritmo definido nem registro recente.',
    overrides: {
      cadence_days: null,
      last_contact_at_days_ago: null,
      sentiment: null,
      best_channel: null,
      best_time: null,
    },
  },
  {
    name: 'interacao-antiga',
    label: 'Última interação antiga',
    description: 'Sem contato há 90 dias.',
    overrides: {
      cadence_days: null,
      last_contact_at_days_ago: 90,
      sentiment: null,
      best_channel: null,
      best_time: null,
    },
  },
  {
    name: 'atrasado-cadencia',
    label: 'Atrasado vs cadência',
    description: 'Cadência semanal mas 21 dias sem falar.',
    overrides: {
      cadence_days: 7,
      last_contact_at_days_ago: 21,
      sentiment: null,
      best_channel: null,
      best_time: null,
    },
  },
  {
    name: 'tudo-verde',
    label: 'Tudo verde',
    description: 'Cenário ideal: cadência ok, recente, positivo, canal claro.',
    overrides: {
      cadence_days: 7,
      last_contact_at_days_ago: 2,
      sentiment: 'positivo',
      best_channel: 'WhatsApp',
      best_time: 'manhã',
    },
  },
  {
    name: 'sem-canal',
    label: 'Sem canal preferido',
    description: 'Falta sinal de canal/horário ótimo.',
    overrides: {
      cadence_days: null,
      last_contact_at_days_ago: null,
      sentiment: null,
      best_channel: '',
      best_time: '',
    },
  },
];

const DAY_MS = 86_400_000;

export interface SimulationResult<P, I> {
  profile: (P & ProfileShape) | null;
  intelligence: (I & IntelligenceShape) | null;
}

export function applySimulation<P extends ProfileShape, I extends IntelligenceShape>(
  profile: P | null | undefined,
  intelligence: I | null | undefined,
  overrides: SimulationOverrides,
): SimulationResult<P, I> {
  const baseProfile = (profile ? { ...profile } : {}) as P & ProfileShape;
  const baseIntel = (intelligence ? { ...intelligence } : {}) as I & IntelligenceShape;

  if (overrides.cadence_days !== null) {
    baseProfile.cadence_days = overrides.cadence_days;
  }
  if (overrides.last_contact_at_days_ago !== null) {
    baseProfile.last_contact_at = new Date(
      Date.now() - overrides.last_contact_at_days_ago * DAY_MS,
    ).toISOString();
  }
  if (overrides.sentiment !== null) {
    baseProfile.sentiment = overrides.sentiment;
    baseIntel.sentiment = overrides.sentiment;
  }
  if (overrides.best_channel !== null) {
    baseIntel.best_channel = overrides.best_channel || null;
  }
  if (overrides.best_time !== null) {
    baseIntel.best_time = overrides.best_time || null;
  }

  return {
    profile: profile || Object.keys(baseProfile).length ? baseProfile : null,
    intelligence: intelligence || Object.keys(baseIntel).length ? baseIntel : null,
  };
}

export function hasActiveOverrides(overrides: SimulationOverrides): boolean {
  return (
    overrides.cadence_days !== null ||
    overrides.last_contact_at_days_ago !== null ||
    overrides.sentiment !== null ||
    overrides.best_channel !== null ||
    overrides.best_time !== null
  );
}
