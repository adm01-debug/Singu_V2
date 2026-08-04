/**
 * Modo de testes da Ficha 360 — armazena overrides client-side em sessionStorage.
 * Não persiste entre sessões nem afeta dados reais.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SimulationSentiment = 'positivo' | 'neutro' | 'misto' | 'negativo' | null;

export interface SimulationOverrides {
  cadence_days: number | null;
  last_contact_at_days_ago: number | null;
  sentiment: SimulationSentiment;
  best_channel: string | null;
  best_time: string | null;
}

export const EMPTY_OVERRIDES: SimulationOverrides = {
  cadence_days: null,
  last_contact_at_days_ago: null,
  sentiment: null,
  best_channel: null,
  best_time: null,
};

interface State {
  enabled: boolean;
  overrides: SimulationOverrides;
  /** Nome do preset built-in atualmente aplicado. */
  presetName: string | null;
  /** Id do preset customizado atualmente aplicado. */
  presetId: string | null;
  setEnabled: (v: boolean) => void;
  setOverride: <K extends keyof SimulationOverrides>(k: K, v: SimulationOverrides[K]) => void;
  applyPreset: (name: string, o: SimulationOverrides) => void;
  applyCustomPreset: (id: string, name: string, o: SimulationOverrides) => void;
  reset: () => void;
}

export const useSimulationStore = create<State>()(
  persist(
    (set) => ({
      enabled: false,
      overrides: { ...EMPTY_OVERRIDES },
      presetName: null,
      presetId: null,
      setEnabled: (v) => set({ enabled: v }),
      setOverride: (k, v) =>
        set((s) => ({
          overrides: { ...s.overrides, [k]: v },
          presetName: null,
          presetId: null,
        })),
      applyPreset: (name, o) =>
        set({ overrides: { ...o }, presetName: name, presetId: null, enabled: true }),
      applyCustomPreset: (id, name, o) =>
        set({ overrides: { ...o }, presetName: name, presetId: id, enabled: true }),
      reset: () =>
        set({
          enabled: false,
          overrides: { ...EMPTY_OVERRIDES },
          presetName: null,
          presetId: null,
        }),
    }),
    {
      name: 'singu-prontidao-sim',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
