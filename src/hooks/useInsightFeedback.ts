import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { EvidenceKind } from '@/components/contacts/EvidenceDrillDownSheet';

export type InsightVote = 1 | -1;

export interface InsightFeedbackRow {
  id: string;
  vote: InsightVote;
  note: string | null;
  updated_at: string;
}

function key(contactId: string, kind: EvidenceKind, label: string) {
  return ['insight-feedback', contactId, kind, label.trim().toLowerCase()];
}

export function useInsightFeedback(
  contactId: string | null | undefined,
  kind: EvidenceKind | null | undefined,
  label: string | null | undefined,
) {
  const { user } = useAuth();
  return useQuery({
    queryKey: key(contactId ?? '', kind ?? 'preference', label ?? ''),
    enabled: !!contactId && !!kind && !!label && label.trim().length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<InsightFeedbackRow | null> => {
      const uid = user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from('behavioral_insight_feedback')
        .select('id, vote, note, updated_at')
        .eq('user_id', uid)
        .eq('contact_id', contactId!)
        .eq('insight_kind', kind!)
        .eq('insight_label', label!.trim())
        .maybeSingle();
      if (error) throw error;
      return (data as InsightFeedbackRow | null) ?? null;
    },
  });
}

export function useSubmitInsightFeedback() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      contactId: string;
      kind: EvidenceKind;
      label: string;
      vote: InsightVote;
      note?: string | null;
    }) => {
      const uid = user?.id;
      if (!uid) throw new Error('Você precisa estar autenticado para enviar feedback.');
      const payload = {
        user_id: uid,
        contact_id: input.contactId,
        insight_kind: input.kind,
        insight_label: input.label.trim(),
        vote: input.vote,
        note: input.note ?? null,
      };
      const { data, error } = await supabase
        .from('behavioral_insight_feedback')
        .upsert(payload, { onConflict: 'user_id,contact_id,insight_kind,insight_label' })
        .select('id, vote, note, updated_at')
        .single();
      if (error) throw error;
      return data as InsightFeedbackRow;
    },
    onSuccess: (row, vars) => {
      qc.setQueryData(key(vars.contactId, vars.kind, vars.label), row);
    },
    onError: () => toast.error('Erro ao registrar feedback'),
  });
}

export function useRemoveInsightFeedback() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contactId: string; kind: EvidenceKind; label: string }) => {
      const uid = user?.id;
      if (!uid) throw new Error('Você precisa estar autenticado.');
      const { error } = await supabase
        .from('behavioral_insight_feedback')
        .delete()
        .eq('user_id', uid)
        .eq('contact_id', input.contactId)
        .eq('insight_kind', input.kind)
        .eq('insight_label', input.label.trim());
      if (error) throw error;
    },
    onSuccess: (_v, vars) => {
      qc.setQueryData(key(vars.contactId, vars.kind, vars.label), null);
    },
    onError: () => toast.error('Erro ao remover feedback'),
  });
}