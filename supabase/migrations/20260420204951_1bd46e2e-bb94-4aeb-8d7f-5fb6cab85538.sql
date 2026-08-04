CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','unhealthy')),
  total_latency_ms INTEGER,
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_timestamp
  ON public.system_health_snapshots (timestamp DESC);

ALTER TABLE public.system_health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view system health snapshots" ON public.system_health_snapshots;
CREATE POLICY "Admins can view system health snapshots"
  ON public.system_health_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role can insert system health snapshots" ON public.system_health_snapshots;
CREATE POLICY "Service role can insert system health snapshots"
  ON public.system_health_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Retenção: manter 60 dias de snapshots (limpeza manual via cron opcional)
COMMENT ON TABLE public.system_health_snapshots IS
  'Snapshots periódicos do system-health para cálculo de Error Budget. Populado a cada 5 min via cron. Visível apenas para admins.';