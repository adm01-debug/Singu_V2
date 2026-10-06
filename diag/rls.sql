\pset pager off
\echo ### anon_traffic_tables
WITH q AS (
  SELECT s.calls, m[1] AS rel
  FROM extensions.pg_stat_statements s JOIN pg_roles r ON r.oid=s.userid,
       regexp_matches(s.query, '"public"\."([a-z_0-9]+)"', 'g') m
  WHERE r.rolname='anon'
), t AS (SELECT rel, sum(calls) AS calls FROM q GROUP BY rel)
SELECT t.rel||'|'||t.calls::text||'|kind='||coalesce(c.relkind::text,'?')||'|S='||has_table_privilege('anon',c.oid,'SELECT')::text||'|I='||has_table_privilege('anon',c.oid,'INSERT')::text||'|U='||has_table_privilege('anon',c.oid,'UPDATE')::text||'|D='||has_table_privilege('anon',c.oid,'DELETE')::text||'|rls='||c.relrowsecurity::text||'|anonpol='||(SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=t.rel AND ('anon'=ANY(p.roles) OR 'public'=ANY(p.roles)))::text||'|fn='||(SELECT count(*) FROM pg_proc WHERE proname=t.rel AND pronamespace='public'::regnamespace)::text AS x
FROM t LEFT JOIN pg_class c ON c.relname=t.rel AND c.relnamespace='public'::regnamespace
ORDER BY t.calls DESC;
\echo ### anon_pols_detail
SELECT p.tablename||'|'||p.policyname||'|'||p.cmd||'|'||array_to_string(p.roles,',')||'|'||coalesce(left(p.qual,100),'')||'|'||coalesce(left(p.with_check,100),'') AS x FROM pg_policies p WHERE p.schemaname='public' AND p.tablename IN ('dados_dispersos_pb','stg_portal_sicoob','stg_site_sicoob_pacs','stg_bcb_sicoob','lalamove_position_log','quotes','quote_templates') ORDER BY 1;
\echo ### tabstats
SELECT relname||'|ins='||n_tup_ins||'|upd='||n_tup_upd||'|del='||n_tup_del||'|live='||n_live_tup||'|aa='||coalesce(last_autoanalyze::text,'-') AS x FROM pg_stat_user_tables WHERE schemaname='public' AND relname IN ('dados_dispersos_pb','stg_portal_sicoob','stg_site_sicoob_pacs','stg_bcb_sicoob','lalamove_position_log') ORDER BY 1;
