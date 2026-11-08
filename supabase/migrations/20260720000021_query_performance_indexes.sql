-- Additional performance indexes for hot query paths identified in audit pass 3.
-- All use CREATE INDEX IF NOT EXISTS for idempotency.

-- ── social_behavior_analysis (contact_id, analysis_date DESC) ──────────────
-- next-best-action: .eq('contact_id', contactId).order('analysis_date', {ascending:false}).limit(1)
-- Existing idx_social_behavior_analysis_contact covers (contact_id) alone;
-- adding analysis_date avoids a sort step on every NBA call.
DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('social_behavior_analysis', ARRAY['contact_id', 'analysis_date'], 'CREATE INDEX IF NOT EXISTS idx_social_behavior_analysis_contact_date ON public.social_behavior_analysis (contact_id, analysis_date DESC)'),
      ('deal_forecasts', ARRAY['period_id', 'forecasted_amount'], 'CREATE INDEX IF NOT EXISTS idx_deal_forecasts_period_amount ON public.deal_forecasts (period_id, forecasted_amount DESC)'),
      ('social_profiles', ARRAY['contact_id', 'platform'], 'CREATE INDEX IF NOT EXISTS idx_social_profiles_contact_platform ON public.social_profiles (contact_id, platform)'),
      ('connection_test_logs', ARRAY['status', 'created_at'], $$CREATE INDEX IF NOT EXISTS idx_connection_test_logs_status_created ON public.connection_test_logs (created_at DESC) WHERE status = 'error'$$),
      ('incoming_webhook_logs', ARRAY['status', 'created_at'], $$CREATE INDEX IF NOT EXISTS idx_incoming_webhook_logs_status_created ON public.incoming_webhook_logs (created_at DESC) WHERE status = 'error'$$),
      ('forecast_periods', ARRAY['status', 'period_start'], $$CREATE INDEX IF NOT EXISTS idx_forecast_periods_open ON public.forecast_periods (period_start DESC) WHERE status = 'open'$$)
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
