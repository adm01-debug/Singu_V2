import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { NbaPriority, NbaSort } from './useProximosPassosFilters';

const SCOPE = 'ficha360';
const VALID_PRIORITIES: readonly NbaPriority[] = ['alta', 'media', 'baixa'];
const VALID_SORTS: readonly NbaSort[] = ['sugerido', 'recomendacao', 'prioridade', 'canal'];

export interface Ficha360Preferences {
  priorities: NbaPriority[];
  channels: string[];
  sort: NbaSort;
}

const DEFAULTS: Ficha360Preferences = {
  priorities: [],
  channels: [],
  sort: 'sugerido',
};

function sanitize(raw: unknown): Ficha360Preferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
  const obj = raw as Record<string, unknown>;
  const priorities = Array.isArray(obj.priorities)
    ? (obj.priorities as unknown[])
        .map((v) => String(v).toLowerCase())
        .filter((v): v is NbaPriority => (VALID_PRIORITIES as readonly string[]).includes(v))
    : [];
  const channels = Array.isArray(obj.channels)
    ? (obj.channels as unknown[]).map((v) => String(v).toLowerCase()).filter(Boolean)
    : [];
  const sortRaw = String(obj.sort ?? '').toLowerCase();
  const sort = (VALID_SORTS as readonly string[]).includes(sortRaw)
    ? (sortRaw as NbaSort)
    : DEFAULTS.sort;
  return { priorities, channels, sort };
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const as = [...a].sort();
  const bs = [...b].sort();
  return as.every((v, i) => v === bs[i]);
}

function prefsEqual(a: Ficha360Preferences, b: Ficha360Preferences) {
  return arraysEqual(a.priorities, b.priorities) && arraysEqual(a.channels, b.channels) && a.sort === b.sort;
}

/** @internal — computed inside the hook so it includes user?.id */

/**
 * Sincroniza preferências de filtros/ordenação da Ficha 360 com o perfil do usuário.
 * - Carrega no primeiro acesso (se ausentes na URL, hidrata os filtros).
 * - Salva (debounced) sempre que mudarem.
 */
export function useFicha360PreferencesSync(opts: {
  current: Ficha360Preferences;
  hydrate: (prefs: Ficha360Preferences) => void;
  hasUrlOverride: boolean;
}) {
  const { user } = useAuth();
  const { current, hydrate, hasUrlOverride } = opts;
  const qc = useQueryClient();
  const QK = ['user-ui-preferences', SCOPE, user?.id] as const;
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<Ficha360Preferences | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: remote } = useQuery({
    queryKey: QK,
    enabled: !!user,
    queryFn: async (): Promise<Ficha360Preferences> => {
      if (!user?.id) return { ...DEFAULTS };
      const { data, error } = await supabase
        .from('user_ui_preferences')
        .select('preferences')
        .eq('user_id', user!.id)
        .eq('scope', SCOPE)
        .maybeSingle();
      if (error) throw error;
      return sanitize(data?.preferences ?? null);
    },
    staleTime: 5 * 60_000,
  });

  const upsert = useMutation({
    mutationFn: async (prefs: Ficha360Preferences) => {
      const userId = user?.id;
      if (!userId) return;
      const { error } = await supabase
        .from('user_ui_preferences')
        .upsert(
          [{ user_id: userId, scope: SCOPE, preferences: prefs as unknown as never }],
          { onConflict: 'user_id,scope' },
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      lastSavedRef.current = vars;
      qc.setQueryData<Ficha360Preferences>(QK, vars);
    },
  });

  // Hidrata uma única vez se a URL não trouxe overrides
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!remote) return;
    hydratedRef.current = true;
    lastSavedRef.current = remote;
    if (!hasUrlOverride && !prefsEqual(remote, current)) {
      hydrate(remote);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  // Persiste mudanças (debounced) após hidratação
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (lastSavedRef.current && prefsEqual(lastSavedRef.current, current)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsert.mutate(current);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.priorities, current.channels, current.sort]);
}
