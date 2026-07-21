import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

export interface KBArticle {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_published: boolean;
  views_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeBase() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['knowledge-base', user?.id];

  const { data: articles = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as KBArticle[];
    },
    staleTime: 5 * 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<KBArticle>) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('knowledge_base_articles')
        .insert({ ...input, user_id: user.id } as TablesInsert<'knowledge_base_articles'>);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Artigo criado!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KBArticle> & { id: string }) => {
      const { error } = await supabase.from('knowledge_base_articles').update(updates as TablesUpdate<'knowledge_base_articles'>).eq('user_id', user!.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Artigo atualizado!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_base_articles').delete().eq('user_id', user!.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Artigo removido!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const categories = [...new Set(articles.map(a => a.category))];

  return { articles, isLoading, create, update, remove, categories };
}
