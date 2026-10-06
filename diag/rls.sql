\pset pager off
\echo ### buckets
SELECT id||'|'||public::text FROM storage.buckets ORDER BY 1;
\echo ### storage_policies
SELECT policyname||'|'||cmd||'|'||array_to_string(roles,',')||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') FROM pg_policies WHERE schemaname='storage' AND tablename='objects' ORDER BY 1;
