-- Migration: Add missing indexes for pipeline and notification hot paths
--
-- Identified gaps via pg_stats + index audit:
--   deals.pipeline_stage  — no index, scanned on every Kanban board load
--   insights.dismissed    — no index, scanned for dismissed=false notification query
--   health_alerts.dismissed — same pattern
--   stakeholder_alerts.company_id — no index for company-scoped filters
--   alerts (user_id+dismissed) — repeated in useRealtimeNotifications initial load

-- Pipeline Kanban: groups and filters deals by stage on every page load
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage
  ON public.deals (pipeline_stage);

-- Notification system partial indexes — only the undismissed rows matter for queries
CREATE INDEX IF NOT EXISTS idx_insights_not_dismissed
  ON public.insights (user_id, created_at DESC)
  WHERE dismissed = false;

CREATE INDEX IF NOT EXISTS idx_health_alerts_not_dismissed
  ON public.health_alerts (user_id, created_at DESC)
  WHERE dismissed = false;

CREATE INDEX IF NOT EXISTS idx_alerts_user_not_dismissed
  ON public.alerts (user_id, created_at DESC)
  WHERE dismissed = false;

-- Stakeholder alerts: company-scoped filtering
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_company_id
  ON public.stakeholder_alerts (company_id);
