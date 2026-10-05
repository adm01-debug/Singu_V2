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
SELECT id AS cid2, user_id AS uid2 FROM public.contacts WHERE user_id IS NOT NULL AND deleted_at IS NULL LIMIT 1 \gset
SELECT channel AS ch, direction AS dir FROM public.interactions LIMIT 1 \gset
SELECT id AS coid FROM public.companies LIMIT 1 \gset
INSERT INTO public.interactions (contact_id, user_id, channel, direction, assunto) VALUES (:'cid2', :'uid2', :'ch', :'dir', 'diag') RETURNING id AS iid1 \gset
INSERT INTO public.interactions (company_id, user_id, channel, direction, assunto) VALUES (:'coid', :'uid2', :'ch', :'dir', 'diag') RETURNING id AS iid2 \gset
INSERT INTO public.interactions (company_id, user_id, channel, direction, assunto) VALUES (:'coid', NULL, :'ch', :'dir', 'diag') RETURNING id AS iid3 \gset
UPDATE public.interactions SET assunto = 'diag2' WHERE id IN (:'iid1', :'iid2', :'iid3');
SELECT relationship_score, sentiment, last_interaction_at IS NOT NULL AS tem_ultima FROM public.contacts WHERE id = :'cid2';
SELECT count(*) AS cadencias FROM public.contact_cadence WHERE contact_id = :'cid2' AND user_id = :'uid2';
DELETE FROM public.interactions WHERE id IN (:'iid1', :'iid2', :'iid3');
SELECT 'interacoes ok' AS status;
ROLLBACK;
SELECT 'verificacao concluida e revertida' AS status;
