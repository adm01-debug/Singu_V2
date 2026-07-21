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

DROP POLICY IF EXISTS cl_service_all ON public.connector_log;
DROP POLICY IF EXISTS ptc_service_all ON zapp_history.phone_to_contact;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver notas" ON _dormant.notes;
