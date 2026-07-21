import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useAllowedIPs() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: ips = [], isLoading } = useQuery({
    queryKey: ['allowed-ips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ip_whitelist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) return [];
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const addIP = useMutation({
    mutationFn: async ({ ip, label }: { ip: string; label?: string }) => {
      const { error } = await supabase.from('ip_whitelist').insert({
        user_id: user!.id, ip_address: ip, label: label ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('IP adicionado.'); qc.invalidateQueries({ queryKey: ['allowed-ips'] }); },
    onError: () => toast.error('Erro ao adicionar IP.'),
  });

  const removeIP = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ip_whitelist').delete().eq('user_id', user!.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('IP removido.'); qc.invalidateQueries({ queryKey: ['allowed-ips'] }); },
    onError: () => toast.error('Erro ao remover IP.'),
  });

  const toggleIP = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('ip_whitelist').update({ is_active: active }).eq('user_id', user!.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allowed-ips'] }),
    onError: () => toast.error('Erro ao atualizar status do IP.'),
  });

  return { ips, isLoading, addIP: addIP.mutate, removeIP: removeIP.mutate, toggleIP: toggleIP.mutate };
}
