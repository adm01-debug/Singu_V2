import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Estado booleano persistido em `localStorage`.
 *
 * - SSR-safe: lê do storage apenas após o mount (evita mismatch de hidratação).
 * - Tolerante a falhas: storage indisponível (modo privado, quota) é silenciosamente ignorado.
 * - Sincroniza entre abas via evento `storage`.
 * - SECURITY: callers that store user-specific state MUST include the user ID in `key`
 *   (e.g. `my-feature-${userId ?? 'anon'}`) to prevent cross-user bleed on shared devices.
 */
export function usePersistentBoolean(
  key: string,
  defaultValue: boolean = false,
): [boolean, (next: boolean | ((prev: boolean) => boolean)) => void] {
  const [value, setValue] = useState<boolean>(defaultValue);
  const hydrated = useRef(false);

  // Hidrata na montagem (lado cliente).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === "1" || raw === "true") setValue(true);
      else if (raw === "0" || raw === "false") setValue(false);
    } catch {
      // ignora — storage pode estar indisponível
    }
    hydrated.current = true;
  }, [key]);

  // Sincronia entre abas/janelas.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== key) return;
      if (e.newValue === "1" || e.newValue === "true") setValue(true);
      else if (e.newValue === "0" || e.newValue === "false") setValue(false);
      else if (e.newValue === null) setValue(defaultValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, defaultValue]);

  const update = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: boolean) => boolean)(prev) : next;
        try {
          window.localStorage.setItem(key, resolved ? "1" : "0");
        } catch {
          // ignora
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}
