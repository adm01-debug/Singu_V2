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
        supabase.from('whatsapp_instances').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('whatsapp_kpis').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1),
        contactId
          ? supabase.from('whatsapp_messages').select('*').eq('user_id', user!.id).eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50)
          : supabase.from('whatsapp_messages').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50),
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
    refetchOnWindowFocus: false,
  });

  return {
    instances: data?.instances || [],
    messages: data?.messages || [],
    kpis: data?.kpis || null,
    loading,
  };
}
