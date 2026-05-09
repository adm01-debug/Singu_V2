import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useWhatsAppData(contactId?: string) {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['whatsapp-data', contactId, user?.id],
    queryFn: async () => {
      const [instRes, kpiRes, msgRes] = await Promise.all([
        supabase.from('whatsapp_instances').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_kpis').select('*').order('created_at', { ascending: false }).limit(1),
        contactId
          ? (supabase as any).from('whatsapp_messages').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50)
          : (supabase as any).from('whatsapp_messages').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      return {
        instances: instRes.data || [],
        kpis: (kpiRes.data?.[0] || null) as Tables<'whatsapp_kpis'> | null,
        messages: msgRes.data || [],
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    instances: data?.instances || [],
    messages: data?.messages || [],
    kpis: data?.kpis || null,
    loading,
  };
}
