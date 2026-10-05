\set ON_ERROR_STOP 1
BEGIN;
\i diag/fix.sql
WITH ins AS (
  INSERT INTO public.contacts (first_name, last_name, user_id)
  SELECT 'diag', 'rollback', user_id FROM public.contacts WHERE user_id IS NOT NULL LIMIT 1
  RETURNING id
) SELECT id AS cid FROM ins \gset
UPDATE public.contacts SET hobbies = ARRAY['diag'], interests = ARRAY['diag'] WHERE id = :'cid';
SELECT version FROM public.contacts WHERE id = :'cid';
DELETE FROM public.contacts WHERE id = :'cid';
UPDATE public.companies SET updated_at = now() WHERE id = (SELECT id FROM public.companies LIMIT 1) RETURNING id, version;
SELECT action, table_name, entity_type, record_id IS NOT NULL AS tem_record FROM public.audit_log WHERE record_id = :'cid' ORDER BY created_at;
ROLLBACK;
SELECT 'verificacao concluida e revertida' AS status;
