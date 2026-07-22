-- Wave 179: Missing partial indexes for follow_up_required, alerts.dismissed, insights.dismissed
--
-- Gap analysis:
--   - interactions: existing partial indexes use legacy columns (requer_followup, followup_concluido)
--     but app queries filter on modern columns (follow_up_required, follow_up_date)
--   - alerts: indexes on contact_id/user_id exist but no partial index on dismissed = false
--   - insights: same gap as alerts
--   - notifications: already has idx_notifications_user_unread WHERE (is_read = false) — good model
--
-- These indexes eliminate full-table scans on queries that run frequently (every 5 min briefing poll).

-- 1. interactions: partial index for upcoming follow-up queries using modern column names
--    Covers: usePreContactBriefing.ts .eq('follow_up_required', true).not('follow_up_date', 'is', null)
--    Also covers: any follow-up dashboard/reminders queries
CREATE INDEX IF NOT EXISTS idx_interactions_followup_required_modern
  ON public.interactions (user_id, follow_up_date)
  WHERE follow_up_required = true AND follow_up_date IS NOT NULL;

-- 2. alerts: partial index for active (non-dismissed) alerts per contact
--    Covers: useContactDetail.ts alerts WHERE dismissed = false AND contact_id = X AND user_id = Y
CREATE INDEX IF NOT EXISTS idx_alerts_active
  ON public.alerts (contact_id, user_id)
  WHERE dismissed = false;

-- 3. insights: partial index for active (non-dismissed) insights per contact
--    Covers: useContactDetail.ts insights WHERE dismissed = false AND contact_id = X AND user_id = Y
CREATE INDEX IF NOT EXISTS idx_insights_active
  ON public.insights (contact_id, user_id)
  WHERE dismissed = false;
