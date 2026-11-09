-- get_unified_def.sql — mostra a definição completa de public.get_unified_communication_history.
--
-- Propósito: copiar do banco o que está valendo hoje (todas as sobrecargas): dono, volatilidade,
--   SECURITY DEFINER/INVOKER, configuração (search_path), permissões e o CREATE FUNCTION inteiro.
--   Serve para comparar com scripts/recreate_unified_comm.sql antes de recriar.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/get_unified_def.sql
-- Risco: nenhum — somente leitura.
-- Saída: um bloco por sobrecarga (formato expandido). Código 3 se a função não existir.
\set ON_ERROR_STOP on
\pset pager off
\pset expanded on

SELECT
  p.oid,
  p.proname,
  pg_get_function_arguments(p.oid) AS args,
  pg_get_function_result(p.oid) AS returns,
  pg_get_userbyid(p.proowner) AS dono,
  CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END AS volatilidade,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS seguranca,
  array_to_string(p.proconfig, ', ') AS configuracao,
  COALESCE(array_to_string(p.proacl, ', '), '(padrão: dono e PUBLIC)') AS permissoes,
  pg_get_functiondef(p.oid) AS def
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_unified_communication_history'
ORDER BY p.oid::regprocedure::text;

SELECT :ROW_COUNT = 0 AS ausente \gset
\if :ausente
  DO $$ BEGIN RAISE EXCEPTION 'FATAL: public.get_unified_communication_history nao existe neste banco.'; END $$;
\endif
