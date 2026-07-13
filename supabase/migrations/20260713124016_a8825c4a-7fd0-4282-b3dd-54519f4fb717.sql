ALTER TABLE public.system_alerts
  ADD COLUMN IF NOT EXISTS is_simulated boolean
  GENERATED ALWAYS AS (COALESCE((metadata->>'simulated')::boolean, false)) STORED;

CREATE INDEX IF NOT EXISTS idx_system_alerts_real_unack
  ON public.system_alerts (alert_type, created_at DESC)
  WHERE is_simulated = false AND acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_system_alerts_simulated
  ON public.system_alerts (created_at DESC)
  WHERE is_simulated = true;