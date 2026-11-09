-- recreate_unified_comm.sql — (re)cria a RPC public.get_unified_communication_history no contrato que o app usa.
--
-- Propósito: deixar no banco uma única função (p_company_id uuid, p_limit integer DEFAULT 50) que
--   devolve o histórico de interações de uma empresa — o contrato de
--   src/integrations/supabase/types.ts e src/hooks/useInteractionsRpc.ts. Remove a sobrecarga
--   legada (uuid, uuid, text, integer), que deixava a chamada ambígua no PostgREST.
--   ATENÇÃO: não existe migration desta função em supabase/migrations/ — este script é a única
--   fonte versionada da definição. Antes de recriar, compare com o banco (get_unified_def.sql).
-- Uso:
--   psql "$SUPABASE_DB_URL" -X -f scripts/recreate_unified_comm.sql               # ENSAIO: cria, valida e desfaz
--   psql "$SUPABASE_DB_URL" -X -v aplicar=1 -f scripts/recreate_unified_comm.sql  # grava de verdade
-- Risco: MÉDIO com aplicar=1 — troca uma função usada pela tela de histórico. Mudança de schema em
--   produção: só com aval do dono.
-- Guardas: uma transação só, com lock_timeout; confere antes se tabelas, colunas e roles necessárias
--   existem; só faz DROP da assinatura canônica se o tipo de retorno mudou (senão CREATE OR REPLACE,
--   preservando dependências); executa a função antes de confirmar (corpo plpgsql só é validado ao
--   rodar); idempotente. Sem `-v aplicar=1` termina em ROLLBACK.
-- Permissões: EXECUTE só para authenticated e service_role; PUBLIC e anon são revogados, como manda
--   supabase/migrations/20260721000064_fix_default_privileges.sql (a versão antiga deste script
--   concedia a anon). A função é SECURITY INVOKER: a RLS de interactions/profiles continua valendo.
\set ON_ERROR_STOP on
\pset pager off
\if :{?aplicar}
\else
  \set aplicar 0
\endif
SELECT lower(:'aplicar') IN ('1', 'true', 'on', 'yes', 'sim') AS aplicar_ok \gset

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $guarda$
DECLARE
  v_faltas text;
BEGIN
  SELECT string_agg(r.tabela || '.' || r.coluna, ', ' ORDER BY r.tabela, r.coluna) INTO v_faltas
    FROM (VALUES ('interactions', 'id'), ('interactions', 'type'), ('interactions', 'channel'),
                 ('interactions', 'resumo'), ('interactions', 'content'), ('interactions', 'data_interacao'),
                 ('interactions', 'user_id'), ('interactions', 'company_id'),
                 ('profiles', 'id'), ('profiles', 'full_name'), ('profiles', 'email')) AS r(tabela, coluna)
   WHERE NOT EXISTS (
           SELECT 1 FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = to_regclass(format('public.%I', r.tabela))
              AND a.attname = r.coluna AND a.attnum > 0 AND NOT a.attisdropped);
  IF v_faltas IS NOT NULL THEN
    RAISE EXCEPTION 'FATAL: colunas necessarias ausentes em public: %. Nada foi alterado.', v_faltas;
  END IF;
  SELECT string_agg(r, ', ' ORDER BY r) INTO v_faltas
    FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS r
   WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = r);
  IF v_faltas IS NOT NULL THEN
    RAISE EXCEPTION 'FATAL: roles do Supabase ausentes: %. Nada foi alterado.', v_faltas;
  END IF;

  -- CREATE OR REPLACE não troca tipo de retorno: só nesse caso a assinatura canônica é removida antes.
  -- (to_regprocedure devolve NULL se a função não existe; a comparação então não dispara.)
  IF pg_get_function_result(to_regprocedure('public.get_unified_communication_history(uuid, integer)'))
         <> 'TABLE(interaction_id uuid, interaction_type text, channel text, summary text, '
            || 'interaction_date timestamp with time zone, user_name text)' THEN
    RAISE NOTICE 'retorno atual difere do contrato: removendo a assinatura (uuid, integer) para recriar.';
    DROP FUNCTION public.get_unified_communication_history(uuid, integer);
  END IF;
END
$guarda$;

DROP FUNCTION IF EXISTS public.get_unified_communication_history(uuid, uuid, text, integer);

CREATE OR REPLACE FUNCTION public.get_unified_communication_history(
  p_company_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  interaction_id uuid,
  interaction_type text,
  channel text,
  summary text,
  interaction_date timestamp with time zone,
  user_name text
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.type::text,
    i.channel::text,
    COALESCE(i.resumo, i.content)::text,
    i.data_interacao,
    COALESCE(p.full_name, p.email, 'Sistema')::text
  FROM interactions i
  LEFT JOIN profiles p ON p.id = i.user_id
  WHERE i.company_id = p_company_id
  ORDER BY i.data_interacao DESC
  LIMIT p_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_unified_communication_history(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unified_communication_history(uuid, integer) TO authenticated, service_role;

-- Validação: se o corpo estiver quebrado (coluna/tipo), falha aqui e a transação inteira é desfeita.
SELECT count(*) AS linhas_no_teste
  FROM public.get_unified_communication_history('00000000-0000-0000-0000-000000000000'::uuid, 1);

\if :aplicar_ok
  NOTIFY pgrst, 'reload schema';
  COMMIT;
  \echo 'APLICADO: public.get_unified_communication_history(uuid, integer) recriada (PostgREST avisado).'
\else
  ROLLBACK;
  \echo 'ENSAIO: a função foi criada e validada, e tudo foi desfeito. Para gravar rode com -v aplicar=1.'
\endif
