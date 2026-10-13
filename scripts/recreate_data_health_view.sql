DROP VIEW IF EXISTS public.vw_singu_data_health;
CREATE VIEW public.vw_singu_data_health WITH (security_invoker = true) AS
WITH metrics AS (
  SELECT
    ((SELECT count(*) FROM companies WHERE user_id IS NOT NULL))::numeric
      / NULLIF((SELECT count(*) FROM companies), 0)::numeric * 100 AS pct_companies_uid,
    ((SELECT count(*) FROM contacts WHERE user_id IS NOT NULL AND deleted_at IS NULL))::numeric
      / NULLIF((SELECT count(*) FROM contacts WHERE deleted_at IS NULL), 0)::numeric * 100 AS pct_contacts_uid,
    ((SELECT count(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj <> ''))::numeric
      / NULLIF((SELECT count(*) FROM companies), 0)::numeric * 100 AS pct_cnpj,
    (SELECT count(*) FROM interactions) AS interactions_total,
    ((SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true))::numeric
      / NULLIF((SELECT count(*) FROM pg_tables WHERE schemaname = 'public'), 0)::numeric * 100 AS pct_rls,
    ((SELECT count(*) FROM pg_tables WHERE schemaname = 'public'
        AND tablename = ANY(ARRAY['disc_analysis_history','disc_communication_logs','disc_conversion_metrics','eq_analysis_history','cognitive_bias_history','metaprogram_analysis','emotional_states_history','emotional_anchors','hidden_objections','decision_criteria','client_values','offer_suggestions','insights','contact_cadence','contact_preferences','communication_preferences','contact_relatives','contact_time_analysis','life_events','compatibility_alerts','compatibility_settings','health_alerts','health_alert_settings','automation_rules','automation_logs','lux_intelligence','favorite_templates','companies','contacts','interactions','activities','alerts','disc_profile_config'])))::numeric
      / 33::numeric * 100 AS pct_singu,
    (SELECT count(*) FROM compatibility_settings) AS s1,
    (SELECT count(*) FROM health_alert_settings) AS s2,
    (SELECT count(*) FROM automation_rules) AS s3,
    (SELECT count(*) FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'vw_singu_%') AS vs,
    (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE n.nspname = 'public' AND c.contype = 'c' AND c.conname LIKE 'chk_%') AS chks,
    (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') AS tt,
    (SELECT count(*) FROM pg_views WHERE schemaname = 'public') AS tv
)
SELECT
  NULL::uuid AS user_id,
  round(pct_companies_uid / 10, 1) AS score_user_id_companies,
  round(pct_contacts_uid / 10, 1) AS score_user_id_contacts,
  round(pct_cnpj / 10, 1) AS score_cnpj,
  CASE WHEN interactions_total > 1000 THEN 10 WHEN interactions_total > 0 THEN 4 ELSE 0 END AS score_interactions,
  round(pct_rls / 10, 1) AS score_rls,
  round(pct_singu / 10, 1) AS score_singu_tables,
  CASE WHEN s1 > 0 AND s2 > 0 AND s3 > 0 THEN 10 ELSE 5 END AS score_seeds,
  CASE WHEN vs >= 9 THEN 10 WHEN vs >= 5 THEN 7 ELSE 3 END AS score_views,
  CASE WHEN chks >= 20 THEN 10 WHEN chks >= 10 THEN 7 ELSE 3 END AS score_constraints,
  round((pct_companies_uid / 10 + pct_contacts_uid / 10 + pct_rls / 10 * 2 + pct_singu / 10 * 2
        + CASE WHEN interactions_total > 1000 THEN 10 WHEN interactions_total > 0 THEN 4 ELSE 0 END * 1.5
        + CASE WHEN s1 > 0 AND s2 > 0 THEN 10 ELSE 5 END * 0.5
        + CASE WHEN vs >= 9 THEN 10 ELSE 5 END * 0.5
        + CASE WHEN chks >= 20 THEN 10 ELSE 5 END * 0.5
        + pct_cnpj / 10 * 0.5) / 9.5, 1) AS health_score,
  tt AS total_tables,
  tv AS total_views,
  interactions_total,
  s1 AS seeds_compat,
  s2 AS seeds_health,
  s3 AS seeds_auto,
  vs AS views_singu,
  chks AS check_constraints,
  now() AS measured_at
FROM metrics;
NOTIFY pgrst, 'reload schema';
