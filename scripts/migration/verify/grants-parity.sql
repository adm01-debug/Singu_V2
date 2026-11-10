-- grants-parity.sql — Snapshot canonico de GRANTs em public.* para diff origem x destino.
-- Cobre os papeis do PostgREST (anon/authenticated/service_role), postgres e PUBLIC.
-- Le table_privileges (role_table_grants omite concessoes a PUBLIC feitas por outros papeis).
-- Classe   : SNAPSHOT (saida canonica para diff origem x destino; sem veredito)
-- Saida    : 0.
SELECT
  table_schema || '.' || table_name || '::' || grantee || '::' ||
  string_agg(privilege_type, ',' ORDER BY privilege_type)
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','service_role','postgres','PUBLIC')
GROUP BY table_schema, table_name, grantee
ORDER BY 1;