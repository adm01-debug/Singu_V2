ALTER POLICY "Admins can update lux_webhook_config" ON public.lux_webhook_config USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view lux_webhook_config" ON public.lux_webhook_config USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can insert their own marketing stats" ON public.marketing_campaign_stats WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own marketing stats" ON public.marketing_campaign_stats USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own marketing stats" ON public.marketing_campaign_stats USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own ROI data" ON public.marketing_roi_data WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own ROI data" ON public.marketing_roi_data USING (((select auth.uid()) = user_id));
ALTER POLICY "Admins read mcp_tool_calls" ON public.mcp_tool_calls USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create own meeting summaries" ON public.meeting_summaries WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete own meeting summaries" ON public.meeting_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update own meeting summaries" ON public.meeting_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view own meeting summaries" ON public.meeting_summaries USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own metaprogram analysis" ON public.metaprogram_analysis WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own metaprogram analysis" ON public.metaprogram_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own metaprogram_analysis" ON public.metaprogram_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own metaprogram analysis" ON public.metaprogram_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY mqlcls_owner_all ON public.mql_classifications USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY mqlc_owner_all ON public.mql_criteria USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own contact's neuro history" ON public.neuro_behavioral_history WITH CHECK ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = (select auth.uid()))))));
ALTER POLICY "Users can view their own contact's neuro history" ON public.neuro_behavioral_history USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = (select auth.uid()))))));
ALTER POLICY "Owner or admin can insert neuro pnl sessions" ON public.neuro_pnl_sessions WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Users can update neuro pnl sessions" ON public.neuro_pnl_sessions USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))));
ALTER POLICY "Users can view neuro pnl sessions" ON public.neuro_pnl_sessions USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))));
ALTER POLICY "Users can insert their own feedback" ON public.nlp_feedback WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own feedback" ON public.nlp_feedback USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own notification logs" ON public.notification_logs USING (((select auth.uid()) = user_id));
ALTER POLICY "self read prefs" ON public.notification_preferences USING (((select auth.uid()) = user_id));
ALTER POLICY "self update prefs" ON public.notification_preferences USING (((select auth.uid()) = user_id));
ALTER POLICY "self upsert prefs" ON public.notification_preferences WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own nurturing enrollments" ON public.nurturing_enrollments USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY ne_owner_all ON public.nurturing_executions USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own nurturing workflows" ON public.nurturing_workflows USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users delete own objection feedback" ON public.objection_example_feedback USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own objection feedback" ON public.objection_example_feedback WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users update own objection feedback" ON public.objection_example_feedback USING (((select auth.uid()) = user_id));
ALTER POLICY "Users view own objection feedback" ON public.objection_example_feedback USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own offer suggestions" ON public.offer_suggestions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own offer suggestions" ON public.offer_suggestions WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own offer suggestions" ON public.offer_suggestions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own offer suggestions" ON public.offer_suggestions USING (((select auth.uid()) = user_id));
ALTER POLICY "Admins manage reset requests" ON public.password_reset_requests USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users read own reset requests" ON public.password_reset_requests USING ((user_id = (select auth.uid())));
ALTER POLICY pie_delete_own ON public.people_intelligence_events USING (((select auth.uid()) = user_id));
ALTER POLICY pie_insert_own ON public.people_intelligence_events WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY pie_select_own ON public.people_intelligence_events USING (((select auth.uid()) = user_id));
ALTER POLICY "Admins manage permissions" ON public.permissions USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY pv_delete_own ON public.phone_validations USING (((select auth.uid()) = user_id));
ALTER POLICY pv_insert_own ON public.phone_validations WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY pv_select_own ON public.phone_validations USING (((select auth.uid()) = user_id));
ALTER POLICY pv_update_own ON public.phone_validations USING (((select auth.uid()) = user_id));
ALTER POLICY playbook_usage_insert_own ON public.playbook_usage_log WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY playbook_usage_select_own ON public.playbook_usage_log USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own profile" ON public.profiles WITH CHECK (((select auth.uid()) = id));
ALTER POLICY "Users can update their own profile" ON public.profiles USING (((select auth.uid()) = id));
ALTER POLICY "Users can view their own profile" ON public.profiles USING (((select auth.uid()) = id));
ALTER POLICY "Users can delete their own passo feedbacks" ON public.proximo_passo_feedback USING ((user_id = (select auth.uid())));
ALTER POLICY "Users can insert their own passo feedbacks" ON public.proximo_passo_feedback WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "Users can view their own passo feedbacks" ON public.proximo_passo_feedback USING ((user_id = (select auth.uid())));
ALTER POLICY "Owner or admin can view psychographic audit logs" ON public.psychographic_audit_log USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = psychographic_audit_log.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Users can delete their own purchase history" ON public.purchase_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own purchase history" ON public.purchase_history WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own purchase history" ON public.purchase_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own purchase history" ON public.purchase_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own subscriptions" ON public.push_subscriptions WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own subscriptions" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own subscriptions" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view own push subscriptions" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view own subscriptions limited" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own telemetry" ON public.query_telemetry USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own telemetry" ON public.query_telemetry WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own telemetry" ON public.query_telemetry USING (((select auth.uid()) = user_id));
ALTER POLICY "Admins can view all redistribution logs" ON public.redistribution_log USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can insert their own redistribution logs" ON public.redistribution_log WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own redistribution logs" ON public.redistribution_log USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own reframing analysis" ON public.reframing_analysis WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own reframing analysis" ON public.reframing_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own reframing analysis" ON public.reframing_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own reframing audit" ON public.reframing_analysis_audit USING (((select auth.uid()) = user_id));
ALTER POLICY "Users delete own alerts" ON public.revops_alerts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own alerts" ON public.revops_alerts WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users update own alerts" ON public.revops_alerts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users view own alerts" ON public.revops_alerts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users delete own benchmarks" ON public.revops_benchmarks USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own benchmarks" ON public.revops_benchmarks WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users update own benchmarks" ON public.revops_benchmarks USING (((select auth.uid()) = user_id));
ALTER POLICY "Users view own benchmarks" ON public.revops_benchmarks USING (((select auth.uid()) = user_id));
ALTER POLICY "Users delete own snapshots" ON public.revops_snapshots USING (((select auth.uid()) = user_id));
ALTER POLICY "Users insert own snapshots" ON public.revops_snapshots WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users view own snapshots" ON public.revops_snapshots USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can manage their own RFM analysis" ON public.rfm_analysis USING (((select auth.uid()) = user_id));
