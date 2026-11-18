-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416223724
-- nome:   singu_add_cols_batch_3

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS "entity_type" text,
  ADD COLUMN IF NOT EXISTS "entity_id" uuid,
  ADD COLUMN IF NOT EXISTS "entity_name" text;

ALTER TABLE public.city_whitelist
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "state" text;

ALTER TABLE public.custom_fields
  ADD COLUMN IF NOT EXISTS "user_id" uuid,
  ADD COLUMN IF NOT EXISTS "field_options" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.document_views
  ADD COLUMN IF NOT EXISTS "signature_id" uuid,
  ADD COLUMN IF NOT EXISTS "viewer_ip" text,
  ADD COLUMN IF NOT EXISTS "viewer_user_agent" text,
  ADD COLUMN IF NOT EXISTS "duration_seconds" integer,
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.knowledge_base_articles
  ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "views_count" integer DEFAULT 0;

ALTER TABLE public.lead_score_config
  ADD COLUMN IF NOT EXISTS "grade_thresholds" jsonb DEFAULT '{"hot": 60, "cold": 0, "warm": 30, "on_fire": 85}'::jsonb NOT NULL;

ALTER TABLE public.meeting_summaries
  ADD COLUMN IF NOT EXISTS "key_decisions" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "sentiment_overview" text,
  ADD COLUMN IF NOT EXISTS "topics" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "generated_by_model" text DEFAULT 'gemini-2.5-flash'::text;

ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS "module" text;

ALTER TABLE public.sales_team_members
  ADD COLUMN IF NOT EXISTS "profile_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "max_leads_day" integer DEFAULT 10 NOT NULL,
  ADD COLUMN IF NOT EXISTS "max_leads_total" integer DEFAULT 50 NOT NULL,
  ADD COLUMN IF NOT EXISTS "current_lead_count" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "leads_today" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "leads_today_reset_at" date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS "territories" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "specializations" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "manager_id" uuid;

ALTER TABLE public.sequences
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS "pause_on_meeting" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "max_enrollments" integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "total_completed" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "total_replied" integer DEFAULT 0 NOT NULL;

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS "title" text,
  ADD COLUMN IF NOT EXISTS "sla_deadline" timestamptz;

ALTER TABLE public.trigger_usage_history
  ADD COLUMN IF NOT EXISTS "trigger_type" text,
  ADD COLUMN IF NOT EXISTS "template_id" text,
  ADD COLUMN IF NOT EXISTS "template_title" text,
  ADD COLUMN IF NOT EXISTS "scenario" text,
  ADD COLUMN IF NOT EXISTS "context" text,
  ADD COLUMN IF NOT EXISTS "result" text,
  ADD COLUMN IF NOT EXISTS "notes" text,
  ADD COLUMN IF NOT EXISTS "effectiveness_rating" integer,
  ADD COLUMN IF NOT EXISTS "used_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS "user_id" uuid,
  ADD COLUMN IF NOT EXISTS "instance_name" text,
  ADD COLUMN IF NOT EXISTS "remote_jid" text,
  ADD COLUMN IF NOT EXISTS "message_id" text,
  ADD COLUMN IF NOT EXISTS "from_me" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "media_mimetype" text,
  ADD COLUMN IF NOT EXISTS "sender_name" text,
  ADD COLUMN IF NOT EXISTS "quoted_message_id" text,
  ADD COLUMN IF NOT EXISTS "timestamp" timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "played_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;
