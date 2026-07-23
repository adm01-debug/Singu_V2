-- Rodada 48/10 · Invariante: exatamente as 33 funções listadas em
-- docs/qa/functions-authenticated-allowlist.md podem ser executadas por `authenticated`.
-- Falha se aparecer função extra ou se alguma da allowlist perder o grant.

BEGIN;

CREATE TEMP TABLE _allow(sig text PRIMARY KEY);
INSERT INTO _allow(sig) VALUES
  ('buyer_add_comment(_token text, _body text, _label text)'),
  ('buyer_toggle_milestone(_token text, _milestone_id uuid, _done boolean, _label text)'),
  ('check_relationship_consistency(p_contact_id uuid)'),
  ('compute_account_health(_account_id uuid)'),
  ('compute_revops_kpis(_user_id uuid, _period_start date, _period_end date)'),
  ('cs_renewal_pipeline(_user_id uuid, _days_ahead integer)'),
  ('dismiss_revops_alert(_alert_id uuid)'),
  ('enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid)'),
  ('evaluate_mql(_contact_id uuid)'),
  ('get_buyer_document_path(_token text, _document_id uuid)'),
  ('get_connection_metrics(_connection_id uuid)'),
  ('get_contact_behavior_gaps(p_contact_id uuid)'),
  ('get_contact_framework_gaps(p_contact_id uuid)'),
  ('get_contact_life_event_gaps(p_contact_id uuid)'),
  ('get_deal_room_by_token(_token text)'),
  ('get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date)'),
  ('get_score_explicability(p_contact_id uuid)'),
  ('has_role(_user_id uuid, _role app_role)'),
  ('increment_form_view(_slug text)'),
  ('increment_magnet_view(_slug text)'),
  ('move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability integer)'),
  ('move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability numeric)'),
  ('record_buyer_view(_token text, _label text)'),
  ('search_companies_unaccent(p_user_id uuid, p_query text, p_limit integer)'),
  ('search_contacts_unaccent(p_user_id uuid, p_query text, p_limit integer)'),
  ('search_interactions_unaccent(p_user_id uuid, p_query text, p_limit integer)'),
  ('search_products_semantic(p_user_id uuid, p_query text, p_limit integer, p_min_similarity real)'),
  ('seed_conversation_topics(_user_id uuid)'),
  ('seed_forecast_period(_user_id uuid, _type text)'),
  ('seed_lead_score_defaults(_user_id uuid)'),
  ('submit_public_form(_slug text, _data jsonb, _utms jsonb, _page_url text, _user_agent text)'),
  ('track_magnet_download(_slug text, _email text, _name text, _utms jsonb)'),
  ('validate_behavioral_consistency(p_contact_id uuid)');

CREATE TEMP TABLE _actual AS
SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

DO $$
DECLARE
  extra int;
  missing int;
  total int;
BEGIN
  SELECT count(*) INTO extra   FROM _actual a WHERE NOT EXISTS (SELECT 1 FROM _allow w WHERE w.sig = a.sig);
  SELECT count(*) INTO missing FROM _allow  w WHERE NOT EXISTS (SELECT 1 FROM _actual a WHERE a.sig = w.sig);
  SELECT count(*) INTO total   FROM _actual;

  IF extra > 0 THEN
    RAISE EXCEPTION 'authenticated executa % função(ões) fora da allowlist. Rode: SELECT sig FROM _actual EXCEPT SELECT sig FROM _allow;', extra;
  END IF;
  IF missing > 0 THEN
    RAISE EXCEPTION 'allowlist declara % função(ões) que perderam GRANT EXECUTE a authenticated', missing;
  END IF;
  IF total <> 33 THEN
    RAISE EXCEPTION 'baseline esperado = 33; atual = %', total;
  END IF;

  RAISE NOTICE 'OK — 33/33 funções da allowlist authenticated conferem.';
END $$;

ROLLBACK;