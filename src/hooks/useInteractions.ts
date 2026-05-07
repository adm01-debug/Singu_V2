import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useNLPAutoAnalysis } from '@/hooks/useNLPAutoAnalysis';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Interaction = Tables<'interactions'>;
export type InteractionInsert = TablesInsert<'interactions'>;
export type InteractionUpdate = TablesUpdate<'interactions'>;

const PAGE_SIZE = 50;

async function fetchInteractionsPage(contactId?: string, companyId?: string) {
  let query = supabase
    .from('interactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (contactId) query = query.eq('contact_id', contactId);
  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function useInteractions(contactId?: string, companyId?: string, options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const { triggerAnalysis } = useNLPAutoAnalysis();
  const queryClient = useQueryClient();

  const queryKey = ['interactions', contactId ?? '__all__', companyId ?? '__all__'];
  const externalEnabled = options?.enabled ?? true;

  const { data: interactions = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => fetchInteractionsPage(contactId, companyId),
    enabled: !!user && externalEnabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const hasMore = interactions.length >= PAGE_SIZE;
  const loadMore = useCallback(() => {}, []);

  const fetchInteractions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const createInteraction = async (
    interaction: Omit<InteractionInsert, 'user_id'>,
    options?: { triggerDISCAnalysis?: boolean; triggerNLPAnalysis?: boolean }
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('interactions')
        .insert({ ...interaction, user_id: user.id })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Falha ao criar interação: nenhum dado retornado.');

      queryClient.setQueryData<Interaction[]>(queryKey, prev => prev ? [data, ...prev] : [data]);
      toast({
        title: 'Interação registrada',
        description: 'A interação foi salva com sucesso.',
      });
      logActivity({ type: 'created', entityType: 'interaction', entityId: data.id, entityName: data.title, description: `Interação: ${data.type}` });

      // Trigger DISC auto-analysis if enabled and has content
      if (options?.triggerDISCAnalysis !== false && data.contact_id) {
        const fullText = [data.content, data.transcription].filter(Boolean).join('\n\n');
        if (fullText.length >= 100) {
          // Call DISC analyzer in background (non-blocking)
          supabase.functions.invoke('disc-analyzer', {
            body: {
              texts: [fullText],
              contactId: data.contact_id,
              interactionId: data.id,
              userId: user.id
            }
          }).then(({ data: discResult }) => {
            if (discResult?.success) {
              toast({
                title: `🎯 Perfil DISC Atualizado`,
                description: `Perfil: ${discResult.analysis?.blendProfile || discResult.analysis?.primaryProfile}`,
              });
            }
          }).catch(err => logger.error('DISC analysis error:', err));
        }
      }

      // Trigger NLP auto-analysis if enabled and has content
      if (options?.triggerNLPAnalysis !== false && data.contact_id) {
        const fullText = [data.content, data.transcription].filter(Boolean).join('\n\n');
        if (fullText.length >= 100) {
          // Call NLP analyzer in background (non-blocking)
          triggerAnalysis(
            data.contact_id,
            data.id,
            data.content,
            data.transcription,
            data.type,
            true // showToast
          ).catch(err => logger.error('NLP analysis error:', err));
        }
      }

      return data;
    } catch (error) {
      logger.error('Error creating interaction:', error);
      toast({
        title: 'Erro ao registrar interação',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateInteraction = async (id: string, updates: InteractionUpdate) => {
    const previous = queryClient.getQueryData<Interaction[]>(queryKey);
    queryClient.setQueryData<Interaction[]>(queryKey, prev =>
      prev?.map(i => i.id === id ? { ...i, ...updates } as Interaction : i) ?? []
    );

    try {
      const { data, error } = await supabase
        .from('interactions')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Interação não encontrada ou permissão insuficiente para atualizar.');

      queryClient.setQueryData<Interaction[]>(queryKey, prev =>
        prev?.map(i => i.id === id ? data : i) ?? []
      );
      toast({
        title: 'Interação atualizada',
        description: 'As alterações foram salvas.',
      });
      return data;
    } catch (error) {
      if (previous) queryClient.setQueryData<Interaction[]>(queryKey, previous);
      logger.error('Error updating interaction:', error);
      toast({
        title: 'Erro ao atualizar interação',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteInteraction = async (id: string) => {
    const previous = queryClient.getQueryData<Interaction[]>(queryKey);
    queryClient.setQueryData<Interaction[]>(queryKey, prev => prev?.filter(i => i.id !== id) ?? []);

    try {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const deleted = previous?.find(i => i.id === id);
      logActivity({ type: 'deleted', entityType: 'interaction', entityId: id, entityName: deleted?.title, description: 'Interação excluída' });
      toast({
        title: 'Interação removida',
        description: 'A interação foi excluída com sucesso.',
      });
      return true;
    } catch (error) {
      if (previous) queryClient.setQueryData<Interaction[]>(queryKey, previous);
      logger.error('Error deleting interaction:', error);
      toast({
        title: 'Erro ao excluir interação',
        description: 'Não foi possível excluir a interação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    interactions,
    loading,
    hasMore,
    fetchInteractions,
    loadMore,
    createInteraction,
    updateInteraction,
    deleteInteraction,
  };
}
