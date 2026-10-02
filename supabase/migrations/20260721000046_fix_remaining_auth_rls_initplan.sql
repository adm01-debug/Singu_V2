-- Migration: fix_remaining_auth_rls_initplan (Wave 132)
-- Clears the 3 remaining auth_rls_initplan performance warnings.
--
-- 1. public.connector_log / cl_service_all
--    qual: auth.role() = 'service_role' — dead code (service_role has
--    BYPASSRLS=true), causes an initplan per row. Drop it.
--
-- 2. zapp_history.phone_to_contact / ptc_service_all
--    Same pattern — service_role ALL policy with auth.role() eval per row.
--    Drop it (BYPASSRLS makes it dead code).
--
-- 3. _dormant.notes / "Usuarios autenticados podem ver notas"
--    SELECT policy using bare auth.role() (initplan issue).
--    Consistent with the Wave 131 dormant lockdown, drop this policy too
--    so the table defaults to deny-all for non-service_role callers.

DO $migration$
DECLARE
  policy_definition record;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('public', 'connector_log', 'cl_service_all'),
      ('zapp_history', 'phone_to_contact', 'ptc_service_all'),
      ('_dormant', 'notes', 'Usuarios autenticados podem ver notas')
    ) AS policies(schema_name, table_name, policy_name)
  LOOP
    IF to_regclass(format('%I.%I', policy_definition.schema_name, policy_definition.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I',
        policy_definition.policy_name,
        policy_definition.schema_name,
        policy_definition.table_name
      );
    END IF;
  END LOOP;
END;
$migration$;
