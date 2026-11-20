-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416223750
-- nome:   singu_add_cols_batch_4

ALTER TABLE public.ai_chat_threads
  ADD COLUMN IF NOT EXISTS "context_entity_type" text,
  ADD COLUMN IF NOT EXISTS "context_entity_id" uuid,
  ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "industry" text,
  ADD COLUMN IF NOT EXISTS "phone" text,
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "address" text,
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "state" text,
  ADD COLUMN IF NOT EXISTS "notes" text,
  ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "lat" double precision,
  ADD COLUMN IF NOT EXISTS "lng" double precision,
  ADD COLUMN IF NOT EXISTS "instagram" text,
  ADD COLUMN IF NOT EXISTS "linkedin" text,
  ADD COLUMN IF NOT EXISTS "facebook" text,
  ADD COLUMN IF NOT EXISTS "youtube" text,
  ADD COLUMN IF NOT EXISTS "twitter" text,
  ADD COLUMN IF NOT EXISTS "tiktok" text;

ALTER TABLE public.device_login_notifications
  ADD COLUMN IF NOT EXISTS "ip_address" text,
  ADD COLUMN IF NOT EXISTS "location" text,
  ADD COLUMN IF NOT EXISTS "is_read" boolean DEFAULT false;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "document_type" text DEFAULT 'other'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS "mime_type" text,
  ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text,
  ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.landing_page_submissions
  ADD COLUMN IF NOT EXISTS "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "phone" text;

ALTER TABLE public.lead_score_history
  ADD COLUMN IF NOT EXISTS "contact_id" uuid,
  ADD COLUMN IF NOT EXISTS "user_id" uuid,
  ADD COLUMN IF NOT EXISTS "total_score" numeric(5,2),
  ADD COLUMN IF NOT EXISTS "grade" text,
  ADD COLUMN IF NOT EXISTS "intent_score" numeric(5,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "relationship_score" numeric(5,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "recorded_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.nurturing_enrollments
  ADD COLUMN IF NOT EXISTS "current_step" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_action_at" timestamptz;

ALTER TABLE public.purchase_history
  ADD COLUMN IF NOT EXISTS "renewal_date" timestamptz,
  ADD COLUMN IF NOT EXISTS "cycle_months" integer,
  ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE public.search_products_cache
  ADD COLUMN IF NOT EXISTS "external_id" text,
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "category" text,
  ADD COLUMN IF NOT EXISTS "tags" text[],
  ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "image_url" text,
  ADD COLUMN IF NOT EXISTS "price" numeric,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.sms_campaign_recipients
  ADD COLUMN IF NOT EXISTS "phone" text,
  ADD COLUMN IF NOT EXISTS "error_message" text,
  ADD COLUMN IF NOT EXISTS "replied_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "cost_cents" integer;

ALTER TABLE public.trigger_ab_tests
  ADD COLUMN IF NOT EXISTS "contact_id" uuid,
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "disc_profile" text,
  ADD COLUMN IF NOT EXISTS "variant_a_trigger" text,
  ADD COLUMN IF NOT EXISTS "variant_a_template" text,
  ADD COLUMN IF NOT EXISTS "variant_a_uses" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "variant_a_avg_rating" numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "variant_b_trigger" text,
  ADD COLUMN IF NOT EXISTS "variant_b_template" text,
  ADD COLUMN IF NOT EXISTS "variant_b_uses" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "variant_b_avg_rating" numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "confidence" numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "started_at" timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "completed_at" timestamptz;

ALTER TABLE public.user_known_devices
  ADD COLUMN IF NOT EXISTS "last_used_at" timestamptz DEFAULT now();
