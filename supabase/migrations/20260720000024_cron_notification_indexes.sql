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
DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('purchase_history', ARRAY['user_id', 'renewal_date'], 'CREATE INDEX IF NOT EXISTS idx_purchase_history_user_renewal ON public.purchase_history (user_id, renewal_date) WHERE renewal_date IS NOT NULL'),
      ('life_events', ARRAY['user_id', 'event_date'], 'CREATE INDEX IF NOT EXISTS idx_life_events_user_event_date ON public.life_events (user_id, event_date)'),
      ('alerts', ARRAY['user_id', 'type', 'created_at'], $$CREATE INDEX IF NOT EXISTS idx_alerts_user_at_risk_created ON public.alerts (user_id, created_at DESC) WHERE type = 'at_risk'$$)
    ) AS indexes(table_name, column_names, ddl)
  LOOP
    IF (
      SELECT count(*) = cardinality(index_definition.column_names)
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', index_definition.table_name))
        AND attname = ANY(index_definition.column_names)
        AND NOT attisdropped
    ) THEN
      EXECUTE index_definition.ddl;
    END IF;
  END LOOP;
END;
$migration$;
