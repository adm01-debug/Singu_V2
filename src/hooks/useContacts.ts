import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
]);

/**
 * Normalize external DB column names to local schema names.
 * External uses tags_array/interests_array, local uses tags/interests.
 * External uses cargo, local uses role_title.
 */
function normalizeExternalContact(raw: Record<string, unknown>): Contact {
  const normalized = { ...raw } as Record<string, unknown>;
  // Map external → local field names
  if ('tags_array' in normalized && !('tags' in normalized)) {
    normalized.tags = normalized.tags_array;
  }
  if ('interests_array' in normalized && !('interests' in normalized)) {
    normalized.interests = normalized.interests_array;
  }
  if ('cargo' in normalized && !normalized.role_title) {
    normalized.role_title = normalized.cargo;
  }
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
  'cargo', 'departamento', 'sexo',
  'company_id', 'relationship_score', 'relationship_stage', 'sentiment',
  'tags_array', 'interests_array', 'hobbies',
  'birthday', 'source',
  'updated_at', 'created_at', 'user_id',
  'bitrix_contact_id', 'is_duplicate', 'duplicate_of',
  'notes'
].join(',');

async function fetchContactsPage(companyId?: string) {
  const filters = companyId
    ? [{ type: 'eq' as const, column: 'company_id', value: companyId }]
    : undefined;

  const { data, error } = await queryExternalData<Record<string, unknown>>({
    table: 'contacts',
    select: CONTACT_LISTING_SELECT,
    order: { column: 'updated_at', ascending: false },
    range: { from: 0, to: PAGE_SIZE - 1 },
    filters,
  });

  if (error) throw error;
  return (data || []).map(normalizeExternalContact);
}

export function useContacts(companyId?: string, options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const queryClient = useQueryClient();

  const queryKey = ['contacts', companyId ?? '__all__'];
  const externalEnabled = options?.enabled ?? true;

  const { data: contacts = [], isLoading: loading, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchContactsPage(companyId),
    enabled: !!user && externalEnabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const fetchContacts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // loadMore / hasMore kept for API compat but simplified
  const hasMore = contacts.length >= PAGE_SIZE;
  const loadMore = useCallback(() => {
    // pagination can be added later if needed
  }, []);

  const prefetchContactDetails = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['contact', id],
      queryFn: async () => {
        const { data, error } = await queryExternalData<Record<string, unknown>>({
          table: 'contacts',
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

      const { data, error } = await insertExternalData<Contact>('contacts', { ...externalFields, user_id: user.id });
      if (error) throw error;
      if (data) {
        const normalized = normalizeExternalContact(data as unknown as Record<string, unknown>);
        queryClient.setQueryData<Contact[]>(queryKey, prev => prev ? [normalized, ...prev] : [normalized]);
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
    const previous = queryClient.getQueryData<Contact[]>(queryKey);
    const targetContact = previous?.find(c => c.id === id);
    const versionToUse = expectedVersion ?? targetContact?.version;
    
    // Optimistic Update
    queryClient.setQueryData<Contact[]>(queryKey, prev =>
      prev?.map(c => c.id === id ? { ...c, ...updates } as Contact : c) ?? []
    );

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
        queryClient.setQueryData<Contact[]>(queryKey, prev =>
          prev?.map(c => c.id === id ? normalized : c) ?? []
        );
        logActivity({ type: 'updated', entityType: 'contact', entityId: id, entityName: `${normalized.first_name} ${normalized.last_name}`.trim(), description: 'Contato atualizado' });
        
        // Track score changes
        if (updates.relationship_score !== undefined && user) {
          const prev = previous?.find(c => c.id === id);
          trackScoreChange({ userId: user.id, contactId: id, scoreType: 'relationship', newValue: updates.relationship_score ?? 0, previousValue: prev?.relationship_score });
        }
      }
      return data;
    } catch (error) {
      // Automatic Rollback on error
      if (previous) queryClient.setQueryData<Contact[]>(queryKey, previous);
      
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
    const previous = queryClient.getQueryData<Contact[]>(queryKey);
    
    // Optimistic Delete
    queryClient.setQueryData<Contact[]>(queryKey, prev => prev?.filter(c => c.id !== id) ?? []);

    try {
      const { success, error } = await deleteExternalData('contacts', id);
      if (error) throw error;
      
      const deleted = previous?.find(c => c.id === id);
      logActivity({ type: 'deleted', entityType: 'contact', entityId: id, entityName: deleted ? `${deleted.first_name} ${deleted.last_name}`.trim() : undefined, description: 'Contato excluído' });
      return true;
    } catch (error) {
      // Automatic Rollback on error
      if (previous) queryClient.setQueryData<Contact[]>(queryKey, previous);
      
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting contact:', { error: msg });
      toast({ title: 'Erro ao excluir contato', description: msg, variant: 'destructive' });
      return false;
    }
  };

  return { contacts, loading, isFetching, hasMore, fetchContacts, loadMore, createContact, updateContact, deleteContact, prefetchContactDetails };
}
