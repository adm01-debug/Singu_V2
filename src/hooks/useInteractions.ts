import { useCallback, useMemo } from 'react';
import { useQueryClient, useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
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

type InteractionPage = { data: Interaction[]; nextCursor: number | undefined; total: number };
type InteractionInfiniteData = InfiniteData<InteractionPage>;

async function fetchInteractionsPage(
  contactId?: string,
  companyId?: string,
  pageParam = 0
) {
  let query = supabase
    .from('interactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

  if (contactId) query = query.eq('contact_id', contactId)
  .limit(1000);
  if (companyId) query = query.eq('company_id', companyId);

  const { data, error, count } = await query;
  if (error) throw error;
  const rows = data ?? [];
  return { data: rows, nextCursor: rows.length === PAGE_SIZE ? pageParam + 1 : undefined, total: count || 0 } as InteractionPage;
}

export function useInteractions(contactId?: string, companyId?: string, options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const { triggerAnalysis } = useNLPAutoAnalysis();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['interactions', contactId ?? '__all__', companyId ?? '__all__', user?.id], [contactId, companyId, user?.id]);
  const externalEnabled = options?.enabled ?? true;

  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: queryError,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => fetchInteractionsPage(contactId, companyId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user && externalEnabled,
    staleTime: 30 * 1000,
  });

  const interactions = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);
  const totalCount = data?.pages[0]?.total ?? 0;

  const hasMore = hasNextPage;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

      // Optimistic prepend to the first page of the InfiniteData cache
      queryClient.setQueryData<InteractionInfiniteData>(queryKey, prev => {
        if (!prev) return { pages: [{ data: [data], nextCursor: undefined, total: 1 }], pageParams: [0] };
        return {
          ...prev,
          pages: [
            { ...prev.pages[0], data: [data, ...prev.pages[0].data], total: prev.pages[0].total + 1 },
            ...prev.pages.slice(1),
          ],
        };
      });
      toast({
        title: 'Interação registrada',
        description: 'A interação foi salva com sucesso.',
      });
      logActivity({ type: 'created', entityType: 'interaction', entityId: data.id, entityName: data.title, description: `Interação: ${data.type}` });

      // Trigger DISC auto-analysis if enabled and has content
      if (options?.triggerDISCAnalysis !== false && data.contact_id) {
        const fullText = [data.content, data.transcription].filter(Boolean).join('\n\n');
        if (fullText.length >= 100) {
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
                title: `Perfil DISC Atualizado`,
                description: `Perfil: ${discResult.analysis?.blendProfile || discResult.analysis?.primaryProfile}`,
              });
            }
          }).catch(err => {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            logger.error('DISC analysis error:', { error: msg });
          });
        }
      }

      // Trigger NLP auto-analysis if enabled and has content
      if (options?.triggerNLPAnalysis !== false && data.contact_id) {
        const fullText = [data.content, data.transcription].filter(Boolean).join('\n\n');
        if (fullText.length >= 100) {
          triggerAnalysis(
            data.contact_id,
            data.id,
            data.content,
            data.transcription,
            data.type,
            true
          ).catch(err => {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            logger.error('NLP analysis error:', { error: msg });
          });
        }
      }

      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating interaction:', { error: msg });
      toast({
        title: 'Erro ao registrar interação',
        description: msg,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateInteraction = async (id: string, updates: InteractionUpdate) => {
    const previous = queryClient.getQueryData<InteractionInfiniteData>(queryKey);

    // Optimistic update across all pages
    queryClient.setQueryData<InteractionInfiniteData>(queryKey, prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map(page => ({
          ...page,
          // eslint-disable-next-line sonarjs/no-nested-functions
          data: page.data.map(i => i.id === id ? { ...i, ...updates } as Interaction : i),
        })),
      };
    });

    try {
      const { data, error } = await supabase
        .from('interactions')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Interação não encontrada ou permissão insuficiente para atualizar.');

      // Confirm with server data
      queryClient.setQueryData<InteractionInfiniteData>(queryKey, prev => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map(page => ({
            ...page,
            // eslint-disable-next-line sonarjs/no-nested-functions
            data: page.data.map(i => i.id === id ? data : i),
          })),
        };
      });
      toast({
        title: 'Interação atualizada',
        description: 'As alterações foram salvas.',
      });
      return data;
    } catch (error) {
      if (previous) queryClient.setQueryData<InteractionInfiniteData>(queryKey, previous);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating interaction:', { error: msg });
      toast({
        title: 'Erro ao atualizar interação',
        description: msg,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteInteraction = async (id: string) => {
    const previous = queryClient.getQueryData<InteractionInfiniteData>(queryKey);

    // Optimistic delete across all pages
    queryClient.setQueryData<InteractionInfiniteData>(queryKey, prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map(page => ({
          ...page,
          // eslint-disable-next-line sonarjs/no-nested-functions
          data: page.data.filter(i => i.id !== id),
          total: page.total > 0 ? page.total - 1 : 0,
        })),
      };
    });

    try {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const deleted = previous?.pages.flatMap(p => p.data).find(i => i.id === id);
      logActivity({ type: 'deleted', entityType: 'interaction', entityId: id, entityName: deleted?.title, description: 'Interação excluída' });
      toast({
        title: 'Interação removida',
        description: 'A interação foi excluída com sucesso.',
      });
      return true;
    } catch (error) {
      if (previous) queryClient.setQueryData<InteractionInfiniteData>(queryKey, previous);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting interaction:', { error: msg });
      toast({
        title: 'Erro ao excluir interação',
        description: msg,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    interactions,
    loading,
    hasMore,
    isFetchingNextPage,
    totalCount,
    error: queryError,
    fetchInteractions,
    loadMore,
    createInteraction,
    updateInteraction,
    deleteInteraction,
  };
}
