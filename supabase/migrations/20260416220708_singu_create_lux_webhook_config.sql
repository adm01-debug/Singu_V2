-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220708
-- nome:   singu_create_lux_webhook_config

-- ============================================================================
-- SINGU — TABELA 9/9: lux_webhook_config
-- Spec: memory features/lux-intelligence-module
-- "webhooks assíncronos com o n8n para enriquecer perfis"
-- Provavel admin UI: /admin/lux-config (citada no index.md das memories)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lux_webhook_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Identificação
  config_name text NOT NULL,
  description text,
  -- Endpoint n8n / external
  webhook_url text NOT NULL,
  webhook_method text DEFAULT 'POST' CHECK (webhook_method IN ('POST','PUT','PATCH')),
  auth_type text DEFAULT 'none' CHECK (auth_type IN ('none','bearer','basic','api_key','hmac_signature')),
  auth_secret_name text,
  custom_headers jsonb DEFAULT '{}'::jsonb,
  -- Escopo da varredura
  scrape_target text NOT NULL CHECK (scrape_target IN ('company','contact','both')),
  scrape_sources text[] DEFAULT '{linkedin,instagram,facebook,cnpj,receita_federal}'::text[],
  -- Retry e timeout
  timeout_seconds integer DEFAULT 60,
  retry_max_attempts integer DEFAULT 3,
  retry_backoff_base_ms integer DEFAULT 1000,
  retry_strategy text DEFAULT 'exponential' CHECK (retry_strategy IN ('linear','exponential','constant')),
  -- Rate limit
  rate_limit_per_minute integer DEFAULT 10,
  rate_limit_per_hour integer DEFAULT 100,
  -- Stats
  total_calls integer DEFAULT 0,
  total_successes integer DEFAULT 0,
  total_failures integer DEFAULT 0,
  last_called_at timestamp with time zone,
  last_success_at timestamp with time zone,
  last_failure_at timestamp with time zone,
  last_failure_reason text,
  -- Controle
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  priority integer DEFAULT 100,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lux_webhook_config IS 'SINGU: Configurações de webhooks do módulo Lux Intelligence. Cada linha = 1 endpoint n8n/externo para enriquecimento profundo (redes sociais, CNPJ, LinkedIn). Inclui auth, retry exponencial, rate limiting e estatísticas. Admin UI: /admin/lux-config.';

ALTER TABLE public.lux_webhook_config
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS config_name text NOT NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS webhook_url text NOT NULL,
  ADD COLUMN IF NOT EXISTS webhook_method text DEFAULT 'POST' CHECK (webhook_method IN ('POST','PUT','PATCH')),
  ADD COLUMN IF NOT EXISTS auth_type text DEFAULT 'none' CHECK (auth_type IN ('none','bearer','basic','api_key','hmac_signature')),
  ADD COLUMN IF NOT EXISTS auth_secret_name text,
  ADD COLUMN IF NOT EXISTS custom_headers jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scrape_target text NOT NULL CHECK (scrape_target IN ('company','contact','both')),
  ADD COLUMN IF NOT EXISTS scrape_sources text[] DEFAULT '{linkedin,instagram,facebook,cnpj,receita_federal}'::text[],
  ADD COLUMN IF NOT EXISTS timeout_seconds integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS retry_max_attempts integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS retry_backoff_base_ms integer DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS retry_strategy text DEFAULT 'exponential' CHECK (retry_strategy IN ('linear','exponential','constant')),
  ADD COLUMN IF NOT EXISTS rate_limit_per_minute integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS rate_limit_per_hour integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS total_calls integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_successes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_failures integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_called_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_success_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_failure_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_failure_reason text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();


CREATE INDEX IF NOT EXISTS idx_lux_webhook_config_user_active ON public.lux_webhook_config (user_id, is_active, priority) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lux_webhook_config_one_default_per_user ON public.lux_webhook_config (user_id) WHERE is_default = true;

ALTER TABLE public.lux_webhook_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.lux_webhook_config FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.lux_webhook_config FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.lux_webhook_config FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.lux_webhook_config FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.lux_webhook_config FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_lux_webhook_config_updated_at ON public.lux_webhook_config';
    EXECUTE 'CREATE TRIGGER update_lux_webhook_config_updated_at BEFORE UPDATE ON public.lux_webhook_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=22;
