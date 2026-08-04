
-- =====================================================
-- Lead Scoring System
-- Score composto: Engagement + Fit + Intent + Relationship
-- =====================================================

-- Tabela para armazenar scores calculados
CREATE TABLE public.lead_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Score total (0-100)
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'cold', -- cold, warm, hot, on_fire
  
  -- Sub-scores (0-100 cada)
  engagement_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  fit_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  intent_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  relationship_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Detalhamento
  score_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Pesos configuráveis
  weight_engagement NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  weight_fit NUMERIC(3,2) NOT NULL DEFAULT 0.20,
  weight_intent NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  weight_relationship NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  
  -- Metadata
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score_change NUMERIC(5,2) DEFAULT 0,
  previous_score NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(contact_id, user_id)
);

-- Histórico de scores para tendências
CREATE TABLE public.lead_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_score NUMERIC(5,2) NOT NULL,
  grade TEXT NOT NULL,
  engagement_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  fit_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  intent_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  relationship_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações de pesos por usuário
CREATE TABLE public.lead_score_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  weight_engagement NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  weight_fit NUMERIC(3,2) NOT NULL DEFAULT 0.20,
  weight_intent NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  weight_relationship NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  grade_thresholds JSONB NOT NULL DEFAULT '{"cold": 0, "warm": 30, "hot": 60, "on_fire": 85}'::jsonb,
  auto_recalculate BOOLEAN NOT NULL DEFAULT true,
  recalculate_interval_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact ON public.lead_scores(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_user ON public.lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_grade ON public.lead_scores(grade);
CREATE INDEX IF NOT EXISTS idx_lead_scores_total ON public.lead_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_contact ON public.lead_score_history(contact_id, recorded_at DESC);

-- RLS
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_score_config ENABLE ROW LEVEL SECURITY;

-- Policies: lead_scores
CREATE POLICY "Users can view their own lead scores"
  ON public.lead_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead scores"
  ON public.lead_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead scores"
  ON public.lead_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead scores"
  ON public.lead_scores FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: lead_score_history
CREATE POLICY "Users can view their own score history"
  ON public.lead_score_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own score history"
  ON public.lead_score_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies: lead_score_config
CREATE POLICY "Users can view their own config"
  ON public.lead_score_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
  ON public.lead_score_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
  ON public.lead_score_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_lead_scores_updated_at
  BEFORE UPDATE ON public.lead_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_score_config_updated_at
  BEFORE UPDATE ON public.lead_score_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
