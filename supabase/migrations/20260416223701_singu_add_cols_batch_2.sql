-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416223701
-- nome:   singu_add_cols_batch_2

ALTER TABLE public.access_security_settings
  ADD COLUMN IF NOT EXISTS "enable_ip_restriction" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "enable_geo_blocking" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "enable_device_detection" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notify_new_device" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "max_sessions" integer DEFAULT 5;

ALTER TABLE public.churn_risk_scores
  ADD COLUMN IF NOT EXISTS "risk_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "recommendations" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "days_since_last_interaction" integer,
  ADD COLUMN IF NOT EXISTS "sentiment_trend" text,
  ADD COLUMN IF NOT EXISTS "score_trend" text,
  ADD COLUMN IF NOT EXISTS "analyzed_at" timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "expires_at" timestamptz DEFAULT (now() + '7 days'::interval) NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.custom_field_values
  ADD COLUMN IF NOT EXISTS "user_id" uuid,
  ADD COLUMN IF NOT EXISTS "value" text;

ALTER TABLE public.document_templates
  ADD COLUMN IF NOT EXISTS "document_type" text DEFAULT 'contract'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS "content_html" text,
  ADD COLUMN IF NOT EXISTS "merge_fields" jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[];

ALTER TABLE public.lead_routing_rules
  ADD COLUMN IF NOT EXISTS "fallback_rule_id" uuid;

ALTER TABLE public.lux_webhook_config
  ADD COLUMN IF NOT EXISTS "entity_type" text,
  ADD COLUMN IF NOT EXISTS "timeout_ms" integer DEFAULT 60000,
  ADD COLUMN IF NOT EXISTS "max_retries" integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "headers" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "last_test_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "last_test_status" text;

ALTER TABLE public.password_reset_requests
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS "approved_by" uuid,
  ADD COLUMN IF NOT EXISTS "reason" text,
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "resolved_at" timestamptz;

ALTER TABLE public.rfm_segment_config
  ADD COLUMN IF NOT EXISTS "user_id" uuid,
  ADD COLUMN IF NOT EXISTS "segment_name" text,
  ADD COLUMN IF NOT EXISTS "segment_key" text,
  ADD COLUMN IF NOT EXISTS "email_template" text;

ALTER TABLE public.sequence_steps
  ADD COLUMN IF NOT EXISTS "step_order" integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS "message_template" text,
  ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE public.sms_templates
  ADD COLUMN IF NOT EXISTS "body" text;

ALTER TABLE public.trigger_intensity_history
  ADD COLUMN IF NOT EXISTS "trigger_type" text,
  ADD COLUMN IF NOT EXISTS "result" text,
  ADD COLUMN IF NOT EXISTS "interaction_id" uuid;

ALTER TABLE public.webauthn_credentials
  ADD COLUMN IF NOT EXISTS "label" text DEFAULT 'Passkey'::text,
  ADD COLUMN IF NOT EXISTS "sign_count" integer DEFAULT 0;
