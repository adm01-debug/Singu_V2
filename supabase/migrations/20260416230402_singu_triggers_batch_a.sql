-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416230402
-- nome:   singu_triggers_batch_a

DROP TRIGGER IF EXISTS update_ai_chat_threads_updated_at ON public.ai_chat_threads;
CREATE TRIGGER update_ai_chat_threads_updated_at BEFORE UPDATE ON public.ai_chat_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON public.automation_rules;
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_churn_risk_scores_updated_at ON public.churn_risk_scores;
CREATE TRIGGER update_churn_risk_scores_updated_at BEFORE UPDATE ON public.churn_risk_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_client_values ON public.client_values;
CREATE TRIGGER set_updated_at_client_values BEFORE UPDATE ON public.client_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_values_updated_at ON public.client_values;
CREATE TRIGGER update_client_values_updated_at BEFORE UPDATE ON public.client_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_communication_preferences ON public.communication_preferences;
CREATE TRIGGER set_updated_at_communication_preferences BEFORE UPDATE ON public.communication_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communication_preferences_updated_at ON public.communication_preferences;
CREATE TRIGGER update_communication_preferences_updated_at BEFORE UPDATE ON public.communication_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_compatibility_settings ON public.compatibility_settings;
CREATE TRIGGER set_updated_at_compatibility_settings BEFORE UPDATE ON public.compatibility_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compatibility_settings_updated_at ON public.compatibility_settings;
CREATE TRIGGER update_compatibility_settings_updated_at BEFORE UPDATE ON public.compatibility_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_contact_cadence ON public.contact_cadence;
CREATE TRIGGER set_updated_at_contact_cadence BEFORE UPDATE ON public.contact_cadence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_cadence_updated_at ON public.contact_cadence;
CREATE TRIGGER update_contact_cadence_updated_at BEFORE UPDATE ON public.contact_cadence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_contact_preferences ON public.contact_preferences;
CREATE TRIGGER set_updated_at_contact_preferences BEFORE UPDATE ON public.contact_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_preferences_updated_at ON public.contact_preferences;
CREATE TRIGGER update_contact_preferences_updated_at BEFORE UPDATE ON public.contact_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_contact_relatives ON public.contact_relatives;
CREATE TRIGGER set_updated_at_contact_relatives BEFORE UPDATE ON public.contact_relatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_relatives_updated_at ON public.contact_relatives;
CREATE TRIGGER update_contact_relatives_updated_at BEFORE UPDATE ON public.contact_relatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_decision_criteria ON public.decision_criteria;
CREATE TRIGGER set_updated_at_decision_criteria BEFORE UPDATE ON public.decision_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decision_criteria_updated_at ON public.decision_criteria;
CREATE TRIGGER update_decision_criteria_updated_at BEFORE UPDATE ON public.decision_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_disc_conversion_metrics ON public.disc_conversion_metrics;
CREATE TRIGGER set_updated_at_disc_conversion_metrics BEFORE UPDATE ON public.disc_conversion_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_disc_conversion_metrics_updated_at ON public.disc_conversion_metrics;
CREATE TRIGGER update_disc_conversion_metrics_updated_at BEFORE UPDATE ON public.disc_conversion_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_disc_profile_config ON public.disc_profile_config;
CREATE TRIGGER set_updated_at_disc_profile_config BEFORE UPDATE ON public.disc_profile_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_document_signatures_updated_at ON public.document_signatures;
CREATE TRIGGER trg_document_signatures_updated_at BEFORE UPDATE ON public.document_signatures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_document_templates_updated_at ON public.document_templates;
CREATE TRIGGER trg_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_handoff_requests_updated_at ON public.handoff_requests;
CREATE TRIGGER update_handoff_requests_updated_at BEFORE UPDATE ON public.handoff_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_health_alert_settings ON public.health_alert_settings;
CREATE TRIGGER set_updated_at_health_alert_settings BEFORE UPDATE ON public.health_alert_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_alert_settings_updated_at ON public.health_alert_settings;
CREATE TRIGGER update_health_alert_settings_updated_at BEFORE UPDATE ON public.health_alert_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_landing_pages_updated_at ON public.landing_pages;
CREATE TRIGGER set_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
