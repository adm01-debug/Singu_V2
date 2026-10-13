BEGIN;
SELECT set_config('rls.merge_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('rls.merge_other', (SELECT id::text FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.merge_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.merge_owner'), 'role', 'authenticated')::text, true);
SELECT set_config('rls.merge_company_primary', gen_random_uuid()::text, true);
SELECT set_config('rls.merge_company_secondary', gen_random_uuid()::text, true);
SELECT set_config('rls.merge_contact_primary', gen_random_uuid()::text, true);
SELECT set_config('rls.merge_contact_secondary', gen_random_uuid()::text, true);
SELECT set_config('rls.merge_contact_other', gen_random_uuid()::text, true);
SELECT set_config('rls.merge_fail_audit', 'on', true);
DO $test$
BEGIN
  IF NULLIF(current_setting('rls.merge_other'), '') IS NULL THEN
    RAISE EXCEPTION 'O contrato exige dois usuários cadastrados';
  END IF;
END;
$test$;
INSERT INTO public.companies(id, user_id, nome_crm) VALUES
  (current_setting('rls.merge_company_primary')::uuid, current_setting('rls.merge_owner')::uuid, 'Principal atômica'),
  (current_setting('rls.merge_company_secondary')::uuid, current_setting('rls.merge_owner')::uuid, 'Secundária atômica');
INSERT INTO public.contacts(id, user_id, first_name, email, company_id) VALUES
  (current_setting('rls.merge_contact_primary')::uuid, current_setting('rls.merge_owner')::uuid, 'Principal', 'principal@example.test', NULL),
  (current_setting('rls.merge_contact_secondary')::uuid, current_setting('rls.merge_owner')::uuid, 'Secundário', 'secundario@example.test', current_setting('rls.merge_company_secondary')::uuid),
  (current_setting('rls.merge_contact_other')::uuid, current_setting('rls.merge_other')::uuid, 'Outro proprietário', 'outro@example.test', NULL);
INSERT INTO public.contact_behavior(contact_id)
VALUES (current_setting('rls.merge_contact_secondary')::uuid);
INSERT INTO public.contact_automation_settings(user_id, contact_id)
VALUES (current_setting('rls.merge_owner')::uuid, current_setting('rls.merge_contact_secondary')::uuid);
WITH definition AS (
  INSERT INTO public.custom_fields(user_id, entity_type, field_name, field_label, field_type)
  VALUES (current_setting('rls.merge_owner')::uuid, 'contact', 'prova_mesclagem', 'Prova de mesclagem', 'text')
  RETURNING id
)
INSERT INTO public.custom_field_values(user_id, custom_field_id, entity_id, value_text)
SELECT current_setting('rls.merge_owner')::uuid, id, current_setting('rls.merge_contact_secondary')::uuid, 'Preservado'
FROM definition;
INSERT INTO public.favorites(user_id, entity_type, entity_id)
VALUES (current_setting('rls.merge_owner')::uuid, 'contact', current_setting('rls.merge_contact_secondary')::uuid);
INSERT INTO public.audit_log(user_id, action, entity_type, entity_id, table_name, record_id)
VALUES (current_setting('rls.merge_owner')::uuid, 'INSERT', 'contacts',
  current_setting('rls.merge_contact_secondary')::uuid, 'contacts', current_setting('rls.merge_contact_secondary'));

CREATE TABLE public.merge_contract_conflicts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  label text NOT NULL,
  UNIQUE(contact_id, label)
);
GRANT SELECT, INSERT, UPDATE ON public.merge_contract_conflicts TO authenticated;

CREATE FUNCTION pg_temp.reject_merge_audit() RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.action = 'UPDATE' AND NEW.old_data ? 'merged_from'
     AND NEW.entity_id = current_setting('rls.merge_contact_primary')::uuid
     AND current_setting('rls.merge_fail_audit') = 'on' THEN
    RAISE EXCEPTION 'Falha de auditoria simulada';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER merge_contract_reject_audit BEFORE INSERT ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_merge_audit();
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  primary_id uuid := current_setting('rls.merge_contact_primary')::uuid;
  secondary_id uuid := current_setting('rls.merge_contact_secondary')::uuid;
  other_id uuid := current_setting('rls.merge_contact_other')::uuid;
  result jsonb;
  rejected boolean;
