DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='lux_webhook_config' AND p.polname='Admins can update lux_webhook_config') THEN
    ALTER POLICY "Admins can update lux_webhook_config" ON public.lux_webhook_config USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='lux_webhook_config' AND p.polname='Admins can view lux_webhook_config') THEN
    ALTER POLICY "Admins can view lux_webhook_config" ON public.lux_webhook_config USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='marketing_campaign_stats' AND p.polname='Users can insert their own marketing stats') THEN
    ALTER POLICY "Users can insert their own marketing stats" ON public.marketing_campaign_stats WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='marketing_campaign_stats' AND p.polname='Users can update their own marketing stats') THEN
    ALTER POLICY "Users can update their own marketing stats" ON public.marketing_campaign_stats USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='marketing_campaign_stats' AND p.polname='Users can view their own marketing stats') THEN
    ALTER POLICY "Users can view their own marketing stats" ON public.marketing_campaign_stats USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='marketing_roi_data' AND p.polname='Users can insert their own ROI data') THEN
    ALTER POLICY "Users can insert their own ROI data" ON public.marketing_roi_data WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='marketing_roi_data' AND p.polname='Users can view their own ROI data') THEN
    ALTER POLICY "Users can view their own ROI data" ON public.marketing_roi_data USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='mcp_tool_calls' AND p.polname='Admins read mcp_tool_calls') THEN
    ALTER POLICY "Admins read mcp_tool_calls" ON public.mcp_tool_calls USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='meeting_summaries' AND p.polname='Users can create own meeting summaries') THEN
    ALTER POLICY "Users can create own meeting summaries" ON public.meeting_summaries WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='meeting_summaries' AND p.polname='Users can delete own meeting summaries') THEN
    ALTER POLICY "Users can delete own meeting summaries" ON public.meeting_summaries USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='meeting_summaries' AND p.polname='Users can update own meeting summaries') THEN
    ALTER POLICY "Users can update own meeting summaries" ON public.meeting_summaries USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='meeting_summaries' AND p.polname='Users can view own meeting summaries') THEN
    ALTER POLICY "Users can view own meeting summaries" ON public.meeting_summaries USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='metaprogram_analysis' AND p.polname='Users can create their own metaprogram analysis') THEN
    ALTER POLICY "Users can create their own metaprogram analysis" ON public.metaprogram_analysis WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='metaprogram_analysis' AND p.polname='Users can delete their own metaprogram analysis') THEN
    ALTER POLICY "Users can delete their own metaprogram analysis" ON public.metaprogram_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='metaprogram_analysis' AND p.polname='Users can update their own metaprogram_analysis') THEN
    ALTER POLICY "Users can update their own metaprogram_analysis" ON public.metaprogram_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='metaprogram_analysis' AND p.polname='Users can view their own metaprogram analysis') THEN
    ALTER POLICY "Users can view their own metaprogram analysis" ON public.metaprogram_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='mql_classifications' AND p.polname='mqlcls_owner_all') THEN
    ALTER POLICY mqlcls_owner_all ON public.mql_classifications USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='mql_criteria' AND p.polname='mqlc_owner_all') THEN
    ALTER POLICY mqlc_owner_all ON public.mql_criteria USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='neuro_behavioral_history' AND p.polname='Users can insert their own contact''s neuro history') THEN
    ALTER POLICY "Users can insert their own contact's neuro history" ON public.neuro_behavioral_history WITH CHECK ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='neuro_behavioral_history' AND p.polname='Users can view their own contact''s neuro history') THEN
    ALTER POLICY "Users can view their own contact's neuro history" ON public.neuro_behavioral_history USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='neuro_pnl_sessions' AND p.polname='Owner or admin can insert neuro pnl sessions') THEN
    ALTER POLICY "Owner or admin can insert neuro pnl sessions" ON public.neuro_pnl_sessions WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='neuro_pnl_sessions' AND p.polname='Users can update neuro pnl sessions') THEN
    ALTER POLICY "Users can update neuro pnl sessions" ON public.neuro_pnl_sessions USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='neuro_pnl_sessions' AND p.polname='Users can view neuro pnl sessions') THEN
    ALTER POLICY "Users can view neuro pnl sessions" ON public.neuro_pnl_sessions USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='nlp_feedback' AND p.polname='Users can insert their own feedback') THEN
    ALTER POLICY "Users can insert their own feedback" ON public.nlp_feedback WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='nlp_feedback' AND p.polname='Users can view their own feedback') THEN
    ALTER POLICY "Users can view their own feedback" ON public.nlp_feedback USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='notification_logs' AND p.polname='Users can view their own notification logs') THEN
    ALTER POLICY "Users can view their own notification logs" ON public.notification_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='notification_preferences' AND p.polname='self read prefs') THEN
    ALTER POLICY "self read prefs" ON public.notification_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='notification_preferences' AND p.polname='self update prefs') THEN
    ALTER POLICY "self update prefs" ON public.notification_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='notification_preferences' AND p.polname='self upsert prefs') THEN
    ALTER POLICY "self upsert prefs" ON public.notification_preferences WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='nurturing_enrollments' AND p.polname='Users manage own nurturing enrollments') THEN
    ALTER POLICY "Users manage own nurturing enrollments" ON public.nurturing_enrollments USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='nurturing_executions' AND p.polname='ne_owner_all') THEN
    ALTER POLICY ne_owner_all ON public.nurturing_executions USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='nurturing_workflows' AND p.polname='Users manage own nurturing workflows') THEN
    ALTER POLICY "Users manage own nurturing workflows" ON public.nurturing_workflows USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='objection_example_feedback' AND p.polname='Users delete own objection feedback') THEN
    ALTER POLICY "Users delete own objection feedback" ON public.objection_example_feedback USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='objection_example_feedback' AND p.polname='Users insert own objection feedback') THEN
    ALTER POLICY "Users insert own objection feedback" ON public.objection_example_feedback WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='objection_example_feedback' AND p.polname='Users update own objection feedback') THEN
    ALTER POLICY "Users update own objection feedback" ON public.objection_example_feedback USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='objection_example_feedback' AND p.polname='Users view own objection feedback') THEN
    ALTER POLICY "Users view own objection feedback" ON public.objection_example_feedback USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='offer_suggestions' AND p.polname='Users can delete their own offer suggestions') THEN
    ALTER POLICY "Users can delete their own offer suggestions" ON public.offer_suggestions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='offer_suggestions' AND p.polname='Users can insert their own offer suggestions') THEN
    ALTER POLICY "Users can insert their own offer suggestions" ON public.offer_suggestions WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='offer_suggestions' AND p.polname='Users can update their own offer suggestions') THEN
    ALTER POLICY "Users can update their own offer suggestions" ON public.offer_suggestions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='offer_suggestions' AND p.polname='Users can view their own offer suggestions') THEN
    ALTER POLICY "Users can view their own offer suggestions" ON public.offer_suggestions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='password_reset_requests' AND p.polname='Admins manage reset requests') THEN
    ALTER POLICY "Admins manage reset requests" ON public.password_reset_requests USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='password_reset_requests' AND p.polname='Users read own reset requests') THEN
    ALTER POLICY "Users read own reset requests" ON public.password_reset_requests USING ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='people_intelligence_events' AND p.polname='pie_delete_own') THEN
    ALTER POLICY pie_delete_own ON public.people_intelligence_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='people_intelligence_events' AND p.polname='pie_insert_own') THEN
    ALTER POLICY pie_insert_own ON public.people_intelligence_events WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='people_intelligence_events' AND p.polname='pie_select_own') THEN
    ALTER POLICY pie_select_own ON public.people_intelligence_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='permissions' AND p.polname='Admins manage permissions') THEN
    ALTER POLICY "Admins manage permissions" ON public.permissions USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='phone_validations' AND p.polname='pv_delete_own') THEN
    ALTER POLICY pv_delete_own ON public.phone_validations USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='phone_validations' AND p.polname='pv_insert_own') THEN
    ALTER POLICY pv_insert_own ON public.phone_validations WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='phone_validations' AND p.polname='pv_select_own') THEN
    ALTER POLICY pv_select_own ON public.phone_validations USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='phone_validations' AND p.polname='pv_update_own') THEN
    ALTER POLICY pv_update_own ON public.phone_validations USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='playbook_usage_log' AND p.polname='playbook_usage_insert_own') THEN
    ALTER POLICY playbook_usage_insert_own ON public.playbook_usage_log WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='playbook_usage_log' AND p.polname='playbook_usage_select_own') THEN
    ALTER POLICY playbook_usage_select_own ON public.playbook_usage_log USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='profiles' AND p.polname='Users can insert their own profile') THEN
    ALTER POLICY "Users can insert their own profile" ON public.profiles WITH CHECK (((select auth.uid()) = id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='profiles' AND p.polname='Users can update their own profile') THEN
    ALTER POLICY "Users can update their own profile" ON public.profiles USING (((select auth.uid()) = id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='profiles' AND p.polname='Users can view their own profile') THEN
    ALTER POLICY "Users can view their own profile" ON public.profiles USING (((select auth.uid()) = id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='proximo_passo_feedback' AND p.polname='Users can delete their own passo feedbacks') THEN
    ALTER POLICY "Users can delete their own passo feedbacks" ON public.proximo_passo_feedback USING ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='proximo_passo_feedback' AND p.polname='Users can insert their own passo feedbacks') THEN
    ALTER POLICY "Users can insert their own passo feedbacks" ON public.proximo_passo_feedback WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='proximo_passo_feedback' AND p.polname='Users can view their own passo feedbacks') THEN
    ALTER POLICY "Users can view their own passo feedbacks" ON public.proximo_passo_feedback USING ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='psychographic_audit_log' AND p.polname='Owner or admin can view psychographic audit logs') THEN
    ALTER POLICY "Owner or admin can view psychographic audit logs" ON public.psychographic_audit_log USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = psychographic_audit_log.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='purchase_history' AND p.polname='Users can delete their own purchase history') THEN
    ALTER POLICY "Users can delete their own purchase history" ON public.purchase_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='purchase_history' AND p.polname='Users can insert their own purchase history') THEN
    ALTER POLICY "Users can insert their own purchase history" ON public.purchase_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='purchase_history' AND p.polname='Users can update their own purchase history') THEN
    ALTER POLICY "Users can update their own purchase history" ON public.purchase_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='purchase_history' AND p.polname='Users can view their own purchase history') THEN
    ALTER POLICY "Users can view their own purchase history" ON public.purchase_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='push_subscriptions' AND p.polname='Users can create their own subscriptions') THEN
    ALTER POLICY "Users can create their own subscriptions" ON public.push_subscriptions WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='push_subscriptions' AND p.polname='Users can delete their own subscriptions') THEN
    ALTER POLICY "Users can delete their own subscriptions" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='push_subscriptions' AND p.polname='Users can update their own subscriptions') THEN
    ALTER POLICY "Users can update their own subscriptions" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='push_subscriptions' AND p.polname='Users can view own push subscriptions') THEN
    ALTER POLICY "Users can view own push subscriptions" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='push_subscriptions' AND p.polname='Users can view own subscriptions limited') THEN
    ALTER POLICY "Users can view own subscriptions limited" ON public.push_subscriptions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='query_telemetry' AND p.polname='Users can delete their own telemetry') THEN
    ALTER POLICY "Users can delete their own telemetry" ON public.query_telemetry USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='query_telemetry' AND p.polname='Users can insert their own telemetry') THEN
    ALTER POLICY "Users can insert their own telemetry" ON public.query_telemetry WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='query_telemetry' AND p.polname='Users can view their own telemetry') THEN
    ALTER POLICY "Users can view their own telemetry" ON public.query_telemetry USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='redistribution_log' AND p.polname='Admins can view all redistribution logs') THEN
    ALTER POLICY "Admins can view all redistribution logs" ON public.redistribution_log USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='redistribution_log' AND p.polname='Users can insert their own redistribution logs') THEN
    ALTER POLICY "Users can insert their own redistribution logs" ON public.redistribution_log WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='redistribution_log' AND p.polname='Users can view their own redistribution logs') THEN
    ALTER POLICY "Users can view their own redistribution logs" ON public.redistribution_log USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='reframing_analysis' AND p.polname='Users can create their own reframing analysis') THEN
    ALTER POLICY "Users can create their own reframing analysis" ON public.reframing_analysis WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='reframing_analysis' AND p.polname='Users can update their own reframing analysis') THEN
    ALTER POLICY "Users can update their own reframing analysis" ON public.reframing_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='reframing_analysis' AND p.polname='Users can view their own reframing analysis') THEN
    ALTER POLICY "Users can view their own reframing analysis" ON public.reframing_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='reframing_analysis_audit' AND p.polname='Users can view their own reframing audit') THEN
    ALTER POLICY "Users can view their own reframing audit" ON public.reframing_analysis_audit USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_alerts' AND p.polname='Users delete own alerts') THEN
    ALTER POLICY "Users delete own alerts" ON public.revops_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_alerts' AND p.polname='Users insert own alerts') THEN
    ALTER POLICY "Users insert own alerts" ON public.revops_alerts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_alerts' AND p.polname='Users update own alerts') THEN
    ALTER POLICY "Users update own alerts" ON public.revops_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_alerts' AND p.polname='Users view own alerts') THEN
    ALTER POLICY "Users view own alerts" ON public.revops_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_benchmarks' AND p.polname='Users delete own benchmarks') THEN
    ALTER POLICY "Users delete own benchmarks" ON public.revops_benchmarks USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_benchmarks' AND p.polname='Users insert own benchmarks') THEN
    ALTER POLICY "Users insert own benchmarks" ON public.revops_benchmarks WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_benchmarks' AND p.polname='Users update own benchmarks') THEN
    ALTER POLICY "Users update own benchmarks" ON public.revops_benchmarks USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_benchmarks' AND p.polname='Users view own benchmarks') THEN
    ALTER POLICY "Users view own benchmarks" ON public.revops_benchmarks USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_snapshots' AND p.polname='Users delete own snapshots') THEN
    ALTER POLICY "Users delete own snapshots" ON public.revops_snapshots USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_snapshots' AND p.polname='Users insert own snapshots') THEN
    ALTER POLICY "Users insert own snapshots" ON public.revops_snapshots WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='revops_snapshots' AND p.polname='Users view own snapshots') THEN
    ALTER POLICY "Users view own snapshots" ON public.revops_snapshots USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='rfm_analysis' AND p.polname='Users can manage their own RFM analysis') THEN
    ALTER POLICY "Users can manage their own RFM analysis" ON public.rfm_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
