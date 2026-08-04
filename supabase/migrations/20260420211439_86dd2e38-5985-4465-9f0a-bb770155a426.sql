
-- 1) Tabela de alertas automáticos do error budget
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning','high','critical')),
  threshold_pct NUMERIC NOT NULL,
  consumed_pct NUMERIC NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_type_created ON public.system_alerts (alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_unack ON public.system_alerts (created_at DESC) WHERE acknowledged_at IS NULL;

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system alerts"
ON public.system_alerts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can acknowledge system alerts"
ON public.system_alerts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (insert é exclusivo via service_role; sem policy de INSERT para clientes)

-- 2) Índice em snapshots para acelerar agregação e cleanup
CREATE INDEX IF NOT EXISTS idx_health_snapshots_timestamp_desc
  ON public.system_health_snapshots (timestamp DESC);

-- 3) Função de retenção (>60 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_snapshots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_health_snapshots
  WHERE timestamp < now() - INTERVAL '60 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM public.system_alerts
  WHERE acknowledged_at IS NOT NULL
    AND created_at < now() - INTERVAL '90 days';

  RETURN deleted_count;
END;
$$;
