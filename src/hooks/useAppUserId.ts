import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Resolve o `users.id` (inteiro, tabela sincronizada com o Bitrix) do usuário
 * autenticado no Supabase Auth (uuid), pela ponte `profiles.bitrix_user_id`.
 *
 * As RPCs do rodízio (`rodizio_bloquear_cliente`, `rodizio_aprovar_bloqueio`,
 * `rodizio_reverter_execucao`, etc.) esperam um `*_id` inteiro referenciando
 * `users.id` — não o uuid do `auth.users`.
 *
 * Não resolver por e-mail em `users`: (1) `users` só tem policy de SELECT para
 * admin, então para os demais a query volta vazia e o hook devolveria null sem
 * erro; (2) o e-mail do Bitrix nem sempre é o e-mail de login (comercial02@ é o
 * Henrique, `users.id` 17, com e-mail diferente) — a ponte acerta esse caso.
 *
 * Quem ainda não tem a ponte preenchida devolve null, e aí os parâmetros
 * `*_por_id` vão como null: a maioria das RPCs tem `default null`;
 * `rodizio_bloquear_cliente` exige `p_solicitado_por_id` e falha com mensagem
 * clara para o usuário.
 */
export function useAppUserId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['app-user-id', user?.id],
    queryFn: async (): Promise<number | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) return null;
      // types.ts ainda não tem bitrix_user_id (coluna criada no t209).
      const bitrixUserId = (data as Record<string, unknown> | null)?.bitrix_user_id;
      return typeof bitrixUserId === 'number' ? bitrixUserId : null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}