BEGIN
  rejected := false;
  BEGIN
    PERFORM public.merge_records_atomically('contacts', primary_id, other_id);
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Mesclagem cruzou proprietários'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.merge_records_atomically('contacts', primary_id, primary_id);
  EXCEPTION WHEN invalid_parameter_value THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Mesclagem aceitou IDs iguais'; END IF;
  rejected := false;
  BEGIN
    PERFORM public.merge_records_atomically('contacts', primary_id, secondary_id,
      '{"email":"parcial@example.test","user_id":"00000000-0000-0000-0000-000000000000"}');
  EXCEPTION WHEN invalid_parameter_value THEN rejected := true;
  END;
  IF NOT rejected OR EXISTS (SELECT 1 FROM public.contacts WHERE id = primary_id AND email <> 'principal@example.test') THEN
    RAISE EXCEPTION 'Campo proibido deixou uma alteração parcial';
  END IF;
  rejected := false;
  BEGIN
    PERFORM public.merge_records_atomically('contacts', primary_id, secondary_id,
      '{"email":"parcial@example.test"}');
  EXCEPTION WHEN raise_exception THEN rejected := true;
  END;
  IF NOT rejected OR EXISTS (
      SELECT 1 FROM public.contacts
      WHERE (id = primary_id AND email <> 'principal@example.test')
         OR (id = secondary_id AND deleted_at IS NOT NULL)
    ) OR EXISTS (SELECT 1 FROM public.audit_log WHERE entity_id = primary_id AND old_data ? 'merged_from') THEN
    RAISE EXCEPTION 'Falha da auditoria não reverteu os registros';
  END IF;
  PERFORM set_config('rls.merge_fail_audit', 'off', true);
  result := public.merge_records_atomically('contacts', primary_id, secondary_id,
    '{"email":"confirmado@example.test"}');
  IF result->>'success' IS DISTINCT FROM 'true'
    OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = primary_id AND email = 'confirmado@example.test')
    OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = secondary_id AND deleted_at IS NOT NULL AND duplicate_of = primary_id)
    OR NOT EXISTS (SELECT 1 FROM public.contact_behavior WHERE contact_id = primary_id)
    OR NOT EXISTS (SELECT 1 FROM public.contact_automation_settings WHERE contact_id = primary_id)
    OR NOT EXISTS (SELECT 1 FROM public.custom_field_values
      WHERE entity_id = primary_id AND value_text = 'Preservado')
    OR NOT EXISTS (SELECT 1 FROM public.favorites WHERE entity_id = primary_id AND entity_type = 'contact')
    OR NOT EXISTS (SELECT 1 FROM public.audit_log WHERE entity_id = secondary_id AND action = 'INSERT')
    OR (SELECT count(*) FROM public.audit_log WHERE entity_id = primary_id AND old_data ? 'merged_from') <> 1 THEN
    RAISE EXCEPTION 'Mesclagem de contato incompleta';
  END IF;
  result := public.merge_records_atomically('contacts', primary_id, secondary_id,
    '{"email":"retry@example.test"}');
  IF result->>'already_merged' IS DISTINCT FROM 'true'
    OR EXISTS (SELECT 1 FROM public.contacts WHERE id = primary_id AND email <> 'confirmado@example.test')
    OR (SELECT count(*) FROM public.audit_log WHERE entity_id = primary_id AND old_data ? 'merged_from') <> 1 THEN
    RAISE EXCEPTION 'Retry alterou novamente os registros ou duplicou auditoria';
  END IF;
  result := public.merge_contacts(primary_id, secondary_id);
  IF result->>'kept_contact_id' IS DISTINCT FROM primary_id::text
    OR result->>'merged_contact_id' IS DISTINCT FROM secondary_id::text THEN
    RAISE EXCEPTION 'Wrapper de contato perdeu seu contrato';
  END IF;
  result := public.merge_duplicate_contacts(primary_id, secondary_id);
  IF result->>'success' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Wrapper de contato duplicado falhou';
  END IF;
  result := public.merge_records_atomically('companies',
    current_setting('rls.merge_company_primary')::uuid, current_setting('rls.merge_company_secondary')::uuid);
  IF result->>'success' IS DISTINCT FROM 'true'
    OR EXISTS (SELECT 1 FROM public.contacts WHERE id = secondary_id
      AND company_id IS DISTINCT FROM current_setting('rls.merge_company_primary')::uuid)
    OR NOT EXISTS (SELECT 1 FROM public.companies
      WHERE id = current_setting('rls.merge_company_secondary')::uuid AND deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Mesclagem de empresa perdeu o vínculo do contato';
  END IF;
  result := public.merge_records_atomically('companies',
    current_setting('rls.merge_company_primary')::uuid, current_setting('rls.merge_company_secondary')::uuid);
  IF result->>'already_merged' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Retry da empresa não foi idempotente';
  END IF;
  result := public.merge_companies(current_setting('rls.merge_company_primary')::uuid,
    current_setting('rls.merge_company_secondary')::uuid);
  IF result->>'company_kept' IS DISTINCT FROM current_setting('rls.merge_company_primary') THEN
    RAISE EXCEPTION 'Wrapper de empresa perdeu seu contrato';
  END IF;
  result := public.merge_duplicate_companies(current_setting('rls.merge_company_primary')::uuid,
    current_setting('rls.merge_company_secondary')::uuid);
  IF result->>'keep_id' IS DISTINCT FROM current_setting('rls.merge_company_primary') THEN
    RAISE EXCEPTION 'Wrapper de empresa duplicada perdeu seu contrato';
  END IF;
END;
$test$;
RESET ROLE;
SELECT set_config('rls.merge_conflict_primary', gen_random_uuid()::text, true);
SELECT set_config('rls.merge_conflict_secondary', gen_random_uuid()::text, true);
INSERT INTO public.contacts(id, user_id, first_name) VALUES
  (current_setting('rls.merge_conflict_primary')::uuid, current_setting('rls.merge_owner')::uuid, 'Conflito principal'),
  (current_setting('rls.merge_conflict_secondary')::uuid, current_setting('rls.merge_owner')::uuid, 'Conflito secundário');
INSERT INTO public.merge_contract_conflicts(user_id, contact_id, label) VALUES
  (current_setting('rls.merge_owner')::uuid, current_setting('rls.merge_conflict_primary')::uuid, 'Único'),
  (current_setting('rls.merge_owner')::uuid, current_setting('rls.merge_conflict_secondary')::uuid, 'Único');
SET LOCAL ROLE authenticated;
DO $test$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.merge_records_atomically('contacts',
      current_setting('rls.merge_conflict_primary')::uuid,
      current_setting('rls.merge_conflict_secondary')::uuid, '{"first_name":"Não persistir"}');
  EXCEPTION WHEN unique_violation THEN rejected := true;
  END;
  IF NOT rejected
    OR NOT EXISTS (SELECT 1 FROM public.contacts
      WHERE id = current_setting('rls.merge_conflict_primary')::uuid AND first_name = 'Conflito principal')
    OR EXISTS (SELECT 1 FROM public.contacts
      WHERE id = current_setting('rls.merge_conflict_secondary')::uuid AND deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Conflito de vínculos deixou dados parciais';
  END IF;
END;
$test$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.merge_records_atomically('contacts',
      current_setting('rls.merge_contact_primary')::uuid, current_setting('rls.merge_contact_secondary')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Identidade ausente executou uma mesclagem'; END IF;
END;
$test$;
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL ROLE anon;
DO $test$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.merge_records_atomically('contacts',
      current_setting('rls.merge_contact_primary')::uuid, current_setting('rls.merge_contact_secondary')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Anon executou uma mesclagem'; END IF;
END;
$test$;
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SET LOCAL ROLE service_role;
DO $test$
DECLARE rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.merge_records_atomically('contacts',
      current_setting('rls.merge_contact_primary')::uuid, current_setting('rls.merge_contact_secondary')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Service role executou uma mesclagem'; END IF;
END;
$test$;
RESET ROLE;
SELECT 'merge_records_atomic: OK' AS result;
ROLLBACK;
