import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { NbaPriority, NbaSort } from './useProximosPassosFilters';

const SCOPE = 'ficha360:presets';
const VALID_PRIORITIES: readonly NbaPriority[] = ['alta', 'media', 'baixa'];
const VALID_SORTS: readonly NbaSort[] = ['sugerido', 'prioridade', 'canal'];

export interface FilterPreset {
  id: string;
  name: string;
  priorities: NbaPriority[];
  channels: string[];
  sort: NbaSort;
  createdAt: string;
}

interface PresetsPayload {
  presets: FilterPreset[];
}

function sanitizePreset(raw: unknown): FilterPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = String(obj.id ?? '').trim();
  const name = String(obj.name ?? '').trim();
  if (!id || !name) return null;
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
    : 'sugerido';
  const createdAt = String(obj.createdAt ?? new Date().toISOString());
  return { id, name, priorities, channels, sort, createdAt };
}

function sanitizePayload(raw: unknown): PresetsPayload {
  if (!raw || typeof raw !== 'object') return { presets: [] };
  const obj = raw as Record<string, unknown>;
  const list = Array.isArray(obj.presets) ? obj.presets : [];
  const presets = list
    .map(sanitizePreset)
    .filter((p): p is FilterPreset => p !== null);
  return { presets };
}

export function useFicha360FilterPresets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const QK = ['user-ui-preferences', SCOPE, user?.id] as const;

  const { data, isLoading } = useQuery({
    queryKey: QK,
    enabled: !!user,
    queryFn: async (): Promise<PresetsPayload> => {
      if (!user?.id) return { presets: [] };
      const { data, error } = await supabase
        .from('user_ui_preferences')
        .select('preferences')
        .eq('user_id', user!.id)
        .eq('scope', SCOPE)
        .maybeSingle();
      if (error) throw error;
      return sanitizePayload(data?.preferences ?? null);
    },
    staleTime: 5 * 60_000,
  });

  const persist = useMutation({
    mutationFn: async (next: PresetsPayload) => {
      const userId = user?.id;
      if (!userId) return next;
      const { error } = await supabase
        .from('user_ui_preferences')
        .upsert(
          [
            {
              user_id: userId,
              scope: SCOPE,
              preferences: next as unknown as never,
            },
          ],
          { onConflict: 'user_id,scope' },
        );
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData<PresetsPayload>(QK, next);
    },
    onError: () => toast.error('Erro ao salvar filtros predefinidos'),
  });

  const presets = data?.presets ?? [];

  const savePreset = (input: { name: string; priorities: NbaPriority[]; channels: string[]; sort: NbaSort }) => {
    const name = input.name.trim().slice(0, 40);
    if (!name) return;
    // Substitui se já existir com mesmo nome (case-insensitive), senão adiciona
    const existing = presets.find((p) => p.name.toLowerCase() === name.toLowerCase());
    const newPreset: FilterPreset = {
      // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
      id: existing?.id ?? `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      priorities: [...input.priorities],
      channels: [...input.channels],
      sort: input.sort,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const nextList = existing
      ? presets.map((p) => (p.id === existing.id ? newPreset : p))
      : [...presets, newPreset];
    return persist.mutateAsync({ presets: nextList.slice(0, 20) });
  };

  const deletePreset = (id: string) => {
    return persist.mutateAsync({ presets: presets.filter((p) => p.id !== id) });
  };

  return {
    presets,
    isLoading,
    isSaving: persist.isPending,
    savePreset,
    deletePreset,
  };
}
