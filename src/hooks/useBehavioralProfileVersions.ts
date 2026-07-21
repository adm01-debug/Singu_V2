import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BehavioralInsightItem } from '@/hooks/useBehavioralProfile';

export interface BehavioralProfileVersion {
  id: string;
  contact_id: string;
  profile_id: string | null;
  summary: string | null;
  tone: string | null;
  communication_style: string | null;
  sentiment_trend: string | null;
  preferences: BehavioralInsightItem[];
  hobbies: BehavioralInsightItem[];
  recurrent_topics: string[];
  based_on_count: number;
  model: string | null;
  trigger_source: string | null;
  generated_at: string;
}

const asArr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);

function normalize(row: Record<string, unknown>): BehavioralProfileVersion {
  return {
    id: String(row.id),
    contact_id: String(row.contact_id),
    profile_id: (row.profile_id as string) ?? null,
    summary: (row.summary as string) ?? null,
    tone: (row.tone as string) ?? null,
    communication_style: (row.communication_style as string) ?? null,
    sentiment_trend: (row.sentiment_trend as string) ?? null,
    preferences: asArr<BehavioralInsightItem>(row.preferences, []),
    hobbies: asArr<BehavioralInsightItem>(row.hobbies, []),
    recurrent_topics: asArr<string>(row.recurrent_topics, []),
    based_on_count: Number(row.based_on_count ?? 0),
    model: (row.model as string) ?? null,
    trigger_source: (row.trigger_source as string) ?? null,
    generated_at: String(row.generated_at),
  };
}

export function useBehavioralProfileVersions(contactId: string | null | undefined, limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['behavioral-profile-versions', contactId, limit, user?.id],
    enabled: !!contactId && !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<BehavioralProfileVersion[]> => {
      const { data, error } = await supabase
        .from('contact_analytical_profile_versions')
        .select('*')
        .eq('contact_id', contactId!)
        .order('generated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(normalize);
    },
  });
}

/** Retorna itens presentes em `curr` mas ausentes em `prev` e vice-versa, comparando pelo `label` normalizado. */
export function diffInsightLists(prev: BehavioralInsightItem[], curr: BehavioralInsightItem[]) {
  const key = (s: string) => s.trim().toLowerCase();
  const prevSet = new Set(prev.map((p) => key(p.label)));
  const currSet = new Set(curr.map((p) => key(p.label)));
  return {
    added: curr.filter((c) => !prevSet.has(key(c.label))),
    removed: prev.filter((p) => !currSet.has(key(p.label))),
  };
}

export function diffStringLists(prev: string[], curr: string[]) {
  const key = (s: string) => s.trim().toLowerCase();
  const prevSet = new Set(prev.map(key));
  const currSet = new Set(curr.map(key));
  return {
    added: curr.filter((c) => !prevSet.has(key(c))),
    removed: prev.filter((p) => !currSet.has(key(p))),
  };
}