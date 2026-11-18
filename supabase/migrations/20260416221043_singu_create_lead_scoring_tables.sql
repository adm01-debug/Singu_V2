-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221043
-- nome:   singu_create_lead_scoring_tables

-- ============================================================================
-- SINGU — MÓDULO LEAD SCORING (3 tabelas)
-- Spec: memory features/lead-scoring-system
-- 4 dimensões: Engagement(30%), Fit(20%), Intent(25%), Relationship(25%)
-- Grades: cold(0-29), warm(30-59), hot(60-84), on_fire(85-100)
-- NOTA: lead_score_history já existe no destino — pular
-- ============================================================================

-- lead_scores: score atual por contato (1:1)
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  -- Score total e sub-scores (0-100)
  total_score integer NOT NULL DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  engagement_score integer NOT NULL DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  fit_score integer NOT NULL DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 100),
  intent_score integer NOT NULL DEFAULT 0 CHECK (intent_score BETWEEN 0 AND 100),
  relationship_score integer NOT NULL DEFAULT 0 CHECK (relationship_score BETWEEN 0 AND 100),
  -- Grade automática baseada em thresholds
  grade text NOT NULL DEFAULT 'cold' CHECK (grade IN ('cold','warm','hot','on_fire')),
  -- Fatores que contribuíram para o score (JSON breakdown)
  factors jsonb DEFAULT '{}'::jsonb,
  weights_snapshot jsonb DEFAULT '{}'::jsonb,
  -- Change tracking
  previous_score integer,
  score_change integer GENERATED ALWAYS AS (total_score - COALESCE(previous_score, 0)) STORED,
  trend text CHECK (trend IN ('rising','falling','stable','new')),
  calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_lead_score_contact UNIQUE (user_id, contact_id)
);

COMMENT ON TABLE public.lead_scores IS 'SINGU: Score atual de lead por contato. 4 dimensões ponderadas (Engagement 30%, Fit 20%, Intent 25%, Relationship 25%). Grade automática. 1 registro por contato. Série temporal em lead_score_history.';

CREATE INDEX IF NOT EXISTS idx_lead_scores_user_grade ON public.lead_scores (user_id, grade);
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact ON public.lead_scores (contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_total_desc ON public.lead_scores (user_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_trend ON public.lead_scores (trend) WHERE trend IN ('rising','falling');

ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own" ON public.lead_scores FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.lead_scores FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.lead_scores FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.lead_scores FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.lead_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

-- lead_score_config: pesos e thresholds por usuário
CREATE TABLE IF NOT EXISTS public.lead_score_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  weight_engagement numeric(3,2) NOT NULL DEFAULT 0.30 CHECK (weight_engagement BETWEEN 0 AND 1),
  weight_fit numeric(3,2) NOT NULL DEFAULT 0.20 CHECK (weight_fit BETWEEN 0 AND 1),
  weight_intent numeric(3,2) NOT NULL DEFAULT 0.25 CHECK (weight_intent BETWEEN 0 AND 1),
  weight_relationship numeric(3,2) NOT NULL DEFAULT 0.25 CHECK (weight_relationship BETWEEN 0 AND 1),
  threshold_warm integer NOT NULL DEFAULT 30 CHECK (threshold_warm BETWEEN 0 AND 100),
  threshold_hot integer NOT NULL DEFAULT 60 CHECK (threshold_hot BETWEEN 0 AND 100),
  threshold_on_fire integer NOT NULL DEFAULT 85 CHECK (threshold_on_fire BETWEEN 0 AND 100),
  auto_recalculate boolean DEFAULT true,
  recalculate_interval_hours integer DEFAULT 6,
  last_recalculated_at timestamp with time zone,
  custom_factors jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weights_sum_one CHECK (ROUND((weight_engagement + weight_fit + weight_intent + weight_relationship)::numeric, 2) = 1.00),
  CONSTRAINT thresholds_ordered CHECK (threshold_warm < threshold_hot AND threshold_hot < threshold_on_fire)
);

COMMENT ON TABLE public.lead_score_config IS 'SINGU: Config de pesos e thresholds do lead scoring por usuário. Soma dos 4 pesos = 1.00. Thresholds ordenados crescente.';

CREATE INDEX IF NOT EXISTS idx_lead_score_config_user ON public.lead_score_config (user_id);

ALTER TABLE public.lead_score_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own" ON public.lead_score_config FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.lead_score_config FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.lead_score_config FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.lead_score_config FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.lead_score_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- churn_risk_scores: pontuação de risco de churn (complementa churn_predictions + churn_risk_factors existentes)
CREATE TABLE IF NOT EXISTS public.churn_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  risk_score integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  factors_detected jsonb DEFAULT '[]'::jsonb,
  factors_breakdown jsonb DEFAULT '{}'::jsonb,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  confidence integer DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  previous_score integer,
  calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_current boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT churn_risk_either_contact_or_company CHECK (contact_id IS NOT NULL OR company_id IS NOT NULL)
);

COMMENT ON TABLE public.churn_risk_scores IS 'SINGU: Histórico de scores de risco de churn (análise local, 5 fatores). Espelha feature churn-risk-detection das memories. is_current=true para score atual.';

CREATE INDEX IF NOT EXISTS idx_churn_risk_user_current ON public.churn_risk_scores (user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_churn_risk_contact ON public.churn_risk_scores (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_churn_risk_company ON public.churn_risk_scores (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_churn_risk_level ON public.churn_risk_scores (risk_level, calculated_at DESC);

ALTER TABLE public.churn_risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own" ON public.churn_risk_scores FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.churn_risk_scores FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.churn_risk_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER update_lead_scores_updated_at BEFORE UPDATE ON public.lead_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
    EXECUTE 'CREATE TRIGGER update_lead_score_config_updated_at BEFORE UPDATE ON public.lead_score_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;
