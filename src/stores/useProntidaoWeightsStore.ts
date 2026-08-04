/**
 * Pesos do Score de Prontidão.
 * - `defaultWeights`: padrão global persistido em localStorage (vale para todas as fichas).
 * - `sessionOverride`: ajuste efêmero para um único `contactId` (não persistido; some ao recarregar/trocar contato).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PRONTIDAO_WEIGHTS, type ProntidaoWeights } from '@/domain/leadScoring';

interface SessionOverride {
  contactId: string;
  weights: ProntidaoWeights;
}

interface State {
  defaultWeights: ProntidaoWeights;
  sessionOverride: SessionOverride | null;
  setDefaultWeight: (key: keyof ProntidaoWeights, value: number) => void;
  setSessionOverrideWeight: (
    contactId: string,
    key: keyof ProntidaoWeights,
    value: number,
  ) => void;
  clearSessionOverride: () => void;
  resetDefaults: () => void;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const useProntidaoWeightsStore = create<State>()(
  persist(
    (set) => ({
      defaultWeights: { ...DEFAULT_PRONTIDAO_WEIGHTS },
      sessionOverride: null,
      setDefaultWeight: (key, value) =>
        set((s) => ({ defaultWeights: { ...s.defaultWeights, [key]: clamp(value) } })),
      setSessionOverrideWeight: (contactId, key, value) =>
        set((s) => {
          const base =
            s.sessionOverride && s.sessionOverride.contactId === contactId
              ? s.sessionOverride.weights
              : s.defaultWeights;
          return {
            sessionOverride: {
              contactId,
              weights: { ...base, [key]: clamp(value) },
            },
          };
        }),
      clearSessionOverride: () => set({ sessionOverride: null }),
      resetDefaults: () => set({ defaultWeights: { ...DEFAULT_PRONTIDAO_WEIGHTS } }),
    }),
    {
      name: 'singu-prontidao-weights',
      partialize: (state) => ({ defaultWeights: state.defaultWeights }),
      // Migração transparente do shape antigo `{ weights }` -> `{ defaultWeights }`
      migrate: (persisted: unknown) => {
        if (persisted && typeof persisted === 'object') {
          const obj = persisted as Record<string, unknown>;
          if (!obj.defaultWeights && obj.weights) {
            return { defaultWeights: obj.weights as ProntidaoWeights };
          }
        }
        return persisted as { defaultWeights: ProntidaoWeights } | undefined;
      },
      version: 2,
    },
  ),
);

/**
 * Retorna os pesos efetivos: override de sessão se aplicável ao contactId, senão o padrão global.
 */
export const useEffectiveProntidaoWeights = (contactId?: string): ProntidaoWeights => {
  return useProntidaoWeightsStore((s) =>
    s.sessionOverride && contactId && s.sessionOverride.contactId === contactId
      ? s.sessionOverride.weights
      : s.defaultWeights,
  );
};
