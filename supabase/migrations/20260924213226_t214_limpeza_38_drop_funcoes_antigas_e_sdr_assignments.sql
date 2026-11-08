-- Correção 3.8 do doc de arquitetura do rodízio.

-- 1) sdr_closer_assignments tinha ativo/is_ativo divergentes (4/4 linhas). O motor real
--    (fn_proximo_sdr) lê `ativo` -- is_ativo é coluna órfã. As 4 linhas existentes são teste
--    óbvio (nomes "SDR Novo"/"Closer Novo"/null, data_inicio=data_fim, todas de 2026-02-04,
--    zero SDR real cadastrado no sistema ainda -- D6 confirma SDRs serão contratados depois).
DO $migration$
BEGIN
  IF to_regclass('public.sdr_closer_assignments') IS NOT NULL THEN
    DELETE FROM public.sdr_closer_assignments;
    ALTER TABLE public.sdr_closer_assignments DROP COLUMN IF EXISTS is_ativo;
  END IF;
END;
$migration$;

-- 2) Dropar as 7 funções de round-robin sobre companies.user_id, substituídas pelo motor
--    do rodízio sobre customers.vendedor_id/sdr_id. Confirmado: zero uso no front (PR #51
--    já removeu os hooks que as chamavam) e zero dependência em views.
DROP FUNCTION IF EXISTS public.assign_lead_round_robin(uuid, uuid);
DROP FUNCTION IF EXISTS public.auto_assign_company(uuid);
DROP FUNCTION IF EXISTS public.auto_assign_leads(integer);
DROP FUNCTION IF EXISTS public.bulk_reassign_companies(uuid[], uuid);
DROP FUNCTION IF EXISTS public.distribute_leads_round_robin(uuid[]);
DROP FUNCTION IF EXISTS public.redistribute_portfolio_smart(uuid, integer, text);
DROP FUNCTION IF EXISTS public.suggest_lead_assignment(uuid);
