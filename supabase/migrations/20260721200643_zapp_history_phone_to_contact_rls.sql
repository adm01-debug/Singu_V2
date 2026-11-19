-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721200643
-- nome:   zapp_history_phone_to_contact_rls

-- Migration: zapp_history_phone_to_contact_rls (Wave 143)
-- Adds SELECT policy to zapp_history.phone_to_contact.
-- Fixes advisor: rls_enabled_no_policy (1 remaining after Wave 140).
--
-- authenticated → SELECT only (look up contact by phone in app UI)
-- service_role  → all operations via rolbypassrls=true (pipeline writes)
-- anon          → no access

DROP POLICY IF EXISTS phone_to_contact_select ON zapp_history.phone_to_contact;
CREATE POLICY phone_to_contact_select
  ON zapp_history.phone_to_contact
  FOR SELECT
  TO authenticated
  USING (true);
