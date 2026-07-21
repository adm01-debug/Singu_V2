import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TagCategory = 'hobbies' | 'interests';

export interface TagDiff {
  added: string[];
  removed: string[];
}

export interface TagHistoryEvent {
  id: string;
  createdAt: string;
  userId: string | null;
  changes: Partial<Record<TagCategory, TagDiff>>;
}

interface AuditRow {
  id: string;
  created_at: string;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

const toStringArray = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
};

export function diffArrays(oldArr: string[], newArr: string[]): TagDiff {
  const oldSet = new Set(oldArr);
  const newSet = new Set(newArr);
  return {
    added: newArr.filter((x) => !oldSet.has(x)),
    removed: oldArr.filter((x) => !newSet.has(x)),
  };
}

const CATEGORIES: TagCategory[] = ['hobbies', 'interests'];

export function useContactTagsHistory(contactId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-tags-history', contactId, user?.id],
    queryFn: async (): Promise<TagHistoryEvent[]> => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('audit_log')
        .select('id, created_at, user_id, old_data, new_data')
        .eq('entity_type', 'contact_tags')
        .eq('entity_id', contactId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      const rows = (data ?? []) as AuditRow[];

      const events: TagHistoryEvent[] = [];
      for (const row of rows) {
        const oldD = (row.old_data ?? {}) as Record<string, unknown>;
        const newD = (row.new_data ?? {}) as Record<string, unknown>;
        const changes: Partial<Record<TagCategory, TagDiff>> = {};
        for (const cat of CATEGORIES) {
          const before = toStringArray(oldD[cat]);
          const after = toStringArray(newD[cat]);
          const diff = diffArrays(before, after);
          if (diff.added.length > 0 || diff.removed.length > 0) {
            changes[cat] = diff;
          }
        }
        if (Object.keys(changes).length > 0) {
          events.push({
            id: row.id,
            createdAt: row.created_at,
            userId: row.user_id,
            changes,
          });
        }
      }
      return events;
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
