-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416230430
-- nome:   singu_triggers_batch_b

DROP TRIGGER IF EXISTS update_lead_assignments_updated_at ON public.lead_assignments;
CREATE TRIGGER update_lead_assignments_updated_at BEFORE UPDATE ON public.lead_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_routing_rules_updated_at ON public.lead_routing_rules;
CREATE TRIGGER update_lead_routing_rules_updated_at BEFORE UPDATE ON public.lead_routing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_score_config_updated_at ON public.lead_score_config;
CREATE TRIGGER update_lead_score_config_updated_at BEFORE UPDATE ON public.lead_score_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_scores_updated_at ON public.lead_scores;
CREATE TRIGGER update_lead_scores_updated_at BEFORE UPDATE ON public.lead_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_life_events ON public.life_events;
CREATE TRIGGER set_updated_at_life_events BEFORE UPDATE ON public.life_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_life_events_updated_at ON public.life_events;
CREATE TRIGGER update_life_events_updated_at BEFORE UPDATE ON public.life_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_lux_intelligence ON public.lux_intelligence;
CREATE TRIGGER set_updated_at_lux_intelligence BEFORE UPDATE ON public.lux_intelligence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lux_intelligence_updated_at ON public.lux_intelligence;
CREATE TRIGGER update_lux_intelligence_updated_at BEFORE UPDATE ON public.lux_intelligence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lux_webhook_config_updated_at ON public.lux_webhook_config;
CREATE TRIGGER update_lux_webhook_config_updated_at BEFORE UPDATE ON public.lux_webhook_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_summaries_updated_at ON public.meeting_summaries;
CREATE TRIGGER update_meeting_summaries_updated_at BEFORE UPDATE ON public.meeting_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_purchase_history ON public.purchase_history;
CREATE TRIGGER set_updated_at_purchase_history BEFORE UPDATE ON public.purchase_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_push_subscriptions ON public.push_subscriptions;
CREATE TRIGGER set_updated_at_push_subscriptions BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_rfm_analysis ON public.rfm_analysis;
CREATE TRIGGER set_updated_at_rfm_analysis BEFORE UPDATE ON public.rfm_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_rfm_segment_config ON public.rfm_segment_config;
CREATE TRIGGER set_updated_at_rfm_segment_config BEFORE UPDATE ON public.rfm_segment_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_auto_reset_leads_daily ON public.sales_team_members;
CREATE TRIGGER trg_auto_reset_leads_daily BEFORE UPDATE ON public.sales_team_members FOR EACH ROW WHEN ((old.leads_today IS DISTINCT FROM new.leads_today)) EXECUTE FUNCTION auto_reset_leads_on_update();

DROP TRIGGER IF EXISTS update_sales_team_members_updated_at ON public.sales_team_members;
CREATE TRIGGER update_sales_team_members_updated_at BEFORE UPDATE ON public.sales_team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_search_products_cache_updated_at ON public.search_products_cache;
CREATE TRIGGER trg_update_search_products_cache_updated_at BEFORE UPDATE ON public.search_products_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sms_campaigns_updated_at ON public.sms_campaigns;
CREATE TRIGGER trg_sms_campaigns_updated_at BEFORE UPDATE ON public.sms_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sms_templates_updated_at ON public.sms_templates;
CREATE TRIGGER trg_sms_templates_updated_at BEFORE UPDATE ON public.sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_social_profiles ON public.social_profiles;
CREATE TRIGGER set_updated_at_social_profiles BEFORE UPDATE ON public.social_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_social_scraping_schedule ON public.social_scraping_schedule;
CREATE TRIGGER set_updated_at_social_scraping_schedule BEFORE UPDATE ON public.social_scraping_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_trigger_ab_tests ON public.trigger_ab_tests;
CREATE TRIGGER set_updated_at_trigger_ab_tests BEFORE UPDATE ON public.trigger_ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_trigger_bundles ON public.trigger_bundles;
CREATE TRIGGER set_updated_at_trigger_bundles BEFORE UPDATE ON public.trigger_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_trigger_channel_effectiveness ON public.trigger_channel_effectiveness;
CREATE TRIGGER set_updated_at_trigger_channel_effectiveness BEFORE UPDATE ON public.trigger_channel_effectiveness FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_weekly_report_settings ON public.weekly_report_settings;
CREATE TRIGGER set_updated_at_weekly_report_settings BEFORE UPDATE ON public.weekly_report_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_whatsapp_instances ON public.whatsapp_instances;
CREATE TRIGGER set_updated_at_whatsapp_instances BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
