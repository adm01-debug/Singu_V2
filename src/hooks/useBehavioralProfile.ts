import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export interface BehavioralInsightItem {
  label: string;
  evidence?: string;
}

export interface BehavioralProfile {
  id: string;
  contact_id: string;
  summary: string | null;
  tone: string | null;
  communication_style: string | null;
  sentiment_trend: string | null;
  preferences: BehavioralInsightItem[];
  hobbies: BehavioralInsightItem[];
  recurrent_topics: string[];
  based_on_count: number;
  model: string | null;
  last_updated_at: string;
}

function normalize(row: Record<string, unknown> | null): BehavioralProfile | null {
  if (!row) return null;
  const asArr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  return {
    id: String(row.id),
    contact_id: String(row.contact_id),
    summary: (row.summary as string) ?? null,
    tone: (row.tone as string) ?? null,
    communication_style: (row.communication_style as string) ?? null,
    sentiment_trend: (row.sentiment_trend as string) ?? null,
    preferences: asArr<BehavioralInsightItem>(row.preferences, []),
    hobbies: asArr<BehavioralInsightItem>(row.hobbies, []),
    recurrent_topics: asArr<string>(row.recurrent_topics, []),
    based_on_count: Number(row.based_on_count ?? 0),
    model: (row.model as string) ?? null,
    last_updated_at: String(row.last_updated_at),
  };
}

export function useBehavioralProfile(contactId: string | null | undefined) {
  return useQuery({
    queryKey: ['behavioral-profile', contactId],
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<BehavioralProfile | null> => {
      const { data, error } = await supabase
        .from('contact_analytical_profiles')
        .select('*')
        .eq('contact_id', contactId!)
        .maybeSingle();
      if (error) throw error;
      return normalize(data as Record<string, unknown> | null);
    },
  });
}

export function useGenerateBehavioralProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string): Promise<BehavioralProfile> => {
      const { data, error } = await supabase.functions.invoke('generate-behavioral-profile', {
        body: { contact_id: contactId },
      });
      if (error) throw new Error(error.message);
      if (!data?.profile) throw new Error(data?.error || 'Falha ao gerar perfil');
      return normalize(data.profile as Record<string, unknown>)!;
    },
    onSuccess: (profile) => {
      qc.setQueryData(['behavioral-profile', profile.contact_id], profile);
      toast.success('Perfil comportamental atualizado');
    },
    onError: (e: Error) => {
      toast.error('Erro ao gerar perfil', { description: parseApiError(e) });
    },
  });
}
