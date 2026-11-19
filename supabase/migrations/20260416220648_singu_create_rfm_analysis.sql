-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220648
-- nome:   singu_create_rfm_analysis

-- ============================================================================
-- SINGU — TABELA 8/9: rfm_analysis
-- Completa o trio rfm_history + rfm_metrics + rfm_segment_config
-- rfm_analysis = snapshot atual (1 por company), rfm_history = série temporal
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rfm_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  -- Scores RFM (1-5)
  recency_score integer NOT NULL CHECK (recency_score BETWEEN 1 AND 5),
  frequency_score integer NOT NULL CHECK (frequency_score BETWEEN 1 AND 5),
  monetary_score integer NOT NULL CHECK (monetary_score BETWEEN 1 AND 5),
  rfm_score text GENERATED ALWAYS AS (recency_score::text || frequency_score::text || monetary_score::text) STORED,
  rfm_total integer GENERATED ALWAYS AS (recency_score + frequency_score + monetary_score) STORED,
  -- Segmento (FK conceitual com rfm_segment_config.segment_code)
  segment_code text NOT NULL,
  segment_name text,
  -- Métricas brutas
  days_since_last_purchase integer,
  purchase_count integer DEFAULT 0,
  total_revenue numeric(15,2) DEFAULT 0,
  avg_ticket numeric(15,2) DEFAULT 0,
  -- Trending
  previous_segment text,
  segment_changed_at timestamp with time zone,
  trend text CHECK (trend IN ('up','down','stable','new','churning')),
  -- Recomendações
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  churn_risk_score integer CHECK (churn_risk_score BETWEEN 0 AND 100),
  analyzed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_rfm_analysis_company UNIQUE (user_id, company_id)
);

COMMENT ON TABLE public.rfm_analysis IS 'SINGU: Análise RFM corrente por empresa (1 registro por company_id). Snapshot atual. Série histórica vai em rfm_history. Configuração de segmentos em rfm_segment_config. Segments typical: Champions, Loyal, At Risk, Lost, New, Promising, Need Attention, About to Sleep, Cannot Lose Them, Hibernating.';

ALTER TABLE public.rfm_analysis
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS recency_score integer NOT NULL CHECK (recency_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS frequency_score integer NOT NULL CHECK (frequency_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS monetary_score integer NOT NULL CHECK (monetary_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rfm_score text GENERATED ALWAYS AS (recency_score::text || frequency_score::text || monetary_score::text) STORED,
  ADD COLUMN IF NOT EXISTS rfm_total integer GENERATED ALWAYS AS (recency_score + frequency_score + monetary_score) STORED,
  ADD COLUMN IF NOT EXISTS segment_code text NOT NULL,
  ADD COLUMN IF NOT EXISTS segment_name text,
  ADD COLUMN IF NOT EXISTS days_since_last_purchase integer,
  ADD COLUMN IF NOT EXISTS purchase_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_ticket numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_segment text,
  ADD COLUMN IF NOT EXISTS segment_changed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS trend text CHECK (trend IN ('up','down','stable','new','churning')),
  ADD COLUMN IF NOT EXISTS recommended_actions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS churn_risk_score integer CHECK (churn_risk_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS analyzed_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();


CREATE INDEX IF NOT EXISTS idx_rfm_analysis_user_segment ON public.rfm_analysis (user_id, segment_code);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_company ON public.rfm_analysis (company_id);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_score_total ON public.rfm_analysis (rfm_total DESC);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_churn_risk ON public.rfm_analysis (churn_risk_score DESC) WHERE churn_risk_score >= 60;

ALTER TABLE public.rfm_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.rfm_analysis FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.rfm_analysis FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.rfm_analysis FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.rfm_analysis FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.rfm_analysis FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER update_rfm_analysis_updated_at BEFORE UPDATE ON public.rfm_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=24;
