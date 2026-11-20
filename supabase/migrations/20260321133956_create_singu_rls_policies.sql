-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321133956
-- nome:   create_singu_rls_policies

DO $$ 
BEGIN
  -- trigger_usage_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trigger_usage_history' AND policyname = 'Users can view their own trigger usage history') THEN
    CREATE POLICY "Users can view their own trigger usage history" ON public.trigger_usage_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trigger_usage_history' AND policyname = 'Users can insert their own trigger usage history') THEN
    CREATE POLICY "Users can insert their own trigger usage history" ON public.trigger_usage_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trigger_usage_history' AND policyname = 'Users can update their own trigger usage history') THEN
    CREATE POLICY "Users can update their own trigger usage history" ON public.trigger_usage_history FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trigger_usage_history' AND policyname = 'Users can delete their own trigger usage history') THEN
    CREATE POLICY "Users can delete their own trigger usage history" ON public.trigger_usage_history FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- favorite_templates
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'favorite_templates' AND policyname = 'Users can view their own favorites') THEN
    CREATE POLICY "Users can view their own favorites" ON public.favorite_templates FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'favorite_templates' AND policyname = 'Users can insert their own favorites') THEN
    CREATE POLICY "Users can insert their own favorites" ON public.favorite_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'favorite_templates' AND policyname = 'Users can delete their own favorites') THEN
    CREATE POLICY "Users can delete their own favorites" ON public.favorite_templates FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- vak_analysis_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vak_analysis_history' AND policyname = 'Users can view their own VAK analysis') THEN
    CREATE POLICY "Users can view their own VAK analysis" ON public.vak_analysis_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vak_analysis_history' AND policyname = 'Users can insert their own VAK analysis') THEN
    CREATE POLICY "Users can insert their own VAK analysis" ON public.vak_analysis_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vak_analysis_history' AND policyname = 'Users can delete their own VAK analysis') THEN
    CREATE POLICY "Users can delete their own VAK analysis" ON public.vak_analysis_history FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vak_analysis_history' AND policyname = 'Users can update their own vak_analysis_history') THEN
    CREATE POLICY "Users can update their own vak_analysis_history" ON public.vak_analysis_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- metaprogram_analysis
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metaprogram_analysis' AND policyname = 'Users can view their own metaprogram analysis') THEN
    CREATE POLICY "Users can view their own metaprogram analysis" ON public.metaprogram_analysis FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metaprogram_analysis' AND policyname = 'Users can create their own metaprogram analysis') THEN
    CREATE POLICY "Users can create their own metaprogram analysis" ON public.metaprogram_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metaprogram_analysis' AND policyname = 'Users can delete their own metaprogram analysis') THEN
    CREATE POLICY "Users can delete their own metaprogram analysis" ON public.metaprogram_analysis FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metaprogram_analysis' AND policyname = 'Users can update their own metaprogram_analysis') THEN
    CREATE POLICY "Users can update their own metaprogram_analysis" ON public.metaprogram_analysis FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- compatibility_alerts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_alerts' AND policyname = 'Users can view their own compatibility alerts') THEN
    CREATE POLICY "Users can view their own compatibility alerts" ON public.compatibility_alerts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_alerts' AND policyname = 'Users can create their own compatibility alerts') THEN
    CREATE POLICY "Users can create their own compatibility alerts" ON public.compatibility_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_alerts' AND policyname = 'Users can update their own compatibility alerts') THEN
    CREATE POLICY "Users can update their own compatibility alerts" ON public.compatibility_alerts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_alerts' AND policyname = 'Users can delete their own compatibility alerts') THEN
    CREATE POLICY "Users can delete their own compatibility alerts" ON public.compatibility_alerts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- compatibility_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_settings' AND policyname = 'Users can view their own compatibility settings') THEN
    CREATE POLICY "Users can view their own compatibility settings" ON public.compatibility_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_settings' AND policyname = 'Users can create their own compatibility settings') THEN
    CREATE POLICY "Users can create their own compatibility settings" ON public.compatibility_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_settings' AND policyname = 'Users can update their own compatibility settings') THEN
    CREATE POLICY "Users can update their own compatibility settings" ON public.compatibility_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compatibility_settings' AND policyname = 'Users can delete their own compatibility_settings') THEN
    CREATE POLICY "Users can delete their own compatibility_settings" ON public.compatibility_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- emotional_states_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emotional_states_history' AND policyname = 'Users can view their own emotional states history') THEN
    CREATE POLICY "Users can view their own emotional states history" ON public.emotional_states_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emotional_states_history' AND policyname = 'Users can create their own emotional states history') THEN
    CREATE POLICY "Users can create their own emotional states history" ON public.emotional_states_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emotional_states_history' AND policyname = 'Users can delete their own emotional states history') THEN
    CREATE POLICY "Users can delete their own emotional states history" ON public.emotional_states_history FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emotional_states_history' AND policyname = 'Users can update their own emotional_states_history') THEN
    CREATE POLICY "Users can update their own emotional_states_history" ON public.emotional_states_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- client_values
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_values' AND policyname = 'Users can view their own client values') THEN
    CREATE POLICY "Users can view their own client values" ON public.client_values FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_values' AND policyname = 'Users can create their own client values') THEN
    CREATE POLICY "Users can create their own client values" ON public.client_values FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_values' AND policyname = 'Users can update their own client values') THEN
    CREATE POLICY "Users can update their own client values" ON public.client_values FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_values' AND policyname = 'Users can delete their own client values') THEN
    CREATE POLICY "Users can delete their own client values" ON public.client_values FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- hidden_objections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hidden_objections' AND policyname = 'Users can view their own hidden objections') THEN
    CREATE POLICY "Users can view their own hidden objections" ON public.hidden_objections FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hidden_objections' AND policyname = 'Users can create their own hidden objections') THEN
    CREATE POLICY "Users can create their own hidden objections" ON public.hidden_objections FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hidden_objections' AND policyname = 'Users can update their own hidden objections') THEN
    CREATE POLICY "Users can update their own hidden objections" ON public.hidden_objections FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hidden_objections' AND policyname = 'Users can delete their own hidden objections') THEN
    CREATE POLICY "Users can delete their own hidden objections" ON public.hidden_objections FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- eq_analysis_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eq_analysis_history' AND policyname = 'Users can view their own EQ analysis history') THEN
    CREATE POLICY "Users can view their own EQ analysis history" ON public.eq_analysis_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eq_analysis_history' AND policyname = 'Users can create their own EQ analysis history') THEN
    CREATE POLICY "Users can create their own EQ analysis history" ON public.eq_analysis_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eq_analysis_history' AND policyname = 'Users can delete their own EQ analysis history') THEN
    CREATE POLICY "Users can delete their own EQ analysis history" ON public.eq_analysis_history FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eq_analysis_history' AND policyname = 'Users can update their own eq_analysis_history') THEN
    CREATE POLICY "Users can update their own eq_analysis_history" ON public.eq_analysis_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- cognitive_bias_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cognitive_bias_history' AND policyname = 'Users can view their own cognitive bias history') THEN
    CREATE POLICY "Users can view their own cognitive bias history" ON public.cognitive_bias_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cognitive_bias_history' AND policyname = 'Users can create their own cognitive bias history') THEN
    CREATE POLICY "Users can create their own cognitive bias history" ON public.cognitive_bias_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cognitive_bias_history' AND policyname = 'Users can delete their own cognitive bias history') THEN
    CREATE POLICY "Users can delete their own cognitive bias history" ON public.cognitive_bias_history FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cognitive_bias_history' AND policyname = 'Users can update their own cognitive_bias_history') THEN
    CREATE POLICY "Users can update their own cognitive_bias_history" ON public.cognitive_bias_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- stakeholder_alerts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stakeholder_alerts' AND policyname = 'Users can view their own stakeholder alerts') THEN
    CREATE POLICY "Users can view their own stakeholder alerts" ON public.stakeholder_alerts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stakeholder_alerts' AND policyname = 'Users can create their own stakeholder alerts') THEN
    CREATE POLICY "Users can create their own stakeholder alerts" ON public.stakeholder_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stakeholder_alerts' AND policyname = 'Users can update their own stakeholder alerts') THEN
    CREATE POLICY "Users can update their own stakeholder alerts" ON public.stakeholder_alerts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stakeholder_alerts' AND policyname = 'Users can delete their own stakeholder alerts') THEN
    CREATE POLICY "Users can delete their own stakeholder alerts" ON public.stakeholder_alerts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- health_alert_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_alert_settings' AND policyname = 'Users can view their own health settings') THEN
    CREATE POLICY "Users can view their own health settings" ON public.health_alert_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_alert_settings' AND policyname = 'Users can create their own health settings') THEN
    CREATE POLICY "Users can create their own health settings" ON public.health_alert_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_alert_settings' AND policyname = 'Users can update their own health settings') THEN
    CREATE POLICY "Users can update their own health settings" ON public.health_alert_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'health_alert_settings' AND policyname = 'Users can delete their own health_alert_settings') THEN
    CREATE POLICY "Users can delete their own health_alert_settings" ON public.health_alert_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- weekly_report_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_report_settings' AND policyname = 'Users can view their own report settings') THEN
    CREATE POLICY "Users can view their own report settings" ON public.weekly_report_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_report_settings' AND policyname = 'Users can create their own report settings') THEN
    CREATE POLICY "Users can create their own report settings" ON public.weekly_report_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_report_settings' AND policyname = 'Users can update their own report settings') THEN
    CREATE POLICY "Users can update their own report settings" ON public.weekly_report_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_report_settings' AND policyname = 'Users can delete their own weekly_report_settings') THEN
    CREATE POLICY "Users can delete their own weekly_report_settings" ON public.weekly_report_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- contact_time_analysis
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_time_analysis' AND policyname = 'Users can view their own contact time analysis') THEN
    CREATE POLICY "Users can view their own contact time analysis" ON public.contact_time_analysis FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_time_analysis' AND policyname = 'Users can insert their own contact time analysis') THEN
    CREATE POLICY "Users can insert their own contact time analysis" ON public.contact_time_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_time_analysis' AND policyname = 'Users can update their own contact time analysis') THEN
    CREATE POLICY "Users can update their own contact time analysis" ON public.contact_time_analysis FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_time_analysis' AND policyname = 'Users can delete their own contact time analysis') THEN
    CREATE POLICY "Users can delete their own contact time analysis" ON public.contact_time_analysis FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- contact_cadence
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_cadence' AND policyname = 'Users can view their own contact cadence') THEN
    CREATE POLICY "Users can view their own contact cadence" ON public.contact_cadence FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_cadence' AND policyname = 'Users can create their own contact cadence') THEN
    CREATE POLICY "Users can create their own contact cadence" ON public.contact_cadence FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_cadence' AND policyname = 'Users can update their own contact cadence') THEN
    CREATE POLICY "Users can update their own contact cadence" ON public.contact_cadence FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_cadence' AND policyname = 'Users can delete their own contact cadence') THEN
    CREATE POLICY "Users can delete their own contact cadence" ON public.contact_cadence FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- contact_preferences
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_preferences' AND policyname = 'Users can view their own contact preferences') THEN
    CREATE POLICY "Users can view their own contact preferences" ON public.contact_preferences FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_preferences' AND policyname = 'Users can create their own contact preferences') THEN
    CREATE POLICY "Users can create their own contact preferences" ON public.contact_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_preferences' AND policyname = 'Users can update their own contact preferences') THEN
    CREATE POLICY "Users can update their own contact preferences" ON public.contact_preferences FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_preferences' AND policyname = 'Users can delete their own contact preferences') THEN
    CREATE POLICY "Users can delete their own contact preferences" ON public.contact_preferences FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- score_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'score_history' AND policyname = 'Users can view their own score history') THEN
    CREATE POLICY "Users can view their own score history" ON public.score_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'score_history' AND policyname = 'Users can insert their own score history') THEN
    CREATE POLICY "Users can insert their own score history" ON public.score_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'score_history' AND policyname = 'Users can delete their own score history') THEN
    CREATE POLICY "Users can delete their own score history" ON public.score_history FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'score_history' AND policyname = 'Users can update their own score_history') THEN
    CREATE POLICY "Users can update their own score_history" ON public.score_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- social tables (FOR ALL policies)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_profiles' AND policyname = 'Users can view their own social profiles') THEN
    CREATE POLICY "Users can view their own social profiles" ON public.social_profiles FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own social profiles" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own social profiles" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own social profiles" ON public.social_profiles FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_life_events' AND policyname = 'Users can view their own social life events') THEN
    CREATE POLICY "Users can view their own social life events" ON public.social_life_events FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own social life events" ON public.social_life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own social life events" ON public.social_life_events FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own social life events" ON public.social_life_events FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_behavior_analysis' AND policyname = 'Users can view their own social behavior analysis') THEN
    CREATE POLICY "Users can view their own social behavior analysis" ON public.social_behavior_analysis FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own social behavior analysis" ON public.social_behavior_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own social behavior analysis" ON public.social_behavior_analysis FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own social behavior analysis" ON public.social_behavior_analysis FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_scraping_schedule' AND policyname = 'Users can view their own scraping schedule') THEN
    CREATE POLICY "Users can view their own scraping schedule" ON public.social_scraping_schedule FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own scraping schedule" ON public.social_scraping_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own scraping schedule" ON public.social_scraping_schedule FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own scraping schedule" ON public.social_scraping_schedule FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- rfm_analysis & rfm_metrics
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rfm_analysis' AND policyname = 'Users can manage their own RFM analysis') THEN
    CREATE POLICY "Users can manage their own RFM analysis" ON public.rfm_analysis FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rfm_metrics' AND policyname = 'Users can view their RFM metrics') THEN
    CREATE POLICY "Users can view their RFM metrics" ON public.rfm_metrics FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- disc tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'disc_analysis_history' AND policyname = 'Users can view their own DISC analysis history') THEN
    CREATE POLICY "Users can view their own DISC analysis history" ON public.disc_analysis_history FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own DISC analysis" ON public.disc_analysis_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own DISC analysis" ON public.disc_analysis_history FOR DELETE USING (auth.uid() = user_id);
    CREATE POLICY "Users can update their own disc_analysis_history" ON public.disc_analysis_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'disc_conversion_metrics' AND policyname = 'Users can view their own DISC conversion metrics') THEN
    CREATE POLICY "Users can view their own DISC conversion metrics" ON public.disc_conversion_metrics FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can manage their own DISC conversion metrics" ON public.disc_conversion_metrics FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'disc_communication_logs' AND policyname = 'Users can view their own DISC communication logs') THEN
    CREATE POLICY "Users can view their own DISC communication logs" ON public.disc_communication_logs FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own DISC communication logs" ON public.disc_communication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own DISC communication logs" ON public.disc_communication_logs FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own disc_communication_logs" ON public.disc_communication_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- trigger tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trigger_ab_tests' AND policyname = 'Users can view their own AB tests') THEN
    CREATE POLICY "Users can view their own AB tests" ON public.trigger_ab_tests FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own AB tests" ON public.trigger_ab_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own AB tests" ON public.trigger_ab_tests FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own AB tests" ON public.trigger_ab_tests FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trigger_intensity_history' AND policyname = 'Users can view their own intensity history') THEN
    CREATE POLICY "Users can view their own intensity history" ON public.trigger_intensity_history FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own intensity history" ON public.trigger_intensity_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own intensity history" ON public.trigger_intensity_history FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own intensity history" ON public.trigger_intensity_history FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trigger_channel_effectiveness' AND policyname = 'Users can view their own channel effectiveness') THEN
    CREATE POLICY "Users can view their own channel effectiveness" ON public.trigger_channel_effectiveness FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own channel effectiveness" ON public.trigger_channel_effectiveness FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own channel effectiveness" ON public.trigger_channel_effectiveness FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own channel effectiveness" ON public.trigger_channel_effectiveness FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- contact_relatives
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_relatives' AND policyname = 'Users can view their own contact_relatives') THEN
    CREATE POLICY "Users can view their own contact_relatives" ON public.contact_relatives FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own contact_relatives" ON public.contact_relatives FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own contact_relatives" ON public.contact_relatives FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own contact_relatives" ON public.contact_relatives FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- whatsapp tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_messages' AND policyname = 'Users can manage their own whatsapp_messages') THEN
    CREATE POLICY "Users can manage their own whatsapp_messages" ON public.whatsapp_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_instances' AND policyname = 'Users can manage their own whatsapp_instances') THEN
    CREATE POLICY "Users can manage their own whatsapp_instances" ON public.whatsapp_instances FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_kpis' AND policyname = 'Users can manage their own whatsapp_kpis') THEN
    CREATE POLICY "Users can manage their own whatsapp_kpis" ON public.whatsapp_kpis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- lux_intelligence
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lux_intelligence' AND policyname = 'Users can view their own lux intelligence') THEN
    CREATE POLICY "Users can view their own lux intelligence" ON public.lux_intelligence FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own lux intelligence" ON public.lux_intelligence FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own lux intelligence" ON public.lux_intelligence FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own lux intelligence" ON public.lux_intelligence FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- automation_rules
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_rules' AND policyname = 'Users can view their own automation rules') THEN
    CREATE POLICY "Users can view their own automation rules" ON public.automation_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own automation rules" ON public.automation_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own automation rules" ON public.automation_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own automation rules" ON public.automation_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;

  -- automation_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'Users can view their own automation logs') THEN
    CREATE POLICY "Users can view their own automation logs" ON public.automation_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own automation logs" ON public.automation_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own automation logs" ON public.automation_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "Users can only update own automation logs" ON public.automation_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

END $$;
