\pset pager off
\echo ### definers_pre
SELECT p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|anon='||has_function_privilege('anon',p.oid,'EXECUTE')::text||'|auth='||has_function_privilege('authenticated',p.oid,'EXECUTE')::text||'|acl='||coalesce(p.proacl::text,'NULL') AS x FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.prosecdef ORDER BY 1;
