-- Additional performance indexes for hot query paths identified in audit pass 3.
-- All use CREATE INDEX IF NOT EXISTS for idempotency.

-- ── social_behavior_analysis (contact_id, analysis_date DESC) ──────────────
-- next-best-action: .eq('contact_id', contactId).order('analysis_date', {ascending:false}).limit(1)
-- Existing idx_social_behavior_analysis_contact covers (contact_id) alone;
-- adding analysis_date avoids a sort step on every NBA call.
CREATE INDEX IF NOT EXISTS idx_social_behavior_analysis_contact_date
  ON public.social_behavior_analysis (contact_id, analysis_date DESC);

-- ── deal_forecasts (period_id, forecasted_amount DESC) ─────────────────────
-- forecast-narrative: .eq("period_id", period_id).order("forecasted_amount", {ascending:false}).limit(50)
-- Existing idx_deal_forecasts_period covers (period_id, category); the ORDER BY
-- forecasted_amount is not satisfied by that index and requires a heap sort.
CREATE INDEX IF NOT EXISTS idx_deal_forecasts_period_amount
  ON public.deal_forecasts (period_id, forecasted_amount DESC);

-- ── social_profiles (contact_id, platform) ─────────────────────────────────
-- social-profile-scraper: .eq("contact_id", contactId).eq("platform", platform).maybeSingle()
-- Two separate single-column indexes (contact_id) and (platform) require a
-- bitmap-and merge; a compound index satisfies both predicates in one scan.
CREATE INDEX IF NOT EXISTS idx_social_profiles_contact_platform
  ON public.social_profiles (contact_id, platform);

-- ── connection_test_logs (status, created_at DESC) ─────────────────────────
-- health-aggregate: .eq("status","error").gte("created_at", since) — full count
-- Existing index is on (connection_id, created_at DESC), useless for status scans.
-- A partial index on the error status keeps it small and fast.
CREATE INDEX IF NOT EXISTS idx_connection_test_logs_status_created
  ON public.connection_test_logs (created_at DESC)
  WHERE status = 'error';

-- ── incoming_webhook_logs (status, created_at DESC) ────────────────────────
-- health-aggregate: .eq("status","error").gte("created_at", since) — full count
-- Same pattern; existing index is on (webhook_id, created_at DESC).
CREATE INDEX IF NOT EXISTS idx_incoming_webhook_logs_status_created
  ON public.incoming_webhook_logs (created_at DESC)
  WHERE status = 'error';

-- ── forecast_periods (status) — partial for open periods ───────────────────
-- forecast-snapshot-cron: .eq("status","open") without user_id filter.
-- Existing idx_forecast_periods_user (user_id, status, period_start DESC) requires
-- user_id in the leading position; cron queries ALL open periods and skips user_id.
CREATE INDEX IF NOT EXISTS idx_forecast_periods_open
  ON public.forecast_periods (period_start DESC)
  WHERE status = 'open';
