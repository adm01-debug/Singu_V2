-- Allowlist de funções expostas — ver docs/qa/functions-authenticated-allowlist.md.
-- Invariante 1: anon executa EXATAMENTE as RPCs públicas listadas.
-- Invariante 2: authenticated executa, entre as SECURITY DEFINER (que ignoram RLS), EXATAMENTE as
--               RPCs públicas + has_role + as 15 RPCs do frontend
--               com escopo por auth.uid() (20261006130000) + 2 RPCs admin do AI Gateway (20261006140000).
--               Inclui a confirmação manual de sequência e a mesclagem com seus quatro aliases.
--               Funções SECURITY INVOKER rodam sob RLS e não entram aqui.
-- Falha se aparecer função extra ou se alguma da allowlist perder o grant.

BEGIN;

CREATE TEMP TABLE _public_rpc(sig text PRIMARY KEY);
INSERT INTO _public_rpc(sig) VALUES
  ('buyer_add_comment(_token text, _body text, _label text)'),
  ('buyer_toggle_milestone(_token text, _milestone_id uuid, _done boolean, _label text)'),
  ('get_buyer_document_path(_token text, _document_id uuid)'),
  ('get_deal_room_by_token(_token text)'),
  ('get_public_csat_survey(_token uuid)'),
  ('increment_form_view(_slug text)'),
  ('increment_landing_page_view(page_id uuid)'),
  ('increment_magnet_view(_slug text)'),
  ('record_buyer_view(_token text, _label text)'),
  ('submit_public_csat_survey(_token uuid, _score integer, _feedback text)'),
  ('submit_public_form(_slug text, _data jsonb, _utms jsonb, _page_url text, _user_agent text)'),
  ('track_magnet_download(_slug text, _email text, _name text, _utms jsonb)');

CREATE TEMP TABLE _definer_auth(sig text PRIMARY KEY);
INSERT INTO _definer_auth SELECT sig FROM _public_rpc;
INSERT INTO _definer_auth(sig) VALUES ('has_role(_user_id uuid, _role app_role)');
INSERT INTO _definer_auth(sig) VALUES
  ('cleanup_behavioral_regen_queue(_retention_days integer, _max_attempts integer, _dead_letter_backoff_days integer)'),
  ('compute_account_health(_account_id uuid)'),
  ('compute_attribution(_deal_id text, _model text, _deal_value numeric)'),
  ('compute_revops_kpis(_user_id uuid, _period_start date, _period_end date)'),
  ('cs_renewal_pipeline(_user_id uuid, _days_ahead integer)'),
  ('dismiss_revops_alert(_alert_id uuid)'),
  ('enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid)'),
  ('evaluate_mql(_contact_id uuid)'),
  ('get_connection_metrics(_connection_id uuid)'),
  ('get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date)'),
  ('get_score_explicability(p_contact_id uuid)'),
  ('move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability integer)'),
  ('publish_mtta_sla_breach_alert(_mtta_minutes integer, _sla_minutes integer)'),
  ('seed_conversation_topics(_user_id uuid)'),
  ('seed_forecast_period(_user_id uuid, _type text)');
INSERT INTO _definer_auth(sig) VALUES
  ('confirm_sequence_manual_step(p_enrollment_id uuid, p_step_id uuid, p_note text)'),
  ('get_ai_gateway_health(_hours integer)'),
  ('get_ai_gateway_partition_stats()');
INSERT INTO _definer_auth(sig) VALUES
  ('merge_records_atomically(p_entity text, p_primary_id uuid, p_secondary_id uuid, p_field_overrides jsonb)'),
  ('merge_companies(p_company_keep uuid, p_company_remove uuid)'),
  ('merge_duplicate_companies(p_keep_id uuid, p_merge_id uuid)'),
  ('merge_contacts(p_keep_contact_id uuid, p_merge_contact_id uuid)'),
  ('merge_duplicate_contacts(p_keep_id uuid, p_merge_id uuid)');

CREATE TEMP TABLE _fn AS
SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig,
       p.prosecdef,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.prokind = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_depend d
    WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
  );

DO $$
DECLARE
  extra text;
  missing text;
BEGIN
  SELECT string_agg(sig, ', ' ORDER BY sig) INTO extra
  FROM _fn WHERE anon_exec AND sig NOT IN (SELECT sig FROM _public_rpc);
  IF extra IS NOT NULL THEN
    RAISE EXCEPTION 'anon executa função(ões) fora da allowlist pública: %', extra;
  END IF;

  SELECT string_agg(w.sig, ', ' ORDER BY w.sig) INTO missing
  FROM _public_rpc w WHERE NOT EXISTS (SELECT 1 FROM _fn f WHERE f.sig = w.sig AND f.anon_exec);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'RPC(s) pública(s) sem EXECUTE para anon: %', missing;
  END IF;

  SELECT string_agg(sig, ', ' ORDER BY sig) INTO extra
  FROM _fn WHERE prosecdef AND auth_exec AND sig NOT IN (SELECT sig FROM _definer_auth);
  IF extra IS NOT NULL THEN
    RAISE EXCEPTION 'authenticated executa SECURITY DEFINER fora da allowlist: %', extra;
  END IF;

  SELECT string_agg(w.sig, ', ' ORDER BY w.sig) INTO missing
  FROM _definer_auth w WHERE NOT EXISTS (SELECT 1 FROM _fn f WHERE f.sig = w.sig AND f.auth_exec);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'allowlist declara função(ões) sem EXECUTE para authenticated: %', missing;
  END IF;

  RAISE NOTICE 'OK — anon: % RPCs públicas; authenticated: % assinaturas da allowlist.',
    (SELECT count(*) FROM _public_rpc), (SELECT count(*) FROM _definer_auth);
END $$;

ROLLBACK;
