import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

export interface LandingPageBlock {
  id: string;
  type: string;
  [k: string]: unknown;
}

export interface LandingPage {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  blocks: LandingPageBlock[];
  theme: Record<string, unknown>;
  is_published: boolean;
  view_count: number;
  submission_count: number;
  redirect_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandingPageSubmission {
  id: string;
  landing_page_id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  data: Record<string, unknown>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export function useLandingPages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['landing-pages', user?.id];

  const { data: pages = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as LandingPage[];
    },
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<LandingPage>) => {
      if (!user) throw new Error('Não autenticado');
      const slug = (input.slug || `lp-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60);
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          user_id: user.id,
          slug,
          title: input.title ?? 'Nova landing page',
          description: input.description ?? null,
          blocks: (input.blocks ?? []) as unknown as Json,
          theme: (input.theme ?? {}) as unknown as Json,
          is_published: false,
        } as TablesInsert<'landing_pages'>)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar landing page");
      return data as unknown as LandingPage;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Landing page criada!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<LandingPage> & { id: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('landing_pages').update(patch as unknown as TablesUpdate<'landing_pages'>).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Landing page salva!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('landing_pages').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Removida.'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('landing_pages').update({ is_published: publish }).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: key });
      toast.success(v.publish ? 'Página publicada!' : 'Página despublicada.');
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  return { pages, isLoading, create, update, remove, togglePublish };
}

export function useLandingPageSubmissions(pageId?: string) {
  return useQuery({
    queryKey: ['lp-submissions', pageId],
    enabled: !!pageId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_submissions')
        .select('*')
        .eq('landing_page_id', pageId!)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as LandingPageSubmission[];
    },
  });
}
