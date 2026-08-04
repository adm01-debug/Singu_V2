import { useCallback, useState } from 'react';

/**
 * Persiste a intenção do usuário de manter o WhyScoreDrawer aberto
 * durante a sessão de trabalho, permitindo que o drawer reabra
 * automaticamente ao navegar entre contatos na Ficha 360.
 *
 * - sessionStorage: preferência some ao fechar o navegador.
 * - Quando o usuário fecha explicitamente, a flag é apagada e o
 *   drawer não reabre mais até ser aberto de novo.
 */
const STORAGE_KEY = 'singu-whyscore-open-v1';

function readFlag(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeFlag(value: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (value) {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* modo privado / SSR — ignorar silenciosamente */
  }
}

export interface WhyScoreDrawerPreference {
  shouldAutoOpen: boolean;
  rememberOpen: () => void;
  forgetOpen: () => void;
}

export function useWhyScoreDrawerPreference(): WhyScoreDrawerPreference {
  // Lê uma única vez no mount para evitar flicker; mudanças posteriores
  // não precisam re-renderizar este hook (consumidor controla seu próprio open).
  const [shouldAutoOpen] = useState<boolean>(() => readFlag());

  const rememberOpen = useCallback(() => writeFlag(true), []);
  const forgetOpen = useCallback(() => writeFlag(false), []);

  return { shouldAutoOpen, rememberOpen, forgetOpen };
}
