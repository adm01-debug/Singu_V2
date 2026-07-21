-- rls-force-audit.sql — Rodada 17/10
-- Tabelas cujo owner e superuser bypassam RLS sem FORCE ROW LEVEL SECURITY.
\echo '== rls-force-audit =='
SELECT n.nspname AS schemaname, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       pg_get_userbyid(c.relowner) AS owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind = 'r'
   AND n.nspname = 'public'
   AND c.relrowsecurity = true
   AND c.relforcerowsecurity = false
 ORDER BY c.relname;
\echo 'WARN: considere ALTER TABLE ... FORCE ROW LEVEL SECURITY para tabelas sensiveis.'