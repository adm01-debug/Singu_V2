-- function-volatility-audit.sql — Rodada 17/10
-- Funcoes VOLATILE usadas em index expressions corrompem indices silenciosamente.
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
   AND p.provolatile = 'v'
   AND p.prokind = 'f'
   AND EXISTS (
     SELECT 1 FROM pg_depend d
      JOIN pg_class c ON c.oid = d.objid
      WHERE d.refobjid = p.oid AND c.relkind IN ('i','I')
   )
 ORDER BY p.proname;
\echo 'FATAL se listado: refatorar para IMMUTABLE ou remover do index.'