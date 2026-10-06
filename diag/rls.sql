\pset pager off
\echo ### anon_rpc_calls
SELECT s.calls||'|'||substring(s.query from '"public"\."([a-z_0-9]+)"\(') FROM extensions.pg_stat_statements s JOIN pg_roles r ON r.oid=s.userid WHERE r.rolname='anon' AND s.query ~ '"public"\."[a-z_0-9]+"\(' ORDER BY s.calls DESC LIMIT 40;
\echo ### anon_write_tables
SELECT s.calls||'|'||substring(s.query from '(INSERT INTO|UPDATE|DELETE FROM) "public"\."([a-z_0-9]+)"') FROM extensions.pg_stat_statements s JOIN pg_roles r ON r.oid=s.userid WHERE r.rolname='anon' AND s.query ~ '(INSERT INTO|UPDATE|DELETE FROM) "public"\.' ORDER BY s.calls DESC LIMIT 30;
\echo ### anon_policies_writes
SELECT tablename||'|'||policyname||'|'||cmd||'|'||array_to_string(roles,',')||'|'||coalesce(left(qual,120),'')||'|'||coalesce(left(with_check,120),'') FROM pg_policies WHERE schemaname='public' AND tablename IN ('dados_dispersos_pb','stg_bcb_sicoob') ORDER BY 1,2;
\echo ### recent
SELECT relname||'|ins='||n_tup_ins||'|upd='||n_tup_upd||'|live='||n_live_tup||'|aa='||coalesce(last_autoanalyze::text,'')||'|av='||coalesce(last_autovacuum::text,'') FROM pg_stat_user_tables WHERE schemaname='public' AND relname IN ('dados_dispersos_pb','stg_bcb_sicoob');
SELECT 'ddp_cols='||string_agg(column_name,',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name='dados_dispersos_pb';
\echo ### roles_traffic
SELECT r.rolname||'|'||sum(s.calls)::text AS x FROM extensions.pg_stat_statements s JOIN pg_roles r ON r.oid=s.userid GROUP BY r.rolname ORDER BY sum(s.calls) DESC;
