-- Schema Drift Alerts table
CREATE TABLE IF NOT EXISTS public.schema_drift_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  user_id UUID,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schema_drift_alerts ENABLE ROW LEVEL SECURITY;

-- Index for fast unresolved lookups
CREATE INDEX IF NOT EXISTS idx_schema_drift_unresolved ON public.schema_drift_alerts(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schema_drift_entity ON public.schema_drift_alerts(entity_name, error_type);

-- Admins can view all alerts
CREATE POLICY "Admins can view schema drift alerts"
ON public.schema_drift_alerts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update (resolve) alerts
CREATE POLICY "Admins can update schema drift alerts"
ON public.schema_drift_alerts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert (edge function uses service role, but fallback)
CREATE POLICY "System can insert schema drift alerts"
ON public.schema_drift_alerts
FOR INSERT
TO authenticated
WITH CHECK (true);