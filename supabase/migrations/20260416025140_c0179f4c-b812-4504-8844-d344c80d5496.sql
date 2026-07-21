
CREATE TABLE public.churn_risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations TEXT[] DEFAULT '{}',
  days_since_last_interaction INTEGER,
  sentiment_trend TEXT,
  score_trend TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.churn_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own churn risks"
  ON public.churn_risk_scores FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own churn risks"
  ON public.churn_risk_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own churn risks"
  ON public.churn_risk_scores FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own churn risks"
  ON public.churn_risk_scores FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_churn_risk_contact ON public.churn_risk_scores(contact_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_user ON public.churn_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_level ON public.churn_risk_scores(risk_level);

CREATE TRIGGER update_churn_risk_scores_updated_at
  BEFORE UPDATE ON public.churn_risk_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
