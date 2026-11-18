-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416223818
-- nome:   singu_add_cols_batch_5

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "dismissed" boolean DEFAULT false;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS "role_title" text,
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "phone" text,
  ADD COLUMN IF NOT EXISTS "whatsapp" text,
  ADD COLUMN IF NOT EXISTS "linkedin" text,
  ADD COLUMN IF NOT EXISTS "instagram" text,
  ADD COLUMN IF NOT EXISTS "twitter" text,
  ADD COLUMN IF NOT EXISTS "avatar_url" text,
  ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "interests" text[] DEFAULT '{}'::text[];

ALTER TABLE public.disc_profile_config
  ADD COLUMN IF NOT EXISTS "short_description" text,
  ADD COLUMN IF NOT EXISTS "detailed_description" text,
  ADD COLUMN IF NOT EXISTS "core_drive" text,
  ADD COLUMN IF NOT EXISTS "core_fear" text,
  ADD COLUMN IF NOT EXISTS "under_pressure" text,
  ADD COLUMN IF NOT EXISTS "ideal_environment" text,
  ADD COLUMN IF NOT EXISTS "preferred_pace" text,
  ADD COLUMN IF NOT EXISTS "decision_making_style" text,
  ADD COLUMN IF NOT EXISTS "opening_strategies" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "presentation_tips" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "follow_up_approach" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "power_words" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "avoid_words" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "detection_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "typical_phrases" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "compatibility_matrix" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "color_scheme" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS "content_html" text,
  ADD COLUMN IF NOT EXISTS "content_text" text,
  ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[];

ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS "blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "theme" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "submission_count" integer DEFAULT 0 NOT NULL;

ALTER TABLE public.lead_scores
  ADD COLUMN IF NOT EXISTS "score_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "weight_engagement" numeric(3,2) DEFAULT 0.30 NOT NULL,
  ADD COLUMN IF NOT EXISTS "weight_fit" numeric(3,2) DEFAULT 0.20 NOT NULL,
  ADD COLUMN IF NOT EXISTS "weight_intent" numeric(3,2) DEFAULT 0.25 NOT NULL,
  ADD COLUMN IF NOT EXISTS "weight_relationship" numeric(3,2) DEFAULT 0.25 NOT NULL,
  ADD COLUMN IF NOT EXISTS "last_calculated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.nurturing_workflows
  ADD COLUMN IF NOT EXISTS "trigger_config" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "steps" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "enrolled_count" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "completed_count" integer DEFAULT 0;

ALTER TABLE public.redistribution_log
  ADD COLUMN IF NOT EXISTS "from_member_id" uuid,
  ADD COLUMN IF NOT EXISTS "to_member_id" uuid,
  ADD COLUMN IF NOT EXISTS "auto_triggered" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "inactivity_days" integer,
  ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE public.semantic_search_cache
  ADD COLUMN IF NOT EXISTS "query_hash" text;

ALTER TABLE public.sms_campaigns
  ADD COLUMN IF NOT EXISTS "total_replies" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "cost_estimate_cents" integer DEFAULT 0 NOT NULL;

ALTER TABLE public.trigger_bundles
  ADD COLUMN IF NOT EXISTS "user_id" uuid,
  ADD COLUMN IF NOT EXISTS "scenario" text,
  ADD COLUMN IF NOT EXISTS "disc_profiles" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "vak_profiles" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "metaprograms" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "triggers" text[],
  ADD COLUMN IF NOT EXISTS "sequence_timing" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "neural_path" jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "total_uses" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_system_bundle" boolean DEFAULT false;

ALTER TABLE public.vak_analysis_history
  ADD COLUMN IF NOT EXISTS "visual_words" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "auditory_words" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "kinesthetic_words" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "digital_words" text[] DEFAULT '{}'::text[];
