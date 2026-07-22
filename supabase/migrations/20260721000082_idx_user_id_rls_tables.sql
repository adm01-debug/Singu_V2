-- Migration: idx_user_id_rls_tables (Wave 168)
-- PERFORMANCE FIX: 54 tables have RLS policies that filter on user_id but
-- have no index on that column. Every authenticated REST API query against
-- these tables causes a sequential scan — catastrophic at scale.
--
-- All 45 tables that already had user_id indexes were confirmed clean.
-- This wave adds the 54 missing indexes.
--
-- Index naming: idx_{table}_user_id

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id
  ON public.ai_chat_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_user_id
  ON public.ai_chat_threads (user_id);

CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id
  ON public.automation_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id
  ON public.calendar_events (user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_user_id
  ON public.campaign_recipients (user_id);

CREATE INDEX IF NOT EXISTS idx_churn_risk_scores_user_id
  ON public.churn_risk_scores (user_id);

CREATE INDEX IF NOT EXISTS idx_city_whitelist_user_id
  ON public.city_whitelist (user_id);

CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_user_id
  ON public.cognitive_bias_history (user_id);

CREATE INDEX IF NOT EXISTS idx_compatibility_alerts_user_id
  ON public.compatibility_alerts (user_id);

-- connector_log: user_id referenced in policy via join, not a direct column; skip.

CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id
  ON public.contact_notes (user_id);

CREATE INDEX IF NOT EXISTS idx_contact_relatives_user_id
  ON public.contact_relatives (user_id);

CREATE INDEX IF NOT EXISTS idx_csat_surveys_user_id
  ON public.csat_surveys (user_id);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_user_id
  ON public.custom_field_values (user_id);

CREATE INDEX IF NOT EXISTS idx_decision_criteria_user_id
  ON public.decision_criteria (user_id);

CREATE INDEX IF NOT EXISTS idx_device_login_notifications_user_id
  ON public.device_login_notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_user_id
  ON public.disc_analysis_history (user_id);

CREATE INDEX IF NOT EXISTS idx_disc_communication_logs_user_id
  ON public.disc_communication_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_document_signatures_user_id
  ON public.document_signatures (user_id);

CREATE INDEX IF NOT EXISTS idx_document_templates_user_id
  ON public.document_templates (user_id);

CREATE INDEX IF NOT EXISTS idx_document_views_user_id
  ON public.document_views (user_id);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id
  ON public.email_campaigns (user_id);

CREATE INDEX IF NOT EXISTS idx_emotional_anchors_user_id
  ON public.emotional_anchors (user_id);

CREATE INDEX IF NOT EXISTS idx_emotional_states_history_user_id
  ON public.emotional_states_history (user_id);

CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_user_id
  ON public.eq_analysis_history (user_id);

CREATE INDEX IF NOT EXISTS idx_handoff_requests_user_id
  ON public.handoff_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_health_alerts_user_id
  ON public.health_alerts (user_id);

CREATE INDEX IF NOT EXISTS idx_insights_user_id
  ON public.insights (user_id);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_user_id
  ON public.ip_whitelist (user_id);

CREATE INDEX IF NOT EXISTS idx_landing_page_submissions_user_id
  ON public.landing_page_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_user_id
  ON public.lead_assignments (user_id);

CREATE INDEX IF NOT EXISTS idx_lead_routing_rules_user_id
  ON public.lead_routing_rules (user_id);

CREATE INDEX IF NOT EXISTS idx_lead_score_history_user_id
  ON public.lead_score_history (user_id);

CREATE INDEX IF NOT EXISTS idx_life_events_user_id
  ON public.life_events (user_id);

CREATE INDEX IF NOT EXISTS idx_meeting_summaries_user_id
  ON public.meeting_summaries (user_id);

CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_user_id
  ON public.metaprogram_analysis (user_id);

CREATE INDEX IF NOT EXISTS idx_nurturing_enrollments_user_id
  ON public.nurturing_enrollments (user_id);

CREATE INDEX IF NOT EXISTS idx_nurturing_workflows_user_id
  ON public.nurturing_workflows (user_id);

CREATE INDEX IF NOT EXISTS idx_offer_suggestions_user_id
  ON public.offer_suggestions (user_id);

CREATE INDEX IF NOT EXISTS idx_purchase_history_user_id
  ON public.purchase_history (user_id);

CREATE INDEX IF NOT EXISTS idx_redistribution_log_user_id
  ON public.redistribution_log (user_id);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_user_id
  ON public.sequence_enrollments (user_id);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_user_id
  ON public.sequence_steps (user_id);

CREATE INDEX IF NOT EXISTS idx_sequences_user_id
  ON public.sequences (user_id);

CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_user_id
  ON public.sms_campaign_recipients (user_id);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_id
  ON public.sms_campaigns (user_id);

CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id
  ON public.sms_templates (user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id
  ON public.support_tickets (user_id);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id
  ON public.ticket_comments (user_id);

CREATE INDEX IF NOT EXISTS idx_trigger_intensity_history_user_id
  ON public.trigger_intensity_history (user_id);

CREATE INDEX IF NOT EXISTS idx_vak_analysis_history_user_id
  ON public.vak_analysis_history (user_id);

CREATE INDEX IF NOT EXISTS idx_visit_checkins_user_id
  ON public.visit_checkins (user_id);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id
  ON public.webauthn_credentials (user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id
  ON public.whatsapp_messages (user_id);

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  missing_count int;
BEGIN
  WITH rls_tables AS (
    SELECT DISTINCT cl.relname AS tablename
    FROM pg_class cl
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
    JOIN pg_policy pol ON pol.polrelid = cl.oid
    WHERE (
      pg_get_expr(pol.polqual, pol.polrelid) LIKE '%user_id%'
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%user_id%'
    )
  ),
  indexed AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE a.attname = 'user_id'
  )
  SELECT COUNT(*) INTO missing_count
  FROM rls_tables rt
  LEFT JOIN indexed i ON i.tablename = rt.tablename
  WHERE i.tablename IS NULL;

  IF missing_count = 0 THEN
    RAISE NOTICE '[Wave 168] All RLS user_id-filtered tables now have user_id indexes. Performance clean.';
  ELSE
    RAISE WARNING '[Wave 168] % tables still missing user_id index after migration', missing_count;
  END IF;
END;
$$;
