-- RLS Coverage Enforcer — falha se qualquer tabela pública não tem RLS habilitada
-- ou não tem policy definida. Roda em CI.
-- Uso: psql "$DB_URL" -v ON_ERROR_STOP=1 -f verify/rls-coverage.sql
\set ON_ERROR_STOP on

WITH tables_pub AS (
  SELECT c.oid, c.relname, c.relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname NOT LIKE '\_%' ESCAPE '\'
     -- partições herdam as policies da tabela-particionada (pg_policy só na pai)
     AND NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = c.oid)
),
policies_pub AS (
  SELECT c.oid, COUNT(p.polname) AS n_policies
    FROM tables_pub c
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
   GROUP BY c.oid
),
gaps AS (
  SELECT t.relname AS tabela,
         t.relrowsecurity AS rls_enabled,
         p.n_policies,
         CASE
           WHEN NOT t.relrowsecurity THEN 'RLS_DISABLED'
           WHEN p.n_policies = 0     THEN 'NO_POLICY'
           ELSE NULL
         END AS gap
    FROM tables_pub t
    JOIN policies_pub p ON p.oid = t.oid
   WHERE NOT t.relrowsecurity OR p.n_policies = 0
)
SELECT * FROM gaps ORDER BY gap, tabela;

DO $$
DECLARE v_gaps int;
BEGIN
  SELECT COUNT(*) INTO v_gaps
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND c.relname NOT LIKE '\_%' ESCAPE '\'
     AND NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = c.oid)
   GROUP BY c.oid, c.relname, c.relrowsecurity
  HAVING NOT bool_or(c.relrowsecurity) OR COUNT(p.polname) = 0;

  IF COALESCE(v_gaps, 0) > 0 THEN
    RAISE EXCEPTION '🚨 RLS COVERAGE FAILED: % tabela(s) sem RLS/policy', v_gaps;
  END IF;
  RAISE NOTICE '✔ RLS coverage 100%% em public.*';
END $$;