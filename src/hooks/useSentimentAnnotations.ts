import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type AnnotationCategory = 'campanha' | 'abordagem' | 'release' | 'reuniao' | 'outro';

export interface SentimentAnnotation {
  id: string;
  created_by: string;
  contact_id: string;
  week_start: string; // ISO date YYYY-MM-DD
  category: AnnotationCategory;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnotationInput {
  contact_id: string;
  week_start: string;
  category: AnnotationCategory;
  title: string;
  description?: string | null;
}

export interface UpdateAnnotationInput {
  id: string;
  category?: AnnotationCategory;
  title?: string;
  description?: string | null;
  week_start?: string;
}

const QK = (contactId?: string) => ['sentiment-annotations', contactId ?? 'none'] as const;

export function useSentimentAnnotations(contactId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: QK(contactId),
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SentimentAnnotation[]> => {
      const { data, error } = await supabase
        .from('sentiment_annotations')
        .select('*')
        .eq('contact_id', contactId!)
        .order('week_start', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as SentimentAnnotation[];
    },
  });

  const byWeek = useMemo(() => {
    const map = new Map<string, SentimentAnnotation[]>();
    for (const a of list.data ?? []) {
      const arr = map.get(a.week_start) ?? [];
      arr.push(a);
      map.set(a.week_start, arr);
    }
    return map;
  }, [list.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: QK(contactId) });

  const create = useMutation({
    mutationFn: async (input: CreateAnnotationInput) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('sentiment_annotations')
        .insert({
          created_by: user.id,
          contact_id: input.contact_id,
          week_start: input.week_start,
          category: input.category,
          title: input.title,
          description: input.description ?? null,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar anotação');
      return data as SentimentAnnotation;
    },
    onSuccess: invalidate,
    onError: () => toast.error('Erro ao criar anotação'),
  });

  const update = useMutation({
    mutationFn: async (input: UpdateAnnotationInput) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from('sentiment_annotations')
        .update(patch)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao atualizar anotação');
      return data as SentimentAnnotation;
    },
    onSuccess: invalidate,
    onError: () => toast.error('Erro ao atualizar anotação'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sentiment_annotations').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
    onError: () => toast.error('Erro ao remover anotação'),
  });

  return { list, byWeek, create, update, remove };
}
