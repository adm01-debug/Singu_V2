\set ON_ERROR_STOP 1
SELECT p.oid::regprocedure::text AS sig
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.proname LIKE 'plpgsql\_check%' ORDER BY 1;
SELECT extversion FROM pg_extension WHERE extname='plpgsql_check';
