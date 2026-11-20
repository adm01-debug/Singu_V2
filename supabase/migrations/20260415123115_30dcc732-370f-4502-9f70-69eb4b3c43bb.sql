
CREATE TABLE IF NOT EXISTS public.lux_webhook_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company')),
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  timeout_ms INTEGER DEFAULT 60000,
  max_retries INTEGER DEFAULT 3,
  headers JSONB DEFAULT '{}'::jsonb,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type)
);

ALTER TABLE public.lux_webhook_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view lux_webhook_config" ON public.lux_webhook_config;  -- [singu-idem]
CREATE POLICY "Admins can view lux_webhook_config"
  ON public.lux_webhook_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert lux_webhook_config" ON public.lux_webhook_config;  -- [singu-idem]
CREATE POLICY "Admins can insert lux_webhook_config"
  ON public.lux_webhook_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update lux_webhook_config" ON public.lux_webhook_config;  -- [singu-idem]
CREATE POLICY "Admins can update lux_webhook_config"
  ON public.lux_webhook_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete lux_webhook_config" ON public.lux_webhook_config;  -- [singu-idem]
CREATE POLICY "Admins can delete lux_webhook_config"
  ON public.lux_webhook_config FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_lux_webhook_config_updated_at ON public.lux_webhook_config;  -- [singu-idem]
CREATE TRIGGER update_lux_webhook_config_updated_at
  BEFORE UPDATE ON public.lux_webhook_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();