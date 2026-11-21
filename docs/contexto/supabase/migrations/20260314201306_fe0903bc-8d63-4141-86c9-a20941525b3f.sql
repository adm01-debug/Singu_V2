-- Add missing UPDATE policies
DROP POLICY IF EXISTS "Users can update their own disc_analysis_history" ON public.disc_analysis_history

-- [singu-idem]
CREATE POLICY "Users can update their own disc_analysis_history"
ON public.disc_analysis_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own cognitive_bias_history" ON public.cognitive_bias_history

-- [singu-idem]
CREATE POLICY "Users can update their own cognitive_bias_history"
ON public.cognitive_bias_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own emotional_states_history" ON public.emotional_states_history

-- [singu-idem]
CREATE POLICY "Users can update their own emotional_states_history"
ON public.emotional_states_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own eq_analysis_history" ON public.eq_analysis_history

-- [singu-idem]
CREATE POLICY "Users can update their own eq_analysis_history"
ON public.eq_analysis_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own vak_analysis_history" ON public.vak_analysis_history

-- [singu-idem]
CREATE POLICY "Users can update their own vak_analysis_history"
ON public.vak_analysis_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own score_history" ON public.score_history

-- [singu-idem]
CREATE POLICY "Users can update their own score_history"
ON public.score_history FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own metaprogram_analysis" ON public.metaprogram_analysis

-- [singu-idem]
CREATE POLICY "Users can update their own metaprogram_analysis"
ON public.metaprogram_analysis FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

-- Add missing DELETE policies
DROP POLICY IF EXISTS "Users can delete their own disc_communication_logs" ON public.disc_communication_logs

-- [singu-idem]
CREATE POLICY "Users can delete their own disc_communication_logs"
ON public.disc_communication_logs FOR DELETE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own health_alert_settings" ON public.health_alert_settings

-- [singu-idem]
CREATE POLICY "Users can delete their own health_alert_settings"
ON public.health_alert_settings FOR DELETE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own compatibility_settings" ON public.compatibility_settings

-- [singu-idem]
CREATE POLICY "Users can delete their own compatibility_settings"
ON public.compatibility_settings FOR DELETE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own weekly_report_settings" ON public.weekly_report_settings

-- [singu-idem]
CREATE POLICY "Users can delete their own weekly_report_settings"
ON public.weekly_report_settings FOR DELETE TO authenticated
USING (auth.uid() = user_id)

-- Add missing UPDATE and DELETE policies for activities
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities

-- [singu-idem]
CREATE POLICY "Users can update their own activities"
ON public.activities FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities

-- [singu-idem]
CREATE POLICY "Users can delete their own activities"
ON public.activities FOR DELETE TO authenticated
USING (auth.uid() = user_id)

-- Add missing UPDATE and DELETE policies for weekly_reports
DROP POLICY IF EXISTS "Users can update their own weekly_reports" ON public.weekly_reports

-- [singu-idem]
CREATE POLICY "Users can update their own weekly_reports"
ON public.weekly_reports FOR UPDATE TO authenticated
USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own weekly_reports" ON public.weekly_reports

-- [singu-idem]
CREATE POLICY "Users can delete their own weekly_reports"
ON public.weekly_reports FOR DELETE TO authenticated
USING (auth.uid() = user_id)
