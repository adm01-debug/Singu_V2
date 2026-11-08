-- Migration: zapp_history_phone_to_contact_rls (Wave 143)
-- Adds SELECT policy to zapp_history.phone_to_contact.
-- Fixes advisor: rls_enabled_no_policy (1 remaining after Wave 140).
--
-- authenticated → SELECT only (look up contact by phone in app UI)
-- service_role  → all operations via rolbypassrls=true (pipeline writes)
-- anon          → no access

CREATE POLICY phone_to_contact_select
  ON zapp_history.phone_to_contact
  FOR SELECT
  TO authenticated
  USING (true);
