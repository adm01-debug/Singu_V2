import { useState, useEffect, useCallback } from 'react';
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
  const [data, setData] = useState<ContactDetailData>({
    contact: null,
    company: null,
    interactions: [],
    insights: [],
    alerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactDetail = useCallback(async () => {
    if (!user || !contactId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch contact from local database, fallback to external database (prevents false "Contato não encontrado")
      let contactData: Contact | null = null;

      const { data: localContact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();

      if (contactError) throw contactError;

      if (localContact) {
        contactData = normalizeExternalContact(localContact as unknown as Record<string, unknown>);
      } else {
        const { data: externalContacts, error: externalContactError } = await queryExternalData<Contact>({
          table: 'contacts',
          filters: [{ type: 'eq', column: 'id', value: contactId }],
        });

        if (externalContactError) throw externalContactError;
        contactData = externalContacts?.[0] ? normalizeExternalContact(externalContacts[0] as unknown as Record<string, unknown>) : null;
      }

      if (!contactData) {
        setError('Contato não encontrado');
        setLoading(false);
        return;
      }

      // Fetch company - try local first, then external
      let companyData: Company | null = null;
      if (contactData?.company_id) {
        const { data: localCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('id', contactData.company_id)
          .maybeSingle();

        if (localCompany) {
          companyData = localCompany;
        } else {
          const { data: companyResult } = await queryExternalData<Company>({
            table: 'companies',
            filters: [{ type: 'eq', column: 'id', value: contactData.company_id }],
          });
          if (companyResult && companyResult.length > 0) {
            companyData = companyResult[0];
          }
        }
      }

      // Fetch interactions for this contact - try local first, then external
      let interactionsData: Interaction[] = [];
      const { data: localInteractions, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (interactionsError) {
        logger.error('Error fetching local interactions:', interactionsError);
      }

      if (localInteractions && localInteractions.length > 0) {
        interactionsData = localInteractions;
      } else {
        const { data: extInteractions } = await queryExternalData<Interaction>({
          table: 'interactions',
          filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
          order: { column: 'created_at', ascending: false },
          range: { from: 0, to: 49 },
        });
        if (extInteractions && extInteractions.length > 0) {
          interactionsData = extInteractions;
        }
      }

      // Fetch insights for this contact - try local first, then external
      let insightsData: Insight[] = [];
      const { data: localInsights, error: insightsError } = await supabase
        .from('insights')
        .select('*')
        .eq('contact_id', contactId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (insightsError) {
        logger.error('Error fetching local insights:', insightsError);
      }

      if (localInsights && localInsights.length > 0) {
        insightsData = localInsights;
      } else {
        const { data: extInsights } = await queryExternalData<Insight>({
          table: 'insights',
          filters: [
            { type: 'eq', column: 'contact_id', value: contactId },
            { type: 'eq', column: 'dismissed', value: false },
          ],
          order: { column: 'created_at', ascending: false },
          range: { from: 0, to: 19 },
        });
        if (extInsights && extInsights.length > 0) {
          insightsData = extInsights;
        }
      }

      // Fetch alerts for this contact - try local first, then external
      let alertsData: Alert[] = [];
      const { data: localAlerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('contact_id', contactId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) {
        logger.error('Error fetching local alerts:', alertsError);
      }

      if (localAlerts && localAlerts.length > 0) {
        alertsData = localAlerts;
      } else {
        const { data: extAlerts } = await queryExternalData<Alert>({
          table: 'alerts',
          filters: [
            { type: 'eq', column: 'contact_id', value: contactId },
          ],
          order: { column: 'created_at', ascending: false },
          range: { from: 0, to: 9 },
        });
        if (extAlerts && extAlerts.length > 0) {
          alertsData = extAlerts;
        }
      }

      setData({
        contact: contactData,
        company: companyData,
        interactions: interactionsData || [],
        insights: insightsData || [],
        alerts: alertsData || [],
      });
    } catch (err) {
      logger.error('Error fetching contact detail:', err);
      setError('Erro ao carregar dados do contato');
      toast({
        title: 'Erro ao carregar contato',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, contactId, toast]);

  useEffect(() => {
    fetchContactDetail();
  }, [fetchContactDetail]);

  // Set up realtime subscription for updates
  useEffect(() => {
    if (!user || !contactId) return;

    const channel = supabase
      .channel(`contact-detail-${contactId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setData(prev => ({
              ...prev,
              contact: payload.new as Contact,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => ({
              ...prev,
              interactions: [payload.new as Interaction, ...prev.interactions],
            }));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({
              ...prev,
              interactions: prev.interactions.filter(i => i.id !== payload.old.id),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insights',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => ({
              ...prev,
              insights: [payload.new as Insight, ...prev.insights],
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => ({
              ...prev,
              alerts: [payload.new as Alert, ...prev.alerts],
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contactId]);

  const updateContact = async (updates: TablesUpdate<'contacts'>) => {
    if (!user || !contactId) return null;

    try {
      let query = supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId);

      // Optimistic locking: se temos a versão atual, enviar para evitar sobrescrever edição concorrente
      const currentVersion = data.contact?.version;
      if (currentVersion !== undefined && currentVersion !== null) {
        query = query.eq('version', currentVersion);
      }

      const { data: updatedContact, error } = await query
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!updatedContact) {
        throw new Error('Contato não encontrado ou concorrência detectada (versão desatualizada).');
      }

      setData(prev => ({
        ...prev,
        contact: updatedContact,
      }));

      toast({
        title: 'Contato atualizado',
        description: 'As alterações foram salvas.',
      });

      return updatedContact;
    } catch (err) {
      logger.error('Error updating contact:', err);
      toast({
        title: 'Erro ao atualizar contato',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateBehavior = async (behavior: Record<string, unknown>) => {
    // Merge new behavior data with existing to prevent losing fields like discProfile
    const currentBehavior = (data.contact?.behavior as Record<string, unknown>) || {};
    return updateContact({ 
      behavior: { ...currentBehavior, ...behavior } as Json 
    });
  };

  const addInteraction = async (interaction: Omit<Tables<'interactions'>, 'id' | 'created_at' | 'user_id'>) => {
    if (!user || !contactId) return null;

    try {
      const { data: newInteraction, error } = await supabase
        .from('interactions')
        .insert({
          ...interaction,
          contact_id: contactId,
          user_id: user.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!newInteraction) throw new Error('Falha ao registrar interação.');

      // Realtime will handle the update, but we can optimistically update
      setData(prev => ({
        ...prev,
        interactions: [newInteraction, ...prev.interactions],
      }));

      toast({
        title: 'Interação registrada',
        description: 'A interação foi salva com sucesso.',
      });

      return newInteraction;
    } catch (err) {
      logger.error('Error adding interaction:', err);
      toast({
        title: 'Erro ao registrar interação',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ dismissed: true })
        .eq('id', alertId);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        alerts: prev.alerts.filter(a => a.id !== alertId),
      }));

      toast({
        title: 'Alerta dispensado',
      });
    } catch (err) {
      logger.error('Error dismissing alert:', err);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('insights')
        .update({ dismissed: true })
        .eq('id', insightId);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        insights: prev.insights.filter(i => i.id !== insightId),
      }));

      toast({
        title: 'Insight dispensado',
      });
    } catch (err) {
      logger.error('Error dismissing insight:', err);
    }
  };

  return {
    ...data,
    loading,
    error,
    refetch: fetchContactDetail,
    updateContact,
    updateBehavior,
    addInteraction,
    dismissAlert,
    dismissInsight,
  };
}
