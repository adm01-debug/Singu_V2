-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416223639
-- nome:   singu_add_cols_batch_1

-- Tabela: access_blocked_log (2 cols)
ALTER TABLE public.access_blocked_log
  ADD COLUMN IF NOT EXISTS "country_code" text,
  ADD COLUMN IF NOT EXISTS "reason" text;

-- Tabela: audit_log (2 cols)
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS "entity_type" text,
  ADD COLUMN IF NOT EXISTS "entity_id" uuid;

-- Tabela: csat_surveys (6 cols)
ALTER TABLE public.csat_surveys
  ADD COLUMN IF NOT EXISTS "interaction_id" uuid,
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS "answered_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "expires_at" timestamptz DEFAULT (now() + '7 days'::interval),
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "public_token" uuid DEFAULT gen_random_uuid() NOT NULL;

-- Tabela: document_signatures (12 cols)
ALTER TABLE public.document_signatures
  ADD COLUMN IF NOT EXISTS "template_id" uuid,
  ADD COLUMN IF NOT EXISTS "contact_id" uuid,
  ADD COLUMN IF NOT EXISTS "company_id" uuid,
  ADD COLUMN IF NOT EXISTS "rendered_html" text,
  ADD COLUMN IF NOT EXISTS "merge_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "signature_token" text DEFAULT encode(extensions.gen_random_bytes(24), 'hex'::text) NOT NULL,
  ADD COLUMN IF NOT EXISTS "signature_image" text,
  ADD COLUMN IF NOT EXISTS "signature_typed" text,
  ADD COLUMN IF NOT EXISTS "signed_ip" text,
  ADD COLUMN IF NOT EXISTS "signed_user_agent" text,
  ADD COLUMN IF NOT EXISTS "declined_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "declined_reason" text;

-- Tabela: handoff_requests (6 cols)
ALTER TABLE public.handoff_requests
  ADD COLUMN IF NOT EXISTS "from_member_id" uuid,
  ADD COLUMN IF NOT EXISTS "to_member_id" uuid,
  ADD COLUMN IF NOT EXISTS "qualification_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "handoff_reason" text,
  ADD COLUMN IF NOT EXISTS "notes" text,
  ADD COLUMN IF NOT EXISTS "sla_hours" integer DEFAULT 4 NOT NULL;

-- Tabela: lead_assignments (3 cols)
ALTER TABLE public.lead_assignments
  ADD COLUMN IF NOT EXISTS "routing_rule_id" uuid,
  ADD COLUMN IF NOT EXISTS "first_contact_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "sla_met" boolean;

-- Tabela: login_attempts (2 cols)
ALTER TABLE public.login_attempts
  ADD COLUMN IF NOT EXISTS "blocked_reason" text,
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now();

-- Tabela: offer_suggestions (4 cols)
ALTER TABLE public.offer_suggestions
  ADD COLUMN IF NOT EXISTS "offer_category" text,
  ADD COLUMN IF NOT EXISTS "presented_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "result" text,
  ADD COLUMN IF NOT EXISTS "expires_at" timestamptz;

-- Tabela: rfm_analysis (19 cols)
ALTER TABLE public.rfm_analysis
  ADD COLUMN IF NOT EXISTS "contact_id" uuid,
  ADD COLUMN IF NOT EXISTS "total_score" integer GENERATED ALWAYS AS (((recency_score + frequency_score) + monetary_score)) STORED,
  ADD COLUMN IF NOT EXISTS "days_since_last_interaction" integer,
  ADD COLUMN IF NOT EXISTS "total_purchases" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_interactions" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_monetary_value" numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "average_order_value" numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "segment" text,
  ADD COLUMN IF NOT EXISTS "segment_description" text,
  ADD COLUMN IF NOT EXISTS "segment_color" text,
  ADD COLUMN IF NOT EXISTS "recency_trend" text,
  ADD COLUMN IF NOT EXISTS "frequency_trend" text,
  ADD COLUMN IF NOT EXISTS "monetary_trend" text,
  ADD COLUMN IF NOT EXISTS "overall_trend" text,
  ADD COLUMN IF NOT EXISTS "predicted_next_purchase_date" date,
  ADD COLUMN IF NOT EXISTS "predicted_lifetime_value" numeric(12,2),
  ADD COLUMN IF NOT EXISTS "churn_probability" numeric(5,2),
  ADD COLUMN IF NOT EXISTS "recommended_offers" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "communication_priority" text;

-- Tabela: sequence_enrollments (3 cols)
ALTER TABLE public.sequence_enrollments
  ADD COLUMN IF NOT EXISTS "next_action_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "replied_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "last_step_executed_at" timestamptz;

-- Tabela: sms_opt_outs (1 cols)
ALTER TABLE public.sms_opt_outs
  ADD COLUMN IF NOT EXISTS "phone" text;

-- Tabela: trigger_channel_effectiveness (5 cols)
ALTER TABLE public.trigger_channel_effectiveness
  ADD COLUMN IF NOT EXISTS "contact_id" uuid,
  ADD COLUMN IF NOT EXISTS "uses" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "successes" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "effectiveness_score" numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_used_at" timestamptz;

-- Tabela: visit_checkins (4 cols)
ALTER TABLE public.visit_checkins
  ADD COLUMN IF NOT EXISTS "photo_url" text,
  ADD COLUMN IF NOT EXISTS "visit_type" text DEFAULT 'presencial'::text,
  ADD COLUMN IF NOT EXISTS "check_in_at" timestamptz DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "check_out_at" timestamptz;
