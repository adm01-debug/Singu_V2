-- UP MIGRATION: a pontuação geral usa exatamente as notas exibidas e os pesos existentes.
CREATE OR REPLACE VIEW public.vw_singu_data_health WITH (security_invoker = true) AS
WITH metrics AS (
  SELECT
    (SELECT count(*) FROM public.companies WHERE user_id IS NOT NULL)::numeric /
      NULLIF((SELECT count(*) FROM public.companies), 0)::numeric * 100 AS pct_companies_uid,
    (SELECT count(*) FROM public.contacts WHERE user_id IS NOT NULL AND deleted_at IS NULL)::numeric /
      NULLIF((SELECT count(*) FROM public.contacts WHERE deleted_at IS NULL), 0)::numeric * 100 AS pct_contacts_uid,
    (SELECT count(*) FROM public.companies WHERE cnpj IS NOT NULL AND cnpj <> '')::numeric /
      NULLIF((SELECT count(*) FROM public.companies), 0)::numeric * 100 AS pct_cnpj,
    (SELECT count(*) FROM public.interactions) AS interactions_total,
    (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND rowsecurity)::numeric /
      NULLIF((SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public'), 0)::numeric * 100 AS pct_rls,
    (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = ANY (ARRAY[
      'disc_analysis_history', 'disc_communication_logs', 'disc_conversion_metrics', 'eq_analysis_history',
      'cognitive_bias_history', 'metaprogram_analysis', 'emotional_states_history', 'emotional_anchors',
      'hidden_objections', 'decision_criteria', 'client_values', 'offer_suggestions', 'insights',
      'contact_cadence', 'contact_preferences', 'communication_preferences', 'contact_relatives',
      'contact_time_analysis', 'life_events', 'compatibility_alerts', 'compatibility_settings',
      'health_alerts', 'health_alert_settings', 'automation_rules', 'automation_logs', 'lux_intelligence',
      'favorite_templates', 'companies', 'contacts', 'interactions', 'activities', 'alerts',
      'disc_profile_config'
    ]))::numeric / 33::numeric * 100 AS pct_singu,
    (SELECT count(*) FROM public.compatibility_settings) AS s1,
    (SELECT count(*) FROM public.health_alert_settings) AS s2,
    (SELECT count(*) FROM public.automation_rules) AS s3,
    (SELECT count(*) FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname LIKE 'vw_singu_%') AS vs,
    (SELECT count(*) FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON c.connamespace = n.oid
      WHERE n.nspname = 'public' AND c.contype = 'c' AND c.conname LIKE 'chk_%') AS chks,
    (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public') AS tt,
    (SELECT count(*) FROM pg_catalog.pg_views WHERE schemaname = 'public') AS tv
), scores AS (
  SELECT round(pct_companies_uid / 10, 1) AS score_user_id_companies,
    round(pct_contacts_uid / 10, 1) AS score_user_id_contacts,
    round(pct_cnpj / 10, 1) AS score_cnpj,
    CASE WHEN interactions_total > 1000 THEN 10 WHEN interactions_total > 0 THEN 4 ELSE 0 END AS score_interactions,
    round(pct_rls / 10, 1) AS score_rls,
    round(pct_singu / 10, 1) AS score_singu_tables,
    CASE WHEN s1 > 0 AND s2 > 0 AND s3 > 0 THEN 10 ELSE 5 END AS score_seeds,
    CASE WHEN vs >= 9 THEN 10 WHEN vs >= 5 THEN 7 ELSE 3 END AS score_views,
    CASE WHEN chks >= 20 THEN 10 WHEN chks >= 10 THEN 7 ELSE 3 END AS score_constraints
  FROM metrics
)
SELECT NULL::uuid AS user_id,
  score_user_id_companies, score_user_id_contacts, score_cnpj, score_interactions,
  score_rls, score_singu_tables, score_seeds, score_views, score_constraints,
  round((score_user_id_companies + score_user_id_contacts +
    score_rls * 2 + score_singu_tables * 2 + score_interactions * 1.5 +
    score_seeds * 0.5 + score_views * 0.5 + score_constraints * 0.5 +
    score_cnpj * 0.5) / 9.5, 1) AS health_score,
  tt AS total_tables, tv AS total_views, interactions_total,
  s1 AS seeds_compat, s2 AS seeds_health, s3 AS seeds_auto, vs AS views_singu,
  chks AS check_constraints, now() AS measured_at
FROM metrics CROSS JOIN scores;

-- DOWN MIGRATION: nenhuma nota histórica é regravada; apenas a definição da view muda.
-- Se a view já existia, restaurar sua definição anterior salva com pg_get_viewdef antes
-- deste UP usando CREATE OR REPLACE VIEW WITH (security_invoker = true), sem DROP.
-- Leitura antes do UP que gera o SQL executável da reversão:
-- SELECT 'CREATE OR REPLACE VIEW public.vw_singu_data_health WITH (security_invoker = true) AS '
--   || pg_get_viewdef('public.vw_singu_data_health'::regclass, true);
-- Em reconstruções novas, manter a view da migration 20261013033427, que já contém
-- a mesma pontuação. Preservar os grants e a RLS das tabelas subjacentes.
