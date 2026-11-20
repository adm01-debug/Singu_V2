-- Restaura para public TODAS as tabelas que a producao moveu para _dormant
-- (migration 20260321192912 - move_empty_tables), EXCETO as que ja possuem
-- homonima em public (recriadas por migrations posteriores da branch, ex.:
-- as tabelas da wave de abril 20260415/16 que usam CREATE TABLE plain) e
-- EXCETO inactivity_alerts, que e criada intencionalmente em _dormant por
-- 20261013033428. Necessario pois migrations recuperadas da producao
-- referenciam tabelas como custom_fields, documents, tasks, notifications,
-- user_roles, incoming_webhooks etc. em public, que o preview manteve em
-- _dormant (ex.: v_contact_360 uses public.disc_analysis_history).

DO $$
DECLARE
  t TEXT;
  moved INT := 0;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = '_dormant'
  LOOP
    IF t = ANY (ARRAY[
'access_blocked_log','access_security_settings','ai_chat_messages','ai_chat_threads','campaign_recipients','canned_responses','churn_risk_scores','city_whitelist','csat_surveys','device_login_notifications','document_signatures','document_templates','document_views','email_campaigns','geo_allowed_countries','handoff_requests','inactivity_alerts','knowledge_base_articles','landing_page_submissions','landing_pages','lead_assignments','lead_routing_rules','lead_score_config','lux_webhook_config','meeting_summaries','nurturing_enrollments','nurturing_workflows','redistribution_log','sales_team_members','search_products_cache','semantic_search_cache','sequence_enrollments','sequence_steps','sequences','sms_campaign_recipients','sms_campaigns','sms_opt_outs','sms_templates','support_tickets','ticket_comments','user_known_devices','visit_checkins'
    ]) THEN
      CONTINUE;
    END IF;
    BEGIN
      EXECUTE format('ALTER TABLE _dormant.%I SET SCHEMA public', t);
      moved := moved + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Falha ao devolver %: %', t, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Tabelas devolvidas do _dormant para public: %', moved;
END $$;