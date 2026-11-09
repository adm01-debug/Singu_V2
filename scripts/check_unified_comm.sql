-- check_unified_comm.sql — confere o contrato da RPC public.get_unified_communication_history.
--
-- Propósito: dizer se a função existe exatamente como o app espera (src/hooks/useInteractionsRpc.ts
--   e src/integrations/supabase/types.ts): uma única assinatura (p_company_id uuid, p_limit integer),
--   retorno com as 6 colunas do histórico, e EXECUTE só para authenticated/service_role
--   (anon fica de fora, como define supabase/migrations/20260721000064_fix_default_privileges.sql).
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/check_unified_comm.sql
-- Risco: nenhum — somente leitura.
-- Saída: lista as assinaturas encontradas e termina com "OK check_unified_comm." (código 0) ou
--   "FATAL: ..." com os problemas (código 3). Para ver o corpo da função use get_unified_def.sql;
--   para corrigir, recreate_unified_comm.sql.
\set ON_ERROR_STOP on
\pset pager off

SELECT p.oid::regprocedure AS assinatura,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS returns
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'get_unified_communication_history'
 ORDER BY 1;

DO $check$
DECLARE
  c_args   CONSTANT text := 'p_company_id uuid, p_limit integer';
  c_ret    CONSTANT text := 'TABLE(interaction_id uuid, interaction_type text, channel text, summary text, '
                         || 'interaction_date timestamp with time zone, user_name text)';
  v_qtd    int;
  v_oid    oid;
  v_probs  text := '';
BEGIN
  SELECT count(*) INTO v_qtd
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_unified_communication_history';
  IF v_qtd = 0 THEN
    RAISE EXCEPTION 'FATAL: public.get_unified_communication_history nao existe (rode recreate_unified_comm.sql).';
  END IF;
  IF v_qtd > 1 THEN
    v_probs := v_probs || E'\n  - ' || v_qtd || ' sobrecargas (o PostgREST nao sabe qual chamar; deve haver so uma)';
  END IF;

  v_oid := to_regprocedure('public.get_unified_communication_history(uuid, integer)');
  IF v_oid IS NULL THEN
    v_probs := v_probs || E'\n  - falta a assinatura canonica (uuid, integer)';
  ELSE
    IF pg_get_function_identity_arguments(v_oid) <> c_args THEN
      v_probs := v_probs || E'\n  - argumentos: ' || pg_get_function_identity_arguments(v_oid) || ' (esperado: ' || c_args || ')';
    END IF;
    IF pg_get_function_result(v_oid) <> c_ret THEN
      v_probs := v_probs || E'\n  - retorno: ' || pg_get_function_result(v_oid) || E'\n    esperado: ' || c_ret;
    END IF;
    IF has_function_privilege('public', v_oid, 'EXECUTE') THEN
      v_probs := v_probs || E'\n  - EXECUTE concedido a PUBLIC (qualquer role, inclusive anon, pode chamar)';
    ELSIF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
          AND has_function_privilege('anon', v_oid, 'EXECUTE') THEN
      v_probs := v_probs || E'\n  - EXECUTE concedido a anon (visitante sem login pode chamar)';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated')
       AND NOT has_function_privilege('authenticated', v_oid, 'EXECUTE') THEN
      v_probs := v_probs || E'\n  - authenticated sem EXECUTE (o app nao consegue chamar)';
    END IF;
  END IF;

  IF v_probs <> '' THEN
    RAISE EXCEPTION 'FATAL: get_unified_communication_history fora do contrato:%', v_probs;
  END IF;
END
$check$;
\echo 'OK check_unified_comm.'
