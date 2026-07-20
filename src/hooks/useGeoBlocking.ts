import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useGeoBlocking() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ['geo-countries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('geo_allowed_countries')
        .select('*')
        .eq('user_id', user.id)
        .order('country_name')
        .limit(1000);
      if (error) return [];
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const addCountry = useMutation({
    mutationFn: async ({ code, name }: { code: string; name: string }) => {
      const { error } = await supabase.from('geo_allowed_countries').insert({
        user_id: user!.id, country_code: code, country_name: name,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('País adicionado.'); qc.invalidateQueries({ queryKey: ['geo-countries'] }); },
    onError: () => toast.error('Erro ao adicionar país.'),
  });

  const removeCountry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('geo_allowed_countries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('País removido.'); qc.invalidateQueries({ queryKey: ['geo-countries'] }); },
    onError: () => toast.error('Erro ao remover país.'),
  });

  return { countries, isLoading, addCountry: addCountry.mutate, removeCountry: removeCountry.mutate };
}
