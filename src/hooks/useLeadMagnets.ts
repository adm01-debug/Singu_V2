import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface LeadMagnet {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  type: 'ebook' | 'webinar' | 'whitepaper' | 'template' | 'video' | 'checklist' | 'other';
  file_path: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  gated: boolean;
  form_id: string | null;
  download_count: number;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MagnetDownload {
  id: string;
  magnet_id: string;
  email: string | null;
  name: string | null;
  utm_source: string | null;
  downloaded_at: string;
}

export function useLeadMagnets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const KEY = ['lead-magnets', user?.id];

  const { data: magnets = [], isLoading } = useQuery({
    queryKey: KEY,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('lead_magnets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as unknown as LeadMagnet[];
    },
    staleTime: 60_000,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<LeadMagnet> & { title: string; slug: string; type: LeadMagnet['type'] }) => {
      if (!user) throw new Error('Não autenticado');
      if (input.id) {
        const { error } = await supabase.from('lead_magnets').update(input as TablesUpdate<'lead_magnets'>).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lead_magnets').insert({ ...input, user_id: user.id } as TablesInsert<'lead_magnets'>);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Lead magnet salvo!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lead_magnets').delete().eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Removido'); },
    onError: () => toast.error('Erro ao remover lead magnet'),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('lead_magnets').update({ is_published } as TablesUpdate<'lead_magnets'>).eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error('Erro ao alterar status de publicação'),
  });

  return { magnets, isLoading, upsert, remove, togglePublish };
}

export function useMagnetDownloads(magnetId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['magnet-downloads', magnetId, user?.id],
    enabled: !!magnetId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_magnet_downloads')
        .select('*')
        .eq('magnet_id', magnetId!)
        .order('downloaded_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as MagnetDownload[];
    },
  });
}
