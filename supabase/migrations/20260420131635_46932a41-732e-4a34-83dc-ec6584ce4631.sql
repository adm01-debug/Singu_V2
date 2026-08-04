-- Tabela de anomalias detectadas por IA em conexões/webhooks
CREATE TABLE IF NOT EXISTS public.connection_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.incoming_webhooks(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.connection_configs(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('error_spike', 'latency_degradation', 'suspicious_window', 'volume_drop', 'volume_spike', 'schema_drift')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  explanation TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  model_used TEXT,
  confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connection_anomalies_webhook ON public.connection_anomalies(webhook_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_anomalies_conn ON public.connection_anomalies(connection_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_anomalies_severity ON public.connection_anomalies(severity, detected_at DESC) WHERE acknowledged_at IS NULL;

ALTER TABLE public.connection_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view anomalies"
  ON public.connection_anomalies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update anomalies"
  ON public.connection_anomalies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert anomalies"
  ON public.connection_anomalies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can delete anomalies"
  ON public.connection_anomalies FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));