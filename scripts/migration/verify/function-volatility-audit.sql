-- function-volatility-audit.sql — Rodada 17/10
-- Proposito: falha se um indice depende de function que deixou de ser IMMUTABLE
--            (ALTER FUNCTION ... VOLATILE/STABLE depois do CREATE INDEX): o indice
--            passa a devolver resultado errado silenciosamente.
-- Classe   : GUARD FATAL
-- Limiar   : qualquer function nao-IMMUTABLE de public referenciada por indice.
-- Variaveis: nenhuma
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\echo '== function-volatility-audit =='
SELECT n.nspname AS schema, p.proname AS function_name,
       CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE'
                          WHEN 's' THEN 'STABLE'
                          WHEN 'v' THEN 'VOLATILE' END AS volatility,
       p.prosecdef AS security_definer,
       pg_get_function_identity_arguments(p.oid) AS args
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.provolatile <> 'i'
   AND p.prokind = 'f'
   AND EXISTS (
     SELECT 1 FROM pg_depend d
      JOIN pg_class c ON c.oid = d.objid
      WHERE d.refobjid = p.oid AND c.relkind IN ('i','I')
   )
 ORDER BY p.proname;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.provolatile <> 'i'
     AND p.prokind = 'f'
     AND EXISTS (
       SELECT 1 FROM pg_depend d
        JOIN pg_class c ON c.oid = d.objid
        WHERE d.refobjid = p.oid AND c.relkind IN ('i','I')
     );
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % function(s) nao-IMMUTABLE usadas em indice. Refatorar para IMMUTABLE ou remover do index e REINDEX.', v_count;
  END IF;
END $$;
\echo 'OK nenhuma function nao-IMMUTABLE em indice.'
