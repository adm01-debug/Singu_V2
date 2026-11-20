DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='health_alert_settings' AND p.polname='Users can view their own health settings') THEN
    ALTER POLICY "Users can view their own health settings" ON public.health_alert_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='health_alerts' AND p.polname='Users can create their own health alerts') THEN
    ALTER POLICY "Users can create their own health alerts" ON public.health_alerts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='health_alerts' AND p.polname='Users can delete their own health alerts') THEN
    ALTER POLICY "Users can delete their own health alerts" ON public.health_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='health_alerts' AND p.polname='Users can update their own health alerts') THEN
    ALTER POLICY "Users can update their own health alerts" ON public.health_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='health_alerts' AND p.polname='Users can view their own health alerts') THEN
    ALTER POLICY "Users can view their own health alerts" ON public.health_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='hidden_objections' AND p.polname='Users can create their own hidden objections') THEN
    ALTER POLICY "Users can create their own hidden objections" ON public.hidden_objections WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='hidden_objections' AND p.polname='Users can delete their own hidden objections') THEN
    ALTER POLICY "Users can delete their own hidden objections" ON public.hidden_objections USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='hidden_objections' AND p.polname='Users can update their own hidden objections') THEN
    ALTER POLICY "Users can update their own hidden objections" ON public.hidden_objections USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='hidden_objections' AND p.polname='Users can view their own hidden objections') THEN
    ALTER POLICY "Users can view their own hidden objections" ON public.hidden_objections USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='incoming_webhook_dlq' AND p.polname='Admins manage DLQ') THEN
    ALTER POLICY "Admins manage DLQ" ON public.incoming_webhook_dlq USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='incoming_webhook_logs' AND p.polname='admins read incoming_webhook_logs') THEN
    ALTER POLICY "admins read incoming_webhook_logs" ON public.incoming_webhook_logs USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='incoming_webhooks' AND p.polname='admins manage incoming_webhooks') THEN
    ALTER POLICY "admins manage incoming_webhooks" ON public.incoming_webhooks USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='insights' AND p.polname='Users can delete their own insights') THEN
    ALTER POLICY "Users can delete their own insights" ON public.insights USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='insights' AND p.polname='Users can insert their own insights') THEN
    ALTER POLICY "Users can insert their own insights" ON public.insights WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='insights' AND p.polname='Users can update their own insights') THEN
    ALTER POLICY "Users can update their own insights" ON public.insights USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='insights' AND p.polname='Users can view their own insights') THEN
    ALTER POLICY "Users can view their own insights" ON public.insights USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_scores' AND p.polname='Users delete own intent scores') THEN
    ALTER POLICY "Users delete own intent scores" ON public.intent_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_scores' AND p.polname='Users insert own intent scores') THEN
    ALTER POLICY "Users insert own intent scores" ON public.intent_scores WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_scores' AND p.polname='Users update own intent scores') THEN
    ALTER POLICY "Users update own intent scores" ON public.intent_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_scores' AND p.polname='Users view own intent scores') THEN
    ALTER POLICY "Users view own intent scores" ON public.intent_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_signals' AND p.polname='Users delete own intent signals') THEN
    ALTER POLICY "Users delete own intent signals" ON public.intent_signals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_signals' AND p.polname='Users insert own intent signals') THEN
    ALTER POLICY "Users insert own intent signals" ON public.intent_signals WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_signals' AND p.polname='Users update own intent signals') THEN
    ALTER POLICY "Users update own intent signals" ON public.intent_signals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_signals' AND p.polname='Users view own intent signals') THEN
    ALTER POLICY "Users view own intent signals" ON public.intent_signals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_tracking_pixels' AND p.polname='Users delete own pixels') THEN
    ALTER POLICY "Users delete own pixels" ON public.intent_tracking_pixels USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_tracking_pixels' AND p.polname='Users insert own pixels') THEN
    ALTER POLICY "Users insert own pixels" ON public.intent_tracking_pixels WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_tracking_pixels' AND p.polname='Users update own pixels') THEN
    ALTER POLICY "Users update own pixels" ON public.intent_tracking_pixels USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='intent_tracking_pixels' AND p.polname='Users view own pixels') THEN
    ALTER POLICY "Users view own pixels" ON public.intent_tracking_pixels USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interaction_summaries' AND p.polname='Users can manage summaries of their entities') THEN
    ALTER POLICY "Users can manage summaries of their entities" ON public.interaction_summaries USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interaction_summaries' AND p.polname='Users can view summaries of their entities') THEN
    ALTER POLICY "Users can view summaries of their entities" ON public.interaction_summaries USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interactions' AND p.polname='Users can access their own interactions') THEN
    ALTER POLICY "Users can access their own interactions" ON public.interactions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interactions' AND p.polname='Users can delete their own interactions') THEN
    ALTER POLICY "Users can delete their own interactions" ON public.interactions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interactions' AND p.polname='Users can insert their own interactions') THEN
    ALTER POLICY "Users can insert their own interactions" ON public.interactions WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interactions' AND p.polname='Users can update their own interactions') THEN
    ALTER POLICY "Users can update their own interactions" ON public.interactions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interactions' AND p.polname='Users can view their own interactions') THEN
    ALTER POLICY "Users can view their own interactions" ON public.interactions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='interactions_audit' AND p.polname='Users can view their own interactions audit') THEN
    ALTER POLICY "Users can view their own interactions audit" ON public.interactions_audit USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='ip_whitelist' AND p.polname='Users manage own IPs') THEN
    ALTER POLICY "Users manage own IPs" ON public.ip_whitelist USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='knowledge_base_articles' AND p.polname='Users manage own kb articles') THEN
    ALTER POLICY "Users manage own kb articles" ON public.knowledge_base_articles USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='landing_page_submissions' AND p.polname='owners read submissions') THEN
    ALTER POLICY "owners read submissions" ON public.landing_page_submissions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='landing_pages' AND p.polname='owners manage landing pages') THEN
    ALTER POLICY "owners manage landing pages" ON public.landing_pages USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_assignments' AND p.polname='Admins can view all assignments') THEN
    ALTER POLICY "Admins can view all assignments" ON public.lead_assignments USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_assignments' AND p.polname='Users can delete their own assignments') THEN
    ALTER POLICY "Users can delete their own assignments" ON public.lead_assignments USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_assignments' AND p.polname='Users can insert their own assignments') THEN
    ALTER POLICY "Users can insert their own assignments" ON public.lead_assignments WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_assignments' AND p.polname='Users can update their own assignments') THEN
    ALTER POLICY "Users can update their own assignments" ON public.lead_assignments USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_assignments' AND p.polname='Users can view their own assignments') THEN
    ALTER POLICY "Users can view their own assignments" ON public.lead_assignments USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_magnet_downloads' AND p.polname='lmd_owner_read') THEN
    ALTER POLICY lmd_owner_read ON public.lead_magnet_downloads USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_magnets' AND p.polname='lm_owner_all') THEN
    ALTER POLICY lm_owner_all ON public.lead_magnets USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_routing_rules' AND p.polname='Admins can view all routing rules') THEN
    ALTER POLICY "Admins can view all routing rules" ON public.lead_routing_rules USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_routing_rules' AND p.polname='Users can delete their own routing rules') THEN
    ALTER POLICY "Users can delete their own routing rules" ON public.lead_routing_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_routing_rules' AND p.polname='Users can insert their own routing rules') THEN
    ALTER POLICY "Users can insert their own routing rules" ON public.lead_routing_rules WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_routing_rules' AND p.polname='Users can update their own routing rules') THEN
    ALTER POLICY "Users can update their own routing rules" ON public.lead_routing_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_routing_rules' AND p.polname='Users can view their own routing rules') THEN
    ALTER POLICY "Users can view their own routing rules" ON public.lead_routing_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_config' AND p.polname='Users can insert their own config') THEN
    ALTER POLICY "Users can insert their own config" ON public.lead_score_config WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_config' AND p.polname='Users can update their own config') THEN
    ALTER POLICY "Users can update their own config" ON public.lead_score_config USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_config' AND p.polname='Users can view their own config') THEN
    ALTER POLICY "Users can view their own config" ON public.lead_score_config USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_history' AND p.polname='Users can insert their own score history') THEN
    ALTER POLICY "Users can insert their own score history" ON public.lead_score_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_history' AND p.polname='Users can view their own score history') THEN
    ALTER POLICY "Users can view their own score history" ON public.lead_score_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_recompute_queue' AND p.polname='lead_score_queue_insert_own') THEN
    ALTER POLICY lead_score_queue_insert_own ON public.lead_score_recompute_queue WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_recompute_queue' AND p.polname='lead_score_queue_select_own') THEN
    ALTER POLICY lead_score_queue_select_own ON public.lead_score_recompute_queue USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_rules' AND p.polname='lead_score_rules_delete_own') THEN
    ALTER POLICY lead_score_rules_delete_own ON public.lead_score_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_rules' AND p.polname='lead_score_rules_insert_own') THEN
    ALTER POLICY lead_score_rules_insert_own ON public.lead_score_rules WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_rules' AND p.polname='lead_score_rules_select_own') THEN
    ALTER POLICY lead_score_rules_select_own ON public.lead_score_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_rules' AND p.polname='lead_score_rules_update_own') THEN
    ALTER POLICY lead_score_rules_update_own ON public.lead_score_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_threshold_automations' AND p.polname='auto delete own') THEN
    ALTER POLICY "auto delete own" ON public.lead_score_threshold_automations USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_threshold_automations' AND p.polname='auto insert own') THEN
    ALTER POLICY "auto insert own" ON public.lead_score_threshold_automations WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_threshold_automations' AND p.polname='auto select own') THEN
    ALTER POLICY "auto select own" ON public.lead_score_threshold_automations USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_threshold_automations' AND p.polname='auto update own') THEN
    ALTER POLICY "auto update own" ON public.lead_score_threshold_automations USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_threshold_log' AND p.polname='log insert own') THEN
    ALTER POLICY "log insert own" ON public.lead_score_threshold_log WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_threshold_log' AND p.polname='log select own') THEN
    ALTER POLICY "log select own" ON public.lead_score_threshold_log USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_thresholds' AND p.polname='lead_score_thresholds_delete_own') THEN
    ALTER POLICY lead_score_thresholds_delete_own ON public.lead_score_thresholds USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_thresholds' AND p.polname='lead_score_thresholds_insert_own') THEN
    ALTER POLICY lead_score_thresholds_insert_own ON public.lead_score_thresholds WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_thresholds' AND p.polname='lead_score_thresholds_select_own') THEN
    ALTER POLICY lead_score_thresholds_select_own ON public.lead_score_thresholds USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_score_thresholds' AND p.polname='lead_score_thresholds_update_own') THEN
    ALTER POLICY lead_score_thresholds_update_own ON public.lead_score_thresholds USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_scores' AND p.polname='Users can delete their own lead scores') THEN
    ALTER POLICY "Users can delete their own lead scores" ON public.lead_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_scores' AND p.polname='Users can insert their own lead scores') THEN
    ALTER POLICY "Users can insert their own lead scores" ON public.lead_scores WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_scores' AND p.polname='Users can update their own lead scores') THEN
    ALTER POLICY "Users can update their own lead scores" ON public.lead_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lead_scores' AND p.polname='Users can view their own lead scores') THEN
    ALTER POLICY "Users can view their own lead scores" ON public.lead_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='life_events' AND p.polname='Users can delete their own life events') THEN
    ALTER POLICY "Users can delete their own life events" ON public.life_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='life_events' AND p.polname='Users can insert their own life events') THEN
    ALTER POLICY "Users can insert their own life events" ON public.life_events WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='life_events' AND p.polname='Users can update their own life events') THEN
    ALTER POLICY "Users can update their own life events" ON public.life_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='life_events' AND p.polname='Users can view their own life events') THEN
    ALTER POLICY "Users can view their own life events" ON public.life_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='life_events_history' AND p.polname='Users can view their own life events history') THEN
    ALTER POLICY "Users can view their own life events history" ON public.life_events_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='login_attempts' AND p.polname='Admins read all attempts') THEN
    ALTER POLICY "Admins read all attempts" ON public.login_attempts USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='login_attempts' AND p.polname='Users read own attempts') THEN
    ALTER POLICY "Users read own attempts" ON public.login_attempts USING ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lux_intelligence' AND p.polname='Users can delete their own lux intelligence') THEN
    ALTER POLICY "Users can delete their own lux intelligence" ON public.lux_intelligence USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lux_intelligence' AND p.polname='Users can insert their own lux intelligence') THEN
    ALTER POLICY "Users can insert their own lux intelligence" ON public.lux_intelligence WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lux_intelligence' AND p.polname='Users can update their own lux intelligence') THEN
    ALTER POLICY "Users can update their own lux intelligence" ON public.lux_intelligence USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lux_intelligence' AND p.polname='Users can view their own lux intelligence') THEN
    ALTER POLICY "Users can view their own lux intelligence" ON public.lux_intelligence USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lux_webhook_config' AND p.polname='Admins can delete lux_webhook_config') THEN
    ALTER POLICY "Admins can delete lux_webhook_config" ON public.lux_webhook_config USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='lux_webhook_config' AND p.polname='Admins can insert lux_webhook_config') THEN
    ALTER POLICY "Admins can insert lux_webhook_config" ON public.lux_webhook_config WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
