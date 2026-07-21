import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SecuritySettings {
  id: string;
  enable_ip_restriction: boolean;
  enable_geo_blocking: boolean;
  enable_device_detection: boolean;
  notify_new_device: boolean;
  max_sessions: number;
  session_timeout_minutes: number;
}

const DEFAULTS: Omit<SecuritySettings, 'id'> = {
  enable_ip_restriction: false,
  enable_geo_blocking: false,
  enable_device_detection: true,
  notify_new_device: true,
  max_sessions: 5,
  session_timeout_minutes: 480,
};

export function useAccessSecurity() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['access-security', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('access_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) return { id: '', ...DEFAULTS };
      return data as SecuritySettings;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const update = useMutation({
    mutationFn: async (updates: Partial<Omit<SecuritySettings, 'id'>>) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('access_security_settings')
        .upsert({ user_id: user!.id, ...updates }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Configurações salvas.'); qc.invalidateQueries({ queryKey: ['access-security'] }); },
    onError: () => toast.error('Erro ao salvar.'),
  });

  return { settings: settings ?? { id: '', ...DEFAULTS }, isLoading, update: update.mutate };
}
