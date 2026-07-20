import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { addDays, differenceInDays, parseISO } from 'date-fns';
import { logger } from "@/lib/logger";

export interface ContactCadence {
  id: string;
  user_id: string;
  contact_id: string;
  cadence_days: number;
  priority: 'high' | 'medium' | 'low';
  auto_remind: boolean;
  last_contact_at: string | null;
  next_contact_due: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    company_id: string | null;
    relationship_score: number | null;
  };
  company?: {
    name: string;
  } | null;
}

export interface CadenceAlert {
  contact: ContactCadence['contact'];
  company: ContactCadence['company'];
  cadence: ContactCadence;
  daysOverdue: number;
  status: 'overdue' | 'due_today' | 'due_soon' | 'on_track';
}

const CADENCE_PRESETS = {
  vip: { days: 7, label: 'VIP (Semanal)' },
  high: { days: 14, label: 'Alta (Quinzenal)' },
  medium: { days: 21, label: 'Média (3 semanas)' },
  low: { days: 30, label: 'Baixa (Mensal)' },
  minimal: { days: 60, label: 'Mínima (Bimestral)' },
};

export function useContactCadence() {
  const { user } = useAuth();
  const [cadences, setCadences] = useState<ContactCadence[]>([]);
  const [alerts, setAlerts] = useState<CadenceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCadences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contact_cadence')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, avatar_url, company_id, relationship_score)
        `)
        .eq('user_id', user.id)
        .order('next_contact_due', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Fetch companies in parallel (avoid N+1 waterfall)
      const baseCadences = data || [];
      const companyIds = Array.from(
        new Set(
          baseCadences
            .map(cadence => cadence.contact?.company_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      // Fetch all companies in a single .in() query instead of N individual requests
      const { data: companiesData } = companyIds.length > 0
        ? await supabase.from('companies').select('id, name').in('id', companyIds)
        : { data: [] };
      const companyMap = new Map((companiesData || []).map(c => [c.id, { name: c.name }]));

      const cadencesWithCompanies: ContactCadence[] = baseCadences.map((cadence) => ({
        ...cadence,
        contact: cadence.contact,
        company: cadence.contact?.company_id
          ? (companyMap.get(cadence.contact.company_id) ?? null)
          : null,
      } as ContactCadence));

      setCadences(cadencesWithCompanies);

      // Calculate alerts
      const today = new Date();
      const calculatedAlerts: CadenceAlert[] = [];

      for (const cadence of cadencesWithCompanies) {
        if (!cadence.next_contact_due || !cadence.contact) continue;

        const dueDate = parseISO(cadence.next_contact_due);
        const daysUntilDue = differenceInDays(dueDate, today);

        let status: CadenceAlert['status'] = 'on_track';
        if (daysUntilDue < 0) {
          status = 'overdue';
        } else if (daysUntilDue === 0) {
          status = 'due_today';
        } else if (daysUntilDue <= 3) {
          status = 'due_soon';
        }

        if (status !== 'on_track') {
          calculatedAlerts.push({
            contact: cadence.contact,
            company: cadence.company,
            cadence,
            daysOverdue: Math.abs(daysUntilDue),
            status,
          });
        }
      }

      // Sort by urgency
      calculatedAlerts.sort((a, b) => {
        const statusOrder = { overdue: 0, due_today: 1, due_soon: 2, on_track: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setAlerts(calculatedAlerts);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching cadences:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCadences();
  }, [fetchCadences]);

  const setCadence = useCallback(async (
    contactId: string,
    cadenceDays: number,
    priority: 'high' | 'medium' | 'low' = 'medium',
    notes?: string
  ) => {
    if (!user) return;

    try {
      // Get latest interaction for this contact
      const { data: latestInteraction } = await supabase
        .from('interactions')
        .select('created_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastContactAt = latestInteraction?.created_at || new Date().toISOString();
      const nextContactDue = addDays(parseISO(lastContactAt), cadenceDays).toISOString();

      const { error } = await supabase
        .from('contact_cadence')
        .upsert({
          user_id: user.id,
          contact_id: contactId,
          cadence_days: cadenceDays,
          priority,
          auto_remind: true,
          last_contact_at: lastContactAt,
          next_contact_due: nextContactDue,
          notes,
        }, { onConflict: 'user_id,contact_id' });

      if (error) throw error;

      toast.success('Cadência configurada!');
      fetchCadences();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error setting cadence:', { error: msg });
      toast.error('Erro ao configurar cadência', { description: msg });
    }
  }, [user, fetchCadences]);

  const updateLastContact = useCallback(async (contactId: string) => {
    if (!user) return;

    try {
      const cadence = cadences.find(c => c.contact_id === contactId);
      if (!cadence) return;

      const now = new Date().toISOString();
      const nextContactDue = addDays(new Date(), cadence.cadence_days).toISOString();

      const { error } = await supabase
        .from('contact_cadence')
        .update({
          last_contact_at: now,
          next_contact_due: nextContactDue,
        })
        .eq('id', cadence.id)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchCadences();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating last contact:', { error: msg });
    }
  }, [user, cadences, fetchCadences]);

  const removeCadence = useCallback(async (contactId: string) => {
    if (!user) return;

    const previousCadences = cadences;
    const previousAlerts = alerts;
    setCadences(prev => prev.filter(c => c.contact_id !== contactId));
    setAlerts(prev => prev.filter(a => a.cadence.contact_id !== contactId));

    try {
      const { error } = await supabase
        .from('contact_cadence')
        .delete()
        .eq('contact_id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Cadência removida');
    } catch (error) {
      setCadences(previousCadences);
      setAlerts(previousAlerts);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error removing cadence:', { error: msg });
      toast.error('Erro ao remover cadência', { description: msg });
    }
  }, [user, cadences, alerts]);

  return {
    cadences,
    alerts,
    loading,
    setCadence,
    updateLastContact,
    removeCadence,
    refresh: fetchCadences,
    presets: CADENCE_PRESETS,
  };
}
