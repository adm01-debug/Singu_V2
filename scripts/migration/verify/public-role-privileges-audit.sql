-- public-role-privileges-audit.sql — Rodada 19/10
-- GRANTs a PUBLIC em public.* sao vetor de exposicao involuntaria pos-restore.
\echo '== public-role-privileges-audit =='
SELECT table_schema, table_name, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND grantee = 'PUBLIC'
 ORDER BY 1,2,3;
\echo '-- Functions com EXECUTE a PUBLIC --'
SELECT n.nspname, p.proname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND has_function_privilege('PUBLIC', p.oid, 'EXECUTE')
 ORDER BY 1,2;
\echo 'REC: REVOKE ALL ON <obj> FROM PUBLIC; conceder explicitamente a roles nomeadas.'