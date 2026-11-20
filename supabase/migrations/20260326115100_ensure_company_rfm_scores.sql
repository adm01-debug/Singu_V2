-- Fix para o Supabase Preview da PR #267.
--
-- Causa raiz: o preview do Supabase (GitHub integration) RECRIA o banco da branch a cada push,
-- mas MANTEM o historico supabase_migrations.schema_migrations. As migrations
-- 20260110000000_baseline_tabelas_base.sql ja foram registradas como aplicadas, entao quando a
-- 20260326115101_add_composite_performance_indices.sql roda (criando indices em
-- company_rfm_scores e company_addresses) essas tabelas nao existem no banco recriado.
--
-- Esta migration roda ANTES da 20260326115101 (ordenacao por timestamp) e garante as tabelas.
-- Todos os comandos sao idempotentes: em producao (onde as tabelas ja existem) roda como no-op.

-- DDL recuperada fielmente de 20260110000000_baseline_tabelas_base.sql (linhas 397-422 e 475-494)
CREATE TABLE IF NOT EXISTS public.company_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo text DEFAULT '''Comercial|Faturamento''::character varying'::character varying,
  is_primary bool DEFAULT false,
  cep varchar,
  logradouro varchar,
  numero varchar,
  complemento text,
  bairro text,
  cidade text,
  estado varchar,
  pais varchar DEFAULT 'Brasil'::character varying,
  latitude numeric,
  longitude numeric,
  ponto_referencia varchar,
  instrucoes_entrega text,
  horario_funcionamento text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  google_maps_url text,
  google_place_id text,
  origem varchar,
  cidade_ibge int4,
  tipo_logradouro varchar,
  CONSTRAINT company_addresses_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.company_rfm_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  last_interaction_date timestamptz,
  interaction_count int4 DEFAULT 0,
  total_value numeric DEFAULT 0,
  recency_score int4,
  frequency_score int4,
  monetary_score int4,
  combined_score numeric,
  segment_id uuid,
  segment_code text,
  overall_trend text,
  contacts_count int4 DEFAULT 0,
  avg_contact_score numeric,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT company_rfm_scores_pkey PRIMARY KEY (id)
);

-- Postgres nao suporta ADD CONSTRAINT IF NOT EXISTS; checagem manual em pg_constraint.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_combined_score_check') THEN
        ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_combined_score_check CHECK (((combined_score >= (1)::numeric) AND (combined_score <= (5)::numeric)));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_frequency_score_check') THEN
        ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_frequency_score_check CHECK (((frequency_score >= 1) AND (frequency_score <= 5)));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_monetary_score_check') THEN
        ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_monetary_score_check CHECK (((monetary_score >= 1) AND (monetary_score <= 5)));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_overall_trend_check') THEN
        ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_overall_trend_check CHECK ((overall_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text])));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_recency_score_check') THEN
        ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_recency_score_check CHECK (((recency_score >= 1) AND (recency_score <= 5)));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_company_addresses_cep ON public.company_addresses USING btree (cep);
CREATE INDEX IF NOT EXISTS idx_company_addresses_cidade ON public.company_addresses USING btree (cidade, estado);
CREATE INDEX IF NOT EXISTS idx_company_addresses_cidade_ibge ON public.company_addresses USING btree (cidade_ibge);
CREATE INDEX IF NOT EXISTS idx_company_addresses_company ON public.company_addresses USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_company_addresses_created_at ON public.company_addresses USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_company_addresses_primary ON public.company_addresses USING btree (company_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_company_addresses_tipo_logradouro ON public.company_addresses USING btree (tipo_logradouro);

CREATE INDEX IF NOT EXISTS idx_company_rfm_scores_created_at ON public.company_rfm_scores USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_company_rfm_scores_segment_id ON public.company_rfm_scores USING btree (segment_id);
CREATE INDEX IF NOT EXISTS idx_company_rfm_segment ON public.company_rfm_scores USING btree (segment_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_rfm_unique ON public.company_rfm_scores USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_company_rfm_user ON public.company_rfm_scores USING btree (user_id);

-- alerts.status e demais colunas que a 20260326115101 indexa
-- (recuperado do schema real de producao; baseline fundadora de
--  20260109144945 nao cria a coluna status em alerts)
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS interaction_id uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS action_type text;

CREATE INDEX IF NOT EXISTS idx_alerts_user_status_created
ON public.alerts (user_id, status, created_at DESC);