-- Intent Data Module: tabelas para rastreamento de sinais de intenção first-party

-- 1. intent_signals: cada evento de intenção capturado
CREATE TABLE public.intent_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  external_company_id TEXT,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'page_view','email_open','email_click','form_submit','content_download',
    'pricing_view','demo_request','social_engagement','search_query','competitor_mention'
  )),
  signal_source TEXT,
  signal_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  weight INT NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intent_signals_user_occurred ON public.intent_signals(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_contact ON public.intent_signals(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intent_signals_external_company ON public.intent_signals(external_company_id) WHERE external_company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intent_signals_type ON public.intent_signals(signal_type);

ALTER TABLE public.intent_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own intent signals" ON public.intent_signals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own intent signals" ON public.intent_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own intent signals" ON public.intent_signals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own intent signals" ON public.intent_signals
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER audit_intent_signals
  AFTER INSERT OR UPDATE OR DELETE ON public.intent_signals
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- 2. intent_scores: score agregado por contact ou account
CREATE TABLE public.intent_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('contact','account')),
  scope_id TEXT NOT NULL,
  intent_score INT NOT NULL DEFAULT 0 CHECK (intent_score BETWEEN 0 AND 100),
  score_trend TEXT NOT NULL DEFAULT 'stable' CHECK (score_trend IN ('rising','stable','falling')),
  signal_count_30d INT NOT NULL DEFAULT 0,
  top_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, scope, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_intent_scores_user_score ON public.intent_scores(user_id, intent_score DESC);

ALTER TABLE public.intent_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own intent scores" ON public.intent_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own intent scores" ON public.intent_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own intent scores" ON public.intent_scores
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own intent scores" ON public.intent_scores
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_intent_scores_updated_at
  BEFORE UPDATE ON public.intent_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. intent_tracking_pixels: pixels de rastreamento por domínio
CREATE TABLE public.intent_tracking_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pixel_key TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  signal_count INT NOT NULL DEFAULT 0,
  last_signal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intent_pixels_user ON public.intent_tracking_pixels(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_pixels_key ON public.intent_tracking_pixels(pixel_key) WHERE active = true;

ALTER TABLE public.intent_tracking_pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own pixels" ON public.intent_tracking_pixels
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pixels" ON public.intent_tracking_pixels
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pixels" ON public.intent_tracking_pixels
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pixels" ON public.intent_tracking_pixels
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_intent_pixels_updated_at
  BEFORE UPDATE ON public.intent_tracking_pixels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();