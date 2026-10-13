import { useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { trackScoreChange } from '@/lib/trackScoreChange';
import { queryExternalData, insertExternalData, updateExternalDataWithVersion, deleteExternalData, ConcurrentEditError } from '@/lib/externalData';
import { showConcurrentEditToast } from '@/lib/concurrentEditToast';
import { z } from 'zod';
import { Constants, type Json, type Tables, type TablesInsert, type TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Contact = Omit<Tables<'contacts'>, 'tags' | 'interests' | 'hobbies'> & {
  tags: string[];
  interests: string[];
  hobbies: string[];
};
export type ContactInsert = Omit<TablesInsert<'contacts'>, 'full_name'>;
export type ContactUpdate = Omit<TablesUpdate<'contacts'>, 'full_name'>;

const text = z.string().nullable().default(null);
const numeric = z.number().finite().nullable().default(null);
const json: z.ZodType<Json> = z.lazy(() => z.union([
  z.string(), z.number().finite(), z.boolean(), z.null(), z.array(json), z.record(json),
]));
const nullableJson = json.nullable().default(null);
function normalizeArray(value: unknown): string[] | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // JSON inválido ou de outra estrutura deve chegar ao caller como erro.
    try {
      value = JSON.parse(trimmed);
    } catch (error) {
      if (/^[[{"]/.test(trimmed)) throw error;
      value = trimmed.split(',').map(item => item.trim()).filter(Boolean);
    }
  }
  return z.array(z.string()).parse(value);
}
const strings = z.preprocess(normalizeArray, z.array(z.string()).nullable().default(null));
const contactShape = {
  id: z.string().min(1), user_id: z.string().min(1), version: z.number().int().nonnegative(),
  action_filter: text, apelido: text, assigned_by_id: numeric, assinatura_contato: text,
  avatar_url: text, behavior: nullableJson, birthday: text, bitrix_contact_id: numeric,
  bitrix_created_at: text, cargo: text, chunk_size: text, company_id: text,
  comparison_style: text, cpf: text, created_at: text, data_nascimento: text,
  deleted_at: text, deleted_by: text, departamento: text, duplicate_of: text,
  email: text, emotional_confidence: numeric, emotional_state: text, emotional_trigger: text,
  extra_data: nullableJson, family_info: text, first_name: text, full_name: text,
  hobbies: strings, instagram: text, interests: strings, interests_array: strings,
  is_duplicate: z.boolean().nullable().default(null), last_interaction_at: text,
  last_name: text, life_events: nullableJson, linkedin: text, metaprogram_profile: nullableJson,
  most_frequent_objection: text, motivation_direction: text, nome_tratamento: text,
  notes: text, objection_patterns: nullableJson, personal_notes: text, phone: text,
  reference_frame: text, relationship_score: numeric, relationship_stage: text,
  role: text, role_title: text, search_vector: z.unknown(), sentiment: text, sexo: text,
  source: z.enum(Constants.public.Enums.data_source).nullable().default(null),
  tags: strings, tags_array: strings, twitter: text, updated_at: text,
  vak_dominant: text, vak_profile: nullableJson, whatsapp: text, working_style: text,
} satisfies { [K in keyof Tables<'contacts'>]: z.ZodType<Tables<'contacts'>[K], z.ZodTypeDef, unknown> };
const contactRowSchema = z.object(contactShape);

export type ContactListItem = Pick<Contact,
  | 'id' | 'first_name' | 'last_name' | 'company_id' | 'relationship_score'
  | 'relationship_stage' | 'sentiment' | 'tags' | 'updated_at' | 'created_at'
  | 'notes' // Added notes for summary
>;

/** Normaliza aliases reais sem inventar uma versão a partir de updated_at. */
export function normalizeExternalContact(raw: unknown): Contact {
  // Validação completa antes da asserção única (inferência Zod com strictNullChecks=false).
  const row = contactRowSchema.parse(raw) as Tables<'contacts'>;
  return {
    ...row,
    tags: row.tags_array ?? row.tags ?? [],
    interests: row.interests_array ?? row.interests ?? [],
    hobbies: row.hobbies || [],
    role_title: row.role_title || row.cargo,
  };
}

export function prepareContactWrite(input: ContactUpdate): Record<string, unknown> {
  // Proteção em runtime também para callers legados que enviem uma Row inteira.
  const { id, version, full_name, ...record } = input as TablesUpdate<'contacts'>;
  if (record.role_title !== undefined && record.cargo === undefined) record.cargo = record.role_title;
  if (record.tags !== undefined && record.tags_array === undefined) record.tags_array = record.tags;
  if (record.interests !== undefined && record.interests_array === undefined) record.interests_array = record.interests;
  return contactRowSchema.omit({ id: true, version: true, full_name: true }).partial().strict().parse(record);
}

const PAGE_SIZE = 50;

/** Lean select for listing — excludes heavy JSON blobs (behavior, life_events, extra_data) */
const CONTACT_LISTING_SELECT = [
   'id', 'first_name', 'last_name', 'full_name', 'nome_tratamento', 'apelido', 'version',
   'cpf', 'role', 'role_title', 'family_info', 'personal_notes', 'assinatura_contato',
   'email', 'phone', 'whatsapp', 'linkedin', 'instagram', 'twitter', 'avatar_url',
   'data_nascimento', 'last_interaction_at', 'emotional_state', 'emotional_confidence', 'emotional_trigger',
   'vak_dominant', 'motivation_direction', 'working_style', 'reference_frame', 'chunk_size', 'action_filter', 'comparison_style', 'most_frequent_objection',
  'cargo', 'departamento', 'sexo',
  'company_id', 'relationship_score', 'relationship_stage', 'sentiment',
  'tags_array', 'interests_array', 'tags', 'interests', 'hobbies',
  'birthday', 'source',
  'updated_at', 'created_at', 'user_id',
  'bitrix_contact_id', 'is_duplicate', 'duplicate_of',
  'notes'
].join(',');

async function fetchContactsPage(companyId?: string, page = 0) {
  const filters: NonNullable<Parameters<typeof queryExternalData>[0]['filters']> = [
    { type: 'is', column: 'deleted_at', value: null },
    ...(companyId ? [{ type: 'eq' as const, column: 'company_id', value: companyId }] : []),
  ];

  const isFirstPage = page === 0;
  const { data, count, error } = await queryExternalData<unknown>({
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
    if (!externalEnabled || !fetchAll || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    void fetchNextPage();
  }, [externalEnabled, fetchAll, fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

  const totalCount = useMemo(() => {
    const fromLast = data?.pages.find(p => p.totalCount != null)?.totalCount ?? null;
    if (fromLast != null) return fromLast;
    return contacts.length;
  }, [data, contacts.length]);
  const allContactsLoading = externalEnabled &&
    fetchAll &&
    !isFetchNextPageError &&
    (hasNextPage || isFetchingNextPage);

  const fetchContacts = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ['sequence-enroll-contacts', user?.id] }),
    ]);
  }, [queryClient, queryKey, user?.id]);

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
        const { data, error } = await queryExternalData<unknown>({
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
      const externalFields = prepareContactWrite(contact);
      const { data, error } = await insertExternalData<unknown>('contacts', { ...externalFields, user_id: user.id });
      if (error) throw error;
      if (!data) throw new Error('Criação não retornou um contato válido.');
      if (data) {
        const normalized = normalizeExternalContact(data);
        queryClient.setQueryData<InfiniteData<Page>>(queryKey, prev => {
          if (!prev) return { pages: [{ items: [normalized], totalCount: null }], pageParams: [0] };
          const firstPage = prev.pages[0] ?? { items: [], totalCount: null };
          const updatedFirst = { ...firstPage, items: [normalized, ...firstPage.items], totalCount: firstPage.totalCount == null ? null : firstPage.totalCount + 1 };
          return { ...prev, pages: [updatedFirst, ...prev.pages.slice(1)] };
        });
        toast({ title: 'Contato criado', description: `${normalized.first_name} ${normalized.last_name} foi adicionado com sucesso.` });
        logActivity({ type: 'created', entityType: 'contact', entityId: normalized.id, entityName: `${normalized.first_name} ${normalized.last_name}`.trim(), description: 'Contato criado' });
        return normalized;
      }
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao criar contato:', { error: msg });
      toast({ title: 'Erro ao criar contato', description: msg, variant: 'destructive' });
      return null;
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate, expectedVersion?: number): Promise<Contact | null> => {
    const previous = queryClient.getQueryData<InfiniteData<Page>>(queryKey);
    const targetContact = previous?.pages.flatMap(p => p.items).find(c => c.id === id);

    // Optimistic Update — must update within paginated InfiniteData structure
    queryClient.setQueryData<InfiniteData<Page>>(queryKey, prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map(page =>

          ({ ...page, items: page.items.map(c => c.id === id ? { ...c, ...updates, tags: updates.tags ?? c.tags, interests: updates.interests ?? c.interests, hobbies: updates.hobbies ?? c.hobbies } : c) })
        ),
      };
    });

    try {
      const cleanUpdates = prepareContactWrite(updates);
      let versionToUse = expectedVersion ?? targetContact?.version;
      if (versionToUse == null) {
        const current = await queryExternalData<unknown>({
          table: 'contacts', select: 'id,user_id,version', range: { from: 0, to: 0 },
          filters: [{ type: 'eq', column: 'id', value: id }],
        });
        if (current.error) throw current.error;
        if (!current.data?.[0]) throw new Error('Contato não encontrado para atualização.');
        versionToUse = normalizeExternalContact(current.data[0]).version;
      }
      const { data, error } = await updateExternalDataWithVersion<unknown>('contacts', id, versionToUse, cleanUpdates);
      if (error) throw error;
      if (!data) throw new Error('Atualização não retornou um contato válido.');

      const normalized = normalizeExternalContact(data);
      if (normalized) {
        queryClient.setQueryData<InfiniteData<Page>>(queryKey, prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map(page =>

              ({ ...page, items: page.items.map(c => c.id === id ? normalized : c) })
            ),
          };
        });
        logActivity({ type: 'updated', entityType: 'contact', entityId: id, entityName: `${normalized.first_name} ${normalized.last_name}`.trim(), description: 'Contato atualizado' });


        // Registra alterações de score
        if (updates.relationship_score !== undefined && user) {
          const prev = previous?.pages.flatMap(p => p.items).find(c => c.id === id);
          trackScoreChange({ userId: user.id, contactId: id, scoreType: 'relationship', newValue: updates.relationship_score ?? 0, previousValue: prev?.relationship_score });
        }
      }
      return normalized;
    } catch (error) {
      // Rollback preserva o mesmo contrato paginado do cache.
      if (previous) queryClient.setQueryData<InfiniteData<Page>>(queryKey, previous);

      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao atualizar contato:', { error: msg });

      if (error instanceof ConcurrentEditError) {
        showConcurrentEditToast({ entity: 'contato', queryClient, queryKey });
      } else {
        toast({ title: 'Erro ao atualizar contato', description: msg, variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteContact = async (id: string) => {
    const previous = queryClient.getQueryData<InfiniteData<Page>>(queryKey);

    // Optimistic Delete — filter across all InfiniteQuery pages
    queryClient.setQueryData<InfiniteData<Page>>(queryKey, prev => {
      if (!prev) return prev;

      if (!prev.pages.some(page => page.items.some(c => c.id === id))) return prev;
      return { ...prev, pages: prev.pages.map(page => ({
        ...page,
        items: page.items.filter(c => c.id !== id),
        totalCount: page.totalCount == null ? null : Math.max(0, page.totalCount - 1),
      })) };
    });

    try {
      const deleted = previous?.pages.flatMap(p => p.items).find(c => c.id === id);
      const { success, error } = await deleteExternalData('contacts', id, {
        entityName: deleted ? `${deleted.first_name} ${deleted.last_name}`.trim() : undefined,
        description: 'Contato excluído',
      });
      if (error || !success) throw error || new Error('Não foi possível excluir o contato.');
      return true;
    } catch (error) {
      // Automatic Rollback on error
      if (previous) queryClient.setQueryData<InfiniteData<Page>>(queryKey, previous);

      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao excluir contato:', { error: msg });
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
