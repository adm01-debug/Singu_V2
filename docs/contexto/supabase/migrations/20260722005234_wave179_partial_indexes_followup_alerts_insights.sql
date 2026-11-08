-- Wave 179: Missing partial indexes for follow_up_required, alerts.dismissed, insights.dismissed

-- 1. interactions: partial index for upcoming follow-up queries using modern column names
CREATE INDEX IF NOT EXISTS idx_interactions_followup_required_modern
  ON public.interactions (user_id, follow_up_date)
  WHERE follow_up_required = true AND follow_up_date IS NOT NULL;

-- 2. alerts: partial index for active (non-dismissed) alerts per contact
CREATE INDEX IF NOT EXISTS idx_alerts_active
  ON public.alerts (contact_id, user_id)
  WHERE dismissed = false;

-- 3. insights: partial index for active (non-dismissed) insights per contact
CREATE INDEX IF NOT EXISTS idx_insights_active
  ON public.insights (contact_id, user_id)
  WHERE dismissed = false;
