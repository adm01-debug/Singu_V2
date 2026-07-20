import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface VisitCheckin {
  id: string;
  user_id: string;
  contact_id: string | null;
  company_id: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  notes: string | null;
  photo_url: string | null;
  visit_type: string;
  check_in_at: string;
  check_out_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export function useVisitCheckins(entityId?: string, entityType?: 'contact' | 'company') {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['visit-checkins', entityId, entityType, user?.id];

  const { data: checkins = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('visit_checkins').select('*').eq('user_id', user.id).order('check_in_at', { ascending: false });
      if (entityId && entityType === 'contact') query = query.eq('contact_id', entityId);
      if (entityId && entityType === 'company') query = query.eq('company_id', entityId);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data || []) as unknown as VisitCheckin[];
    },
    staleTime: 3 * 60_000,
  });

  const checkIn = useMutation({
    mutationFn: async (input: { contactId?: string; companyId?: string; notes?: string; visitType?: string }) => {
      if (!user) throw new Error('Não autenticado');

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        // eslint-disable-next-line sonarjs/no-intrusive-permissions
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });

      const { error } = await supabase.from('visit_checkins').insert({
        user_id: user.id,
        contact_id: input.contactId || null,
        company_id: input.companyId || null,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        notes: input.notes || null,
        visit_type: input.visitType || 'presencial',
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('📍 Check-in realizado!'); },
    onError: (e: Error) => toast.error(e.message.includes('denied') ? 'Permissão de localização negada' : e.message),
  });

  const checkOut = useMutation({
    mutationFn: async (id: string) => {
      const checkin = checkins.find(c => c.id === id);
      const duration = checkin ? Math.round((Date.now() - new Date(checkin.check_in_at).getTime()) / 60000) : null;
      const { error } = await supabase.from('visit_checkins').update({
        check_out_at: new Date().toISOString(),
        duration_minutes: duration,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Check-out realizado!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { checkins, isLoading, checkIn, checkOut };
}
