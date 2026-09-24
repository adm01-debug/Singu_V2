import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Resolve o `users.id` (inteiro, tabela sincronizada com o Bitrix) do usuário
 * autenticado no Supabase Auth (uuid), por correspondência de e-mail.
 *
 * As RPCs do rodízio (`rodizio_bloquear_cliente`, `rodizio_aprovar_bloqueio`,
 * `rodizio_reverter_execucao`, etc.) esperam um `*_id` inteiro referenciando
 * `users.id` — não o uuid do `auth.users`. Não existe hoje nenhuma coluna de
 * ligação direta entre as duas tabelas, então resolvemos por e-mail (best
 * effort). Se não houver correspondência, os parâmetros `*_por_id` são
 * enviados como `null` e a RPC decide se isso é aceitável (a maioria tem
 * `default null`; `rodizio_bloquear_cliente` exige `p_solicitado_por_id`, e
 * nesse caso a ação falha com uma mensagem clara para o usuário).
 */
export function useAppUserId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['app-user-id', user?.email],
    queryFn: async (): Promise<number | null> => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      if (error) return null;
      return data?.id ?? null;
    },
    enabled: !!user?.email,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}
