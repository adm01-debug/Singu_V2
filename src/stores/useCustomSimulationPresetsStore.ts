/**
 * Presets customizados do Modo de Testes — persistidos em localStorage
 * (sobrevivem entre sessões, ao contrário dos overrides em sessionStorage).
 * Não trafega rede; tudo client-side, escopado ao navegador do usuário.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SimulationOverrides } from './useSimulationStore';

export interface CustomSimulationPreset {
  id: string;
  name: string;
  overrides: SimulationOverrides;
  createdAt: string;
  updatedAt: string;
}

interface State {
  presets: CustomSimulationPreset[];
  /** Cria novo preset e devolve o id gerado. */
  save: (name: string, overrides: SimulationOverrides) => string;
  /** Atualiza overrides (e opcionalmente nome) de um preset existente. */
  update: (id: string, patch: { name?: string; overrides?: SimulationOverrides }) => void;
  remove: (id: string) => void;
}

function makeId(): string {
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  return `preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const useCustomSimulationPresetsStore = create<State>()(
  persist(
    (set, get) => ({
      presets: [],
      save: (name, overrides) => {
        const id = makeId();
        const trimmed = name.trim() || 'Preset sem nome';
        const ts = nowIso();
        const next: CustomSimulationPreset = {
          id,
          name: trimmed,
          overrides: { ...overrides },
          createdAt: ts,
          updatedAt: ts,
        };
        set({ presets: [...get().presets, next] });
        return id;
      },
      update: (id, patch) => {
        set({
          presets: get().presets.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: patch.name?.trim() ? patch.name.trim() : p.name,
                  overrides: patch.overrides ? { ...patch.overrides } : p.overrides,
                  updatedAt: nowIso(),
                }
              : p,
          ),
        });
      },
      remove: (id) => set({ presets: get().presets.filter((p) => p.id !== id) }),
    }),
    {
      name: 'singu-prontidao-sim-custom-presets',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
