import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
  const key = ['knowledge-base'];

  const { data: articles = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as KBArticle[];
    },
    staleTime: 5 * 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<KBArticle>) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('knowledge_base_articles')
        .insert({ ...input, user_id: user.id } as never);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Artigo criado!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KBArticle> & { id: string }) => {
      const { error } = await supabase.from('knowledge_base_articles').update(updates as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Artigo atualizado!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_base_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Artigo removido!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const categories = [...new Set(articles.map(a => a.category))];

  return { articles, isLoading, create, update, remove, categories };
}
