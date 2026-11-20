-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321192912
-- nome:   create_dormant_schema_move_empty_tables

-- ============================================================
-- A2: Mover 223 tabelas vazias para schema _dormant
-- Reversível: ALTER TABLE _dormant.xxx SET SCHEMA public;
-- ============================================================

CREATE SCHEMA IF NOT EXISTS _dormant;
COMMENT ON SCHEMA _dormant IS 'Tabelas vazias movidas do public em 2026-03-21. Reverter: ALTER TABLE _dormant.xxx SET SCHEMA public;';

-- Mover via DO block dinâmico
DO $$
DECLARE
  r RECORD;
  moved INT := 0;
BEGIN
  FOR r IN 
    SELECT t.relname as tbl
    FROM pg_class t 
    JOIN pg_namespace n ON n.oid = t.relnamespace 
    WHERE n.nspname = 'public' AND t.relkind = 'r' AND t.reltuples <= 0
    AND t.relname NOT IN (
        'achievements',
    'activities',
    'activity_feed',
    'alert_rules',
    'alerts',
    'automation_logs',
    'automation_rules',
    'automations',
    'cadence_enrollments',
    'calendar_events',
    'campaign_members',
    'campaigns',
    'carriers',
    'churn_predictions',
    'client_values',
    'clients',
    'cognitive_bias_history',
    'commissions',
    'communication_preferences',
    'companies',
    'company_addresses',
    'company_cadences',
    'company_emails',
    'company_phones',
    'company_rfm_scores',
    'company_social_media',
    'compatibility_alerts',
    'compatibility_settings',
    'config_regras_negocio',
    'connector_log',
    'contact_addresses',
    'contact_cadence',
    'contact_emails',
    'contact_phones',
    'contact_preferences',
    'contact_relatives',
    'contact_social_media',
    'contact_time_analysis',
    'contacts',
    'coop_sistemas',
    'customer_ownership_history',
    'customer_sdr_history',
    'customers',
    'deal_competitors',
    'deal_velocity_analysis',
    'deals',
    'decision_criteria',
    'disc_analysis_history',
    'disc_communication_logs',
    'disc_conversion_metrics',
    'disc_profile_config',
    'disc_templates',
    'economic_group_members',
    'economic_groups',
    'emotional_anchors',
    'emotional_states_history',
    'eq_analysis_history',
    'favorite_templates',
    'favorites',
    'for',
    'health_alert_settings',
    'health_alerts',
    'hidden_objections',
    'insights',
    'interaction_templates',
    'interactions',
    'ip_whitelist',
    'lead_scores',
    'lead_sources',
    'life_events',
    'login_attempts',
    'lux_intelligence',
    'meetings',
    'metaprogram_analysis',
    'notification_preferences',
    'offer_suggestions',
    'password_reset_requests',
    'permissions',
    'pipeline_stages',
    'pipelines',
    'products',
    'profiles',
    'proposals',
    'purchase_history',
    'push_subscriptions',
    'quick_notes',
    'relationship_score_history',
    'reminders',
    'rfm_analysis',
    'rfm_history',
    'rfm_metrics',
    'rfm_segment_config',
    'role_permissions',
    'sales',
    'sales_cadences',
    'sales_goals',
    'sales_tasks',
    'salespeople',
    'scheduled_visits',
    'score_history',
    'sdr_closer_assignments',
    'seller_daily_metrics',
    'sla_violations',
    'social_behavior_analysis',
    'social_life_events',
    'social_profiles',
    'social_scraping_schedule',
    'stakeholder_alerts',
    'storage',
    'suppliers',
    'territories',
    'territory_assignments',
    'to',
    'trigger_ab_tests',
    'trigger_bundles',
    'trigger_channel_effectiveness',
    'trigger_intensity_history',
    'trigger_usage_history',
    'uapi_sessions',
    'user_badges',
    'user_goals',
    'user_roles',
    'users',
    'vak_analysis_history',
    'webauthn_credentials',
    'weekly_report_settings',
    'weekly_reports',
    'whatsapp_instances',
    'whatsapp_kpis',
    'whatsapp_messages',
    'workspace_accounts'
    )
    ORDER BY t.relname
  LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.' || quote_ident(r.tbl) || ' SET SCHEMA _dormant';
      moved := moved + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Falha ao mover %: %', r.tbl, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Total movidas: %', moved;
END $$;
