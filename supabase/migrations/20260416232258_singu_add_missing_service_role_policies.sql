-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416232258
-- nome:   singu_add_missing_service_role_policies

-- ============================================================================
-- SINGU — Adicionar service_role_full onde falta + policies faltantes críticas
-- ============================================================================

DO $$
DECLARE 
  t text;
  has_svc boolean;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'rfm_history','rfm_metrics','query_telemetry','schema_drift_alerts','score_history',
    'secret_rotation_log','social_behavior_analysis','social_life_events','social_profiles',
    'social_scraping_schedule','stakeholder_alerts','trigger_ab_tests','trigger_channel_effectiveness',
    'trigger_usage_history','weekly_report_settings','weekly_reports','whatsapp_instances',
    'whatsapp_kpis','whatsapp_messages'
  ])
  LOOP
    -- Tem service_role_full? se não, criar
    SELECT EXISTS(SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename=t 
      AND policyname IN ('service_role_full','service_full','service_role_full_'||t))
    INTO has_svc;
    IF NOT has_svc THEN
      EXECUTE format('CREATE POLICY "service_role_full" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;

-- disc_profile_config: somente 'Authenticated can read'. Adicionar service_role_full
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='disc_profile_config' AND policyname='service_role_full') THEN
    CREATE POLICY "service_role_full" ON public.disc_profile_config FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- access_blocked_log / login_attempts / password_reset_requests: só service_role (log de segurança)
-- Essas estão corretas — service_role já tem acesso total, usuários NÃO devem ver logs de segurança brutos

-- Verificação final: reporting de tabelas ainda com cobertura parcial
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT t.tname, COALESCE(pc.n, 0) AS n_policies
    FROM (SELECT unnest(ARRAY[
      'access_security_settings','ai_chat_messages','ai_chat_threads','campaign_recipients',
      'canned_responses','churn_risk_scores','city_whitelist','contact_cadence','csat_surveys',
      'decision_criteria','device_login_notifications','disc_conversion_metrics','document_signatures',
      'document_templates','document_views','email_campaigns','favorite_templates','geo_allowed_countries',
      'handoff_requests','insights','ip_whitelist','knowledge_base_articles','landing_page_submissions',
      'landing_pages','lead_assignments','lead_routing_rules','lead_score_config','lead_scores',
      'life_events','lux_intelligence','lux_webhook_config','meeting_summaries','nurturing_enrollments',
      'nurturing_workflows','offer_suggestions','rfm_analysis','sales_team_members',
      'sequence_enrollments','sequence_steps','sequences','sms_campaign_recipients','sms_campaigns',
      'sms_opt_outs','sms_templates','support_tickets','ticket_comments','user_known_devices',
      'vak_analysis_history','visit_checkins','webauthn_credentials'
    ]) AS tname) t
    LEFT JOIN (SELECT tablename, count(*) AS n FROM pg_policies WHERE schemaname='public' GROUP BY tablename) pc
      ON pc.tablename=t.tname
    WHERE COALESCE(pc.n, 0) < 4
    ORDER BY n_policies, tname
  LOOP
    RAISE NOTICE 'Tabela SINGU com cobertura incompleta: % (% policies)', r.tname, r.n_policies;
  END LOOP;
END $$;
