import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Dias desde a última interação registrada com um contato.
 *
 * Antes este hook chamava `get_days_without_contact({ p_contact_id })`, mas a
 * RPC em produção é `get_days_without_contact(p_company_id uuid)` — só existe
 * na versão por empresa. O argumento `p_contact_id` não existe, então a
 * chamada falhava e o widget nunca mostrava nada. Não há RPC equivalente por
 * contato, então a conta sai de `interactions`, que já é lida direto por
 * vários outros hooks (useTimelineByEntity, useDealsAtRisk, useDISCAnalysis).
 */
export function useContactDaysWithout(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['days-without-contact', contactId, user?.id],
    queryFn: async (): Promise<{ days: number; last_contact_date: string | null }> => {
      const { data, error } = await supabase
        .from('interactions')
        .select('data_interacao')
        .eq('contact_id', contactId!)
        .order('data_interacao', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      const ultima = data?.data_interacao ?? null;
      if (!ultima) return { days: 0, last_contact_date: null };

      const MS_POR_DIA = 24 * 60 * 60 * 1000;
      const dias = Math.max(0, Math.floor((Date.now() - new Date(ultima).getTime()) / MS_POR_DIA));
      return { days: dias, last_contact_date: ultima };
    },
    enabled: !!contactId && !!user,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
