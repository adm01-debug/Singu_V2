ALTER POLICY "Users can update their own disc_analysis_history" ON public.disc_analysis_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own DISC analysis history" ON public.disc_analysis_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own DISC audit" ON public.disc_analysis_history_audit USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own DISC communication logs" ON public.disc_communication_logs WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own disc_communication_logs" ON public.disc_communication_logs USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own DISC communication logs" ON public.disc_communication_logs USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own DISC communication logs" ON public.disc_communication_logs USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own DISC conversion metrics" ON public.disc_conversion_metrics USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own DISC conversion metrics" ON public.disc_conversion_metrics WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own DISC conversion metrics" ON public.disc_conversion_metrics USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own DISC conversion metrics" ON public.disc_conversion_metrics USING (((select auth.uid()) = user_id));
ALTER POLICY "Users delete own signatures" ON public.document_signatures USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own signatures" ON public.document_signatures WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users update own signatures" ON public.document_signatures USING (((select auth.uid()) = user_id));
ALTER POLICY "Users view own signatures" ON public.document_signatures USING (((select auth.uid()) = user_id));
ALTER POLICY "Users delete own templates" ON public.document_templates USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own templates" ON public.document_templates WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users update own templates" ON public.document_templates USING (((select auth.uid()) = user_id));
ALTER POLICY "Users view own templates" ON public.document_templates USING (((select auth.uid()) = user_id));
ALTER POLICY "Owner views document_views via signature" ON public.document_views USING ((EXISTS ( SELECT 1
   FROM document_signatures s
  WHERE ((s.id = document_views.signature_id) AND (s.user_id = (select auth.uid()))))));
ALTER POLICY "Users manage own documents" ON public.documents USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own campaigns" ON public.email_campaigns USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY efr_delete_own ON public.email_finder_results USING (((select auth.uid()) = user_id));
ALTER POLICY efr_insert_own ON public.email_finder_results WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY efr_select_own ON public.email_finder_results USING (((select auth.uid()) = user_id));
ALTER POLICY efr_update_own ON public.email_finder_results USING (((select auth.uid()) = user_id));
ALTER POLICY "Users delete own email thread summaries" ON public.email_thread_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own email thread summaries" ON public.email_thread_summaries WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users update own email thread summaries" ON public.email_thread_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY "Users view own email thread summaries" ON public.email_thread_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY ev_delete_own ON public.email_verifications USING (((select auth.uid()) = user_id));
ALTER POLICY ev_insert_own ON public.email_verifications WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY ev_select_own ON public.email_verifications USING (((select auth.uid()) = user_id));
ALTER POLICY ev_update_own ON public.email_verifications USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own emotional anchors" ON public.emotional_anchors WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own emotional anchors" ON public.emotional_anchors USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own emotional anchors" ON public.emotional_anchors USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own emotional anchors" ON public.emotional_anchors USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own emotional states history" ON public.emotional_states_history WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own emotional states history" ON public.emotional_states_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own emotional_states_history" ON public.emotional_states_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own emotional states history" ON public.emotional_states_history USING (((select auth.uid()) = user_id));
ALTER POLICY "auth users insert entity_relationships" ON public.entity_relationships WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "creator or admin deletes entity_relationships" ON public.entity_relationships USING (((created_by = (select auth.uid())) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "creator or admin updates entity_relationships" ON public.entity_relationships USING (((created_by = (select auth.uid())) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((created_by = (select auth.uid())) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Users can create their own EQ analysis history" ON public.eq_analysis_history WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own EQ analysis history" ON public.eq_analysis_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own eq_analysis_history" ON public.eq_analysis_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own EQ analysis history" ON public.eq_analysis_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Admins can view error logs" ON public.error_logs USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Authenticated users can insert error logs" ON public.error_logs WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Users can delete their own favorites" ON public.favorite_templates USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own favorites" ON public.favorite_templates WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own favorites" ON public.favorite_templates USING (((select auth.uid()) = user_id));
ALTER POLICY "Admins can delete feature flags" ON public.feature_flags USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can insert feature flags" ON public.feature_flags WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update feature flags" ON public.feature_flags USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users delete own f360 summaries" ON public.ficha360_conversation_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own f360 summaries" ON public.ficha360_conversation_summaries WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users see own f360 summaries" ON public.ficha360_conversation_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own follow-up approvals" ON public.follow_up_approvals WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own follow-up approvals" ON public.follow_up_approvals USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can manage their follow-up approvals" ON public.follow_up_approvals USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own follow-up approvals" ON public.follow_up_approvals USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own follow-up approvals" ON public.follow_up_approvals USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can manage their own follow-up approvals" ON public.follow_up_approvals_v2 USING (((select auth.uid()) = user_id));
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polrelid = to_regclass('public.follow_up_approvals_v2')
      AND polname = 'Users can manage their own follow-up approvals v2'
  )
  THEN
    ALTER POLICY "Users can manage their own follow-up approvals v2"
      ON public.follow_up_approvals_v2
      USING (((select auth.uid()) = user_id));
  END IF;
END;
$migration$;
ALTER POLICY "own forecast_cat_history insert" ON public.forecast_categories_history WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_cat_history select" ON public.forecast_categories_history USING (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_periods delete" ON public.forecast_periods USING (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_periods insert" ON public.forecast_periods WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_periods select" ON public.forecast_periods USING (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_periods update" ON public.forecast_periods USING (((select auth.uid()) = user_id));
ALTER POLICY "own quota_settings insert" ON public.forecast_quota_settings WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "own quota_settings select" ON public.forecast_quota_settings USING (((select auth.uid()) = user_id));
ALTER POLICY "own quota_settings update" ON public.forecast_quota_settings USING (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_snapshots delete" ON public.forecast_snapshots USING (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_snapshots insert" ON public.forecast_snapshots WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "own forecast_snapshots select" ON public.forecast_snapshots USING (((select auth.uid()) = user_id));
ALTER POLICY fs_owner_all ON public.form_submissions USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY forms_owner_all ON public.forms USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own geo countries" ON public.geo_allowed_countries USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "Admins can view all handoff requests" ON public.handoff_requests USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can delete their own handoff requests" ON public.handoff_requests USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own handoff requests" ON public.handoff_requests WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own handoff requests" ON public.handoff_requests USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own handoff requests" ON public.handoff_requests USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own health settings" ON public.health_alert_settings WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own health_alert_settings" ON public.health_alert_settings USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own health settings" ON public.health_alert_settings USING (((select auth.uid()) = user_id));
