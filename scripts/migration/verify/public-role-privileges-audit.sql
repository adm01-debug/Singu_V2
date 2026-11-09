-- public-role-privileges-audit.sql — Rodada 19/10
-- Proposito: GRANTs a PUBLIC em public.* sao vetor de exposicao involuntaria pos-restore.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
-- Nota     : nas funcoes has_*_privilege o pseudo-papel se escreve 'public' (minusculo);
--            'PUBLIC' e tratado como nome de role e estoura "role does not exist".
\set ON_ERROR_STOP on
\pset pager off
\echo '== public-role-privileges-audit =='
SELECT table_schema, table_name, privilege_type
  FROM information_schema.table_privileges
 WHERE table_schema = 'public'
   AND grantee = 'PUBLIC'
 ORDER BY 1,2,3;
\echo '-- Functions com EXECUTE a PUBLIC --'
SELECT n.nspname, p.proname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND has_function_privilege('public', p.oid, 'EXECUTE')
 ORDER BY 1,2;
\echo 'REC: REVOKE ALL ON <obj> FROM PUBLIC; conceder explicitamente a roles nomeadas.'
