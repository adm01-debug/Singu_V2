-- grants-parity.sql — Snapshot canonico de GRANTs em public.* para diff origem x destino.
-- Captura pg_dump --no-acl omitindo privilegios PostgREST (anon/authenticated/service_role).
SELECT
  table_schema || '.' || table_name || '::' || grantee || '::' ||
  string_agg(privilege_type, ',' ORDER BY privilege_type)
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','service_role','postgres','PUBLIC')
GROUP BY table_schema, table_name, grantee
ORDER BY 1;