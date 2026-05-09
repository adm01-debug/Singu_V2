import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData } from '@/lib/externalData';
import { normalizeExternalContact } from '@/hooks/useContacts';
import { useContacts } from '@/hooks/useContacts'; // To reuse normalization logic if possible, but let's define it or import it properly.
// Wait, useContacts is a hook. I should probably move normalizeExternalContact to a lib file.
import type { Tables, TablesUpdate, Json } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Contact = Tables<'contacts'>;
export type Company = Tables<'companies'>;
export type Interaction = Tables<'interactions'>;
export type Insight = Tables<'insights'>;
export type Alert = Tables<'alerts'>;

export interface ContactDetailData {
  contact: Contact | null;
  company: Company | null;
  interactions: Interaction[];
  insights: Insight[];
  alerts: Alert[];
}

export function useContactDetail(contactId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ['contact', contactId];

  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    enabled: !!user && !!contactId,
    queryFn: async (): Promise<ContactDetailData> => {
      // 1. Fetch contact
      const { data: localContact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId!)
        .maybeSingle();

      if (contactError) throw contactError;

      let contactData: Contact | null = null;
      if (localContact) {
        contactData = normalizeExternalContact(localContact as unknown as Record<string, unknown>);
      } else {
        const { data: externalContacts } = await queryExternalData<Contact>({
          table: 'contacts',
          filters: [{ type: 'eq', column: 'id', value: contactId! }],
        });
        contactData = externalContacts?.[0] ? normalizeExternalContact(externalContacts[0] as unknown as Record<string, unknown>) : null;
      }

      if (!contactData) throw new Error('Contato não encontrado');

      // 2. Fetch company
      let companyData: Company | null = null;
      if (contactData.company_id) {
        const { data: localCompany } = await supabase.from('companies').select('*').eq('id', contactData.company_id).maybeSingle();
        if (localCompany) {
          companyData = localCompany;
        } else {
          const { data: companyResult } = await queryExternalData<Company>({
            table: 'companies',
            filters: [{ type: 'eq', column: 'id', value: contactData.company_id }],
          });
          companyData = companyResult?.[0] || null;
        }
      }

      // 3. Parallel secondary data
      const [interactionsRes, insightsRes, alertsRes] = await Promise.all([
        supabase.from('interactions').select('*').eq('contact_id', contactId!).order('created_at', { ascending: false }).limit(50),
        supabase.from('insights').select('*').eq('contact_id', contactId!).eq('dismissed', false).order('created_at', { ascending: false }).limit(20),
        supabase.from('alerts').select('*').eq('contact_id', contactId!).eq('dismissed', false).order('created_at', { ascending: false }).limit(10),
      ]);

      return {
        contact: contactData,
        company: companyData,
        interactions: interactionsRes.data || [],
        insights: insightsRes.data || [],
        alerts: alertsRes.data || [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const error = queryError instanceof Error ? queryError.message : null;


  // Set up realtime subscription for updates
  useEffect(() => {
    if (!user || !contactId) return;

    const channel = supabase
      .channel(`contact-detail-${contactId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts', filter: `id=eq.${contactId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions', filter: `contact_id=eq.${contactId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insights', filter: `contact_id=eq.${contactId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `contact_id=eq.${contactId}` }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contactId, queryClient, queryKey]);

  const updateContact = async (updates: TablesUpdate<'contacts'>) => {
    if (!user || !contactId) return null;

    try {
      let query = supabase.from('contacts').update(updates).eq('id', contactId);
      const currentVersion = data?.contact?.version;
      if (currentVersion !== undefined && currentVersion !== null) query = query.eq('version', currentVersion);

      const { data: updatedContact, error } = await query.select().maybeSingle();

      if (error) throw error;
      if (!updatedContact) throw new Error('Contato não encontrado ou concorrência detectada.');

      queryClient.setQueryData(queryKey, (prev: ContactDetailData | undefined) => prev ? { ...prev, contact: updatedContact } : prev);
      toast({ title: 'Contato atualizado', description: 'As alterações foram salvas.' });
      return updatedContact;
    } catch (err) {
      logger.error('Error updating contact:', err);
      toast({ title: 'Erro ao atualizar contato', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const updateBehavior = async (behavior: Record<string, unknown>) => {
    const currentBehavior = (data?.contact?.behavior as Record<string, unknown>) || {};
    return updateContact({ behavior: { ...currentBehavior, ...behavior } as Json });
  };

  const addInteraction = async (interaction: Omit<Tables<'interactions'>, 'id' | 'created_at' | 'user_id'>) => {
    if (!user || !contactId) return null;

    try {
      const { data: newInteraction, error } = await supabase.from('interactions').insert({ ...interaction, contact_id: contactId, user_id: user.id }).select().maybeSingle();
      if (error) throw error;
      if (!newInteraction) throw new Error('Falha ao registrar interação.');

      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Interação registrada', description: 'A interação foi salva com sucesso.' });
      return newInteraction;
    } catch (err) {
      logger.error('Error adding interaction:', err);
      toast({ title: 'Erro ao registrar interação', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase.from('alerts').update({ dismissed: true }).eq('id', alertId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Alerta dispensado' });
    } catch (err) {
      logger.error('Error dismissing alert:', err);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase.from('insights').update({ dismissed: true }).eq('id', insightId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Insight dispensado' });
    } catch (err) {
      logger.error('Error dismissing insight:', err);
    }
  };

  return {
    contact: data?.contact || null,
    company: data?.company || null,
    interactions: data?.interactions || [],
    insights: data?.insights || [],
    alerts: data?.alerts || [],
    loading,
    error,
    refetch,
    updateContact,
    updateBehavior,
    addInteraction,
    dismissAlert,
    dismissInsight,
  };
}
}
