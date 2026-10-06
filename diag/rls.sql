\pset pager off
\echo ### pgss_info
SELECT 'stats_reset='||coalesce(stats_reset::text,'?') FROM pg_stat_statements_info;
\echo ### anon_queries
SELECT s.calls||'|'||left(regexp_replace(s.query,'\s+',' ','g'),230) FROM extensions.pg_stat_statements s JOIN pg_roles r ON r.oid=s.userid WHERE r.rolname='anon' ORDER BY s.calls DESC LIMIT 80;
\echo ### roles_traffic
SELECT r.rolname||'|'||sum(s.calls) FROM extensions.pg_stat_statements s JOIN pg_roles r ON r.oid=s.userid GROUP BY 1 ORDER BY 2 DESC;
