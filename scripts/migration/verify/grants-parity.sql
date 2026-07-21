-- grants-parity.sql — Emite snapshot canônico de GRANTs em public.* para diff origem × destino.
-- Captura pg_dump --no-acl silenciosamente omitindo privilégios PostgREST (anon/authenticated/service_role).
-- Uso:
--   psql "$SRC_DB_URL"  -Atqf verify/grants-parity.sql > verify/out/grants-src.txt
--   psql "$DEST_DB_URL" -Atqf verify/grants-parity.sql > verify/out/grants-dest.txt
--   diff -u verify/out/grants-src.txt verify/out/grants-dest.txt
SELECT
  table_schema || '.' || table_name || '::' || grantee || '::' ||
  string_agg(privilege_type, ',' ORDER BY privilege_type)
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','service_role','postgres','PUBLIC')
GROUP BY table_schema, table_name, grantee
ORDER BY 1;