BEGIN;
SELECT set_config('rls.audit.owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('rls.audit.entity', gen_random_uuid()::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.audit.owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.audit.owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
INSERT INTO public.activities(user_id, type, entity_type, entity_id, reason, metadata)
SELECT current_setting('rls.audit.owner')::uuid, event_type, split_part(event_type, '_', 1),
  current_setting('rls.audit.entity')::uuid, 'QA motivo', '{"qa":true}'::jsonb
FROM unnest(ARRAY[
  'contact_created', 'contact_updated', 'contact_deleted', 'contact_viewed',
  'company_created', 'company_updated', 'company_deleted', 'company_viewed',
  'interaction_created', 'interaction_updated', 'interaction_deleted'
]) AS event_type;
DO $writes$
BEGIN
  IF (SELECT count(*) FROM public.activities
    WHERE entity_id = current_setting('rls.audit.entity')::uuid AND reason = 'QA motivo'
      AND metadata @> '{"qa":true}'::jsonb) <> 11 THEN
    RAISE EXCEPTION 'Eventos atuais ou contexto opcional da auditoria não foram gravados';
  END IF;
END;
$writes$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
SET LOCAL ROLE authenticated;
DO $isolation$
BEGIN
  IF EXISTS (SELECT 1 FROM public.activities WHERE entity_id = current_setting('rls.audit.entity')::uuid) THEN
    RAISE EXCEPTION 'Outro usuário lê a auditoria do proprietário';
  END IF;
END;
$isolation$;
RESET ROLE;
DO $anonymous$
BEGIN
  IF has_table_privilege('anon', 'public.activities', 'INSERT') THEN
    RAISE EXCEPTION 'Anônimo possui permissão para gravar auditoria';
  END IF;
END;
$anonymous$;
SELECT 'activities_audit_events_contract: OK' AS result;
ROLLBACK;
