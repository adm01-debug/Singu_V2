/**
 * Meta (linha-alvo) global do Score de Prontidão.
 * Persistida em localStorage, vale para todas as fichas.
 * Valor 0 desabilita a meta visualmente.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface State {
  target: number;
  setTarget: (value: number) => void;
  reset: () => void;
}

const DEFAULT_TARGET = 70;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const useProntidaoTargetStore = create<State>()(
  persist(
    (set) => ({
      target: DEFAULT_TARGET,
      setTarget: (value) => set({ target: clamp(value) }),
      reset: () => set({ target: DEFAULT_TARGET }),
    }),
    {
      name: 'singu-prontidao-target',
      version: 1,
    },
  ),
);

export const PRONTIDAO_TARGET_DEFAULT = DEFAULT_TARGET;
