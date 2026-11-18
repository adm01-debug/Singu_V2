-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416232129
-- nome:   singu_indexes_batch_4

CREATE UNIQUE INDEX IF NOT EXISTS sequence_enrollments_sequence_id_contact_id_key ON public.sequence_enrollments USING btree (sequence_id, contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS sequence_steps_sequence_id_step_order_key ON public.sequence_steps USING btree (sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_sms_recipients_campaign ON public.sms_campaign_recipients USING btree (campaign_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS sms_campaign_recipients_campaign_id_contact_id_key ON public.sms_campaign_recipients USING btree (campaign_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_status ON public.sms_campaigns USING btree (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_user_phone ON public.sms_opt_outs USING btree (user_id, phone);
CREATE UNIQUE INDEX IF NOT EXISTS sms_opt_outs_user_id_phone_key ON public.sms_opt_outs USING btree (user_id, phone);
CREATE INDEX IF NOT EXISTS idx_sms_templates_user ON public.sms_templates USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_behavior_analysis_contact ON public.social_behavior_analysis USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_social_life_events_contact ON public.social_life_events USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_social_life_events_date ON public.social_life_events USING btree (event_date);
CREATE INDEX IF NOT EXISTS idx_social_life_events_type ON public.social_life_events USING btree (event_type);
CREATE INDEX IF NOT EXISTS idx_social_profiles_contact ON public.social_profiles USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_social_profiles_platform ON public.social_profiles USING btree (platform);
CREATE INDEX IF NOT EXISTS idx_social_scraping_schedule_next ON public.social_scraping_schedule USING btree (next_run_at) WHERE (enabled = true);
CREATE UNIQUE INDEX IF NOT EXISTS social_scraping_schedule_contact_id_platform_key ON public.social_scraping_schedule USING btree (contact_id, platform);
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_dismissed ON public.stakeholder_alerts USING btree (user_id, dismissed);
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_user_contact ON public.stakeholder_alerts USING btree (user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_active ON public.trigger_ab_tests USING btree (is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_disc ON public.trigger_ab_tests USING btree (disc_profile);
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_user_contact ON public.trigger_ab_tests USING btree (user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_bundles_scenario ON public.trigger_bundles USING btree (scenario);
CREATE INDEX IF NOT EXISTS idx_trigger_bundles_system ON public.trigger_bundles USING btree (is_system_bundle) WHERE (is_system_bundle = true);
CREATE INDEX IF NOT EXISTS idx_trigger_channel_effectiveness_trigger_channel ON public.trigger_channel_effectiveness USING btree (trigger_type, channel);
CREATE INDEX IF NOT EXISTS idx_trigger_channel_effectiveness_user_contact ON public.trigger_channel_effectiveness USING btree (user_id, contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key ON public.trigger_channel_effectiveness USING btree (user_id, contact_id, trigger_type, channel);
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_history_trigger ON public.trigger_intensity_history USING btree (trigger_type);
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_history_user_contact ON public.trigger_intensity_history USING btree (user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_contact_id ON public.trigger_usage_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_used_at ON public.trigger_usage_history USING btree (used_at DESC);
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_user_id ON public.trigger_usage_history USING btree (user_id);
-- Skip: user_roles_user_id_role_key já existe no destino
CREATE INDEX IF NOT EXISTS idx_vak_analysis_contact ON public.vak_analysis_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_vak_analysis_user ON public.vak_analysis_history USING btree (user_id);
-- Skip: webauthn_credentials_credential_id_key já existe
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_report_settings ON public.weekly_report_settings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user ON public.whatsapp_instances USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_instances_user_id_instance_name_key ON public.whatsapp_instances USING btree (user_id, instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance ON public.whatsapp_messages USING btree (instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_remote_jid ON public.whatsapp_messages USING btree (remote_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages USING btree ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_contact ON public.whatsapp_messages USING btree (user_id, contact_id);
