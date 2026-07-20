-- Migration: Composite indexes for client-notifications and weekly-digest cron patterns
--
-- client-notifications queries these tables across ALL users in a single pre-batch pass.
-- Without composite indexes the planner uses seq-scans or slow bitmap-and merges.
--
-- weekly-digest also benefits from the same purchase_history and life_events indexes.

-- ── purchase_history (user_id, renewal_date) ─────────────────────────────────
-- client-notifications: .in('user_id', userIds).not('renewal_date','is',null)
--                       .gte('renewal_date', today).lte('renewal_date', +7d)
-- Existing: (user_id) and (contact_id) separate indexes.
-- A partial compound index on non-null renewal_date lets the planner satisfy
-- both the IN-list and the date range with a single index range scan.
CREATE INDEX IF NOT EXISTS idx_purchase_history_user_renewal
  ON public.purchase_history (user_id, renewal_date)
  WHERE renewal_date IS NOT NULL;

-- ── life_events (user_id, event_date) ────────────────────────────────────────
-- client-notifications: .in('user_id', userIds) — full table scan today.
-- Adding a composite (user_id, event_date) lets the engine satisfy the IN-list
-- without scanning every row and supports the recurring-date calculation.
CREATE INDEX IF NOT EXISTS idx_life_events_user_event_date
  ON public.life_events (user_id, event_date);

-- ── alerts (user_id, type, created_at DESC) — partial for at_risk ────────────
-- client-notifications: .in('user_id', userIds).eq('type','at_risk')
--                       .gte('created_at', oneWeekAgo)
-- Existing idx_alerts_user_id covers user_id alone; the planner must then
-- filter type and created_at from the heap. A partial index on at_risk rows
-- is small (subset of total alerts) and exactly covers the dedup check.
CREATE INDEX IF NOT EXISTS idx_alerts_user_at_risk_created
  ON public.alerts (user_id, created_at DESC)
  WHERE type = 'at_risk';
