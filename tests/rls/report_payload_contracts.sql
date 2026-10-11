BEGIN;
SELECT set_config('rls.report_owner', (SELECT id::text FROM public.profiles ORDER BY id LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.report_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.report_owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT set_config('rls.report_baseline', public.get_daily_summary(current_date)::text, true);
RESET ROLE;

INSERT INTO public.companies (nome_crm, user_id) VALUES ('report-payload fixture', current_setting('rls.report_owner')::uuid)
RETURNING set_config('rls.report_company', id::text, true);
INSERT INTO public.contacts (first_name, user_id, company_id)
VALUES ('report-payload fixture', current_setting('rls.report_owner')::uuid, current_setting('rls.report_company')::uuid)
RETURNING set_config('rls.report_contact', id::text, true);
INSERT INTO public.interactions (user_id, contact_id, company_id, channel, direction, data_interacao,
  response_time, requer_followup, followup_concluido, data_followup)
VALUES (current_setting('rls.report_owner')::uuid, current_setting('rls.report_contact')::uuid,
  current_setting('rls.report_company')::uuid, 'email', 'outbound', now(), 120, true, true, now())
RETURNING set_config('rls.report_interaction', id::text, true);
INSERT INTO public.deals (user_id, company_id, titulo, valor, status, closed_at)
VALUES (current_setting('rls.report_owner')::uuid, current_setting('rls.report_company')::uuid,
  'report-payload fixture', 127, 'ganho', now());
UPDATE public.contacts SET last_interaction_at = now() - interval '1 day'
WHERE id = current_setting('rls.report_contact')::uuid;

SET LOCAL ROLE authenticated;
DO $$
DECLARE
  before jsonb := current_setting('rls.report_baseline')::jsonb;
  daily jsonb := public.get_daily_summary(current_date);
  channels jsonb := public.get_channel_analysis(30);
  seasons jsonb := public.get_seasonality_analysis(1);
  audit jsonb := public.check_relationship_consistency(current_setting('rls.report_contact')::uuid);
BEGIN
  IF (daily->>'interactions_count')::bigint <> (before->>'interactions_count')::bigint + 1
    OR (daily->>'deals_created')::bigint <> (before->>'deals_created')::bigint + 1
    OR (daily->>'deals_won')::bigint <> (before->>'deals_won')::bigint + 1
    OR (daily->>'followups_completed')::bigint <> (before->>'followups_completed')::bigint + 1
    OR (daily->>'revenue')::numeric <> (before->>'revenue')::numeric + 127 THEN
    RAISE EXCEPTION 'Resumo diário não inclui a fixture do dono';
  END IF;
  IF daily->'interactions_count' IS DISTINCT FROM daily->'interactions'
    OR daily->'deals_created' IS DISTINCT FROM daily->'new_deals' THEN
    RAISE EXCEPTION 'Aliases legados do resumo divergem';
  END IF;
  IF jsonb_typeof(channels->'series') <> 'array' OR jsonb_typeof(channels->'por_canal') <> 'array'
    OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(channels->'series') s
      WHERE s->>'channel' = 'email' AND (s->>'interaction_count')::bigint >= 1
        AND (s->>'response_rate')::numeric > 0 AND (s->>'conversion_rate')::numeric > 0) THEN
    RAISE EXCEPTION 'Série de canais não inclui interação e negócio ganho';
  END IF;
  IF jsonb_typeof(seasons->'series') <> 'array' OR jsonb_array_length(seasons->'series') <> 1
    OR (seasons->'series'->0->>'avg_revenue')::numeric < 127 THEN
    RAISE EXCEPTION 'Sazonalidade não inclui receita do mês';
  END IF;
  IF (audit->>'consistent')::boolean OR audit->'issues'->0->>'type' <> 'last_interaction_at' THEN
    RAISE EXCEPTION 'Auditoria não detectou data desatualizada';
  END IF;
  UPDATE public.contacts SET last_interaction_at = (SELECT data_interacao FROM public.interactions
    WHERE id = current_setting('rls.report_interaction')::uuid)
    WHERE id = current_setting('rls.report_contact')::uuid;
  IF NOT (public.check_relationship_consistency(current_setting('rls.report_contact')::uuid)->>'consistent')::boolean THEN
    RAISE EXCEPTION 'Auditoria não reconheceu data corrigida';
  END IF;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', :'user_b', true);
SELECT set_config('request.jwt.claims', json_build_object('sub', :'user_b', 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (public.get_daily_summary(current_date)->>'revenue')::numeric <> 0
    OR jsonb_array_length(public.get_channel_analysis(30)->'series') <> 0
    OR (public.get_seasonality_analysis(1)->'series'->0->>'avg_revenue')::numeric <> 0 THEN
    RAISE EXCEPTION 'Relatórios expõem dados de outro usuário';
  END IF;
  BEGIN
    PERFORM public.check_relationship_consistency(current_setting('rls.report_contact')::uuid);
    RAISE EXCEPTION 'Auditoria de contato alheio foi autorizada';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.get_daily_summary(date)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.get_channel_analysis(integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.get_seasonality_analysis(integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Relatórios permitem execução anônima';
  END IF;
END $$;
ROLLBACK;
