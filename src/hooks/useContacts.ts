import { useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { trackScoreChange } from '@/lib/trackScoreChange';
import { queryExternalData, insertExternalData, updateExternalData, updateExternalDataWithVersion, deleteExternalData, ConcurrentEditError } from '@/lib/externalData';
import { showConcurrentEditToast } from '@/lib/concurrentEditToast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Contact = Tables<'contacts'>;
export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

export type ContactListItem = Pick<Contact,
  | 'id' | 'first_name' | 'last_name' | 'company_id' | 'relationship_score'
  | 'relationship_stage' | 'sentiment' | 'tags' | 'updated_at' | 'created_at'
  | 'notes' // Added notes for summary
>;

/**
 * Fields that exist only in the LOCAL Supabase schema (types.ts) but NOT in the external DB.
 * These must be stripped before any insert/update to the external DB to avoid column-not-found errors.
 */
const LOCAL_ONLY_FIELDS = new Set([
  'tags', 'interests', 'hobbies',                                // local schema uses array fields; external uses array columns
  'twitter', 'avatar_url',                                        // not columns in external contacts table
  'email', 'phone', 'whatsapp', 'linkedin', 'instagram',         // live in contact_phones / contact_emails / contact_social_media
   'id',                                                           // never send id on updates
   'role_title',                                                   // local-only; external uses 'cargo'
   'family_info',                                                  // mapped later
   'vak_profile',                                                  // local-only JSON blob
   'metaprogram_profile',                                          // local-only JSON blob
   'objection_patterns',                                           // local-only JSON blob
 ]);

/**
 * Normalize external DB column names to local schema names.
 * External uses tags_array/interests_array, local uses tags/interests.
 * External uses cargo, local uses role_title.
 */
/**
 * Normalize external DB column names to local schema names.
 * External uses tags_array/interests_array, local uses tags/interests.
 * External uses cargo, local uses role_title.
 */
export function normalizeExternalContact(raw: Record<string, unknown>): Contact {
  const normalized = { ...raw } as Record<string, unknown>;
  // Map external → local field names
  if ('tags_array' in normalized && !('tags' in normalized)) {
    normalized.tags = normalized.tags_array;
  }
  if ('interests_array' in normalized && !('interests' in normalized)) {
    normalized.interests = normalized.interests_array;
  }
  // External schema might use hobbies column directly or hobbies_array
  if ('hobbies_array' in normalized && !('hobbies' in normalized)) {
    normalized.hobbies = normalized.hobbies_array;
  }
  if ('cargo' in normalized && !normalized.role_title) {
    normalized.role_title = normalized.cargo;
  }
  // Ensure array fields are actually arrays to prevent UI crashes
  ['tags', 'interests', 'hobbies'].forEach(field => {
    if (normalized[field] && typeof normalized[field] === 'string') {
      try {
        normalized[field] = JSON.parse(normalized[field] as string);
      } catch {
        normalized[field] = (normalized[field] as string).split(',').map(s => s.trim());
      }
    } else if (!normalized[field]) {
      normalized[field] = [];
    }
  });
  // Ensure version is present for optimistic locking
  if (!('version' in normalized) && 'updated_at' in normalized) {
    // Fallback: use updated_at timestamp as a pseudo-version if actual version column is missing
    normalized.version = new Date(normalized.updated_at as string).getTime();
  }
  return normalized as unknown as Contact;
}

const PAGE_SIZE = 50;

/** Lean select for listing — excludes heavy JSON blobs (behavior, life_events, extra_data) */
const CONTACT_LISTING_SELECT = [
   'id', 'first_name', 'last_name', 'full_name', 'nome_tratamento', 'apelido',
   'vak_dominant', 'motivation_direction', 'working_style', 'reference_frame', 'chunk_size', 'action_filter', 'comparison_style', 'most_frequent_objection',
  'cargo', 'departamento', 'sexo',
  'company_id', 'relationship_score', 'relationship_stage', 'sentiment',
  'tags_array', 'interests_array', 'hobbies',
  'birthday', 'source',
  'updated_at', 'created_at', 'user_id',
  'bitrix_contact_id', 'is_duplicate', 'duplicate_of',
  'notes'
].join(',');

async function fetchContactsPage(companyId?: string, page = 0) {
  const filters = companyId
    ? [{ type: 'eq' as const, column: 'company_id', value: companyId }]
    : undefined;

  const isFirstPage = page === 0;
  const { data, count, error } = await queryExternalData<Record<string, unknown>>({
    table: 'contacts',
    select: CONTACT_LISTING_SELECT,
    order: { column: 'updated_at', ascending: false },
    range: { from: page * PAGE_SIZE, to: (page + 1) * PAGE_SIZE - 1 },
    filters,
    countMethod: isFirstPage ? 'exact' : undefined,
  });

  if (error) throw error;
  return {
    items: (data || []).map(normalizeExternalContact),
    totalCount: isFirstPage ? count : null,
  };
}

export function useContacts(
  companyId?: string,
  options?: { enabled?: boolean; fetchAll?: boolean },
) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['contacts', companyId ?? '__all__', user?.id], [companyId, user?.id]);
  const externalEnabled = options?.enabled ?? true;

  type Page = { items: Contact[]; totalCount: number | null };

  const {
    data,
    isLoading: loading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    error: queryError,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => fetchContactsPage(companyId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      if (lastPage.totalCount != null) {
        return loaded < lastPage.totalCount ? allPages.length : undefined;
      }
      return lastPage.items.length === PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: !!user && externalEnabled,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const contacts = useMemo(() => data?.pages.flatMap(p => p.items) ?? [], [data]);
  const fetchAll = options?.fetchAll ?? false;
  useEffect(() => {
    if (!fetchAll || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    void fetchNextPage();
  }, [fetchAll, fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

  const totalCount = useMemo(() => {
    const fromLast = data?.pages.find(p => p.totalCount != null)?.totalCount ?? null;
    if (fromLast != null) return fromLast;
    return contacts.length;
  }, [data, contacts.length]);
  const allContactsLoading = fetchAll &&
    !isFetchNextPageError &&
    (hasNextPage || isFetchingNextPage);

  const fetchContacts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    await fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const prefetchContactDetails = (id: string) => {
    // Use a separate key namespace to avoid colliding with useContactDetail's
    // ['contact', id] cache which stores the richer ContactDetailData shape.
    queryClient.prefetchQuery({
      queryKey: ['contact-prefetch', id],
      queryFn: async () => {
        const { data, error } = await queryExternalData<Record<string, unknown>>({
          table: 'contacts',
          select: '*',
          filters: [{ type: 'eq', column: 'id', value: id }]
        });
        if (error) throw error;
        return data?.[0] ? normalizeExternalContact(data[0]) : null;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const createContact = async (contact: Omit<ContactInsert, 'user_id'>) => {
    if (!user) return null;
    try {
      // Strip local-only fields that don't exist in the external DB
      const externalFields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(contact as Record<string, unknown>)) {
        if (!LOCAL_ONLY_FIELDS.has(k)) externalFields[k] = v;
      }

      // Map local role_title to external cargo if provided
      if (contact.role_title && !externalFields.cargo) {
        externalFields.cargo = contact.role_title;
      }

      // Ensure array fields are sent as PostgreSQL arrays if the external DB expects them
      ['tags', 'interests', 'hobbies'].forEach(field => {
        if (contact[field as keyof typeof contact]) {
          const val = contact[field as keyof typeof contact];
          const arrayVal = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean);

          // Map to external column names if they differ
          const extKey = field === 'tags' ? 'tags_array' : field === 'interests' ? 'interests_array' : field;
          externalFields[extKey] = arrayVal;
        }
      });

      const { data, error } = await insertExternalData<Contact>('contacts', { ...externalFields, user_id: user.id });
      if (error) throw error;
      if (data) {
        const normalized = normalizeExternalContact(data as unknown as Record<string, unknown>);
        queryClient.setQueryData<InfiniteData<Page[]>>(queryKey, prev => {
          if (!prev) return { pages: [{ items: [normalized], totalCount: null }], pageParams: [0] };
          const firstPage = prev.pages[0];
          const updatedFirst = { ...firstPage, items: [normalized, ...firstPage.items] };
          return { ...prev, pages: [updatedFirst, ...prev.pages.slice(1)] };
        });
        toast({ title: 'Contato criado', description: `${normalized.first_name} ${normalized.last_name} foi adicionado com sucesso.` });
        logActivity({ type: 'created', entityType: 'contact', entityId: normalized.id, entityName: `${normalized.first_name} ${normalized.last_name}`.trim(), description: 'Contato criado' });
        return normalized;
      }
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating contact:', { error: msg });
      toast({ title: 'Erro ao criar contato', description: msg, variant: 'destructive' });
      return null;
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate, expectedVersion?: number) => {
    const previous = queryClient.getQueryData<InfiniteData<Page[]>>(queryKey);
    const targetContact = previous?.pages.flatMap(p => p.items).find(c => c.id === id);
    const versionToUse = expectedVersion ?? targetContact?.version;

    // Optimistic Update — must update within paginated InfiniteData structure
    queryClient.setQueryData<InfiniteData<Page[]>>(queryKey, prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map(page =>

          ({ ...page, items: page.items.map(c => c.id === id ? { ...c, ...updates } as Contact : c) })
        ),
      };
    });

    try {
      // Strip local-only fields
      const cleanUpdates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates as Record<string, unknown>)) {
        if (!LOCAL_ONLY_FIELDS.has(k)) cleanUpdates[k] = v;
      }

      // Map local fields to external schema names if needed
      if (updates.role_title && !cleanUpdates.cargo) {
        cleanUpdates.cargo = updates.role_title;
      }

      // Map array updates
      ['tags', 'interests', 'hobbies'].forEach(field => {
        if (updates[field as keyof typeof updates] !== undefined) {
          const val = updates[field as keyof typeof updates];
          const arrayVal = Array.isArray(val) ? val : val ? String(val).split(',').map(s => s.trim()).filter(Boolean) : [];
          const extKey = field === 'tags' ? 'tags_array' : field === 'interests' ? 'interests_array' : field;
          cleanUpdates[extKey] = arrayVal;
        }
      });

      let data: Contact | null = null;
      let error: Error | null = null;

      if (versionToUse !== undefined) {
        // Use versioned update for optimistic locking
        const result = await updateExternalDataWithVersion<Contact>('contacts', id, versionToUse, cleanUpdates);
        data = result.data;
        error = result.error;
      } else {
        // Fallback to regular update if version is missing
        const result = await updateExternalData<Contact>('contacts', id, cleanUpdates);
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (data) {
        const normalized = normalizeExternalContact(data as unknown as Record<string, unknown>);
        queryClient.setQueryData<InfiniteData<Page[]>>(queryKey, prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map(page =>

              ({ ...page, items: page.items.map(c => c.id === id ? normalized : c) })
            ),
          };
        });
        logActivity({ type: 'updated', entityType: 'contact', entityId: id, entityName: `${normalized.first_name} ${normalized.last_name}`.trim(), description: 'Contato atualizado' });

        // Track score changes
        if (updates.relationship_score !== undefined && user) {
          const prev = previous?.pages.flatMap(p => p.items).find(c => c.id === id);
          trackScoreChange({ userId: user.id, contactId: id, scoreType: 'relationship', newValue: updates.relationship_score ?? 0, previousValue: prev?.relationship_score });
        }
      }
      return data;
    } catch (error) {
      // Automatic Rollback on error
      if (previous) queryClient.setQueryData<InfiniteData<Contact[]>>(queryKey, previous);

      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating contact:', { error: msg });

      if (error instanceof ConcurrentEditError) {
        showConcurrentEditToast({ entity: 'contato', queryClient, queryKey });
      } else {
        toast({ title: 'Erro ao atualizar contato', description: msg, variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteContact = async (id: string) => {
    const previous = queryClient.getQueryData<InfiniteData<Page[]>>(queryKey);

    // Optimistic Delete — filter across all InfiniteQuery pages
    queryClient.setQueryData<InfiniteData<Page[]>>(queryKey, prev => {
      if (!prev) return prev;

      return { ...prev, pages: prev.pages.map(page => ({ ...page, items: page.items.filter(c => c.id !== id) })) };
    });

    try {
      const { error } = await deleteExternalData('contacts', id);
      if (error) throw error;

      const deleted = previous?.pages.flatMap(p => p.items).find(c => c.id === id);
      logActivity({ type: 'deleted', entityType: 'contact', entityId: id, entityName: deleted ? `${deleted.first_name} ${deleted.last_name}`.trim() : undefined, description: 'Contato excluído' });
      return true;
    } catch (error) {
      // Automatic Rollback on error
      if (previous) queryClient.setQueryData<InfiniteData<Page[]>>(queryKey, previous);

      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting contact:', { error: msg });
      toast({ title: 'Erro ao excluir contato', description: msg, variant: 'destructive' });
      return false;
    }
  };

  return {
    contacts,
    loading: loading || allContactsLoading,
    isFetching,
    hasMore: hasNextPage,
    totalCount,
    error: queryError,
    fetchContacts,
    loadMore,
    createContact,
    updateContact,
    deleteContact,
    prefetchContactDetails,
  };
}
