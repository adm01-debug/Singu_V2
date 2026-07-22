-- ============= CONNECTION CONFIGS =============
CREATE TABLE public.connection_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('supabase_external','bitrix24','n8n','mcp_claude','custom')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_refs JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  last_test_latency_ms INTEGER,
  last_test_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connection_configs_type ON public.connection_configs(connection_type);
CREATE INDEX IF NOT EXISTS idx_connection_configs_active ON public.connection_configs(is_active);

ALTER TABLE public.connection_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage connection_configs"
  ON public.connection_configs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_connection_configs_updated_at
  BEFORE UPDATE ON public.connection_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CONNECTION TEST LOGS =============
CREATE TABLE public.connection_test_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.connection_configs(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  message TEXT,
  details JSONB,
  tested_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connection_test_logs_conn ON public.connection_test_logs(connection_id, created_at DESC);

ALTER TABLE public.connection_test_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read connection_test_logs"
  ON public.connection_test_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins insert connection_test_logs"
  ON public.connection_test_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= INCOMING WEBHOOKS =============
CREATE TABLE public.incoming_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  token TEXT NOT NULL UNIQUE,
  target_entity TEXT NOT NULL CHECK (target_entity IN ('contact','company','deal','interaction','note','custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  allowed_origins TEXT[] DEFAULT ARRAY[]::TEXT[],
  field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_calls BIGINT NOT NULL DEFAULT 0,
  total_errors BIGINT NOT NULL DEFAULT 0,
  last_called_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incoming_webhooks_token ON public.incoming_webhooks(token);
CREATE INDEX IF NOT EXISTS idx_incoming_webhooks_active ON public.incoming_webhooks(is_active);

ALTER TABLE public.incoming_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage incoming_webhooks"
  ON public.incoming_webhooks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_incoming_webhooks_updated_at
  BEFORE UPDATE ON public.incoming_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= INCOMING WEBHOOK LOGS =============
CREATE TABLE public.incoming_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.incoming_webhooks(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  http_status INTEGER,
  payload JSONB,
  response JSONB,
  error_message TEXT,
  source_ip TEXT,
  user_agent TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incoming_webhook_logs_wh ON public.incoming_webhook_logs(webhook_id, created_at DESC);

ALTER TABLE public.incoming_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read incoming_webhook_logs"
  ON public.incoming_webhook_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));