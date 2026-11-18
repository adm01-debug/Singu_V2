-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416230539
-- nome:   singu_indexes_batch_1

CREATE UNIQUE INDEX IF NOT EXISTS access_security_settings_user_id_key ON public.access_security_settings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_thread ON public.ai_chat_messages USING btree (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_user ON public.ai_chat_threads USING btree (user_id, archived, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON public.alerts USING btree (dismissed) WHERE (dismissed = false);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_recipients_campaign_id_contact_id_key ON public.campaign_recipients USING btree (campaign_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_contact ON public.churn_risk_scores USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_level ON public.churn_risk_scores USING btree (risk_level);
CREATE INDEX IF NOT EXISTS idx_churn_risk_user ON public.churn_risk_scores USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS client_values_user_id_contact_id_category_value_name_key ON public.client_values USING btree (user_id, contact_id, category, value_name);
CREATE INDEX IF NOT EXISTS idx_client_values_contact ON public.client_values USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_analyzed_at ON public.cognitive_bias_history USING btree (analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_contact_id ON public.cognitive_bias_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_user_id ON public.cognitive_bias_history USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS communication_preferences_user_id_contact_id_key ON public.communication_preferences USING btree (user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_communication_preferences_contact ON public.communication_preferences USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies USING btree (cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj_base ON public.companies USING btree (cnpj_base);
CREATE INDEX IF NOT EXISTS idx_companies_coords ON public.companies USING btree (lat, lng) WHERE ((lat IS NOT NULL) AND (lng IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_companies_grupo_economico ON public.companies USING btree (grupo_economico);
CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON public.companies USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies USING btree (status);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS compatibility_settings_user_id_key ON public.compatibility_settings USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS contact_cadence_user_id_contact_id_key ON public.contact_cadence USING btree (user_id, contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS contact_preferences_user_id_contact_id_key ON public.contact_preferences USING btree (user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relatives_contact_id ON public.contact_relatives USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relatives_user_id ON public.contact_relatives USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key ON public.contact_time_analysis USING btree (user_id, contact_id, day_of_week, hour_of_day);
CREATE INDEX IF NOT EXISTS idx_contact_time_analysis_contact ON public.contact_time_analysis USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS csat_surveys_public_token_key ON public.csat_surveys USING btree (public_token);
CREATE UNIQUE INDEX IF NOT EXISTS custom_field_values_custom_field_id_entity_id_key ON public.custom_field_values USING btree (custom_field_id, entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS custom_fields_user_id_entity_type_field_name_key ON public.custom_fields USING btree (user_id, entity_type, field_name);
CREATE INDEX IF NOT EXISTS idx_decision_criteria_contact ON public.decision_criteria USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_analyzed_at ON public.disc_analysis_history USING btree (analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_contact ON public.disc_analysis_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_user ON public.disc_analysis_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_disc_communication_logs_contact ON public.disc_communication_logs USING btree (contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS disc_conversion_metrics_user_id_disc_profile_period_start_p_key ON public.disc_conversion_metrics USING btree (user_id, disc_profile, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_disc_conversion_metrics_user ON public.disc_conversion_metrics USING btree (user_id);
