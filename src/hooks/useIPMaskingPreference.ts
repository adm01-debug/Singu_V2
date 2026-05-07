import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'singu:mask-ips';
const CUSTOM_EVENT_KEY = 'singu:mask-ips:changed';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    // Default seguro: false. Só ativa se explicitamente '1'.
    return val === '1';
  } catch (err) {
    console.warn('[useIPMaskingPreference] Falha ao ler localStorage:', err);
    return false;
  }
}

function write(value: boolean) {
  if (typeof window === 'undefined') return;
  const strValue = value ? '1' : '0';
  
  try {
    localStorage.setItem(STORAGE_KEY, strValue);
  } catch (err) {
    // Modo privado ou quota exceeded não deve quebrar o app
    console.warn('[useIPMaskingPreference] Falha ao persistir preferência:', err);
  }

  // Notifica outras instâncias do hook NA MESMA aba via CustomEvent
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_KEY, { detail: value }));
}

/**
 * Hook para gerenciar a preferência global de mascaramento de IPs.
 * Sincroniza o estado entre múltiplas instâncias na mesma aba e entre abas diferentes.
 */
export function useIPMaskingPreference() {
  const [masked, setMaskedState] = useState<boolean>(read);

  useEffect(() => {
    // 1. Sincronização ENTRE abas (evento nativo do navegador)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setMaskedState(e.newValue === '1');
      }
    };

    // 2. Sincronização NA MESMA aba (evento customizado interno)
    const onCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setMaskedState(customEvent.detail);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(CUSTOM_EVENT_KEY, onCustomChange);
    
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CUSTOM_EVENT_KEY, onCustomChange);
    };
  }, []);

  const setMasked = useCallback((v: boolean) => {
    setMaskedState(v);
    write(v);
  }, []);

  const toggle = useCallback(() => {
    setMaskedState(prev => {
      const next = !prev;
      write(next);
      return next;
    });
  }, []);

  return { masked, toggle, setMasked };
}
