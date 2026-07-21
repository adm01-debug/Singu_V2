import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

/**
 * Hook genérico para sincronizar preferências de UI por escopo no perfil do
 * usuário (tabela `user_ui_preferences`). Pensado para ser reusado por
 * qualquer módulo (Interações, Contatos, Empresas, Pipeline...).
 *
 * Estratégia (backend é a fonte da verdade):
 *  1. No mount, faz UMA query para buscar `preferences` do escopo.
 *  2. Após chegar a resposta, chama `hydrate(remote)` UMA vez — desde que
 *     `hasUrlOverride` seja false (URL sempre tem precedência) e o valor
 *     remoto difira do atual via comparação rasa de chaves declaradas.
 *  3. Sempre que `current` mudar após a hidratação, agenda `upsert` com
 *     debounce (default 600ms) — coalesce rajadas do usuário em uma única
 *     escrita. Última escrita vence.
 *
 * Sem usuário autenticado: hook vira no-op silencioso (não escreve nem lê).
 *
 * @template T  Forma das preferências do escopo. Deve ser JSON-serializável.
 */
export interface UseUiPreferencesSyncOptions<T extends Record<string, unknown>> {
  /** Identificador estável do módulo (ex.: "interactions"). */
  scope: string;
  /** Snapshot atual das preferências, controlado pelo caller. */
  current: T;
  /** Defaults a aplicar quando o backend não retorna nada para o escopo. */
  defaults: T;
  /**
   * Sanitiza/normaliza o objeto `preferences` vindo do banco. Deve descartar
   * valores fora de whitelist e devolver SEMPRE um objeto completo `T`. Não
   * confiar no formato remoto evita corromper a UI se outro cliente gravar
   * algo malformado.
   */
  sanitize: (raw: unknown) => T;
  /** Aplica as preferências remotas no estado local (uma única vez). */
  hydrate: (prefs: T) => void;
  /**
   * Quando true, a hidratação é PULADA (URL ganha sobre backend). O
   * upsert continua acontecendo para que o backend reflita o que o
   * usuário escolheu via URL.
   */
  hasUrlOverride: boolean;
  /** Debounce do upsert em ms. Default 600. */
  debounceMs?: number;
}

function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    const av = a[k];
    const bv = b[k];
    if (Array.isArray(av) && Array.isArray(bv)) {
      if (av.length !== bv.length) return false;
      const as = [...av].map(String).sort();
      const bs = [...bv].map(String).sort();
      if (!as.every((v, i) => v === bs[i])) return false;
    } else if (av !== bv) {
      return false;
    }
  }
  return true;
}

export function useUiPreferencesSync<T extends Record<string, unknown>>(
  opts: UseUiPreferencesSyncOptions<T>,
) {
  const { scope, current, defaults, sanitize, hydrate, hasUrlOverride, debounceMs = 600 } = opts;
  const { user } = useAuth();
  const qc = useQueryClient();
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<T | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const QK = ['user-ui-preferences', scope, user?.id] as const;

  const { data: remote } = useQuery({
    queryKey: QK,
    enabled: !!user,
    queryFn: async (): Promise<T> => {
      const { data, error } = await supabase
        .from('user_ui_preferences')
        .select('preferences')
        .eq('user_id', user!.id)
        .eq('scope', scope)
        .maybeSingle();
      if (error) throw error;
      return sanitize(data?.preferences ?? null);
    },
    staleTime: 5 * 60_000,
  });

  const upsert = useMutation({
    mutationFn: async (prefs: T) => {
      const userId = user?.id;
      if (!userId) return;
      const { error } = await supabase
        .from('user_ui_preferences')
        .upsert(
          [{ user_id: userId, scope, preferences: prefs as unknown as Json }],
          { onConflict: 'user_id,scope' },
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      lastSavedRef.current = vars;
      qc.setQueryData<T>(QK, vars);
    },
    onError: () => toast.error('Erro ao salvar preferências'),
  });

  // Hidratação one-shot. Roda só após `remote` chegar, e respeita URL.
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!remote) return;
    hydratedRef.current = true;
    lastSavedRef.current = remote;
    if (!hasUrlOverride && !shallowEqual(remote, current)) {
      hydrate(remote);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  // Persistência debounced após hidratação.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (lastSavedRef.current && shallowEqual(lastSavedRef.current, current)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsert.mutate(current);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
}
